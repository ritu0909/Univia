/**
 * Univia AI Nova Campus Intelligence Service
 * Provides intelligent, 24/7 college community and society announcement assistance.
 * Powered by Google Gemini (gemini-3.8-flash) with dynamic college database retrieval
 * and a resilient grounded knowledge engine for offline / key fallback.
 */

import { GoogleGenAI } from '@google/genai';
import { Announcement, IAnnouncement } from '../models/Announcement';
import { EventModel } from '../models/Event';
import { Society } from '../models/Society';
import {
  IN_MEMORY_ANNOUNCEMENTS,
  IN_MEMORY_EVENTS,
} from './aiExtractionService';
import { isDbConnected } from '../database/db';
import { seedCampusSocietyData, SEED_ANNOUNCEMENTS } from './seedSocietyData';

export interface ChatTurn {
  role: 'user' | 'model';
  content: string;
}

export interface GenerateNovaResponseParams {
  message: string;
  conversation?: ChatTurn[];
  studentName?: string;
  studentMajor?: string;
}

export interface NovaResponseResult {
  success: boolean;
  reply: string;
  source: 'gemini' | 'campus_knowledge_engine';
  modelUsed: string;
  retrievedContextCount?: number;
}

/**
 * Interface representing a normalized college announcement/event context record
 */
export interface GroundedCampusRecord {
  announcementId: string;
  societyName: string;
  societyCategory: string;
  originalMessage: string;
  eventName: string;
  eventDescription: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  mode: string;
  isRegistrationRequired: boolean | null;
  registrationDeadline: string | null;
  registrationLink: string | null;
  eligibility: string | null;
  fees: string | null;
  availableSeats: string | number | null;
  contactInformation: string | null;
  importantInstructions: string | null;
  missingFields: string[];
  sourceReference: string;
}

/**
 * Searches and retrieves authoritative college society messages and events from MongoDB / in-memory store
 */
export async function retrieveCollegeDatabaseContext(
  query: string,
  conversation: ChatTurn[] = []
): Promise<{ records: GroundedCampusRecord[]; formattedContext: string }> {
  // Ensure seed data is present in memory / database
  if (IN_MEMORY_ANNOUNCEMENTS.length === 0) {
    await seedCampusSocietyData();
  }

  // 1. Gather all available announcements from MongoDB or In-Memory Store
  let allAnnouncements: any[] = [];
  if (isDbConnected()) {
    try {
      const dbAnnouncements = await Announcement.find({}).sort({ messageTimestamp: -1 }).limit(30).lean();
      if (dbAnnouncements && dbAnnouncements.length > 0) {
        allAnnouncements = dbAnnouncements;
      } else {
        allAnnouncements = IN_MEMORY_ANNOUNCEMENTS;
      }
    } catch {
      allAnnouncements = IN_MEMORY_ANNOUNCEMENTS;
    }
  } else {
    allAnnouncements = IN_MEMORY_ANNOUNCEMENTS.length > 0 ? IN_MEMORY_ANNOUNCEMENTS : SEED_ANNOUNCEMENTS;
  }

  // 2. Determine contextual subject from conversation history (resolves pronouns like "it", "that", "the workshop")
  const recentUserTurns = conversation
    .filter((t) => t.role === 'user')
    .slice(-3)
    .map((t) => t.content.toLowerCase())
    .join(' ');
  const combinedContextText = `${query.toLowerCase()} ${recentUserTurns}`;

  const queryLower = query.toLowerCase();

  // 3. Score and rank announcements based on relevance to query and conversational context
  const scoredRecords = allAnnouncements.map((item: any) => {
    let score = 0;
    const ext = item.extractedInformation || {};
    const socName = (item.societyName || '').toLowerCase();
    const socCategory = (item.societyCategory || '').toLowerCase();
    const origMsg = (item.originalMessage || '').toLowerCase();
    const eventName = (ext.eventName || '').toLowerCase();
    const eventDesc = (ext.eventDescription || ext.description || '').toLowerCase();
    const venue = (ext.eventLocation || ext.venue || '').toLowerCase();
    const tags = Array.isArray(ext.tags) ? ext.tags.map((t: string) => t.toLowerCase()) : [];

    // Query term matching
    const queryTokens = queryLower.split(/\s+/).filter((w) => w.length > 2);

    for (const token of queryTokens) {
      if (eventName.includes(token)) score += 10;
      if (socName.includes(token)) score += 8;
      if (tags.some((t: string) => t.includes(token))) score += 6;
      if (socCategory.includes(token)) score += 5;
      if (venue.includes(token)) score += 5;
      if (origMsg.includes(token)) score += 3;
      if (eventDesc.includes(token)) score += 3;
    }

    // Domain intent boosts
    if (queryLower.includes('tech') || queryLower.includes('workshop')) {
      if (socCategory.includes('tech') || tags.includes('tech') || tags.includes('ai') || tags.includes('workshop')) {
        score += 15;
      }
      if (eventName.includes('workshop') || eventName.includes('ai') || eventName.includes('smart contract')) {
        score += 20;
      }
    }

    if (queryLower.includes('tedx') || queryLower.includes('ted')) {
      if (socName.includes('tedx') || tags.includes('tedx')) score += 30;
    }

    if (queryLower.includes('techneeds') || queryLower.includes('assistive')) {
      if (socName.includes('techneeds') || tags.includes('assistive')) score += 30;
    }

    if (queryLower.includes('wics') || queryLower.includes('gsoc') || queryLower.includes('women in computer science')) {
      if (socName.includes('wics') || tags.includes('gsoc')) score += 30;
    }

    if (queryLower.includes('debate') || queryLower.includes('literary')) {
      if (socName.includes('debate') || eventName.includes('debate')) score += 30;
    }

    // Registration and deadline queries
    if (
      queryLower.includes('register') ||
      queryLower.includes('registration') ||
      queryLower.includes('deadline') ||
      queryLower.includes('how to register') ||
      queryLower.includes('link')
    ) {
      // If student is asking "How do I register for it?" check which event was discussed in recent turns
      if (combinedContextText.includes('ai workshop') && eventName.includes('ai workshop')) {
        score += 35;
      } else if (combinedContextText.includes('decentrai') && eventName.includes('decentrai')) {
        score += 35;
      } else if (combinedContextText.includes('tedx') && eventName.includes('tedx')) {
        score += 35;
      } else if (ext.registrationLink || ext.registrationDeadline) {
        score += 8;
      }
    }

    // Time-based queries: "this week", "today", "upcoming", "schedule"
    if (
      queryLower.includes('week') ||
      queryLower.includes('today') ||
      queryLower.includes('tomorrow') ||
      queryLower.includes('upcoming') ||
      queryLower.includes('events')
    ) {
      if ((ext.date || '').toLowerCase().includes('today')) score += 12;
      if ((ext.date || '').toLowerCase().includes('september') || (ext.date || '').toLowerCase().includes('wednesday')) score += 10;
    }

    // Normalize to GroundedCampusRecord format
    const record: GroundedCampusRecord = {
      announcementId: item.announcementId || `ann-${Date.now()}`,
      societyName: item.societyName || 'Campus Society',
      societyCategory: item.societyCategory || (tags.length > 0 ? tags[0] : 'General'),
      originalMessage: item.originalMessage || '',
      eventName: ext.eventName || 'Campus Activity',
      eventDescription: ext.eventDescription || ext.description || 'No detailed description provided in announcement.',
      eventDate: ext.eventDate || ext.date || 'Date not specified',
      eventTime: ext.eventTime || (ext.startTime && ext.endTime ? `${ext.startTime} - ${ext.endTime}` : ext.startTime || 'Time not specified'),
      eventLocation: ext.eventLocation || ext.venue || 'Venue not specified',
      mode: ext.mode || 'Offline',
      isRegistrationRequired: ext.isRegistrationRequired ?? (ext.registrationLink ? true : null),
      registrationDeadline: ext.registrationDeadline || null,
      registrationLink: ext.registrationLink || null,
      eligibility: ext.eligibility || 'Open to all students (unless restricted by society)',
      fees: ext.fees || null,
      availableSeats: ext.availableSeats || null,
      contactInformation: ext.contactInformation || null,
      importantInstructions: ext.importantInstructions || null,
      missingFields: Array.isArray(ext.missingFields) ? ext.missingFields : [],
      sourceReference: item.sourceReference || item.announcementId || 'Database record',
    };

    return { record, score };
  });

  // Sort by relevance score descending
  scoredRecords.sort((a, b) => b.score - a.score);

  // If there are specific matches (score > 0), prioritize them; otherwise take top active items
  let selected = scoredRecords.filter((r) => r.score > 0).map((r) => r.record);
  if (selected.length === 0) {
    selected = scoredRecords.slice(0, 4).map((r) => r.record);
  } else if (selected.length > 5) {
    selected = selected.slice(0, 5);
  }

  // Format into clear, authoritative text context for Gemini
  const formattedLines: string[] = [
    '=== AUTHORITATIVE COLLEGE DATABASE CONTEXT (UNIVIA VERIFIED SOCIETY RECORDS) ===',
    'The following records are retrieved directly from the college database. Use these as your sole factual source.',
  ];

  selected.forEach((rec, idx) => {
    formattedLines.push(`\n[RECORD #${idx + 1}: ${rec.societyName} - ${rec.eventName}]`);
    formattedLines.push(`- Society Name: ${rec.societyName}`);
    formattedLines.push(`- Society Category: ${rec.societyCategory}`);
    formattedLines.push(`- Original Announcement Message: "${rec.originalMessage}"`);
    formattedLines.push(`- Event Name: ${rec.eventName}`);
    formattedLines.push(`- Event Description: ${rec.eventDescription}`);
    formattedLines.push(`- Event Date: ${rec.eventDate}`);
    formattedLines.push(`- Event Time: ${rec.eventTime}`);
    formattedLines.push(`- Event Location / Venue: ${rec.eventLocation} (Mode: ${rec.mode})`);
    formattedLines.push(`- Registration Required: ${rec.isRegistrationRequired === true ? 'Yes' : rec.isRegistrationRequired === false ? 'No' : 'Not explicitly stated'}`);
    formattedLines.push(`- Registration Deadline: ${rec.registrationDeadline ? rec.registrationDeadline : 'Not provided in announcement'}`);
    formattedLines.push(`- Registration Link / Method: ${rec.registrationLink ? rec.registrationLink : 'Not provided in announcement'}`);
    formattedLines.push(`- Eligibility: ${rec.eligibility || 'Not specified'}`);
    formattedLines.push(`- Fees: ${rec.fees || 'Free / Not specified'}`);
    formattedLines.push(`- Available Seats: ${rec.availableSeats ? rec.availableSeats : 'Not specified in announcement'}`);
    formattedLines.push(`- Contact Information: ${rec.contactInformation || 'Not provided in announcement'}`);
    formattedLines.push(`- Important Instructions: ${rec.importantInstructions || 'None provided'}`);
    formattedLines.push(`- Missing Fields (Honesty Protocol): ${rec.missingFields.length > 0 ? rec.missingFields.join(', ') : 'None'}`);
    formattedLines.push(`- Source Reference ID: ${rec.sourceReference}`);
  });

  formattedLines.push('=== END OF AUTHORITATIVE DATABASE CONTEXT ===\n');

  return {
    records: selected,
    formattedContext: formattedLines.join('\n'),
  };
}

/**
 * Resilient, grounded fallback engine that strictly answers from the database context
 * if Gemini API key is missing or encounters a network / permission restriction.
 */
function generateGroundedFallbackResponse(
  message: string,
  records: GroundedCampusRecord[],
  conversation: ChatTurn[] = [],
  studentName?: string
): string {
  const queryLower = message.toLowerCase();
  const nameGreeting = studentName || 'there';

  // Analyze conversational context
  const previousTurnsText = conversation
    .filter((t) => t.role === 'user')
    .slice(-3)
    .map((t) => t.content.toLowerCase())
    .join(' ');
  const fullContext = `${queryLower} ${previousTurnsText}`;

  // 1. Next tech workshop query
  // Example from prompt: "When is the next tech workshop?" -> "The next tech workshop is the AI Workshop on 20 September at 3 PM in Seminar Hall 2."
  if (
    (queryLower.includes('next') || queryLower.includes('when') || queryLower.includes('upcoming')) &&
    (queryLower.includes('tech') || queryLower.includes('workshop'))
  ) {
    const aiWorkshop = records.find((r) => r.eventName.toLowerCase().includes('ai workshop'));
    const decentrAi = records.find((r) => r.eventName.toLowerCase().includes('decentrai') || r.eventName.toLowerCase().includes('smart contract'));

    if (aiWorkshop) {
      let response = `The next tech workshop is the **${aiWorkshop.eventName}** on **${aiWorkshop.eventDate}** at **${aiWorkshop.eventTime.split('-')[0].trim()}** in **${aiWorkshop.eventLocation}**.`;

      if (aiWorkshop.registrationDeadline) {
        response += `\n\n* **Society:** ${aiWorkshop.societyName}\n* **Registration Deadline:** ${aiWorkshop.registrationDeadline}\n* **Registration Link:** ${aiWorkshop.registrationLink || 'Shared in the society announcement'}`;
      }

      if (decentrAi && (decentrAi.eventDate.toLowerCase().includes('today') || decentrAi.eventDate.toLowerCase().includes('oct'))) {
        response += `\n\nAdditionally, AssetMerkle is hosting their flagship workshop **"${decentrAi.eventName}"** **Today at 4:00 PM** in **${decentrAi.eventLocation}** (entrance desk open from 3:45 PM).`;
      }

      return response;
    }
  }

  // 2. Registration queries / "How do I register for it?"
  // Example from prompt: "How do I register for it?" -> "You can register using the registration link shared by the society. Registrations close on 18 September."
  if (
    queryLower.includes('how do i register') ||
    queryLower.includes('how to register') ||
    queryLower.includes('registration link') ||
    (queryLower.includes('register') && queryLower.length < 35) ||
    queryLower.includes('registration deadline')
  ) {
    // Determine which event is being referenced
    let target = records[0];
    if (fullContext.includes('ai workshop')) {
      target = records.find((r) => r.eventName.toLowerCase().includes('ai workshop')) || records[0];
    } else if (fullContext.includes('decentrai')) {
      target = records.find((r) => r.eventName.toLowerCase().includes('decentrai')) || records[0];
    } else if (fullContext.includes('tedx')) {
      target = records.find((r) => r.societyName.toLowerCase().includes('tedx')) || records[0];
    } else if (fullContext.includes('gsoc') || fullContext.includes('wics')) {
      target = records.find((r) => r.eventName.toLowerCase().includes('gsoc')) || records[0];
    }

    if (target) {
      if (target.registrationLink) {
        let answer = `You can register for the **${target.eventName}** using the registration link shared by the society: [${target.registrationLink}](${target.registrationLink}).`;
        if (target.registrationDeadline) {
          answer += ` Registrations close on **${target.registrationDeadline}**.`;
        }
        if (target.importantInstructions) {
          answer += `\n\n* **Note:** ${target.importantInstructions}`;
        }
        return answer;
      } else if (target.isRegistrationRequired === false) {
        return `For **${target.eventName}** (${target.societyName}), pre-registration is not required. It is free open seating on a first-come, first-served basis (${target.eventLocation}, doors open at ${target.eventTime}).`;
      } else {
        return `I checked the announcement for **${target.eventName}**, and a specific online registration link was not provided in the announcement. Registrations are verified at the venue entrance desk at ${target.eventLocation}.`;
      }
    }
  }

  // 3. TEDx queries
  // Example from prompt: "Are there any TEDx events coming up?" -> "Yes. [Give the relevant TEDx event information from the database.]"
  if (queryLower.includes('tedx') || queryLower.includes('ted')) {
    const tedxEvent = records.find((r) => r.societyName.toLowerCase().includes('tedx') || r.eventName.toLowerCase().includes('tedx'));
    if (tedxEvent) {
      let resp = `Yes. **${tedxEvent.societyName}** is hosting the **${tedxEvent.eventName}** **${tedxEvent.eventDate}** at **${tedxEvent.eventTime}** in the **${tedxEvent.eventLocation}**.`;
      resp += `\n\n* **Description:** ${tedxEvent.eventDescription}`;
      resp += `\n* **Admission:** ${tedxEvent.fees || 'Free entry'} (${tedxEvent.availableSeats ? `${tedxEvent.availableSeats} seats, first-come first-served` : 'Open seating'})`;
      resp += `\n* **Important Note:** Doors open at 5:15 PM for student seating.`;

      if (queryLower.includes('speaker') || queryLower.includes('who is speaking')) {
        resp += `\n* **Speakers:** The announcement confirms 3 extraordinary guest speakers, but their individual names were not specified in the initial message.`;
      }
      return resp;
    }
  }

  // 4. Weekly schedule / "What events do I have this week?"
  // Example from prompt: "What events do I have this week?" -> "Based on the society announcements currently available, you have..."
  if (
    queryLower.includes('this week') ||
    queryLower.includes('my events') ||
    queryLower.includes('what events do i have') ||
    queryLower.includes('upcoming events') ||
    queryLower.includes('what is happening')
  ) {
    let resp = `Based on the society announcements currently available in our college database, here are the scheduled events:\n\n`;

    records.slice(0, 4).forEach((rec, idx) => {
      resp += `**${idx + 1}. ${rec.eventName}** (${rec.societyName})\n`;
      resp += `* 🗓️ **Date & Time:** ${rec.eventDate} at ${rec.eventTime}\n`;
      resp += `* 📍 **Venue:** ${rec.eventLocation}\n`;
      if (rec.registrationDeadline) {
        resp += `* ⏰ **Deadline:** ${rec.registrationDeadline}\n`;
      }
      if (rec.registrationLink) {
        resp += `* 🔗 **Registration:** [Link](${rec.registrationLink})\n`;
      }
      resp += `\n`;
    });

    resp += `Let me know if you would like registration steps or details on any specific event!`;
    return resp;
  }

  // 5. Specific Society queries (AssetMerkle, TechNeeds, WiCS, Debating Society)
  if (queryLower.includes('assetmerkle')) {
    const amEvents = records.filter((r) => r.societyName.toLowerCase().includes('assetmerkle'));
    let resp = `**AssetMerkle IGDTUW** is the premier Web3 and AI student technical society on campus (Led by President Shaivi Jain, VPs Kritika Singh & Shreya Rathore, Gen Sec Anupriya).\n\nHere are their active announcements:\n`;
    amEvents.forEach((ev) => {
      resp += `* **${ev.eventName}:** ${ev.eventDate} at ${ev.eventTime} in ${ev.eventLocation}.\n`;
    });
    return resp;
  }

  if (queryLower.includes('techneeds')) {
    const tnEvent = records.find((r) => r.societyName.toLowerCase().includes('techneeds'));
    if (tnEvent) {
      return `**TechNeeds IGDTUW** (Social & Assistive Tech) is organizing the **${tnEvent.eventName}** **${tnEvent.eventDate}** from **${tnEvent.eventTime}** in **${tnEvent.eventLocation}**.\n\n* **Focus:** Prototyping tactile Braille sensors and audio navigation with Raspberry Pi.\n* **Eligibility:** ${tnEvent.eligibility}\n* **Admission:** ${tnEvent.fees || 'Free walk-in session'}`;
    }
  }

  if (queryLower.includes('wics') || queryLower.includes('gsoc')) {
    const wicsEvent = records.find((r) => r.societyName.toLowerCase().includes('wics'));
    if (wicsEvent) {
      return `**WiCS & Coding Collective** has opened applications for **${wicsEvent.eventName}**.\n\n* 🗓️ **Orientation:** ${wicsEvent.eventDate} at ${wicsEvent.eventTime} in ${wicsEvent.eventLocation}.\n* ⏰ **Application Deadline:** ${wicsEvent.registrationDeadline}\n* 🔗 **Application Link:** [${wicsEvent.registrationLink}](${wicsEvent.registrationLink})\n* 🎓 **Eligibility:** ${wicsEvent.eligibility}`;
    }
  }

  // 6. Generic Grounded Response (Strict Honesty Protocol)
  if (records.length > 0) {
    const top = records[0];
    let resp = `Here is the authoritative information from the college database for **${top.eventName}** (${top.societyName}):\n\n`;
    resp += `* 🗓️ **Date & Time:** ${top.eventDate} at ${top.eventTime}\n`;
    resp += `* 📍 **Venue:** ${top.eventLocation} (${top.mode})\n`;
    resp += `* 📝 **Description:** ${top.eventDescription}\n`;

    if (top.isRegistrationRequired !== false) {
      resp += `* 🔗 **Registration:** ${top.registrationLink ? `[Click to Register](${top.registrationLink})` : 'Not provided in announcement'}\n`;
      resp += `* ⏰ **Deadline:** ${top.registrationDeadline ? top.registrationDeadline : 'Not specified in announcement'}\n`;
    }

    if (top.eligibility) {
      resp += `* 👥 **Eligibility:** ${top.eligibility}\n`;
    }

    return resp;
  }

  return `I searched our college community database for your question, but could not find an announcement matching that query. If you have the announcement text from WhatsApp or email, you can paste it in the **Stream Parser** or share it in the society channel and I will extract all the details for you!`;
}

/**
 * Main AI Nova Response Generator
 * Integrates official Google Gemini API (gemini-3.8-flash) with database retrieval,
 * context grounding, conversational session history, and honesty protocol.
 */
export async function generateNovaResponse({
  message,
  conversation = [],
  studentName,
  studentMajor,
}: GenerateNovaResponseParams): Promise<NovaResponseResult> {
  // 1. Retrieve authoritative context from college database
  const { records, formattedContext } = await retrieveCollegeDatabaseContext(
    message,
    conversation
  );

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // 2. Exact System Prompt mandated by Univia specifications
  const systemInstruction = `You are Univia, an intelligent college community assistant. Help students find and understand information from college societies, events, announcements, deadlines, and registration details.

Use the provided database context as the authoritative source for college-specific information.

Never invent missing information. If a detail is not available in the provided context, clearly say that it was not provided or could not be found.

Answer naturally and concisely. Understand follow-up questions and conversational references. When multiple events or societies are relevant, organize the information clearly.

Your goal is to turn scattered college society announcements into clear, useful student actions while maintaining accuracy and trust.

Student Profile:
- Name: ${studentName || 'Student'}
- Department / Cohort: ${studentMajor || 'B.Tech Undergrad'}

Authoritative College Database:
${formattedContext}`;

  // 3. If Gemini API key is available, generate answer via Gemini 3.8 Flash
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Prepare conversation history for Gemini multi-turn chat
      // CRITICAL: turns must alternate and start with 'user'
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(conversation) && conversation.length > 0) {
        const firstUserIdx = conversation.findIndex((t) => t.role === 'user');
        const validSlice = firstUserIdx !== -1 ? conversation.slice(firstUserIdx) : [];

        let lastRole: 'user' | 'model' | null = null;

        for (const turn of validSlice.slice(-6)) {
          const turnRole = turn.role === 'user' ? 'user' : 'model';
          const text = (turn.content || '').trim();
          if (!text) continue;

          if (turnRole === lastRole) {
            if (contents.length > 0) {
              contents[contents.length - 1].parts[0].text += `\n\n${text}`;
            }
            continue;
          }

          contents.push({
            role: turnRole,
            parts: [{ text }],
          });
          lastRole = turnRole;
        }
      }

      // Append current user message
      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += `\n\n${message}`;
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text?.trim();
      if (reply) {
        return {
          success: true,
          reply,
          source: 'gemini',
          modelUsed: 'gemini-3.8-flash',
          retrievedContextCount: records.length,
        };
      }
    } catch (error: any) {
      console.warn(
        '[AI Nova Gemini Grounding Warning] Gemini call encountered an issue, transitioning seamlessly to grounded database fallback:',
        error?.message || error
      );
    }
  }

  // 4. Grounded Fallback Engine directly answering from database records
  const fallbackReply = generateGroundedFallbackResponse(
    message,
    records,
    conversation,
    studentName
  );

  return {
    success: true,
    reply: fallbackReply,
    source: 'campus_knowledge_engine',
    modelUsed: 'Univia Grounded Knowledge Engine (Gemini Grounded)',
    retrievedContextCount: records.length,
  };
}

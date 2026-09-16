import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { router as backendRouter } from './src/server/backendRoutes';
import studentRoutes from './src/server/routes/studentRoutes';
import societySystemRoutes from './src/server/routes/societySystemRoutes';
import { connectToDatabase, isDbConnected } from './src/server/database/db';
import { generateNovaResponse, retrieveCollegeDatabaseContext } from './src/server/services/novaIntelligenceService';
import { seedCampusSocietyData } from './src/server/services/seedSocietyData';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount Student Profiles CRUD API (MongoDB)
app.use('/api/students', studentRoutes);

// Mount Generic College Society System & Announcement Routes (MongoDB + AI)
app.use('/api', societySystemRoutes);

// Mount Auth, Event Routing & Admin Approval API routes
app.use('/api', backendRouter);

// Database connection status check
app.get('/api/database/status', (req, res) => {
  const connected = isDbConnected();
  res.json({
    success: true,
    connected,
    type: 'MongoDB',
    status: connected ? 'connected' : 'disconnected',
    message: connected
      ? 'Connected to MongoDB cluster.'
      : 'MongoDB URI not detected or connecting. Using resilient fallback in-memory store.',
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isDbConnected() ? 'connected' : 'offline_fallback',
    timestamp: new Date().toISOString(),
  });
});

// Stream Parser API Endpoint
app.post('/api/stream-parser', async (req, res) => {
  try {
    const { streamText, schedule } = req.body;

    if (!streamText || typeof streamText !== 'string') {
      res.status(400).json({ error: 'streamText is required' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      // Return flag indicating fallback or instructions
      res.status(200).json({
        fallback: true,
        message: 'No GEMINI_API_KEY set. Falling back to local engine.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const studentScheduleContext = schedule && Array.isArray(schedule)
      ? JSON.stringify(schedule.map((s: any) => ({
          title: s.title,
          time: s.time,
          location: s.location,
          date: s.date || 'Today',
        })))
      : '[]';

    const systemInstruction = `You are the core AI intelligence engine for "Univia," an advanced campus community platform designed to eliminate information overload for college freshers.

Your goal is to parse chaotic, scattered student announcement streams (from WhatsApp, emails, and discord) and restructure them into clear JSON format matching Univia's modular dashboard.

STRICT CLASSIFICATION LOGIC:
1. EVENTS TAB DATA: Extract structured dates, times, titles, society/club/host, location, category (one of: 'Social', 'Tech & Innovation', 'Arts & Culture', 'Academic & Career', 'Wellness & Sports'), and a concise description for campus workshops or social gatherings.
2. OPPORTUNITIES TAB DATA: Isolate scholarships, career paths, hidden society registrations, project grants, internships, or free perks (with title, organization, type, deadline, compensation, description).
3. CALENDAR CONFLICT DETECTION: Identify if any extracted events overlap or collide with the student's existing schedule provided in context: ${studentScheduleContext}. Detail detected conflict, extracted event, conflicting item, time slot, and recommendation.
4. HONESTY PROTOCOL: If any message lacks vital information (e.g., missing a room number, missing venue confirmation, or missing deadline time), set "incomplete_info": true and detail the missing field in "missing_fields". Do NOT make up placeholders.

OUTPUT: Return only clean, valid JSON matching the exact schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Raw Announcement Stream to Parse:\n"""\n${streamText}\n"""`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events_tab_data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  society: { type: Type.STRING },
                  date: { type: Type.STRING },
                  time: { type: Type.STRING },
                  location: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['title', 'society', 'date', 'time', 'location', 'category', 'description'],
              },
            },
            opportunities_tab_data: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  organization: { type: Type.STRING },
                  type: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  compensation: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['title', 'organization', 'type', 'deadline', 'compensation', 'description'],
              },
            },
            calendar_conflicts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  detected: { type: Type.BOOLEAN },
                  extracted_event: { type: Type.STRING },
                  conflicts_with: { type: Type.STRING },
                  time_slot: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ['detected', 'extracted_event', 'conflicts_with', 'time_slot', 'recommendation'],
              },
            },
            honesty_protocol: {
              type: Type.OBJECT,
              properties: {
                incomplete_info: { type: Type.BOOLEAN },
                missing_fields: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                notes: { type: Type.STRING },
              },
              required: ['incomplete_info', 'missing_fields', 'notes'],
            },
          },
          required: ['events_tab_data', 'opportunities_tab_data', 'calendar_conflicts', 'honesty_protocol'],
        },
      },
    });

    let rawText = (response.text || '').trim();
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }
    const parsedJson = JSON.parse(rawText || '{}');
    res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error('Gemini Stream Parser error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to parse stream with Gemini',
      fallback: true,
    });
  }
});

// AI Nova / Chatbot Intelligent Assistant Endpoint (Powered by Gemini + Campus Knowledge Engine)
const handleChatRequest = async (req: express.Request, res: express.Response) => {
  try {
    const { message, conversation = [], studentName, studentMajor } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const result = await generateNovaResponse({
      message,
      conversation,
      studentName,
      studentMajor,
    });

    res.json(result);
  } catch (error: any) {
    console.error('AI Nova endpoint error:', error);
    res.status(200).json({
      success: true,
      reply: "Hi! I am Univia, your intelligent college community assistant. I help you find information from college societies, events, announcements, and deadlines. How can I help you right now?",
      source: 'fallback',
    });
  }
};

app.post('/api/nova', handleChatRequest);
app.post('/api/chat', handleChatRequest);

// Dedicated Knowledge Retrieval Endpoint
app.post('/api/knowledge/retrieve', async (req, res) => {
  try {
    const { query = '', conversation = [] } = req.body;
    const { records, formattedContext } = await retrieveCollegeDatabaseContext(String(query), conversation);
    res.json({
      success: true,
      count: records.length,
      records,
      formattedContext,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

async function startServer() {
  // Connect to MongoDB
  try {
    await connectToDatabase();
  } catch (err: any) {
    console.warn('[Server Startup] MongoDB connection attempt finished with message:', err?.message);
  }

  // Seed campus society announcements and event records
  try {
    await seedCampusSocietyData();
  } catch (err: any) {
    console.warn('[Server Startup] Seeding notice:', err?.message);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

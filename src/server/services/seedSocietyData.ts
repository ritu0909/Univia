import { Announcement, IAnnouncement } from '../models/Announcement';
import { EventModel, IEvent } from '../models/Event';
import { Society, ISociety } from '../models/Society';
import {
  IN_MEMORY_ANNOUNCEMENTS,
  IN_MEMORY_EVENTS,
  IN_MEMORY_SOCIETIES,
} from './aiExtractionService';
import { isDbConnected } from '../database/db';

export interface SeedAnnouncement {
  announcementId: string;
  societyId: string;
  societyName: string;
  societyCategory: string;
  originalMessage: string;
  messageTimestamp: Date;
  messageType: string;
  channelId?: string;
  extractedInformation: {
    eventName: string | null;
    eventType: string | null;
    description: string | null;
    eventDescription: string | null;
    date: string | null;
    eventDate: string | null;
    dateIso?: Date | null;
    startTime: string | null;
    endTime: string | null;
    eventTime: string | null;
    venue: string | null;
    eventLocation: string | null;
    mode: string | null;
    onlineMeetingLink: string | null;
    registrationLink: string | null;
    registrationDeadline: string | null;
    registrationDeadlineIso?: Date | null;
    registrationStatus: 'open' | 'closing_soon' | 'closed' | 'not_announced';
    isRegistrationRequired: boolean | null;
    eligibility: string | null;
    targetAudience: string | null;
    fees: string | null;
    availableSeats: string | number | null;
    speakers: string[];
    contactInformation: string | null;
    importantInstructions: string | null;
    importantDeadlines: string | null;
    tags: string[];
    otherImportantDetails: string | null;
    sourceReference: string | null;
    incompleteInfo: boolean;
    missingFields: string[];
  };
}

export const SEED_ANNOUNCEMENTS: SeedAnnouncement[] = [
  {
    announcementId: 'ann-seed-ai-workshop',
    societyId: 'soc-assetmerkle',
    societyName: 'AssetMerkle IGDTUW',
    societyCategory: 'Technology & AI',
    originalMessage:
      'Join us for our AI Workshop on 20 September at 3 PM in Seminar Hall 2. Register using the link below: https://forms.gle/univia-ai-workshop-2026. Registrations close on 18 September. Bring your laptops charged.',
    messageTimestamp: new Date(Date.now() - 3600000 * 5),
    messageType: 'workshop',
    channelId: 'comm-assetmerkle',
    extractedInformation: {
      eventName: 'AI Workshop',
      eventType: 'Workshop',
      description:
        'Hands-on technical session on modern artificial intelligence fundamentals, generative models, and practical coding exercises.',
      eventDescription:
        'Hands-on technical session on modern artificial intelligence fundamentals, generative models, and practical coding exercises.',
      date: '20 September',
      eventDate: '20 September',
      dateIso: new Date('2026-09-20T15:00:00Z'),
      startTime: '3:00 PM',
      endTime: '5:00 PM',
      eventTime: '3:00 PM - 5:00 PM',
      venue: 'Seminar Hall 2',
      eventLocation: 'Seminar Hall 2',
      mode: 'Offline',
      onlineMeetingLink: null,
      registrationLink: 'https://forms.gle/univia-ai-workshop-2026',
      registrationDeadline: '18 September',
      registrationDeadlineIso: new Date('2026-09-18T23:59:59Z'),
      registrationStatus: 'open',
      isRegistrationRequired: true,
      eligibility: 'Open to all college students & freshers',
      targetAudience: 'Engineering undergraduates interested in AI',
      fees: 'Free',
      availableSeats: '80 seats (First come, first served)',
      speakers: ['AssetMerkle AI Research Leads'],
      contactInformation: 'Shaivi Jain (President) / assetmerkle@igdtuw.ac.in',
      importantInstructions: 'Bring your laptops fully charged with Python 3.10+ installed.',
      importantDeadlines: 'Registration deadline: 18 September',
      tags: ['AI', 'Tech', 'Workshop', 'Python', 'Freshers'],
      otherImportantDetails: 'Certificates of completion provided to active attendees.',
      sourceReference: 'ann-seed-ai-workshop',
      incompleteInfo: false,
      missingFields: [],
    },
  },
  {
    announcementId: 'ann-seed-decentrai',
    societyId: 'soc-assetmerkle',
    societyName: 'AssetMerkle IGDTUW',
    societyCategory: 'Technology & Web3',
    originalMessage:
      'Good afternoon everyone! 🚀 Reminder that our flagship workshop "Web3 & AI Smart Contract Odyssey: Build DecentrAI" starts today at 4:00 PM sharp in Auditorium Hall 2. Fresher registrations verified at entrance from 3:45 PM. Foundry template is live on GitHub.',
    messageTimestamp: new Date(Date.now() - 3600000 * 2),
    messageType: 'workshop',
    channelId: 'comm-assetmerkle',
    extractedInformation: {
      eventName: 'Web3 & AI Smart Contract Odyssey: Build DecentrAI',
      eventType: 'Workshop',
      description:
        'Flagship hands-on bootcamp exploring Solidity smart contracts, AI agent interactions on Sepolia testnet, and local Hardhat environments.',
      eventDescription:
        'Flagship hands-on bootcamp exploring Solidity smart contracts, AI agent interactions on Sepolia testnet, and local Hardhat environments.',
      date: 'Today',
      eventDate: 'Today',
      dateIso: new Date(),
      startTime: '4:00 PM',
      endTime: '6:30 PM',
      eventTime: '4:00 PM - 6:30 PM',
      venue: 'Auditorium Hall 2',
      eventLocation: 'Auditorium Hall 2',
      mode: 'Offline',
      onlineMeetingLink: null,
      registrationLink: 'https://univia.campus/events/decentrai-rsvp',
      registrationDeadline: 'Today, 3:45 PM (Entrance desk verification)',
      registrationDeadlineIso: new Date(),
      registrationStatus: 'open',
      isRegistrationRequired: true,
      eligibility: 'Open to all branches and years',
      targetAudience: 'Undergraduates, freshers and blockchain enthusiasts',
      fees: 'Free entry (RSVP pass required)',
      availableSeats: 135,
      speakers: ['Shaivi Jain (President)', 'Kritika Singh (VP)', 'Shreya Rathore (VP)'],
      contactInformation: 'assetmerkle@igdtuw.ac.in',
      importantInstructions: 'Run `git clone` and `forge install` beforehand. Local Hardhat node active on campus Wi-Fi.',
      importantDeadlines: 'Desk verification opens at 3:45 PM',
      tags: ['Web3', 'Blockchain', 'AI', 'Smart Contracts', 'Foundry'],
      otherImportantDetails: 'Free refreshments (cold coffee and snacks) will be served at 5:15 PM.',
      sourceReference: 'ann-seed-decentrai',
      incompleteInfo: false,
      missingFields: [],
    },
  },
  {
    announcementId: 'ann-seed-tedx-salon',
    societyId: 'soc-tedx',
    societyName: 'TEDxIGDTUW',
    societyCategory: 'Social & Cultural',
    originalMessage:
      'Team, our salon session "Breaking Boundaries in Tech & Leadership" is happening today at 5:30 PM in the Main Amphitheatre! We have 3 extraordinary guest speakers confirmed. Doors open at 5:15 PM. Free open seating for students.',
    messageTimestamp: new Date(Date.now() - 3600000 * 3),
    messageType: 'event',
    channelId: 'comm-tedx',
    extractedInformation: {
      eventName: 'Breaking Boundaries in Tech & Leadership Salon',
      eventType: 'Conference / Salon',
      description:
        'Curated campus salon hosting inspiring short talks on interdisciplinary innovation, personal leadership, and breaking glass ceilings in technology.',
      eventDescription:
        'Curated campus salon hosting inspiring short talks on interdisciplinary innovation, personal leadership, and breaking glass ceilings in technology.',
      date: 'Today',
      eventDate: 'Today',
      dateIso: new Date(),
      startTime: '5:30 PM',
      endTime: '7:15 PM',
      eventTime: '5:30 PM - 7:15 PM',
      venue: 'Main Amphitheatre',
      eventLocation: 'Main Amphitheatre',
      mode: 'Offline',
      onlineMeetingLink: null,
      registrationLink: null,
      registrationDeadline: null,
      registrationDeadlineIso: null,
      registrationStatus: 'open',
      isRegistrationRequired: false,
      eligibility: 'Open to all IGDTUW students, faculty, and guests',
      targetAudience: 'All campus community members',
      fees: 'Free entry',
      availableSeats: 150,
      speakers: ['3 Guest Speakers (Individual speaker names not detailed in initial announcement)'],
      contactInformation: 'Radhika Bansal (Lead Organizer) / tedx@igdtuw.ac.in',
      importantInstructions: 'Doors open at 5:15 PM. First-come, first-seated.',
      importantDeadlines: null,
      tags: ['TEDx', 'Leadership', 'Inspiration', 'Public Speaking', 'Salon'],
      otherImportantDetails: 'Live stage lighting and sound check completed.',
      sourceReference: 'ann-seed-tedx-salon',
      incompleteInfo: true,
      missingFields: ['speaker_names', 'registration_link'],
    },
  },
  {
    announcementId: 'ann-seed-techneeds-sprint',
    societyId: 'soc-techneeds',
    societyName: 'TechNeeds IGDTUW',
    societyCategory: 'Social Innovation & Assistive Tech',
    originalMessage:
      'Hey everyone! Assistive AI Sprint is kicking off today at 2:00 PM in Innovation Lab 302. We have tactile Braille sensors and audio feedback pipelines to test with Raspberry Pi. Open to all engineering branches. No prior hardware experience needed.',
    messageTimestamp: new Date(Date.now() - 3600000 * 4),
    messageType: 'workshop',
    channelId: 'comm-techneeds',
    extractedInformation: {
      eventName: 'Assistive AI Sprint',
      eventType: 'Build Sprint',
      description:
        'Collaborative prototyping session developing open-source tactile sensors and audio navigation aids for visually impaired students.',
      eventDescription:
        'Collaborative prototyping session developing open-source tactile sensors and audio navigation aids for visually impaired students.',
      date: 'Today',
      eventDate: 'Today',
      dateIso: new Date(),
      startTime: '2:00 PM',
      endTime: '5:00 PM',
      eventTime: '2:00 PM - 5:00 PM',
      venue: 'Innovation Lab 302',
      eventLocation: 'Innovation Lab 302',
      mode: 'Offline',
      onlineMeetingLink: null,
      registrationLink: null,
      registrationDeadline: null,
      registrationDeadlineIso: null,
      registrationStatus: 'open',
      isRegistrationRequired: false,
      eligibility: 'Open to all engineering branches; no prior hardware experience needed',
      targetAudience: 'Hardware and social impact builders',
      fees: 'Free',
      availableSeats: 40,
      speakers: ['Meera Deshmukh (Lead)', 'Natasha Joshi'],
      contactInformation: 'meera.techneeds@igdtuw.ac.in',
      importantInstructions: 'Raspberry Pi hardware kits and microcontroller sensors provided on site.',
      importantDeadlines: null,
      tags: ['AssistiveTech', 'IoT', 'RaspberryPi', 'Accessibility', 'Sprint'],
      otherImportantDetails: 'Project grants of ₹25,000 available for ongoing prototype teams.',
      sourceReference: 'ann-seed-techneeds-sprint',
      incompleteInfo: false,
      missingFields: [],
    },
  },
  {
    announcementId: 'ann-seed-wics-gsoc',
    societyId: 'soc-wics',
    societyName: 'WiCS & Coding Collective',
    societyCategory: 'Academic & Career Mentorship',
    originalMessage:
      'Google Summer of Code (GSoC) mentorship batch applications are officially open! Orientation on Wednesday at 5:00 PM in Seminar Hall 3. Register on our portal: https://wics-igdtuw.org/gsoc-apply by Friday 11:59 PM.',
    messageTimestamp: new Date(Date.now() - 3600000 * 24),
    messageType: 'opportunity',
    channelId: 'comm-wics',
    extractedInformation: {
      eventName: 'GSoC Mentorship Orientation & Cohort Applications',
      eventType: 'Orientation',
      description:
        'Guided application track and technical mentorship for Google Summer of Code (GSoC), LFX, and open-source fellowship candidates.',
      eventDescription:
        'Guided application track and technical mentorship for Google Summer of Code (GSoC), LFX, and open-source fellowship candidates.',
      date: 'Wednesday',
      eventDate: 'Wednesday',
      dateIso: new Date(Date.now() + 86400000 * 2),
      startTime: '5:00 PM',
      endTime: '6:30 PM',
      eventTime: '5:00 PM - 6:30 PM',
      venue: 'Seminar Hall 3',
      eventLocation: 'Seminar Hall 3',
      mode: 'Offline',
      onlineMeetingLink: null,
      registrationLink: 'https://wics-igdtuw.org/gsoc-apply',
      registrationDeadline: 'Friday, 11:59 PM',
      registrationDeadlineIso: new Date(Date.now() + 86400000 * 4),
      registrationStatus: 'open',
      isRegistrationRequired: true,
      eligibility: 'All 1st, 2nd, and 3rd year students eligible',
      targetAudience: 'Aspiring open-source software contributors',
      fees: 'Free',
      availableSeats: 100,
      speakers: ['Past GSoC Scholars from IGDTUW'],
      contactInformation: 'Ananya Rao / wics@igdtuw.ac.in',
      importantInstructions: 'Submit GitHub profile link during online registration.',
      importantDeadlines: 'Application deadline: Friday at 11:59 PM',
      tags: ['GSoC', 'OpenSource', 'Mentorship', 'Google', 'Internship'],
      otherImportantDetails: 'Selected cohort members receive dedicated 1-on-1 code review mentorship.',
      sourceReference: 'ann-seed-wics-gsoc',
      incompleteInfo: false,
      missingFields: [],
    },
  },
  {
    announcementId: 'ann-seed-debate-ethics',
    societyId: 'soc-tedx',
    societyName: 'Debating & Literary Society',
    societyCategory: 'Arts & Culture',
    originalMessage:
      'Asian Parliamentary Debate on AI Ethics & Intellectual Property on Wednesday, Nov 05, 11:00 AM - 4:00 PM in Conference Auditorium Hall 1. Cash prizes worth ₹25,000. Registration form: https://unstop.com/o/apd-igdtuw. Registrations close Nov 01.',
    messageTimestamp: new Date(Date.now() - 3600000 * 48),
    messageType: 'competition',
    channelId: 'comm-tedx',
    extractedInformation: {
      eventName: 'Asian Parliamentary Debate on AI Ethics & Intellectual Property',
      eventType: 'Competition / Debate',
      description:
        'Inter-college parliamentary debate exploring legal jurisprudence, algorithmic bias, and copyright protection in generative neural models.',
      eventDescription:
        'Inter-college parliamentary debate exploring legal jurisprudence, algorithmic bias, and copyright protection in generative neural models.',
      date: 'Wednesday, Nov 05',
      eventDate: 'Wednesday, Nov 05',
      dateIso: new Date('2026-11-05T11:00:00Z'),
      startTime: '11:00 AM',
      endTime: '4:00 PM',
      eventTime: '11:00 AM - 4:00 PM',
      venue: 'Conference Auditorium Hall 1',
      eventLocation: 'Conference Auditorium Hall 1',
      mode: 'Offline',
      onlineMeetingLink: null,
      registrationLink: 'https://unstop.com/o/apd-igdtuw',
      registrationDeadline: 'Nov 01, 11:59 PM',
      registrationDeadlineIso: new Date('2026-11-01T23:59:59Z'),
      registrationStatus: 'open',
      isRegistrationRequired: true,
      eligibility: 'Teams of 3 institutional debaters + 1 adjudicator',
      targetAudience: 'Collegiate debate societies and policy thinkers',
      fees: 'Free for IGDTUW students; ₹300 per external team',
      availableSeats: '32 teams',
      speakers: [],
      contactInformation: 'Shreya Singh / debate@igdtuw.ac.in',
      importantInstructions: 'Cross-adjudication guidelines followed strictly under APD conventions.',
      importantDeadlines: 'Registration closes Nov 01',
      tags: ['Debate', 'Ethics', 'AI', 'PublicPolicy', 'CashPrizes'],
      otherImportantDetails: 'Cash prize pool of ₹25,000 distributed to top 3 winning delegations.',
      sourceReference: 'ann-seed-debate-ethics',
      incompleteInfo: false,
      missingFields: [],
    },
  },
];

/**
 * Initializes the database & in-memory stores with realistic campus society announcements
 */
export async function seedCampusSocietyData(): Promise<void> {
  // 1. Populate In-Memory Store immediately
  if (IN_MEMORY_ANNOUNCEMENTS.length === 0) {
    for (const ann of SEED_ANNOUNCEMENTS) {
      IN_MEMORY_ANNOUNCEMENTS.push(ann);
    }
  }

  // Populate In-Memory Events from the seed announcements
  if (IN_MEMORY_EVENTS.length === 0) {
    for (const ann of SEED_ANNOUNCEMENTS) {
      const ext = ann.extractedInformation;
      if (ext.eventName) {
        IN_MEMORY_EVENTS.push({
          eventId: `evt-${ann.societyId}-${ann.announcementId.slice(-6)}`,
          societyId: ann.societyId,
          societyName: ann.societyName,
          title: ext.eventName,
          description: ext.description || ann.originalMessage,
          eventType: ext.eventType || 'Campus Event',
          date: ext.date || 'TBA',
          dateIso: ext.dateIso,
          startTime: ext.startTime || '',
          endTime: ext.endTime || '',
          venue: ext.venue || 'Campus Venue TBA',
          mode: ext.mode || 'Offline',
          registrationLink: ext.registrationLink || '',
          registrationDeadline: ext.registrationDeadline || '',
          registrationStatus: ext.registrationStatus || 'open',
          eligibility: ext.eligibility || 'Open to all students',
          fees: ext.fees || 'Free',
          tags: ext.tags,
          sourceAnnouncementId: ann.announcementId,
          status: 'scheduled',
          category: ext.eventType || 'Tech & Innovation',
          attendeesCount: 25,
          isToday: ext.date?.toLowerCase().includes('today') || false,
        });
      }
    }
  }

  // 2. If MongoDB is connected, persist seed records if not already present
  if (isDbConnected()) {
    try {
      for (const seed of SEED_ANNOUNCEMENTS) {
        const existing = await Announcement.findOne({ announcementId: seed.announcementId });
        if (!existing) {
          await Announcement.create(seed);
        }
      }
      console.log('[Campus Seeding] Society announcement knowledge base successfully synchronized to MongoDB.');
    } catch (err: any) {
      console.warn('[Campus Seeding Notice] Could not write seed to MongoDB, using in-memory store:', err?.message);
    }
  }
}

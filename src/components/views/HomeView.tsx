import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertTriangle,
  MapPin,
  MessageSquare,
  ChevronRight,
  Bookmark,
  Check,
  Plus,
  X,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import {
  CampusEvent,
  Society,
  Deadline,
  Opportunity,
  ScheduleItem,
  NavTab,
  UserProfile,
} from '../../types';
import { INITIAL_SCHEDULE } from '../../data/mockData';

interface HomeViewProps {
  events: CampusEvent[];
  societies: Society[];
  deadlines: Deadline[];
  opportunities: Opportunity[];
  schedule: ScheduleItem[];
  onSelectTab: (tab: NavTab) => void;
  onToggleRsvp: (id: string) => void;
  onToggleDeadlineComplete: (id: string) => void;
  onSelectEvent: (event: CampusEvent) => void;
  onSelectOpportunity: (opp: Opportunity) => void;
  onToggleOpportunitySave: (id: string) => void;
  onNavigateToCommunity?: (communityId: string) => void;
  currentUser?: UserProfile;
  isGuest?: boolean;
  onAddToSchedule?: (item: ScheduleItem) => void;
  onUpdateSchedule?: (schedule: ScheduleItem[]) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  events,
  societies,
  deadlines,
  opportunities,
  schedule,
  onSelectTab,
  onToggleRsvp,
  onToggleDeadlineComplete,
  onSelectEvent,
  onSelectOpportunity,
  onToggleOpportunitySave,
  onNavigateToCommunity,
  currentUser,
  isGuest = false,
  onAddToSchedule,
  onUpdateSchedule,
}) => {
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('All');
  const [showAddTimetableModal, setShowAddTimetableModal] = useState(false);
  const [timetableModalTab, setTimetableModalTab] = useState<'import' | 'custom'>('import');

  // Custom class slot form states
  const [customCourseTitle, setCustomCourseTitle] = useState('');
  const [customCourseCode, setCustomCourseCode] = useState('');
  const [customCourseTime, setCustomCourseTime] = useState('10:00 AM - 11:30 AM');
  const [customCourseVenue, setCustomCourseVenue] = useState('Room 204, IT Block');
  const [customCourseFaculty, setCustomCourseFaculty] = useState('Prof. Archana Kumar');
  const [customIsLab, setCustomIsLab] = useState(false);
  const [timetableFeedback, setTimetableFeedback] = useState('');

  // Today's featured events (ensures both Happening Today and Upcoming are rich)
  const rawToday = events.filter((e) => e.isToday);
  const happeningTodayEvents =
    rawToday.length > 0
      ? rawToday
      : events.slice(0, 3).map((e) => ({ ...e, isToday: true }));

  // Upcoming events
  const todayIds = new Set(happeningTodayEvents.map((e) => e.id));
  const upcomingEvents = events.filter((e) => !todayIds.has(e.id));
  const filteredUpcoming = upcomingEvents.filter((e) => {
    if (eventCategoryFilter === 'All') return true;
    if (eventCategoryFilter === 'Tech') return e.category.includes('Tech');
    if (eventCategoryFilter === 'Social') return e.category.includes('Social');
    if (eventCategoryFilter === 'Academic') return e.category.includes('Academic');
    if (eventCategoryFilter === 'Arts') return e.category.includes('Arts');
    return true;
  });

  const joinedSocieties = societies.filter((s) => s.isJoined);
  const hasConflict = schedule.some((item) => item.hasConflict);

  // Quick load official university timetable
  const handleQuickLoadOfficialTimetable = () => {
    if (onUpdateSchedule) {
      onUpdateSchedule(INITIAL_SCHEDULE);
      setTimetableFeedback('Official IGDTUW semester timetable loaded successfully!');
      setTimeout(() => {
        setTimetableFeedback('');
        setShowAddTimetableModal(false);
      }, 1200);
    } else if (onAddToSchedule) {
      INITIAL_SCHEDULE.forEach((item) => onAddToSchedule(item));
      setTimetableFeedback('Official timetable synced!');
      setTimeout(() => {
        setTimetableFeedback('');
        setShowAddTimetableModal(false);
      }, 1200);
    }
  };

  // Add custom class slot
  const handleAddCustomClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCourseTitle.trim()) return;

    const newItem: ScheduleItem = {
      id: `sch-custom-${Date.now()}`,
      time: customCourseTime.trim() || '10:00 AM - 11:30 AM',
      title: customCourseTitle.trim(),
      location: customCourseVenue.trim() || 'Campus Center',
      type: customIsLab ? 'lab' : 'class',
      instructorOrHost: customCourseFaculty.trim() || 'Faculty Instructor',
      status: 'upcoming',
      date: 'Today',
      dayOfWeek: (new Date().toLocaleDateString('en-US', { weekday: 'short' }) === 'Thu' ? 'Thurs' : new Date().toLocaleDateString('en-US', { weekday: 'short' })) as any,
      courseCode: customCourseCode.trim() || 'GEN-101',
      isLab: customIsLab,
    };

    if (onAddToSchedule) {
      onAddToSchedule(newItem);
    } else if (onUpdateSchedule) {
      onUpdateSchedule([newItem, ...schedule]);
    }

    setTimetableFeedback(`Added "${newItem.title}" to today's schedule!`);
    setCustomCourseTitle('');
    setCustomCourseCode('');
    setTimeout(() => {
      setTimetableFeedback('');
      setShowAddTimetableModal(false);
    }, 1200);
  };

  return (
    <div
      id="univia-home-dashboard"
      className="p-5 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200"
    >
      {/* IMPROVED GREETING BAR */}
      <section
        id="hero-welcome-section"
        className="rounded-2xl bg-white border border-[#EBE4F5] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#211B33] tracking-tight">
              {isGuest
                ? 'Welcome to Univia Campus 👋'
                : `Welcome, ${currentUser?.name || 'Student'} 👋`}
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F3EFFB] text-[#7033F5] border border-[#E5DAF6]">
              {isGuest
                ? 'Guest Access • IGDTUW Campus'
                : `${currentUser?.classYear || 'Class of 2030'} • ${
                    currentUser?.major?.includes('Computer')
                      ? 'CSE'
                      : currentUser?.major || 'IGDTUW'
                  }`}
            </span>
            {!isGuest && currentUser?.name && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Signed in as <strong className="font-extrabold">{currentUser.name}</strong></span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#756D85]">
            {isGuest
              ? 'Exploring IGDTUW verified societies, open workshops, and campus student directory.'
              : `Here is what is happening across campus and your upcoming schedule today, ${currentUser?.name || 'Student'}.`}
          </p>
        </div>

        {/* Quick-action shortcuts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <button
            id="quick-events-btn"
            onClick={() => onSelectTab('events')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#7033F5] text-white hover:bg-[#5E22E2] transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events ({events.length})</span>
          </button>
          <button
            id="quick-societies-btn"
            onClick={() => onSelectTab('societies')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F0FB] text-[#5527B8] hover:bg-[#ECE4F8] border border-[#E3D7F4] transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Societies</span>
          </button>
          {!isGuest && (
            <button
              id="quick-chat-btn"
              onClick={() => {
                if (onNavigateToCommunity) onNavigateToCommunity('comm-assetmerkle');
                else onSelectTab('messages');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F5F0FB] text-[#5527B8] hover:bg-[#ECE4F8] border border-[#E3D7F4] transition-colors flex items-center gap-1.5 shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Community Chat</span>
            </button>
          )}
        </div>
      </section>

      {/* SCHEDULE CONFLICT ALERT (Hidden for guests as they have no personal timetable data) */}
      {!isGuest && hasConflict && (
        <section
          id="schedule-conflict-banner"
          className="bg-amber-50/90 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-amber-900 font-medium truncate">
              <strong className="font-bold">Schedule conflict at 4:00 PM:</strong> BAI-110 Programming with Python Lab collides with AssetMerkle Web3 &amp; AI Odyssey.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('calendar')}
            className="px-3 py-1 rounded-lg font-bold text-[11px] bg-amber-600 hover:bg-amber-700 text-white shrink-0 transition-colors"
          >
            Resolve
          </button>
        </section>
      )}

      {/* HAPPENING TODAY - COMPACT CARDS */}
      <section id="happening-today-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <h2 className="text-base font-bold text-[#211B33]">Happening Today</h2>
            <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              Live
            </span>
          </div>
          <button
            onClick={() => onSelectTab('events')}
            className="text-xs font-semibold text-[#7033F5] hover:text-[#521FB8] flex items-center gap-0.5"
          >
            <span>All events</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {happeningTodayEvents.map((evt) => {
            const isAssetMerkle = evt.society.includes('AssetMerkle');
            const isTedx = evt.society.includes('TEDx');
            const commId = isAssetMerkle
              ? 'comm-assetmerkle'
              : isTedx
              ? 'comm-tedx'
              : 'comm-techneeds';

            return (
              <div
                key={evt.id}
                className="bg-white rounded-2xl border border-[#EDE7F5] p-4 hover:border-[#D6C4F3] transition-all hover:shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F0FB] text-[#7033F5]">
                      <span>{evt.societyAvatar}</span>
                      <span className="truncate max-w-[150px]">{evt.society}</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#5527B8]">
                      {evt.time}
                    </span>
                  </div>

                  <h3
                    onClick={() => onSelectEvent(evt)}
                    className="text-sm font-bold text-[#211B33] hover:text-[#7033F5] cursor-pointer transition-colors leading-snug line-clamp-1"
                  >
                    {evt.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#766E87] mt-1.5 truncate">
                    <MapPin className="w-3 h-3 text-[#7033F5] shrink-0" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#F6F1FC] flex items-center justify-between gap-2">
                  {!isGuest && (
                    <button
                      onClick={() => {
                        if (onNavigateToCommunity) onNavigateToCommunity(commId);
                        else onSelectTab('messages');
                      }}
                      className="text-xs font-semibold text-[#7033F5] hover:text-[#521FB8] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#F3EEFC] transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  )}

                  <button
                    onClick={() => onToggleRsvp(evt.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                      evt.isRsvpd
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-[#7033F5] text-white hover:bg-[#5E22E2]'
                    } ${isGuest ? 'w-full justify-center' : ''}`}
                  >
                    {evt.isRsvpd ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Going</span>
                      </>
                    ) : (
                      <span>RSVP</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MAIN TWO-COLUMN DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Upcoming Events & Communities */}
        <div className="lg:col-span-7 space-y-6">
          {/* UPCOMING EVENTS */}
          <section id="upcoming-events-section" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#211B33]">Upcoming Events</h2>
                <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-[#EFEBFA] text-[#7033F5]">
                  {filteredUpcoming.length}
                </span>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 flex-wrap">
                {['All', 'Tech', 'Social', 'Academic', 'Arts'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setEventCategoryFilter(cat)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      eventCategoryFilter === cat
                        ? 'bg-[#7033F5] text-white shadow-2xs'
                        : 'bg-white text-[#635A77] hover:bg-[#F4EFFB] border border-[#ECE5F5]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUpcoming.slice(0, 4).map((event) => {
                const commId = event.society.includes('AssetMerkle')
                  ? 'comm-assetmerkle'
                  : event.society.includes('TEDx')
                  ? 'comm-tedx'
                  : event.society.includes('TechNeeds')
                  ? 'comm-techneeds'
                  : undefined;

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl border border-[#EDE7F5] p-4 hover:border-[#D9CBEF] transition-all hover:shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[11px] font-medium text-[#7033F5] bg-[#F5F0FB] px-2 py-0.5 rounded-md truncate max-w-[170px]">
                          {event.society}
                        </span>
                        <span className="text-[10px] text-[#867E96] font-medium">
                          {event.category}
                        </span>
                      </div>

                      <h3
                        onClick={() => onSelectEvent(event)}
                        className="text-sm font-bold text-[#211B33] hover:text-[#7033F5] transition-colors cursor-pointer line-clamp-1 leading-snug"
                      >
                        {event.title}
                      </h3>

                      <div className="flex items-center gap-3 text-[11px] text-[#6E667E] mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#7033F5]" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#7033F5] shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#F8F5FC] flex items-center justify-between">
                      {!isGuest && commId ? (
                        <button
                          onClick={() => {
                            if (onNavigateToCommunity) onNavigateToCommunity(commId);
                            else onSelectTab('messages');
                          }}
                          className="text-xs text-[#7033F5] hover:text-[#501CBF] font-semibold flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Chat</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#9188A3]">
                          {event.attendeesCount} RSVP'd
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectEvent(event)}
                          className="text-xs text-[#635A77] hover:text-[#211B33] font-medium px-2 py-1"
                        >
                          Info
                        </button>
                        <button
                          onClick={() => onToggleRsvp(event.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                            event.isRsvpd
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-[#7033F5] text-white hover:bg-[#5E22E2]'
                          }`}
                        >
                          {event.isRsvpd ? 'Going ✓' : 'RSVP'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* YOUR COMMUNITIES - TIDY STRIP */}
          <section id="your-communities-section" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#211B33]">Your Communities</h2>
              <button
                onClick={() => onSelectTab('societies')}
                className="text-xs font-semibold text-[#7033F5] hover:text-[#521FB8] flex items-center gap-0.5"
              >
                <span>Browse all ({societies.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {joinedSocieties.map((society) => (
                <div
                  key={society.id}
                  className="bg-white rounded-2xl border border-[#EDE7F5] p-3.5 hover:border-[#D9CBEF] transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#F6F2FD] border border-[#EAE0F8] overflow-hidden flex items-center justify-center shrink-0 relative">
                      {society.imageUrl && society.imageUrl.trim() ? (
                        <img
                          src={society.imageUrl}
                          alt={society.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span className="text-base absolute inset-0 flex items-center justify-center -z-1">
                        {society.avatar || '🏛️'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-[#211B33] truncate">
                        {society.name}
                      </h3>
                      <p className="text-[10px] text-[#7A728C] truncate">
                        {society.memberCount} members
                      </p>
                    </div>
                  </div>

                  {!isGuest && (
                    <button
                      onClick={() => {
                        if (society.communityId && onNavigateToCommunity) {
                          onNavigateToCommunity(society.communityId);
                        } else {
                          onSelectTab('messages');
                        }
                      }}
                      className="p-1.5 rounded-xl bg-[#F3EEFC] hover:bg-[#E8DEF8] text-[#7033F5] shrink-0 transition-colors"
                      title="Open Community Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: STACKED IN EXACT SPECIFIED ORDER: TODAY'S SCHEDULE > DEADLINES > OPPORTUNITIES FOR YOU */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. TODAY'S SCHEDULE (ABOVE OPPORTUNITIES) */}
          <section
            id="todays-schedule-section"
            className="bg-white rounded-2xl border border-[#EDE7F5] p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#211B33]">
                  Today's Schedule
                </h2>
                <p className="text-[11px] text-[#7E768E]">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isGuest && (
                  <button
                    id="btn-add-timetable-header"
                    onClick={() => setShowAddTimetableModal(true)}
                    className="text-xs font-bold text-[#7033F5] hover:text-[#521FB8] bg-[#F5EFFB] hover:bg-[#EBE2F9] px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Timetable</span>
                  </button>
                )}
                <button
                  onClick={() => onSelectTab('calendar')}
                  className="text-xs font-semibold text-[#7033F5] hover:text-[#521FB8]"
                >
                  Calendar
                </button>
              </div>
            </div>

            {isGuest ? (
              <div className="p-4 rounded-xl bg-[#FAF8FD] border border-[#EDE7F5] text-center space-y-2">
                <p className="text-xs font-medium text-[#766E87]">
                  No schedule data available for guest visitors.
                </p>
                <button
                  onClick={() => onSelectTab('events')}
                  className="text-xs font-bold text-[#7033F5] hover:underline"
                >
                  Explore Public Campus Events →
                </button>
              </div>
            ) : schedule.length === 0 ? (
              <div className="p-4.5 rounded-2xl bg-gradient-to-br from-[#FAF8FE] to-[#F5EEFB] border border-[#E5D7F6] text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#7033F5]/10 text-[#7033F5] flex items-center justify-center mx-auto">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#211B33]">Add your semester timetable</h4>
                  <p className="text-[11px] text-[#716A82] max-w-xs mx-auto mt-0.5">
                    Sync your class periods to track lectures and detect conflicts with society sessions.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <button
                    id="btn-add-timetable-empty"
                    onClick={() => setShowAddTimetableModal(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#7033F5] text-white hover:bg-[#5E22E2] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Your Timetable</span>
                  </button>
                  <button
                    onClick={handleQuickLoadOfficialTimetable}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#7033F5] border border-[#DDD0F2] hover:bg-[#F3EDFB] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Load Official Timetable</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {schedule.map((item) => {
                  const isCurrent = item.status === 'current';
                  const isCompleted = item.status === 'completed';
                  const hasItemConflict = item.hasConflict;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        hasItemConflict
                          ? 'bg-amber-50/70 border-amber-300'
                          : isCurrent
                          ? 'bg-gradient-to-br from-[#F6F0FD] to-[#EFE8FD] border-[#D4C3F2]'
                          : isCompleted
                          ? 'bg-[#FCFCFD] border-[#F0ECF6] opacity-70'
                          : 'bg-[#FAF8FD] border-[#EDE7F5]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-[#5527B8] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.time}
                          </span>
                          {item.courseCode && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#EFEBFA] text-[#7033F5]">
                              {item.courseCode}
                            </span>
                          )}
                          {item.isLab && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                              Lab
                            </span>
                          )}
                        </div>
                        {hasItemConflict ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                            Conflict
                          </span>
                        ) : isCurrent ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#7033F5] text-white">
                            Now
                          </span>
                        ) : isCompleted ? (
                          <span className="text-[10px] font-medium text-emerald-700">
                            Done
                          </span>
                        ) : null}
                      </div>

                      <h4 className="text-xs font-bold text-[#211B33] truncate">
                        {item.title}
                      </h4>

                      <div className="flex items-center justify-between gap-1 text-[10px] text-[#716A82] mt-0.5">
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-[#7033F5] shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <span className="shrink-0 text-[10px] font-medium text-[#8D849F]">
                          {item.instructorOrHost}
                        </span>
                      </div>

                      {hasItemConflict && item.conflictNote && (
                        <p className="mt-1.5 text-[10px] text-amber-900 font-medium bg-amber-100/60 p-1 rounded-md line-clamp-2">
                          ⚠️ {item.conflictNote}
                        </p>
                      )}
                    </div>
                  );
                })}

                {!isGuest && (
                  <button
                    onClick={() => setShowAddTimetableModal(true)}
                    className="w-full py-2 rounded-xl text-xs font-bold text-[#7033F5] bg-[#F7F2FD] hover:bg-[#ECE3FA] border border-dashed border-[#D6C1F1] transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Class or Load Timetable</span>
                  </button>
                )}
              </div>
            )}
          </section>

          {/* 2. IMPORTANT DEADLINES (BETWEEN SCHEDULE AND OPPORTUNITIES) */}
          <section
            id="important-deadlines-section"
            className="bg-white rounded-2xl border border-[#EDE7F5] p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#211B33]">
                Deadlines
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {deadlines.filter((d) => !d.isCompleted).length} pending
              </span>
            </div>

            <div className="space-y-2">
              {deadlines.map((dl) => {
                const isHighUrgency = dl.urgency === 'high';
                const isMediumUrgency = dl.urgency === 'medium';

                return (
                  <div
                    key={dl.id}
                    onClick={() => onToggleDeadlineComplete(dl.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                      dl.isCompleted
                        ? 'bg-[#FCFCFD] border-[#F2EEF8] opacity-60'
                        : isHighUrgency
                        ? 'bg-[#FFF8F8] border-rose-200'
                        : isMediumUrgency
                        ? 'bg-[#FFFBF5] border-amber-200'
                        : 'bg-[#FAF8FD] border-[#EFEAF6]'
                    }`}
                  >
                    <button
                      type="button"
                      className="text-[#7033F5] shrink-0"
                      aria-label={dl.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {dl.isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-[#A198B2] hover:text-[#7033F5]" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${
                          dl.isCompleted ? 'line-through text-[#8E869E]' : 'text-[#211B33]'
                        }`}
                      >
                        {dl.title}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        dl.isCompleted
                          ? 'text-emerald-700 bg-emerald-50'
                          : isHighUrgency
                          ? 'text-rose-700 bg-rose-100/70'
                          : isMediumUrgency
                          ? 'text-amber-800 bg-amber-100/70'
                          : 'text-purple-700 bg-purple-100/70'
                      }`}
                    >
                      {dl.isCompleted
                        ? 'Done'
                        : dl.daysLeft === 0
                        ? 'Today'
                        : `${dl.daysLeft}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. OPPORTUNITIES FOR YOU (BELOW DEADLINES) */}
          <section id="recommended-opportunities-section" className="bg-white rounded-2xl border border-[#EDE7F5] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#211B33]">
                Opportunities for You
              </h2>
              <button
                onClick={() => onSelectTab('opportunities')}
                className="text-xs font-semibold text-[#7033F5] hover:text-[#521FB8] flex items-center gap-0.5"
              >
                <span>View all ({opportunities.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {opportunities.slice(0, 3).map((opp) => (
                <div
                  key={opp.id}
                  className="bg-[#FAF8FD] rounded-xl border border-[#EDE7F5] p-3 hover:border-[#D6C5F2] transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#EFEBFA] text-[#7033F5]">
                        {opp.type}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        {opp.compensation}
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectOpportunity(opp)}
                      className="text-xs font-bold text-[#211B33] hover:text-[#7033F5] cursor-pointer transition-colors truncate"
                    >
                      {opp.title}
                    </h3>

                    <p className="text-[11px] text-[#787187] truncate">
                      {opp.organization} • Deadline: {opp.deadline}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onToggleOpportunitySave(opp.id)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        opp.isSaved
                          ? 'bg-[#F2EDFB] text-[#7033F5] border-[#D9C8F5]'
                          : 'bg-white text-[#7B738C] border-[#EDE7F5] hover:bg-[#FAF8FE]'
                      }`}
                      title={opp.isSaved ? 'Saved' : 'Save'}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectOpportunity(opp)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        opp.hasApplied
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#7033F5] text-white hover:bg-[#5E22E2]'
                      }`}
                    >
                      {opp.hasApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ADD / SYNC TIMETABLE MODAL */}
      {showAddTimetableModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E9E1F5] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#F0EAF8] bg-gradient-to-r from-[#FAF8FE] to-[#F5EEFB]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7033F5]/10 text-[#7033F5] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#211B33]">
                    Add Your Timetable
                  </h3>
                  <p className="text-[11px] text-[#716A82]">
                    Sync your class periods to track lectures and detect conflicts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTimetableModal(false)}
                className="p-1.5 rounded-lg text-[#716A82] hover:bg-[#EBE2F6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Feedback Toast */}
            {timetableFeedback && (
              <div className="m-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{timetableFeedback}</span>
              </div>
            )}

            {/* Tabs: Official Import vs Custom Entry */}
            <div className="flex border-b border-[#F0EAF8] px-5 pt-3 gap-2">
              <button
                onClick={() => setTimetableModalTab('import')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  timetableModalTab === 'import'
                    ? 'border-[#7033F5] text-[#7033F5]'
                    : 'border-transparent text-[#716A82] hover:text-[#211B33]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Official Branch Timetable</span>
              </button>
              <button
                onClick={() => setTimetableModalTab('custom')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  timetableModalTab === 'custom'
                    ? 'border-[#7033F5] text-[#7033F5]'
                    : 'border-transparent text-[#716A82] hover:text-[#211B33]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Class</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {timetableModalTab === 'import' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#FAF8FD] border border-[#EDE5F8] space-y-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#7033F5]" />
                      <span className="text-xs font-bold text-[#211B33]">
                        {currentUser?.major || 'B.Tech Computer Science & AI (CSE-AI)'}
                      </span>
                    </div>
                    <p className="text-xs text-[#716A82]">
                      Instantly load the verified semester schedule for your cohort (includes EVS, Programming Lab, Applied Maths, Digital Electronics, and Data Structures).
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={handleQuickLoadOfficialTimetable}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#7033F5] text-white hover:bg-[#5E22E2] transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Load Official Schedule (6 Classes & Labs)</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#716A82] px-1">
                    <span>Prefer the complete interactive grid?</span>
                    <button
                      onClick={() => {
                        setShowAddTimetableModal(false);
                        onSelectTab('calendar');
                      }}
                      className="font-bold text-[#7033F5] hover:underline flex items-center gap-1"
                    >
                      <span>Open Calendar View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddCustomClass} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#211B33] block mb-1">
                      Subject / Course Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Object Oriented Programming (OOPs)"
                      value={customCourseTitle}
                      onChange={(e) => setCustomCourseTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#DDD5ED] focus:outline-none focus:border-[#7033F5] bg-[#FAF8FE]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#211B33] block mb-1">
                        Course Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BCS-201"
                        value={customCourseCode}
                        onChange={(e) => setCustomCourseCode(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#DDD5ED] focus:outline-none focus:border-[#7033F5] bg-[#FAF8FE]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#211B33] block mb-1">
                        Class Timing
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 10:00 AM - 11:30 AM"
                        value={customCourseTime}
                        onChange={(e) => setCustomCourseTime(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#DDD5ED] focus:outline-none focus:border-[#7033F5] bg-[#FAF8FE]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#211B33] block mb-1">
                        Location / Room
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Room 204, IT Block"
                        value={customCourseVenue}
                        onChange={(e) => setCustomCourseVenue(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#DDD5ED] focus:outline-none focus:border-[#7033F5] bg-[#FAF8FE]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#211B33] block mb-1">
                        Instructor / Faculty
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Archana"
                        value={customCourseFaculty}
                        onChange={(e) => setCustomCourseFaculty(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#DDD5ED] focus:outline-none focus:border-[#7033F5] bg-[#FAF8FE]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="custom-is-lab"
                      checked={customIsLab}
                      onChange={(e) => setCustomIsLab(e.target.checked)}
                      className="rounded text-[#7033F5] focus:ring-[#7033F5]"
                    />
                    <label htmlFor="custom-is-lab" className="text-xs text-[#211B33] font-medium cursor-pointer">
                      This is a Practical / Lab Session
                    </label>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTimetableModal(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#716A82] hover:bg-[#F3EEFB] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7033F5] text-white hover:bg-[#5E22E2] transition-colors shadow-sm cursor-pointer"
                    >
                      Add to Today's Schedule
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Users,
  Search,
  Sparkles,
  Check,
  Plus,
  MessageSquare,
  ArrowRight,
  LogOut,
  X,
  Compass,
  Calendar,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { ChatChannel, UserProfile } from '../types';

interface GroupChooserProps {
  channels: ChatChannel[];
  onJoinGroup: (channelId: string) => void;
  onLeaveGroup?: (channelId: string) => void;
  onOpenChat: (channelId: string) => void;
  isModal?: boolean;
  onClose?: () => void;
  currentUser?: UserProfile;
}

export const GroupChooser: React.FC<GroupChooserProps> = ({
  channels,
  onJoinGroup,
  onLeaveGroup,
  onOpenChat,
  isModal = false,
  onClose,
  currentUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Isolate community channels (not direct 1:1 chats)
  const campusGroups = channels.filter((c) => !c.isDirect);

  const categories = [
    'All',
    'Tech & AI',
    'Ideas & Culture',
    'Social Impact',
    'Women in Tech',
    'Design',
    'Fresher Cohort',
  ];

  const filteredGroups = campusGroups.filter((group) => {
    const matchesSearch =
      !searchQuery.trim() ||
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.roleOrCategory && group.roleOrCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Tech & AI') {
      return (
        group.name.includes('AssetMerkle') ||
        group.name.includes('Robotics') ||
        (group.roleOrCategory && (group.roleOrCategory.includes('Web3') || group.roleOrCategory.includes('AI')))
      );
    }
    if (selectedCategory === 'Ideas & Culture') {
      return group.name.includes('TEDx') || (group.roleOrCategory && group.roleOrCategory.includes('Ideas'));
    }
    if (selectedCategory === 'Social Impact') {
      return group.name.includes('TechNeeds') || (group.roleOrCategory && group.roleOrCategory.includes('Social'));
    }
    if (selectedCategory === 'Women in Tech') {
      return group.name.includes('WiCS') || (group.roleOrCategory && group.roleOrCategory.includes('Women'));
    }
    if (selectedCategory === 'Design') {
      return group.name.includes('Design') || (group.roleOrCategory && group.roleOrCategory.includes('Design'));
    }
    if (selectedCategory === 'Fresher Cohort') {
      return group.name.includes('Fresher') || (group.roleOrCategory && group.roleOrCategory.includes('Fresher'));
    }
    return true;
  });

  const joinedCount = campusGroups.filter((g) => g.isJoined).length;

  const showToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => {
      setActionSuccessToast(null);
    }, 2800);
  };

  const handleJoin = (group: ChatChannel) => {
    onJoinGroup(group.id);
    showToast(`Joined ${group.name}! Group chat added to your messages.`);
  };

  const handleLeave = (group: ChatChannel) => {
    if (onLeaveGroup) {
      onLeaveGroup(group.id);
    } else {
      onJoinGroup(group.id); // toggles join
    }
    showToast(`Left ${group.name}.`);
  };

  const handleJoinAllFiltered = () => {
    const unjoined = filteredGroups.filter((g) => !g.isJoined);
    unjoined.forEach((g) => {
      onJoinGroup(g.id);
    });
    showToast(`Joined ${unjoined.length} campus groups!`);
  };

  return (
    <div
      className={`flex flex-col h-full bg-[#FAF8FE] text-[#111B21] ${
        isModal
          ? 'max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-[#EDE4FA]'
          : 'w-full overflow-y-auto'
      }`}
    >
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#241E34] text-white text-xs font-semibold shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-5 sm:p-6 bg-white border-b border-[#EDE4FA] shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#EDE4FA] text-[#7033F5] border border-[#D5C2F3]">
                Campus Groups & Communities
              </span>
              <span className="text-[11px] text-[#667781] font-medium">
                IGDTUW Student Circles
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#1E192B] flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#7033F5]" />
              <span>Choose Which Groups to Join</span>
            </h1>
            <p className="text-xs text-[#54656F] max-w-2xl leading-relaxed">
              Select the university societies, technical clubs, and student cohorts you would like to join. Once joined, their live announcements, group discussions, and event updates will appear in your Messages.
            </p>
          </div>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#54656F] hover:text-[#111B21] hover:bg-[#F0F2F5] transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Stats & Quick Actions Banner */}
        <div className="mt-4 pt-4 border-t border-[#F0F2F5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="px-3 py-1 rounded-xl bg-[#FAF8FE] border border-[#EDE4FA] font-bold text-[#7033F5] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{joinedCount} Joined</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-white border border-[#E9EDEF] text-[#54656F] font-medium">
              <span>{campusGroups.length - joinedCount} Available to Explore</span>
            </div>
          </div>

          {filteredGroups.some((g) => !g.isJoined) && (
            <button
              onClick={handleJoinAllFiltered}
              className="text-xs font-bold text-[#7033F5] hover:text-[#5E25D9] flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-[#EDE4FA] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Join All ({filteredGroups.filter((g) => !g.isJoined).length} remaining)</span>
            </button>
          )}
        </div>

        {/* Search & Category Filter Pills */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#54656F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups by name, keyword, or tech stack (e.g., AI, Web3, Python, TEDx)..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-[#F0F2F5] border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7033F5] text-[#111B21] placeholder:text-[#667781]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#54656F] hover:text-[#111B21]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-medium">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#7033F5] text-white font-bold shadow-xs'
                    : 'bg-white text-[#54656F] border border-[#E9EDEF] hover:bg-[#F0F2F5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid of Campus Groups */}
      <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
        {filteredGroups.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-white rounded-2xl border border-[#EDE4FA] p-8">
            <Compass className="w-10 h-10 text-[#A098B2] mx-auto" />
            <p className="text-sm font-bold text-[#1E192B]">No groups found matching &quot;{searchQuery}&quot;</p>
            <p className="text-xs text-[#667781]">Try searching for other topics or reset the category filter.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-1.5 rounded-xl bg-[#7033F5] text-white text-xs font-bold hover:bg-[#5E25D9] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGroups.map((group) => {
              const isJoined = !!group.isJoined;

              return (
                <div
                  key={group.id}
                  className={`flex flex-col justify-between p-4 sm:p-5 rounded-2xl transition-all duration-200 border ${
                    isJoined
                      ? 'bg-white border-[#7033F5]/30 shadow-xs ring-1 ring-[#7033F5]/10'
                      : 'bg-white border-[#E9EDEF] hover:border-[#D5C2F3] hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Avatar, Title, Category */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#EDE4FA] border border-[#D5C2F3] flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                          {group.avatar || '🏛️'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-[#111B21]">
                              {group.name}
                            </h3>
                            {group.isOfficial && (
                              <span
                                className="w-4 h-4 rounded-full bg-[#7033F5]/10 text-[#7033F5] text-[10px] flex items-center justify-center font-bold"
                                title="Verified Campus Society"
                              >
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-[#7033F5] line-clamp-1">
                            {group.roleOrCategory || 'Official Campus Community'}
                          </span>
                        </div>
                      </div>

                      {isJoined ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Joined Member</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-[#FAF8FE] text-[#667781] text-[10px] font-semibold border border-[#EDE4FA] shrink-0">
                          Open to Freshers
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#54656F] leading-relaxed line-clamp-3">
                      {group.description ||
                        `Official discussion, announcements, project collaboration, and peer study group for ${group.name}.`}
                    </p>

                    {/* Group Details: Members, Latest Message / Activity */}
                    <div className="pt-2 border-t border-[#F0F2F5] space-y-1.5 text-[11px] text-[#667781]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#8696A0]" />
                          <span>{group.memberCount || 95} student members</span>
                        </span>
                        {group.lastMessageTime && (
                          <span className="text-[10px] text-[#8696A0]">
                            Active {group.lastMessageTime}
                          </span>
                        )}
                      </div>

                      {group.lastMessage && (
                        <div className="p-2 rounded-xl bg-[#FAF8FE] border border-[#F0F2F5] flex items-start gap-1.5 text-[11px] text-[#54656F]">
                          <MessageSquare className="w-3.5 h-3.5 text-[#7033F5] shrink-0 mt-0.5" />
                          <span className="line-clamp-1 italic">
                            &quot;{group.lastMessage}&quot;
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-[#F0F2F5] flex items-center justify-between gap-2">
                    {isJoined ? (
                      <>
                        <button
                          onClick={() => handleLeave(group)}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-medium text-[#667781] hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Leave Group</span>
                        </button>

                        <button
                          onClick={() => {
                            onOpenChat(group.id);
                            if (isModal && onClose) onClose();
                          }}
                          className="px-4 py-1.5 rounded-xl bg-[#7033F5] text-white text-xs font-bold hover:bg-[#5E25D9] transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <span>Open Chat</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] text-[#8696A0]">
                          1-click Instant Join
                        </span>

                        <button
                          onClick={() => handleJoin(group)}
                          className="px-4 py-1.5 rounded-xl bg-[#7033F5] text-white text-xs font-bold hover:bg-[#5E25D9] transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Join Group</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Helper */}
      <div className="p-4 bg-white border-t border-[#EDE4FA] flex flex-wrap items-center justify-between gap-3 text-xs text-[#667781] shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#7033F5]" />
          <span>
            Joining groups is free for all verified IGDTUW students. You can leave any group at any time.
          </span>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#F0F2F5] text-[#111B21] text-xs font-bold hover:bg-[#E9EDEF] transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

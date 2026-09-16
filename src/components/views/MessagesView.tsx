import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  ChevronLeft,
  X,
  FileText,
  Image as ImageIcon,
  Download,
  Users,
  Info,
  Check,
  CheckCheck,
  Clock,
  Pin,
  Star,
  Trash2,
  Reply,
  Share2,
  Mic,
  MicOff,
  Music,
  Camera,
  UserPlus,
  MapPin,
  BarChart2,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Building,
  Radio,
  FileUp,
  FolderOpen,
  MessageSquare,
  Plus,
  Compass,
} from 'lucide-react';
import {
  ChatChannel,
  MessageItem,
  UserProfile,
  ActiveCallState,
} from '../../types';
import { CURRENT_USER } from '../../data/mockData';
import { CallOverlayModal } from '../CallOverlayModal';
import { NewChatModal } from '../NewChatModal';
import { GroupChooser } from '../GroupChooser';

interface MessagesViewProps {
  channels: ChatChannel[];
  selectedChannelId: string;
  onSelectChannel: (id: string) => void;
  onSendMessage: (
    channelId: string,
    text: string,
    replyTo?: { id: string; senderName: string; text: string },
    attachment?: any
  ) => void;
  onClearUnread: (channelId: string) => void;
  onToggleReaction?: (channelId: string, messageId: string, emoji: string) => void;
  onDeleteMessage?: (channelId: string, messageId: string) => void;
  onToggleJoinCommunity?: (channelId: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
  currentUser?: UserProfile;
  onAddChannel?: (newChannel: ChatChannel) => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥹', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😔', '🥺', '😢', '😭', '😤', '😠', '🤯', '😱', '🤫', '🫡', '🫠', '😴', '💤'],
  },
  {
    name: 'Campus & Tech',
    emojis: ['💻', '📱', '🖥️', '⌨️', '🖱️', '💾', '🕹️', '📚', '📖', '📝', '✏️', '🖊️', '🎓', '🔬', '🔭', '📡', '💡', '🔍', '🔎', '⚡', '⚙️', '🛠️', '🎯', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧', '🍕', '☕', '🥪', '🍔', '🥤'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🖐️', '🖖', '👋', '✍️', '🤳', '💪'],
  },
  {
    name: 'Hearts & Vibes',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '🎉', '🎊', '🚀', '💯', '✨', '🌟', '⭐', '💥', '🚨', '📌', '📍', '🏆', '🥇'],
  },
];

export const MessagesView: React.FC<MessagesViewProps> = ({
  channels,
  selectedChannelId,
  onSelectChannel,
  onSendMessage,
  onClearUnread,
  onToggleReaction,
  onDeleteMessage,
  onToggleJoinCommunity,
  searchQuery = '',
  onSearchQueryChange,
  currentUser = CURRENT_USER,
  onAddChannel,
}) => {
  // Navigation & Channels
  const [localSearch, setLocalSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'societies' | 'direct' | 'groups' | 'explore'>('all');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showGroupChooserModal, setShowGroupChooserModal] = useState(false);
  const [infoTab, setInfoTab] = useState<'members' | 'media' | 'files'>('members');

  // New Chat & Modals
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);

  // In-Chat Search
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');

  // Input & Attachments
  const [inputText, setInputText] = useState('');
  const [replyTarget, setReplyTarget] = useState<MessageItem | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<any | null>(null);

  // Poll creation modal
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');
  const [pollOption3, setPollOption3] = useState('');

  // Location share modal
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationVenue, setLocationVenue] = useState('Central Library Quiet Study 2nd Floor');
  const [locationRoom, setLocationRoom] = useState('Room L-204');

  // Voice recording simulation
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);

  // Audio Playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Toast / Status notification
  const [toast, setToast] = useState<string | null>(null);

  // File Input Refs for Gallery, Document, Music
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSearch = searchQuery || localSearch;
  const joinedChannels = channels.filter((c) => c.isJoined || c.isDirect);
  const campusGroups = channels.filter((c) => !c.isDirect);
  const unjoinedCount = campusGroups.filter((c) => !c.isJoined).length;

  const activeChannel =
    channels.find((c) => c.id === selectedChannelId && (c.isJoined || c.isDirect)) ||
    (joinedChannels.length > 0 ? joinedChannels[0] : null);

  useEffect(() => {
    if (activeChannel && activeChannel.unreadCount > 0) {
      onClearUnread(activeChannel.id);
    }
  }, [selectedChannelId, activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannel?.messages?.length, pendingAttachment]);

  // Voice recording timer
  useEffect(() => {
    let interval: any;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setVoiceDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setVoiceDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Filter channels - only joined channels and direct chats appear in the chat list
  const filteredChannels = joinedChannels.filter((c) => {
    const query = activeSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      c.name.toLowerCase().includes(query) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(query)) ||
      (c.roleOrCategory && c.roleOrCategory.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (filterTab === 'unread') return c.unreadCount > 0;
    if (filterTab === 'societies') return !c.isDirect;
    if (filterTab === 'direct') return !!c.isDirect;
    if (filterTab === 'groups')
      return (
        !c.isDirect &&
        (c.name.includes('Group') ||
          c.name.includes('Sprint') ||
          (c.memberCount && c.memberCount < 40))
      );
    return true;
  });

  // Filter messages in chat
  const displayedMessages = (activeChannel?.messages || []).filter((m) => {
    if (!inChatSearchQuery.trim()) return true;
    return (
      m.content.toLowerCase().includes(inChatSearchQuery.toLowerCase()) ||
      m.senderName.toLowerCase().includes(inChatSearchQuery.toLowerCase())
    );
  });

  // Sending text / attachment
  const handleSend = () => {
    if ((!inputText.trim() && !pendingAttachment) || !activeChannel) return;

    onSendMessage(
      activeChannel.id,
      inputText.trim(),
      replyTarget
        ? {
            id: replyTarget.id,
            senderName: replyTarget.senderName,
            text: replyTarget.content,
          }
        : undefined,
      pendingAttachment || undefined
    );

    setInputText('');
    setReplyTarget(null);
    setPendingAttachment(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
  };

  // File Handlers
  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      if (typeof loadEvt.target?.result === 'string') {
        setPendingAttachment({
          type: 'image',
          name: file.name,
          url: loadEvt.target.result,
          size: `${(file.size / 1024).toFixed(1)} KB`,
        });
        showToast(`Image "${file.name}" ready to send`);
      }
    };
    reader.readAsDataURL(file);
    setShowAttachMenu(false);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingAttachment({
      type: 'file',
      name: file.name,
      url: '#',
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    });
    showToast(`Document "${file.name}" attached`);
    setShowAttachMenu(false);
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingAttachment({
      type: 'audio',
      name: file.name,
      url: '#',
      size: `${(file.size / 1024).toFixed(0)} KB`,
      duration: '03:45',
    });
    showToast(`Music file "${file.name}" attached`);
    setShowAttachMenu(false);
  };

  // Quick Camera Snapshot Simulation
  const handleCameraSnap = () => {
    setPendingAttachment({
      type: 'image',
      name: `Campus_Snapshot_${new Date().toLocaleTimeString().replace(/:/g, '')}.jpg`,
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%237033F5"/><text x="50%" y="50%" font-family="sans-serif" font-size="20" fill="white" font-weight="bold" text-anchor="middle" dominant-baseline="middle">📸 Campus Snapshot</text></svg>',
      size: '1.2 MB',
    });
    showToast('Campus photo captured');
    setShowAttachMenu(false);
  };

  // Share Contact Card
  const handleShareContact = () => {
    setPendingAttachment({
      type: 'contact',
      name: 'Tanvi Gupta',
      url: '#',
      contactInfo: {
        name: 'Tanvi Gupta',
        phone: '+91 98712 34567',
        role: 'Lead, AssetMerkle Team • 4th Year CSE',
      },
    });
    showToast('Contact card prepared');
    setShowAttachMenu(false);
  };

  // Share Campus Poll
  const handleCreatePoll = () => {
    if (!pollQuestion.trim() || !pollOption1.trim() || !pollOption2.trim()) {
      showToast('Please provide a question and at least 2 options');
      return;
    }

    const options = [
      { id: 'opt-1', text: pollOption1.trim(), votes: 1, voters: ['You'] },
      { id: 'opt-2', text: pollOption2.trim(), votes: 0, voters: [] },
    ];
    if (pollOption3.trim()) {
      options.push({ id: 'opt-3', text: pollOption3.trim(), votes: 0, voters: [] });
    }

    setPendingAttachment({
      type: 'poll',
      name: pollQuestion.trim(),
      url: '#',
      pollInfo: {
        question: pollQuestion.trim(),
        options,
        totalVotes: 1,
      },
    });

    setShowPollCreator(false);
    setPollQuestion('');
    setPollOption1('');
    setPollOption2('');
    setPollOption3('');
    setShowAttachMenu(false);
    showToast('Campus poll attached! Hit Send.');
  };

  // Share Campus Location Pin
  const handleShareLocation = () => {
    setPendingAttachment({
      type: 'location',
      name: locationVenue,
      url: '#',
      locationInfo: {
        venue: locationVenue,
        room: locationRoom,
        notes: 'Meet right here for project sync.',
      },
    });
    setShowLocationModal(false);
    setShowAttachMenu(false);
    showToast('Campus venue location attached!');
  };

  // Voice Note Send
  const handleSendVoiceNote = () => {
    if (!activeChannel) return;
    const durationStr = `${Math.floor(voiceDuration / 60)}:${(voiceDuration % 60)
      .toString()
      .padStart(2, '0')}`;

    onSendMessage(
      activeChannel.id,
      '🎤 Voice Note',
      undefined,
      {
        type: 'voice',
        name: `Voice_Note_${Date.now()}.m4a`,
        url: '#',
        duration: durationStr || '0:05',
        size: '120 KB',
      }
    );

    setIsRecordingVoice(false);
    setVoiceDuration(0);
    showToast('Voice note sent to channel');
  };

  // Call Initiators
  const handleStartCall = (isVideo: boolean) => {
    if (!activeChannel) return;
    setActiveCall({
      channelId: activeChannel.id,
      channelName: activeChannel.name,
      avatar: activeChannel.avatar,
      isVideo,
      isDirect: !!activeChannel.isDirect,
    });
  };

  const handleEndCall = (durationSeconds: number) => {
    if (activeCall && activeChannel) {
      const mins = Math.floor(durationSeconds / 60);
      const secs = (durationSeconds % 60).toString().padStart(2, '0');
      const callTypeLabel = activeCall.isVideo ? '📹 Video call' : '📞 Audio call';
      onSendMessage(
        activeChannel.id,
        `${callTypeLabel} ended • ${mins}:${secs}`
      );
    }
    setActiveCall(null);
    showToast('Call ended');
  };

  // Create Direct Chat
  const handleCreateDirectChat = (contact: {
    name: string;
    avatar: string;
    role: string;
    phone?: string;
  }) => {
    const existing = channels.find((c) => c.isDirect && c.name === contact.name);
    if (existing) {
      onSelectChannel(existing.id);
      setShowMobileChat(true);
      showToast(`Switched to conversation with ${contact.name}`);
      return;
    }

    const newChan: ChatChannel = {
      id: `chat-direct-${Date.now()}`,
      name: contact.name,
      isDirect: true,
      avatar: contact.avatar,
      roleOrCategory: contact.role,
      unreadCount: 0,
      lastMessage: 'Started new direct chat',
      lastMessageTime: 'Just now',
      isOnline: true,
      messages: [
        {
          id: `msg-welcome-${Date.now()}`,
          senderId: 'sys',
          senderName: 'Univia Campus Security',
          senderAvatar: '',
          isSelf: false,
          content: `🔒 Messages to ${contact.name} are end-to-end encrypted on the Univia college network.`,
          timestamp: 'Just now',
          status: 'read',
        },
      ],
    };

    if (onAddChannel) {
      onAddChannel(newChan);
    }
    onSelectChannel(newChan.id);
    setShowMobileChat(true);
    showToast(`Started chat with ${contact.name}`);
  };

  // Create Group
  const handleCreateGroup = (group: {
    name: string;
    avatarEmoji: string;
    description: string;
    selectedMembers: string[];
  }) => {
    const newChan: ChatChannel = {
      id: `group-${Date.now()}`,
      name: group.name,
      isDirect: false,
      roleOrCategory: 'Student Project Group',
      unreadCount: 0,
      lastMessage: `Group created with ${group.selectedMembers.length + 1} members`,
      lastMessageTime: 'Just now',
      memberCount: group.selectedMembers.length + 1,
      description: group.description,
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          senderId: currentUser.campusCardId,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          isSelf: true,
          content: `Created group "${group.name}". Welcome everyone! 🚀`,
          timestamp: 'Just now',
          status: 'delivered',
        },
      ],
    };

    if (onAddChannel) {
      onAddChannel(newChan);
    }
    onSelectChannel(newChan.id);
    setShowMobileChat(true);
    showToast(`Created group "${group.name}"`);
  };

  // Create Community
  const handleCreateCommunity = (comm: {
    name: string;
    category: string;
    description: string;
    avatarEmoji: string;
  }) => {
    const newChan: ChatChannel = {
      id: `community-${Date.now()}`,
      name: `${comm.name} Official`,
      isDirect: false,
      roleOrCategory: comm.category,
      unreadCount: 0,
      lastMessage: 'Official announcements channel initiated',
      lastMessageTime: 'Just now',
      memberCount: 50,
      description: comm.description,
      isOfficial: true,
      messages: [
        {
          id: `msg-comm-${Date.now()}`,
          senderId: currentUser.campusCardId,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar,
          isSelf: true,
          content: `📢 Official announcements channel for ${comm.name} created on Univia.`,
          timestamp: 'Just now',
          status: 'delivered',
        },
      ],
    };

    if (onAddChannel) {
      onAddChannel(newChan);
    }
    onSelectChannel(newChan.id);
    setShowMobileChat(true);
    showToast(`Created community "${comm.name}"`);
  };

  // Vote on campus poll
  const handleVotePoll = (messageId: string, optionId: string) => {
    showToast('Vote recorded on campus poll!');
  };

  return (
    <div
      id="univia-whatsapp-messages-root"
      className="w-full h-full flex flex-col md:flex-row bg-[#F0F2F5] overflow-hidden select-text relative"
    >
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#1F2937]/90 text-white text-xs font-semibold px-4 py-2 rounded-2xl shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 flex items-center gap-2 border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Hidden File Inputs for real folder/gallery/music uploads */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleGalleryUpload}
        className="hidden"
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.zip,.json,.py,.csv"
        onChange={handleDocUpload}
        className="hidden"
      />
      <input
        ref={musicInputRef}
        type="file"
        accept="audio/*"
        onChange={handleMusicUpload}
        className="hidden"
      />

      {/* =========================================================================
          LEFT PANE: WhatsApp Chat Directory & Channels List
          ========================================================================= */}
      <div
        className={`w-full md:w-88 lg:w-96 bg-white border-r border-[#E9EDEF] flex flex-col shrink-0 h-full ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* WhatsApp Left Header */}
        <div className="h-15 px-4 bg-[#F0F2F5] border-b border-[#E9EDEF] flex items-center justify-between shrink-0">
          {/* User Profile Pill */}
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer group">
              {currentUser.avatar && currentUser.avatar.trim() ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover border border-white shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#E5D7F9] text-[#7033F5] font-bold text-xs flex items-center justify-center border border-white shadow-2xs">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-[#111B21] flex items-center gap-1">
                <span>{currentUser.name}</span>
              </p>
              <p className="text-[10px] text-[#54656F] truncate max-w-[120px]">
                {currentUser.handle}
              </p>
            </div>
          </div>

          {/* WhatsApp Action Icons */}
          <div className="flex items-center gap-1 text-[#54656F]">
            {/* Status / Updates */}
            <button
              onClick={() => showToast('All campus status updates are synced.')}
              className="p-2 rounded-full hover:bg-black/5 hover:text-[#111B21] transition-colors"
              title="Status"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>

            {/* Choose / Join Groups Button */}
            <button
              onClick={() => setShowGroupChooserModal(true)}
              className="px-2.5 py-1 rounded-full bg-[#FAF8FE] border border-[#7033F5]/30 text-[#7033F5] text-[11px] font-bold hover:bg-[#7033F5]/10 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Choose which campus groups to join"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Join Groups</span>
              {unjoinedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#7033F5] text-white text-[9px] flex items-center justify-center font-extrabold">
                  {unjoinedCount}
                </span>
              )}
            </button>

            {/* Communities */}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-full hover:bg-black/5 hover:text-[#111B21] transition-colors"
              title="Communities & Societies"
            >
              <Building className="w-4.5 h-4.5" />
            </button>

            {/* New Chat / Add Contact */}
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-full hover:bg-black/5 hover:text-[#111B21] transition-colors"
              title="New Chat / Add Contact"
            >
              <UserPlus className="w-4.5 h-4.5 text-[#7033F5]" />
            </button>

            {/* More Menu */}
            <div className="relative group">
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 rounded-full hover:bg-black/5 hover:text-[#111B21] transition-colors"
                title="Menu"
              >
                <MoreVertical className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Search Bar & Filter Pills */}
        <div className="p-2.5 bg-white border-b border-[#F0F2F5] space-y-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#54656F] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={activeSearch}
              onChange={(e) => {
                if (onSearchQueryChange) onSearchQueryChange(e.target.value);
                setLocalSearch(e.target.value);
              }}
              placeholder="Search or start new chat"
              className="w-full pl-9 pr-7 py-1.5 text-xs bg-[#F0F2F5] border-0 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#7033F5] text-[#111B21] placeholder:text-[#667781]"
            />
            {activeSearch && (
              <button
                onClick={() => {
                  if (onSearchQueryChange) onSearchQueryChange('');
                  setLocalSearch('');
                }}
                className="absolute right-2.5 p-0.5 rounded-full text-[#54656F] hover:text-[#111B21]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick WhatsApp Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px] font-medium">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                filterTab === 'all'
                  ? 'bg-[#E7FCE3] text-[#008069] font-bold border border-[#A7E9D9]'
                  : 'bg-[#F0F2F5] text-[#54656F] hover:bg-[#E9EDEF]'
              }`}
            >
              All ({joinedChannels.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                filterTab === 'unread'
                  ? 'bg-[#E7FCE3] text-[#008069] font-bold border border-[#A7E9D9]'
                  : 'bg-[#F0F2F5] text-[#54656F] hover:bg-[#E9EDEF]'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilterTab('societies')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                filterTab === 'societies'
                  ? 'bg-[#EDE4FA] text-[#7033F5] font-bold border border-[#D5C2F3]'
                  : 'bg-[#F0F2F5] text-[#54656F] hover:bg-[#E9EDEF]'
              }`}
            >
              Societies
            </button>
            <button
              onClick={() => setFilterTab('direct')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                filterTab === 'direct'
                  ? 'bg-[#EDE4FA] text-[#7033F5] font-bold border border-[#D5C2F3]'
                  : 'bg-[#F0F2F5] text-[#54656F] hover:bg-[#E9EDEF]'
              }`}
            >
              Direct
            </button>
            <button
              onClick={() => setFilterTab('explore')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filterTab === 'explore'
                  ? 'bg-[#7033F5] text-white font-bold shadow-xs'
                  : 'bg-[#FAF8FE] text-[#7033F5] border border-[#EDE4FA] hover:bg-[#F3ECFB]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Groups ({campusGroups.length})</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#F0F2F5]">
          {joinedChannels.length === 0 ? (
            <div className="p-4 space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8FE] border border-[#EDE4FA] text-center space-y-2.5">
                <div className="w-11 h-11 rounded-2xl bg-white text-[#7033F5] flex items-center justify-center mx-auto shadow-xs border border-[#EDE4FA]">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-[#1E192B]">No Groups Joined Yet</h4>
                <p className="text-[11px] text-[#667781] leading-relaxed">
                  Choose which campus groups to join to receive discussions, announcements, and events in your Messages.
                </p>
                <button
                  onClick={() => {
                    setFilterTab('explore');
                    setShowMobileChat(true);
                  }}
                  className="w-full py-2 rounded-xl bg-[#7033F5] text-white text-xs font-bold hover:bg-[#5E25D9] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Choose Groups to Join</span>
                </button>
              </div>

              {/* Quick join suggestions right in sidebar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-[#8696A0] uppercase tracking-wider">
                    Suggested Campus Groups
                  </span>
                  <button
                    onClick={() => {
                      setFilterTab('explore');
                      setShowMobileChat(true);
                    }}
                    className="text-[10px] font-bold text-[#7033F5] hover:underline"
                  >
                    View All ({campusGroups.length})
                  </button>
                </div>

                <div className="space-y-1.5">
                  {campusGroups.slice(0, 4).map((grp) => (
                    <div
                      key={grp.id}
                      className="p-2.5 rounded-xl bg-white border border-[#E9EDEF] flex items-center justify-between gap-2 hover:border-[#D5C2F3] transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#EDE4FA] text-base flex items-center justify-center shrink-0">
                          {grp.avatar || '⚡'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#111B21] truncate">
                            {grp.name}
                          </p>
                          <p className="text-[10px] text-[#667781] truncate">
                            {grp.memberCount || 100} members
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (onToggleJoinCommunity) onToggleJoinCommunity(grp.id);
                          onSelectChannel(grp.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#7033F5] text-white text-[10px] font-bold hover:bg-[#5E25D9] transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Join</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-[#667781] space-y-2">
              <p className="text-xs">No conversations match &quot;{activeSearch}&quot;</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="text-xs font-bold text-[#7033F5] hover:underline"
              >
                + Start a new campus chat
              </button>
            </div>
          ) : (
            <>
              {filteredChannels.map((channel) => {
                const isSelected = channel.id === activeChannel?.id;
                return (
                  <div
                    key={channel.id}
                    onClick={() => {
                      onSelectChannel(channel.id);
                      setFilterTab('all');
                      setShowMobileChat(true);
                    }}
                    className={`px-3.5 py-3 flex items-center gap-3 cursor-pointer transition-colors relative group ${
                      isSelected ? 'bg-[#F0F2F5]' : 'hover:bg-[#F5F6F6] bg-white'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-[#E9EDEF] flex items-center justify-center border border-[#E9EDEF]">
                        {channel.avatar && channel.avatar.trim() ? (
                          <img
                            src={channel.avatar}
                            alt={channel.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-[#7033F5]">
                            {channel.isDirect ? '👤' : '⚡'}
                          </span>
                        )}
                      </div>
                      {channel.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                      )}
                    </div>

                    {/* Channel Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <h3 className="text-xs font-bold text-[#111B21] truncate">
                            {channel.name}
                          </h3>
                          {channel.isOfficial && (
                            <span className="text-[10px] text-[#7033F5] shrink-0 font-extrabold" title="Verified Campus Society">
                              ✓
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] shrink-0 font-medium ${
                            channel.unreadCount > 0
                              ? 'text-emerald-600 font-bold'
                              : 'text-[#667781]'
                          }`}
                        >
                          {channel.lastMessageTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-[#667781] truncate flex items-center gap-1">
                          {channel.messages[channel.messages.length - 1]?.isSelf && (
                            <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB] shrink-0 inline" />
                          )}
                          <span>{channel.lastMessage || 'Tap to chat...'}</span>
                        </p>

                        {channel.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                            {channel.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bottom discovery prompt in sidebar */}
              <div className="p-3 bg-[#FAF8FE] border-t border-[#EDE4FA]">
                <button
                  onClick={() => setShowGroupChooserModal(true)}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-[#7033F5]/40 text-[#7033F5] hover:bg-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Choose More Groups ({unjoinedCount} available)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom Quick-Add Bar */}
        <div className="p-3 bg-[#F0F2F5] border-t border-[#E9EDEF] flex items-center justify-between text-xs text-[#54656F] shrink-0">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-1.5 font-bold text-[#7033F5] hover:underline"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Contact / Group</span>
          </button>
          <span className="text-[10px] text-[#8696A0]">Univia Campus WhatsApp</span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANE: Active Conversation Window OR Group Chooser
          ========================================================================= */}
      {activeChannel && filterTab !== 'explore' ? (
        <div
          className={`flex-1 flex flex-col h-full bg-[#EFEAE2] relative overflow-hidden ${
            !showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Subtle WhatsApp-style doodle background */}
          <div
            className="absolute inset-0 opacity-4 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#121B22 0.75px, transparent 0.75px), radial-gradient(#121B22 0.75px, #EFEAE2 0.75px)`,
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          ></div>

          {/* WhatsApp Chat Header Bar */}
          <div className="h-15 px-4 bg-[#F0F2F5] border-b border-[#E9EDEF] flex items-center justify-between shrink-0 relative z-10">
            <div className="flex items-center gap-3">
              {/* Mobile Back Button */}
              <button
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-1.5 -ml-2 rounded-full text-[#54656F] hover:bg-black/5"
                title="Back to Chats"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div
                onClick={() => setShowInfoDrawer(!showInfoDrawer)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E9EDEF] flex items-center justify-center border border-[#E9EDEF]">
                    {activeChannel.avatar && activeChannel.avatar.trim() ? (
                      <img
                        src={activeChannel.avatar}
                        alt={activeChannel.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-[#7033F5]">⚡</span>
                    )}
                  </div>
                  {activeChannel.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  )}
                </div>

                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-[#111B21] flex items-center gap-1.5 group-hover:text-[#7033F5] transition-colors">
                    <span>{activeChannel.name}</span>
                    {activeChannel.isOfficial && (
                      <span className="text-[10px] text-[#7033F5] font-extrabold">✓</span>
                    )}
                  </h2>
                  <p className="text-[10px] text-[#54656F]">
                    {activeChannel.isDirect
                      ? activeChannel.isOnline
                        ? 'online'
                        : 'last seen recently'
                      : `${activeChannel.memberCount || 120} members • Official Community`}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Action Icons: Video, Call, Search, Info */}
            <div className="flex items-center gap-1 text-[#54656F]">
              {/* Explore & Join Groups Button */}
              <button
                onClick={() => setShowGroupChooserModal(true)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 mr-1 rounded-xl bg-white border border-[#EDE4FA] text-[#7033F5] text-xs font-bold hover:bg-[#FAF8FE] transition-colors"
                title="Choose which groups to join"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Join Groups</span>
              </button>

              {/* Video Call */}
              <button
                onClick={() => handleStartCall(true)}
                className="p-2.5 rounded-full hover:bg-black/5 hover:text-[#111B21] transition-colors"
                title="Video Call"
              >
                <Video className="w-4.5 h-4.5 text-[#7033F5]" />
              </button>

              {/* Audio Call */}
              <button
                onClick={() => handleStartCall(false)}
                className="p-2.5 rounded-full hover:bg-black/5 hover:text-[#111B21] transition-colors"
                title="Audio Call"
              >
                <Phone className="w-4.5 h-4.5 text-[#008069]" />
              </button>

              {/* Search in Chat */}
              <button
                onClick={() => setShowInChatSearch(!showInChatSearch)}
                className={`p-2.5 rounded-full transition-colors ${
                  showInChatSearch
                    ? 'bg-[#E9EDEF] text-[#111B21]'
                    : 'hover:bg-black/5 hover:text-[#111B21]'
                }`}
                title="Search in conversation"
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {/* Info Drawer Toggle */}
              <button
                onClick={() => setShowInfoDrawer(!showInfoDrawer)}
                className={`p-2.5 rounded-full transition-colors ${
                  showInfoDrawer
                    ? 'bg-[#E9EDEF] text-[#111B21]'
                    : 'hover:bg-black/5 hover:text-[#111B21]'
                }`}
                title="Community / Contact Info"
              >
                <Info className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* In-Chat Message Search Bar (Expandable) */}
          {showInChatSearch && (
            <div className="px-4 py-2 bg-[#F0F2F5] border-b border-[#E9EDEF] flex items-center gap-3 relative z-10 animate-in slide-in-from-top-1 duration-150">
              <Search className="w-4 h-4 text-[#54656F]" />
              <input
                type="text"
                value={inChatSearchQuery}
                onChange={(e) => setInChatSearchQuery(e.target.value)}
                placeholder="Search messages in this chat..."
                className="flex-1 bg-white px-3 py-1.5 text-xs rounded-xl border border-[#E9EDEF] focus:outline-none focus:ring-1 focus:ring-[#7033F5] text-[#111B21]"
                autoFocus
              />
              <span className="text-[11px] text-[#54656F]">
                {displayedMessages.length} match(es)
              </span>
              <button
                onClick={() => {
                  setShowInChatSearch(false);
                  setInChatSearchQuery('');
                }}
                className="p-1 rounded-full text-[#54656F] hover:text-[#111B21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Messages Container Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 relative z-0">
            {/* Campus Encryption Notice Banner */}
            <div className="flex justify-center">
              <div className="bg-[#FFEECD] text-[#54656F] text-[10px] px-3.5 py-1.5 rounded-xl max-w-md text-center shadow-2xs border border-[#FFE0A3] flex items-center justify-center gap-1.5">
                <span>🔒</span>
                <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
              </div>
            </div>

            {displayedMessages.map((msg) => {
              const isSelf = msg.isSelf;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isSelf ? 'justify-end' : 'justify-start'} group`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-2.5 sm:p-3 shadow-2xs relative text-xs ${
                      isSelf
                        ? 'bg-[#E7FFDB] text-[#111B21] rounded-tr-xs'
                        : 'bg-white text-[#111B21] rounded-tl-xs'
                    }`}
                  >
                    {/* Sender Name in Group Chats */}
                    {!isSelf && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-extrabold text-[11px] text-[#7033F5]">
                          {msg.senderName}
                        </span>
                        {msg.role && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#F3ECFC] text-[#7033F5]">
                            {msg.role}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Reply Quote Preview */}
                    {msg.replyTo && (
                      <div className="mb-1.5 p-2 rounded-xl bg-black/5 border-l-3 border-[#7033F5] text-[11px]">
                        <p className="font-bold text-[#7033F5]">
                          {msg.replyTo.senderName}
                        </p>
                        <p className="text-[#54656F] line-clamp-1">
                          {msg.replyTo.text}
                        </p>
                      </div>
                    )}

                    {/* Attachment Renderers */}
                    {msg.attachment && (
                      <div className="mb-2">
                        {/* Image Attachment */}
                        {msg.attachment.type === 'image' && Boolean(msg.attachment.url?.trim()) && (
                          <div className="rounded-xl overflow-hidden border border-black/5 shadow-2xs">
                            <img
                              src={msg.attachment.url}
                              alt={msg.attachment.name}
                              className="w-full max-h-72 object-cover"
                            />
                            {msg.attachment.name && (
                              <div className="p-1.5 bg-black/5 text-[10px] text-[#54656F] flex items-center justify-between">
                                <span className="truncate">{msg.attachment.name}</span>
                                {msg.attachment.size && <span>{msg.attachment.size}</span>}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Document Attachment */}
                        {msg.attachment.type === 'file' && (
                          <div className="p-2.5 rounded-xl bg-black/5 border border-black/5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <FileText className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-[11px] truncate text-[#111B21]">
                                  {msg.attachment.name}
                                </p>
                                <p className="text-[9px] text-[#667781]">
                                  {msg.attachment.size || 'Document'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => showToast(`Downloading ${msg.attachment?.name || 'file'}`)}
                              className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-[#54656F] hover:text-[#111B21] transition-colors shrink-0 shadow-2xs"
                              title="Download document"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Audio / Music Attachment */}
                        {msg.attachment.type === 'audio' && (
                          <div className="p-2.5 rounded-xl bg-black/5 border border-black/5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-[#7033F5] text-white flex items-center justify-center shrink-0">
                                  <Music className="w-4 h-4" />
                                </span>
                                <div>
                                  <p className="font-bold text-[11px] truncate">
                                    {msg.attachment.name}
                                  </p>
                                  <p className="text-[9px] text-[#667781]">
                                    {msg.attachment.duration || '03:45'} • Audio Track
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  setPlayingAudioId(
                                    playingAudioId === msg.id ? null : msg.id
                                  )
                                }
                                className="w-7 h-7 rounded-full bg-[#7033F5] text-white flex items-center justify-center shadow-xs hover:scale-105 transition-transform"
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 ml-0.5" />
                                )}
                              </button>
                            </div>
                            {/* Waveform track */}
                            <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-[#7033F5] transition-all duration-300 ${
                                  playingAudioId === msg.id ? 'w-2/3 animate-pulse' : 'w-1/4'
                                }`}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Voice Note Attachment */}
                        {msg.attachment.type === 'voice' && (
                          <div className="p-2.5 rounded-xl bg-black/5 flex items-center gap-3">
                            <button
                              onClick={() =>
                                setPlayingAudioId(
                                  playingAudioId === msg.id ? null : msg.id
                                )
                              }
                              className="w-8 h-8 rounded-full bg-[#008069] text-white flex items-center justify-center shadow-xs shrink-0"
                            >
                              {playingAudioId === msg.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1 space-y-1">
                              {/* Audio bars */}
                              <div className="flex items-center gap-0.5 h-4">
                                {[30, 60, 45, 90, 70, 40, 80, 50, 65, 35, 75, 40].map(
                                  (h, idx) => (
                                    <span
                                      key={idx}
                                      style={{ height: `${h}%` }}
                                      className={`w-1 rounded-full ${
                                        playingAudioId === msg.id
                                          ? 'bg-[#008069]'
                                          : 'bg-black/25'
                                      }`}
                                    ></span>
                                  )
                                )}
                              </div>
                              <span className="text-[9px] text-[#667781] block">
                                {msg.attachment.duration || '0:06'}
                              </span>
                            </div>
                            <span className="text-sm">🎙️</span>
                          </div>
                        )}

                        {/* Campus Poll Attachment */}
                        {msg.attachment.type === 'poll' && msg.attachment.pollInfo && (
                          <div className="p-3 rounded-xl bg-white border border-[#DDD3F0] space-y-2 text-[#111B21]">
                            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#7033F5]">
                              <BarChart2 className="w-3.5 h-3.5" />
                              <span>Campus Poll</span>
                            </div>
                            <p className="font-bold text-xs">
                              {msg.attachment.pollInfo.question}
                            </p>
                            <div className="space-y-1.5 pt-1">
                              {msg.attachment.pollInfo.options.map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => handleVotePoll(msg.id, opt.id)}
                                  className="w-full p-2 rounded-lg bg-[#FAF8FE] hover:bg-[#F2ECFB] border border-[#E9E1F5] text-left text-[11px] flex items-center justify-between transition-colors"
                                >
                                  <span>{opt.text}</span>
                                  <span className="text-[10px] font-bold text-[#7033F5]">
                                    {opt.votes} vote(s)
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Location Attachment */}
                        {msg.attachment.type === 'location' && msg.attachment.locationInfo && (
                          <div className="rounded-xl overflow-hidden border border-[#DCD0F0] bg-white shadow-2xs">
                            <div className="p-3 bg-gradient-to-r from-[#7033F5] to-[#8C52FF] text-white">
                              <div className="flex items-center gap-1.5 text-xs font-bold">
                                <MapPin className="w-4 h-4" />
                                <span>{msg.attachment.locationInfo.venue}</span>
                              </div>
                              <p className="text-[10px] text-white/80 mt-0.5">
                                {msg.attachment.locationInfo.room}
                              </p>
                            </div>
                            <div className="p-2 text-[10px] text-[#54656F] flex items-center justify-between">
                              <span>{msg.attachment.locationInfo.notes}</span>
                              <span className="text-[#7033F5] font-bold">Open Campus Map</span>
                            </div>
                          </div>
                        )}

                        {/* Contact Card Attachment */}
                        {msg.attachment.type === 'contact' && msg.attachment.contactInfo && (
                          <div className="p-3 rounded-xl bg-white border border-[#D5C2F3] shadow-2xs space-y-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-[#7033F5] text-white font-bold flex items-center justify-center text-xs">
                                {msg.attachment.contactInfo?.name?.[0] || 'C'}
                              </div>
                              <div>
                                <p className="font-bold text-xs">{msg.attachment.contactInfo?.name || 'Contact'}</p>
                                <p className="text-[10px] text-[#667781]">{msg.attachment.contactInfo?.phone || ''}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (msg.attachment?.contactInfo) {
                                  handleCreateDirectChat({
                                    name: msg.attachment.contactInfo.name,
                                    phone: msg.attachment.contactInfo.phone,
                                    role: msg.attachment.contactInfo.role,
                                    avatar: '',
                                  });
                                }
                              }}
                              className="w-full py-1.5 bg-[#F2ECFB] hover:bg-[#EAE0F9] text-[#7033F5] rounded-lg text-center font-bold text-[10px] transition-colors"
                            >
                              Message Contact
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Content Text */}
                    {msg.content && (
                      <p className="leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    )}

                    {/* Footer: Timestamp & Delivery Ticks */}
                    <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-[#667781]">
                      <span>{msg.timestamp}</span>
                      {isSelf && (
                        <span>
                          {msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#8696A0]" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-[#8696A0]" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Quick Hover Action Bar */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/95 rounded-lg shadow-sm border border-black/5 px-1 py-0.5">
                      <button
                        onClick={() => setReplyTarget(msg)}
                        className="p-1 hover:text-[#7033F5] text-[#54656F]"
                        title="Reply"
                      >
                        <Reply className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => showToast('Message starred')}
                        className="p-1 hover:text-amber-500 text-[#54656F]"
                        title="Star"
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Quote Banner */}
          {replyTarget && (
            <div className="px-4 py-2 bg-[#F0F2F5] border-t border-[#E9EDEF] flex items-center justify-between relative z-10 animate-in slide-in-from-bottom-1">
              <div className="border-l-3 border-[#7033F5] pl-3 py-0.5 text-xs">
                <p className="font-bold text-[#7033F5]">
                  Replying to {replyTarget.senderName}
                </p>
                <p className="text-[#54656F] text-[11px] truncate max-w-lg">
                  {replyTarget.content}
                </p>
              </div>
              <button
                onClick={() => setReplyTarget(null)}
                className="p-1 text-[#54656F] hover:text-[#111B21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pending Attachment Preview Bar */}
          {pendingAttachment && (
            <div className="px-4 py-2.5 bg-[#FAF8FE] border-t border-[#DDD2F1] flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                {pendingAttachment.type === 'image' && pendingAttachment.url && pendingAttachment.url.trim() ? (
                  <img
                    src={pendingAttachment.url}
                    alt="Pending"
                    className="w-12 h-12 rounded-xl object-cover border border-[#DDD2F1]"
                  />
                ) : (
                  <span className="w-10 h-10 rounded-xl bg-[#7033F5] text-white flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </span>
                )}
                <div>
                  <p className="text-xs font-bold text-[#111B21]">
                    {pendingAttachment.name}
                  </p>
                  <p className="text-[10px] text-[#667781]">
                    {pendingAttachment.size || pendingAttachment.type} ready to send
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPendingAttachment(null)}
                className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500 transition-colors"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Emoji Picker Palette */}
          {showEmojiPicker && (
            <div className="bg-white border-t border-[#E9EDEF] p-3 max-h-64 overflow-y-auto relative z-20 shadow-lg">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F0F2F5]">
                <span className="text-xs font-extrabold text-[#111B21]">
                  Campus Emoji Palette
                </span>
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="Filter emojis..."
                  className="px-2.5 py-1 text-xs bg-[#F0F2F5] rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-[#7033F5]"
                />
              </div>
              <div className="space-y-3">
                {EMOJI_CATEGORIES.map((cat) => (
                  <div key={cat.name}>
                    <p className="text-[10px] font-bold text-[#8696A0] uppercase tracking-wider mb-1.5">
                      {cat.name}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {cat.emojis
                        .filter((em) => !emojiSearch || em.includes(emojiSearch))
                        .map((em, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setInputText((prev) => prev + em);
                            }}
                            className="w-8 h-8 text-lg rounded-lg hover:bg-[#F0F2F5] flex items-center justify-center transition-transform hover:scale-125"
                          >
                            {em}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WhatsApp Attach Menu Popup */}
          {showAttachMenu && (
            <div className="absolute bottom-16 left-12 z-30 bg-white rounded-2xl shadow-2xl border border-[#E9EDEF] p-3 grid grid-cols-3 gap-3 w-72 animate-in slide-in-from-bottom-2 duration-150">
              {/* Document */}
              <button
                onClick={() => docInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F0F2F5] text-center group"
              >
                <span className="w-11 h-11 rounded-full bg-[#5F66CD] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-medium text-[#111B21]">Document</span>
              </button>

              {/* Photos & Videos / Gallery */}
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F0F2F5] text-center group"
              >
                <span className="w-11 h-11 rounded-full bg-[#007BFC] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-medium text-[#111B21]">Gallery</span>
              </button>

              {/* Audio / Music */}
              <button
                onClick={() => musicInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F0F2F5] text-center group"
              >
                <span className="w-11 h-11 rounded-full bg-[#E542A3] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Music className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-medium text-[#111B21]">Audio</span>
              </button>

              {/* Camera Snap */}
              <button
                onClick={handleCameraSnap}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F0F2F5] text-center group"
              >
                <span className="w-11 h-11 rounded-full bg-[#D3396D] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-medium text-[#111B21]">Camera</span>
              </button>

              {/* Campus Poll */}
              <button
                onClick={() => setShowPollCreator(true)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F0F2F5] text-center group"
              >
                <span className="w-11 h-11 rounded-full bg-[#00BFA5] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <BarChart2 className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-medium text-[#111B21]">Poll</span>
              </button>

              {/* Location Pin */}
              <button
                onClick={() => setShowLocationModal(true)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F0F2F5] text-center group"
              >
                <span className="w-11 h-11 rounded-full bg-[#02A698] text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5" />
                </span>
                <span className="text-[11px] font-medium text-[#111B21]">Location</span>
              </button>

              {/* Contact Card */}
              <button
                onClick={handleShareContact}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#F0F2F5] text-center group col-span-3"
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#009DE2] text-white flex items-center justify-center shadow-sm">
                    <UserPlus className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-medium text-[#111B21]">Share Contact Card</span>
                </div>
              </button>
            </div>
          )}

          {/* WhatsApp Chat Input Bar */}
          <div className="h-16 px-4 bg-[#F0F2F5] border-t border-[#E9EDEF] flex items-center gap-2 relative z-10 shrink-0">
            {!isRecordingVoice ? (
              <>
                {/* Emoji Picker Button */}
                <button
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowAttachMenu(false);
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    showEmojiPicker
                      ? 'text-[#7033F5] bg-black/5'
                      : 'text-[#54656F] hover:text-[#111B21] hover:bg-black/5'
                  }`}
                  title="Emojis"
                >
                  <Smile className="w-6 h-6" />
                </button>

                {/* Attach File Button */}
                <button
                  onClick={() => {
                    setShowAttachMenu(!showAttachMenu);
                    setShowEmojiPicker(false);
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    showAttachMenu
                      ? 'text-[#7033F5] bg-black/5'
                      : 'text-[#54656F] hover:text-[#111B21] hover:bg-black/5'
                  }`}
                  title="Attach"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                {/* Text Message Input */}
                <div className="flex-1 bg-white rounded-xl px-4 py-2 border border-[#E9EDEF] flex items-center shadow-2xs">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full text-xs text-[#111B21] placeholder:text-[#667781] focus:outline-none resize-none max-h-24 bg-transparent"
                  />
                </div>

                {/* Microphone / Send Button */}
                {inputText.trim() || pendingAttachment ? (
                  <button
                    onClick={handleSend}
                    className="w-10 h-10 rounded-full bg-[#008069] text-white flex items-center justify-center hover:bg-[#00705B] transition-colors shadow-2xs hover:scale-105"
                    title="Send"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsRecordingVoice(true);
                      setVoiceDuration(0);
                    }}
                    className="w-10 h-10 rounded-full hover:bg-black/5 text-[#54656F] hover:text-[#008069] flex items-center justify-center transition-colors"
                    title="Record Voice Note"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                )}
              </>
            ) : (
              /* Live Voice Recording UI Bar */
              <div className="flex-1 flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-rose-200">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="text-xs font-bold text-rose-600">
                    Recording • 0:{(voiceDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRecordingVoice(false)}
                    className="px-3 py-1 text-xs text-[#54656F] hover:text-rose-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendVoiceNote}
                    className="px-4 py-1.5 bg-[#008069] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-[#00705B]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Voice</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`flex-1 flex flex-col h-full bg-[#FAF8FE] relative overflow-hidden ${
            !showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          <GroupChooser
            channels={channels}
            onJoinGroup={(id) => {
              if (onToggleJoinCommunity) onToggleJoinCommunity(id);
              onSelectChannel(id);
            }}
            onLeaveGroup={(id) => {
              if (onToggleJoinCommunity) onToggleJoinCommunity(id);
            }}
            onOpenChat={(id) => {
              onSelectChannel(id);
              setFilterTab('all');
              setShowMobileChat(true);
            }}
            currentUser={currentUser}
          />
        </div>
      )}

      {/* =========================================================================
          RIGHTMOST DRAWER: Society & Community Information
          ========================================================================= */}
      {showInfoDrawer && activeChannel && (
        <div className="w-80 bg-white border-l border-[#E9EDEF] flex flex-col h-full shrink-0 animate-in slide-in-from-right-2 duration-150 z-20">
          <div className="h-15 px-4 bg-[#F0F2F5] border-b border-[#E9EDEF] flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-[#111B21]">
              {activeChannel.isDirect ? 'Contact Info' : 'Community Info'}
            </h3>
            <button
              onClick={() => setShowInfoDrawer(false)}
              className="p-1 rounded-full text-[#54656F] hover:text-[#111B21]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex flex-col items-center text-center border-b border-[#F0F2F5]">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md mb-2 bg-[#7033F5] flex items-center justify-center text-white text-2xl font-bold">
              {activeChannel.avatar && !activeChannel.avatar.includes('unsplash') ? (
                <img
                  src={activeChannel.avatar}
                  alt={activeChannel.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{activeChannel.name ? activeChannel.name.charAt(0).toUpperCase() : 'C'}</span>
              )}
            </div>
            <h4 className="font-bold text-sm text-[#111B21]">
              {activeChannel.name}
            </h4>
            <p className="text-[11px] text-[#7033F5] font-semibold mt-0.5">
              {activeChannel.roleOrCategory || 'Verified Society'}
            </p>
            <p className="text-[11px] text-[#54656F] mt-2 leading-relaxed">
              {activeChannel.description ||
                'Official campus society channel for discussions, deadlines, and project collaboration.'}
            </p>

            {!activeChannel.isDirect && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Member ✓</span>
                </span>
                <button
                  onClick={() => {
                    if (onToggleJoinCommunity) onToggleJoinCommunity(activeChannel.id);
                    setShowInfoDrawer(false);
                  }}
                  className="px-2.5 py-0.5 rounded-full text-rose-600 bg-rose-50 hover:bg-rose-100 text-[10px] font-bold border border-rose-200 transition-colors"
                >
                  Leave Group
                </button>
              </div>
            )}
          </div>

          {/* Quick Info Navigation */}
          <div className="flex border-b border-[#F0F2F5] text-xs font-bold text-[#54656F]">
            <button
              onClick={() => setInfoTab('members')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                infoTab === 'members'
                  ? 'border-[#7033F5] text-[#7033F5]'
                  : 'border-transparent'
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setInfoTab('media')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                infoTab === 'media'
                  ? 'border-[#7033F5] text-[#7033F5]'
                  : 'border-transparent'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setInfoTab('files')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                infoTab === 'files'
                  ? 'border-[#7033F5] text-[#7033F5]'
                  : 'border-transparent'
              }`}
            >
              Docs
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {infoTab === 'members' && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-[#8696A0] uppercase">
                  {activeChannel.members?.length || 5} Participants
                </p>
                <div className="space-y-2">
                  {(
                    activeChannel.members || [
                      {
                        id: 'm1',
                        name: 'Tanvi Gupta',
                        role: 'Lead / Admin',
                        isOnline: true,
                        avatar: '',
                      },
                      {
                        id: 'm2',
                        name: 'Ananya Rao',
                        role: 'Core Member',
                        isOnline: true,
                        avatar: '',
                      },
                      {
                        id: 'm3',
                        name: 'Aarav Patel',
                        role: 'Student Member',
                        isOnline: false,
                        avatar: '',
                      },
                    ]
                  ).map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F0F2F5] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {m.avatar && m.avatar.trim() ? (
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#E5D7F9] text-[#7033F5] font-bold text-xs flex items-center justify-center">
                            {m.name ? m.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-[#111B21]">{m.name}</p>
                          <p className="text-[9px] text-[#667781]">{m.role}</p>
                        </div>
                      </div>
                      {m.role?.includes('Admin') && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#E7FCE3] text-[#008069]">
                          Admin
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {infoTab === 'media' && (
              <div className="py-8 text-center text-[#8696A0]">
                <p className="text-xs font-semibold">No shared photos or media</p>
                <p className="text-[11px] mt-1 text-[#A3B3BC]">Photos shared in this conversation will appear here</p>
              </div>
            )}

            {infoTab === 'files' && (
              <div className="space-y-2">
                {[
                  { name: 'DecentrAI_SmartContract_v2.pdf', size: '2.4 MB' },
                  { name: 'Society_Constitution_2026.pdf', size: '890 KB' },
                  { name: 'Meeting_Minutes_March.docx', size: '340 KB' },
                ].map((f, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-[#FAF8FE] border border-[#EDE4F6] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#7033F5] shrink-0" />
                      <span className="truncate text-[#111B21]">{f.name}</span>
                    </div>
                    <span className="text-[9px] text-[#667781] shrink-0">{f.size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: Call Overlay, New Chat / Add Contact, Poll Creator, Location
          ========================================================================= */}
      {/* Audio / Video Call Overlay */}
      <CallOverlayModal call={activeCall} onEndCall={handleEndCall} />

      {/* New Chat / Add Contact / Community Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        existingChannels={channels}
        onCreateDirectChat={handleCreateDirectChat}
        onCreateGroup={handleCreateGroup}
        onCreateCommunity={handleCreateCommunity}
      />

      {/* Campus Poll Creator Modal */}
      {showPollCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-[#EDE7F5] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#111B21] flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#008069]" />
                <span>Create Campus Poll</span>
              </h3>
              <button
                onClick={() => setShowPollCreator(false)}
                className="p-1 rounded-full text-[#54656F] hover:text-[#111B21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#54656F] block mb-1">
                Question *
              </label>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="e.g., When should we hold the DecentrAI code sprint?"
                className="w-full px-3 py-2 text-xs bg-[#F0F2F5] border-0 rounded-xl focus:ring-1 focus:ring-[#7033F5] text-[#111B21]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#54656F] block">
                Options *
              </label>
              <input
                type="text"
                value={pollOption1}
                onChange={(e) => setPollOption1(e.target.value)}
                placeholder="Option 1 (e.g. Friday 4:00 PM)"
                className="w-full px-3 py-2 text-xs bg-[#F0F2F5] border-0 rounded-xl focus:ring-1 focus:ring-[#7033F5] text-[#111B21]"
              />
              <input
                type="text"
                value={pollOption2}
                onChange={(e) => setPollOption2(e.target.value)}
                placeholder="Option 2 (e.g. Saturday 11:00 AM)"
                className="w-full px-3 py-2 text-xs bg-[#F0F2F5] border-0 rounded-xl focus:ring-1 focus:ring-[#7033F5] text-[#111B21]"
              />
              <input
                type="text"
                value={pollOption3}
                onChange={(e) => setPollOption3(e.target.value)}
                placeholder="Option 3 (Optional)"
                className="w-full px-3 py-2 text-xs bg-[#F0F2F5] border-0 rounded-xl focus:ring-1 focus:ring-[#7033F5] text-[#111B21]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPollCreator(false)}
                className="px-4 py-2 text-xs font-semibold text-[#54656F] hover:bg-[#F0F2F5] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePoll}
                disabled={!pollQuestion.trim() || !pollOption1.trim()}
                className="px-5 py-2 text-xs font-bold bg-[#008069] text-white hover:bg-[#00705B] rounded-xl shadow-xs disabled:opacity-50"
              >
                Attach Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campus Location Picker Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-[#EDE7F5] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#111B21] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#7033F5]" />
                <span>Share Campus Location</span>
              </h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 rounded-full text-[#54656F] hover:text-[#111B21]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#54656F] block mb-1">
                Campus Building / Venue *
              </label>
              <input
                type="text"
                value={locationVenue}
                onChange={(e) => setLocationVenue(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F0F2F5] border-0 rounded-xl focus:ring-1 focus:ring-[#7033F5] text-[#111B21]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#54656F] block mb-1">
                Room / Hall Number
              </label>
              <input
                type="text"
                value={locationRoom}
                onChange={(e) => setLocationRoom(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F0F2F5] border-0 rounded-xl focus:ring-1 focus:ring-[#7033F5] text-[#111B21]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#54656F] hover:bg-[#F0F2F5] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleShareLocation}
                className="px-5 py-2 text-xs font-bold bg-[#7033F5] text-white hover:bg-[#5E22E2] rounded-xl shadow-xs"
              >
                Share Location Pin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Choose Campus Groups Modal */}
      {showGroupChooserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <GroupChooser
              channels={channels}
              onJoinGroup={(id) => {
                if (onToggleJoinCommunity) onToggleJoinCommunity(id);
                onSelectChannel(id);
              }}
              onLeaveGroup={(id) => {
                if (onToggleJoinCommunity) onToggleJoinCommunity(id);
              }}
              onOpenChat={(id) => {
                onSelectChannel(id);
                setFilterTab('all');
                setShowGroupChooserModal(false);
                setShowMobileChat(true);
              }}
              isModal
              onClose={() => setShowGroupChooserModal(false)}
              currentUser={currentUser}
            />
          </div>
        </div>
      )}
    </div>
  );
};

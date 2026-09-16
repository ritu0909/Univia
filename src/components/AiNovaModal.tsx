import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  User,
  RefreshCw,
  Zap,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CornerDownLeft,
  ChevronRight,
} from 'lucide-react';
import { FormattedMarkdown } from './FormattedMarkdown';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  displayedContent?: string;
  timestamp: string;
  source?: string;
  isTyping?: boolean;
}

interface AiNovaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  initialQuery?: string;
}

const SUGGESTED_QUESTIONS = [
  'What are the premier student societies at IGDTUW?',
  'Who leads AssetMerkle IGDTUW?',
  'How do I study for BAS-103 Probability & Statistics?',
  'Top internship programs for 1st & 2nd year students?',
  'How do I add my timetable and avoid lecture conflicts?',
  'Where is the Central Library Book Bank located?',
];

export const AiNovaModal: React.FC<AiNovaModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialQuery = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content: `Hi ${currentUser?.name ? `**${currentUser.name}**` : 'there'}! I am **AI Nova**, your Univia campus intelligence companion for IGDTUW.

Ask me anything about:
* 🏛️ **College Societies:** Leadership of AssetMerkle, TEDx, WiCS, tech recruitments.
* 📚 **Academics & Exams:** BAS-103 Probability & Statistics, Python Lab, scoring 8.5+ CGPA.
* 💼 **Career Pipelines:** Google STEP, Uber She++, Microsoft Engage, scholarships.
* 🗓️ **Univia Tools:** Timetable conflict detection and 1-click schedule import.`,
      displayedContent: `Hi ${currentUser?.name ? `**${currentUser.name}**` : 'there'}! I am **AI Nova**, your Univia campus intelligence companion for IGDTUW.

Ask me anything about:
* 🏛️ **College Societies:** Leadership of AssetMerkle, TEDx, WiCS, tech recruitments.
* 📚 **Academics & Exams:** BAS-103 Probability & Statistics, Python Lab, scoring 8.5+ CGPA.
* 💼 **Career Pipelines:** Google STEP, Uber She++, Microsoft Engage, scholarships.
* 🗓️ **Univia Tools:** Timetable conflict detection and 1-click schedule import.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'Univia Campus Intelligence',
    },
  ]);
  const [input, setInput] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Cancel speech when closing
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialQuery && isOpen) {
      setInput(initialQuery);
    }
  }, [initialQuery, isOpen]);

  // Auto-scroll on new messages or typing updates
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, []);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Smooth progressive typing animation for AI response
  const triggerTypingAnimation = (msgId: string, fullText: string, source: string) => {
    let currentLength = 0;
    const step = Math.max(3, Math.floor(fullText.length / 45)); // smooth chunking
    const interval = 22;

    typingTimerRef.current = setInterval(() => {
      currentLength += step;
      if (currentLength >= fullText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, displayedContent: fullText, isTyping: false }
              : m
          )
        );
      } else {
        const partial = fullText.slice(0, currentLength);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, displayedContent: partial, isTyping: true }
              : m
          )
        );
      }
    }, interval);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    // Stop previous typing animation if running
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      displayedContent: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversation: conversationHistory,
          studentName: currentUser?.name || '',
          studentMajor: currentUser?.major || '',
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        "I'm here to help! Could you please clarify your campus question?";
      const source = data.modelUsed || (data.source === 'gemini' ? 'Gemini 3.8 Flash' : 'Univia Campus Intelligence');

      const msgId = `nova-${Date.now()}`;
      const aiMsg: Message = {
        id: msgId,
        role: 'model',
        content: replyText,
        displayedContent: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source,
        isTyping: true,
      };

      setMessages((prev) => [...prev, aiMsg]);
      triggerTypingAnimation(msgId, replyText, source);
    } catch (err) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        content:
          'I ran into a temporary connection hitch. Please verify your connection or try asking again!',
        displayedContent:
          'I ran into a temporary connection hitch. Please verify your connection or try asking again!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'System Recovery',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown marks for clean speech
    const cleanText = text.replace(/[*#`_>-]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      id="ai-nova-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className={`w-full bg-white dark:bg-[#131926] border border-[#E9E1F5] dark:border-[#243047] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 text-[#211B33] dark:text-[#F8FAFC] ${
          isMaximized
            ? 'h-[96vh] max-w-5xl'
            : 'h-[90vh] max-h-[740px] max-w-2xl'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-4.5 bg-gradient-to-r from-[#7033F5] via-[#8146F7] to-[#925CF9] text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xs border border-white/30 text-amber-200">
              <Sparkles className="w-5 h-5 fill-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight text-white">
                  AI Nova Campus Assistant
                </h3>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  Gemini &amp; IGDTUW Intelligence
                </span>
              </div>
              <p className="text-xs text-purple-100 font-medium">
                Instant answers on societies, syllabus, timetable &amp; campus life
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Maximize / Minimize Button */}
            <button
              onClick={() => setIsMaximized((prev) => !prev)}
              title={isMaximized ? 'Restore View' : 'Maximize Window'}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Reset Conversation */}
            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setSpeakingId(null);
                setMessages([
                  {
                    id: 'welcome-reset',
                    role: 'model',
                    content:
                      'Chat cleared! How can I assist you with IGDTUW academics, timetable, or societies right now?',
                    displayedContent:
                      'Chat cleared! How can I assist you with IGDTUW academics, timetable, or societies right now?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    source: 'Univia Campus Intelligence',
                  },
                ]);
              }}
              title="Clear Conversation"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Close AI Nova"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggested Quick Question Chips */}
        <div className="px-4 py-2.5 bg-[#FAF8FE] dark:bg-[#0E1420] border-b border-[#EDE7F5] dark:border-[#222D40] flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[11px] font-extrabold text-[#7033F5] dark:text-[#A78BFA] shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" /> Quick Topics:
          </span>
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1 rounded-full text-xs bg-white dark:bg-[#1A2234] hover:bg-[#F2ECFB] dark:hover:bg-[#25324C] text-[#554A6E] dark:text-[#CBD5E1] hover:text-[#7033F5] dark:hover:text-[#CBB3F2] border border-[#E5DBF5] dark:border-[#2A3952] whitespace-nowrap transition-all font-medium shrink-0 cursor-pointer shadow-2xs flex items-center gap-1"
            >
              <span>{q}</span>
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#FCFBFE] dark:bg-[#0D121F]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeaking = speakingId === msg.id;
            const isCopied = copiedId === msg.id;
            const textToRender = msg.displayedContent !== undefined ? msg.displayedContent : msg.content;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                    isUser
                      ? 'bg-[#7033F5] text-white'
                      : 'bg-[#F2EDFB] text-[#7033F5] dark:bg-[#251A40] dark:text-[#CBB3F2] border border-[#E4D5F8] dark:border-[#3D2C62]'
                  }`}
                >
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all ${
                    isUser
                      ? 'bg-[#7033F5] text-white rounded-tr-xs shadow-md'
                      : 'bg-white dark:bg-[#161F30] text-[#211B33] dark:text-[#F8FAFC] border border-[#EDE7F5] dark:border-[#28364D] rounded-tl-xs shadow-sm'
                  }`}
                >
                  {/* Content with Markdown */}
                  <FormattedMarkdown content={textToRender} isUser={isUser} />

                  {/* Actions & Timestamp Footer */}
                  <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] gap-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      {!isUser && msg.source && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#7033F5]/10 dark:bg-[#7033F5]/20 text-[#7033F5] dark:text-[#CBB3F2] font-semibold">
                          {msg.source}
                        </span>
                      )}
                      <span
                        className={
                          isUser
                            ? 'text-purple-200'
                            : 'text-[#8A819C] dark:text-[#94A3B8]'
                        }
                      >
                        {msg.timestamp}
                      </span>
                    </div>

                    {!isUser && (
                      <div className="flex items-center gap-1">
                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Copy text"
                          className="p-1 rounded-md text-[#7A718C] dark:text-[#94A3B8] hover:text-[#7033F5] hover:bg-[#F3EEFB] dark:hover:bg-[#232F42] transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Text-to-Speech Button */}
                        {'speechSynthesis' in window && (
                          <button
                            onClick={() => handleToggleSpeech(msg.id, msg.content)}
                            title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              isSpeaking
                                ? 'text-[#7033F5] bg-[#EDE5F8] dark:bg-[#2F214D]'
                                : 'text-[#7A718C] dark:text-[#94A3B8] hover:text-[#7033F5] hover:bg-[#F3EEFB] dark:hover:bg-[#232F42]'
                            }`}
                          >
                            {isSpeaking ? (
                              <VolumeX className="w-3.5 h-3.5" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing/Thinking indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 mr-auto text-xs text-[#7033F5] bg-white dark:bg-[#161F30] p-3 rounded-2xl border border-[#EDE7F5] dark:border-[#28364D] shadow-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-[#7033F5]" />
              <span className="font-bold">AI Nova is analyzing with Gemini...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-[#131926] border-t border-[#EDE7F5] dark:border-[#222D40] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI Nova a campus question... (e.g. AssetMerkle leadership, BAS-103 exam tips, timetable advice)"
                rows={2}
                className="w-full p-3 pr-10 text-xs sm:text-sm rounded-2xl border border-[#DDD3ED] dark:border-[#2B3950] bg-[#FAF8FE] dark:bg-[#0E1420] text-[#211B33] dark:text-[#F8FAFC] focus:outline-none focus:border-[#7033F5] resize-none transition-colors"
              />
              <div className="absolute right-2.5 bottom-2.5 hidden sm:flex items-center gap-1 text-[10px] text-[#8C849E] dark:text-[#717E94] pointer-events-none">
                <kbd className="px-1.5 py-0.5 rounded bg-[#EDE5F8] dark:bg-[#251A40] text-[#7033F5] dark:text-[#CBB3F2] font-mono text-[9px] font-bold">
                  Enter ↵
                </kbd>
              </div>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-12 px-5 rounded-2xl bg-gradient-to-r from-[#7033F5] to-[#864DF8] hover:from-[#5E22E2] hover:to-[#7638F2] disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#7033F5]/25 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>

          <p className="text-[10px] text-center text-[#8C849E] dark:text-[#717E94] mt-2">
            AI Nova provides academic &amp; campus recommendations. Verify official dates on the IGDTUW portal.
          </p>
        </div>
      </div>
    </div>
  );
};

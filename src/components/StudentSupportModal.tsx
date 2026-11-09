import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { SupportTicket, SupportMessage } from '../../server/types';
import { haptics } from '../utils/haptics';

interface StudentSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyMasked?: string;
  customerName?: string;
}

export const StudentSupportModal: React.FC<StudentSupportModalProps> = ({
  isOpen,
  onClose,
  keyMasked,
  customerName,
}) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showThreadSelector, setShowThreadSelector] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Helper to ensure tokens, keys, and device identifiers are passed for 1:1 security & persistence
  const getSupportHeaders = (): Record<string, string> => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bonolota_user_token') : null;
      const userKey = typeof window !== 'undefined' ? (localStorage.getItem('bonolota_user_key') || keyMasked) : null;
      const deviceId = typeof window !== 'undefined' ? localStorage.getItem('bonolota_device_id') : null;
      return {
        ...(token ? { Authorization: `Bearer ${token}`, 'x-session-token': token } : {}),
        ...(userKey ? { 'x-access-key': userKey } : {}),
        ...(deviceId ? { 'x-device-id': deviceId } : {}),
      };
    } catch {
      return {};
    }
  };

  // Load tickets from server
  const loadTickets = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/support/my-tickets', { 
        headers: getSupportHeaders(),
        credentials: 'include' 
      });
      if (res.ok) {
        const data = await res.json();
        const list: SupportTicket[] = data.tickets || [];
        setTickets(list);

        // Auto-select latest ticket if none is selected yet
        if (list.length > 0 && !activeTicketId) {
          const sorted = [...list].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
          setActiveTicketId(sorted[0].id);
        }
      }
    } catch {
      // Ignore network errors in silent polling
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTickets();
      // Auto-poll for new messages every 3.5 seconds while chat box is open
      const interval = setInterval(() => {
        loadTickets(true);
      }, 3500);

      // Focus input on open after a brief delay
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Current active ticket
  const activeTicket = tickets.find(t => t.id === activeTicketId) || tickets[0] || null;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && activeTicket?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages?.length, activeTicketId, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputMessage.trim();
    if (!cleanText || isSending) return;

    haptics.tap();
    setIsSending(true);
    setErrorNotice(null);

    const authHeaders = getSupportHeaders();

    try {
      if (activeTicket) {
        // Append message to existing thread
        const res = await fetch(`/api/support/ticket/${activeTicket.id}/message`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          credentials: 'include',
          body: JSON.stringify({ 
            message: cleanText,
            customerName: customerName || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setInputMessage('');
          await loadTickets(true);
        } else {
          setErrorNotice(data.message || 'মেসেজ পাঠানো সম্ভব হয়নি।');
        }
      } else {
        // First message: automatically create ticket and initiate conversation
        const res = await fetch('/api/support/ticket', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          credentials: 'include',
          body: JSON.stringify({ 
            message: cleanText,
            customerName: customerName || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setInputMessage('');
          if (data.ticket?.id) {
            setActiveTicketId(data.ticket.id);
          }
          await loadTickets(true);
        } else {
          setErrorNotice(data.message || 'মেসেজ পাঠানো সম্ভব হয়নি।');
        }
      }
    } catch {
      setErrorNotice('নেটওয়ার্ক সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-sans">
      {/* Direct Message Card */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl relative animate-scaleUp flex flex-col h-[90vh] max-h-[640px] overflow-hidden text-slate-900 dark:text-white">
        
        {/* Top Header: 1:1 Live Support */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  বনলতা ১:১ সাপোর্ট
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 shrink-0">
                  লাইভ
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate flex items-center gap-1">
                <span>{customerName || 'শিক্ষার্থী'}</span>
                {keyMasked && (
                  <>
                    <span>•</span>
                    <span className="opacity-75">{keyMasked}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Multiple threads switcher if student has more than 1 ticket */}
            {tickets.length > 1 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowThreadSelector(!showThreadSelector)}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                  title="পূর্বের কথোপকথনসমূহ"
                >
                  <span>চ্যাট ({tickets.length})</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {showThreadSelector && (
                  <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-1.5 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                      আপনার কথোপকথন
                    </div>
                    {tickets.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setActiveTicketId(t.id);
                          setShowThreadSelector(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs truncate transition-colors cursor-pointer ${
                          t.id === activeTicket?.id
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        চ্যাট • {new Date(t.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => loadTickets()}
              disabled={isLoading}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice Bar if error */}
        {errorNotice && (
          <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/70 border-b border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorNotice}</span>
            </div>
            <button type="button" onClick={() => setErrorNotice(null)} className="opacity-70 hover:opacity-100 cursor-pointer">✕</button>
          </div>
        )}

        {/* 1:1 Privacy Notice Banner */}
        <div className="px-4 py-1.5 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>১:১ সুরক্ষিত চ্যাট — আপনার বার্তা শুধুমাত্র অনুমোদিত অ্যাডমিন দেখতে পাবেন</span>
        </div>

        {/* Chat Feed Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-slate-50/50 dark:bg-[#070b14]">
          {isLoading && !activeTicket ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2 py-12">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
              <span>চ্যাট লোড হচ্ছে...</span>
            </div>
          ) : !activeTicket || !activeTicket.messages || activeTicket.messages.length === 0 ? (
            /* Friendly Welcome Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-xs space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  সরাসরি বার্তা লিখুন
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  পড়ালেখা, সাবস্ক্রিপশন কি বা প্ল্যাটফর্মের যেকোনো সমস্যায় নিচের বক্সে মেসেজ লিখে পাঠান। অ্যাডমিন সরাসরি ১:১ রিপ্লাই দেবেন।
                </p>
              </div>
            </div>
          ) : (
            /* Message Bubbles Stream */
            activeTicket.messages.map((m: SupportMessage) => {
              const isMe = m.sender === 'customer';
              return (
                <div 
                  key={m.id} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 font-mono px-1">
                    {!isMe && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{m.senderName}</span>
                    <span>•</span>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] break-words whitespace-pre-wrap ${
                    isMe 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-xs shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-bl-xs shadow-xs'
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* DIRECT MESSAGE BOX (Bottom Area) */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSendMessage} className="space-y-1.5">
            <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-[#070b14] border border-slate-300 dark:border-slate-700/90 rounded-2xl p-1.5 sm:p-2 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 transition-colors shadow-xs">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="এখানে সরাসরি আপনার বার্তা বা প্রশ্ন লিখুন..."
                disabled={isSending}
                maxLength={3000}
                rows={2}
                className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none resize-none p-1.5 leading-relaxed min-h-[44px] max-h-[120px]"
              />

              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md shadow-emerald-950/20 active:scale-95"
                title="বার্তা পাঠান (Enter)"
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">পাঠান</span>
                  </>
                )}
              </button>
            </div>

            {/* Hint & Counter Footer */}
            <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              <span className="hidden sm:inline">Enter চেপে মেসেজ পাঠান • Shift+Enter নতুন লাইন</span>
              <span className="sm:hidden">মেসেজ লিখে পাঠান বাটনে চাপুন</span>
              <span>{inputMessage.length}/3000</span>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

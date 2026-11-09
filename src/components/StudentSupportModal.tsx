import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  User,
  Plus
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
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMyTickets = async (silent = false) => {
    if (!silent) setIsLoadingTickets(true);
    try {
      const res = await fetch('/api/support/my-tickets', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const list: SupportTicket[] = data.tickets || [];
        setTickets(list);

        // If list is empty and user opened modal, default to 'create' tab
        if (list.length === 0 && !selectedTicketId) {
          setActiveTab('create');
        }
      }
    } catch {
      // Ignore
    } finally {
      if (!silent) setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMyTickets();
      // Auto-poll for new messages every 4 seconds while modal is open
      const interval = setInterval(() => {
        loadMyTickets(true);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages?.length, selectedTicketId]);

  if (!isOpen) return null;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSub = subject.trim();
    const cleanMsg = message.trim();

    if (cleanSub.length < 2) {
      setNotice({ ok: false, text: 'সমস্যার বিষয় কমপক্ষে ২ অক্ষরের হতে হবে।' });
      return;
    }
    if (cleanMsg.length < 1) {
      setNotice({ ok: false, text: 'বার্তা বা প্রশ্নের বিবরণ লিখুন।' });
      return;
    }

    haptics.tap();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: cleanSub,
          message: cleanMsg,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setNotice({ ok: true, text: 'আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। অ্যাডমিন শীঘ্রই উত্তর দেবেন।' });
        setSubject('');
        setMessage('');
        await loadMyTickets(true);
        if (data.ticket?.id) {
          setSelectedTicketId(data.ticket.id);
        }
        setActiveTab('list');
      } else {
        setNotice({ ok: false, text: data.message || 'মেসেজ পাঠাতে সমস্যা হয়েছে।' });
      }
    } catch {
      setNotice({ ok: false, text: 'নেটওয়ার্ক সংযোগ ত্রুটি।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    const cleanText = replyText.trim();
    haptics.tap();
    setIsSendingReply(true);

    try {
      const res = await fetch(`/api/support/ticket/${selectedTicket.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: cleanText }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setReplyText('');
        await loadMyTickets(true);
      } else {
        alert(data.message || 'মেসেজ পাঠানো যায়নি।');
      }
    } catch {
      alert('নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative animate-scaleUp flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-white">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedTicket ? (
              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="তালিকায় ফিরে যান"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {selectedTicket ? selectedTicket.subject : 'সহায়তা ও ১:১ প্রাইভেট সাপোর্ট'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {selectedTicket 
                  ? `স্ট্যাটাস: ${selectedTicket.status === 'open' ? 'অপেক্ষমাণ' : selectedTicket.status === 'replied' ? 'উত্তর এসেছে' : 'সমাধানকৃত'}` 
                  : (customerName ? `${customerName} • ` : '') + (keyMasked || 'বনলতা শিক্ষার্থী')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Notice */}
        {notice && (
          <div className={`mb-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
            notice.ok ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
            {notice.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />}
            <span className="flex-1">{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* MODE 1: ACTIVE 1:1 CHAT THREAD VIEW */}
        {selectedTicket ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800/80 pr-2">
              {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  কোনো মেসেজ নেই।
                </div>
              ) : (
                selectedTicket.messages.map((m: SupportMessage) => {
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

                      <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] break-words whitespace-pre-wrap ${
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

            {/* Chat Reply Input Bar */}
            <form onSubmit={handleSendReply} className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="আপনার মেসেজ লিখুন..."
                disabled={isSendingReply}
                maxLength={3000}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={isSendingReply || !replyText.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
              >
                {isSendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">পাঠান</span>
              </button>
            </form>
          </div>
        ) : (
          /* MODE 2: TICKET LIST & CREATE TABS */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'list'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>আমার কথোপকথন</span>
                  {tickets.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-200 font-mono font-bold">
                      {tickets.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === 'create'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন জিজ্ঞাসা</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => loadMyTickets()}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                title="রিফ্রেশ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Tab: Create New Inquiry */}
            {activeTab === 'create' && (
              <form onSubmit={handleCreateTicket} className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    জিজ্ঞাসার বিষয় (Subject)
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    maxLength={150}
                    placeholder="যেমন: ইউনিট সিঙ্ক সমস্যা বা রিভিশন প্রশ্ন..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      বার্তা বা প্রশ্ন (Message)
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">{message.length}/3000</span>
                  </div>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    maxLength={3000}
                    placeholder="আপনার সমস্যা বা বার্তাটি পরিষ্কারভাবে বর্ণনা করুন..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !subject.trim() || !message.trim()}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/20 text-xs"
                >
                  {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>মেসেজ পাঠান</span>
                </button>
              </form>
            )}

            {/* Tab: Conversation List */}
            {activeTab === 'list' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {isLoadingTickets && tickets.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>লোড হচ্ছে...</span>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <p className="mb-3">আপনি এখনও কোনো সাপোর্ট আবেদন করেননি।</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('create')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>নতুন মেসেজ পাঠান</span>
                    </button>
                  </div>
                ) : (
                  tickets.map(t => {
                    const lastMsg = t.messages && t.messages.length > 0 
                      ? t.messages[t.messages.length - 1] 
                      : { text: t.message, timestamp: t.updatedAt };
                    const hasAdminReply = t.status === 'replied' || (t.messages && t.messages.some(m => m.sender === 'admin'));

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all cursor-pointer text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-slate-900 dark:text-white truncate font-semibold">
                            {t.subject}
                          </strong>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            t.status === 'open' 
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' 
                              : t.status === 'replied'
                              ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 animate-pulse'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          }`}>
                            {t.status === 'open' ? 'অপেক্ষমাণ' : t.status === 'replied' ? 'উত্তর এসেছে 💬' : 'সমাধানকৃত'}
                          </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                          {lastMsg.text}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200/80 dark:border-slate-800/80 font-mono">
                          <span>{t.messages?.length || 1} টি মেসেজ</span>
                          <span>{new Date(t.updatedAt || t.createdAt).toLocaleDateString('bn-BD')}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

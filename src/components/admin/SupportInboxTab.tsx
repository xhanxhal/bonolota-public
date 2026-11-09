import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  User, 
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Smartphone,
  Globe,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { SupportTicket, SupportMessage } from '../../../server/types';
import { haptics } from '../../utils/haptics';

export const SupportInboxTab: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [markResolved, setMarkResolved] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'replied' | 'resolved'>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/admin/support/tickets', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const tList: SupportTicket[] = data.tickets || [];
        setTickets(tList);
        // Default select first ticket if none selected
        if (!selectedTicketId && tList.length > 0) {
          setSelectedTicketId(tList[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load support tickets:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // Auto-poll every 5 seconds for new student chat messages
    const timer = setInterval(() => {
      loadTickets(true);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages?.length, selectedTicketId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    const cleanReply = replyMessage.trim();
    haptics.tap();
    setIsSubmittingReply(true);

    try {
      const res = await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          replyMessage: cleanReply,
          markResolved,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setReplyMessage('');
        await loadTickets(true);
        setNotice('উত্তর সফলভাবে পাঠানো হয়েছে এবং শিক্ষার্থীর ডিভাইসে সরাসরি পৌঁছেছে!');
        setTimeout(() => setNotice(null), 3500);
      } else {
        setNotice(data.message || 'উত্তর পাঠাতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setNotice('সার্ভার এরর');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteEntireChat = async () => {
    if (!selectedTicket) return;
    const confirmDelete = window.confirm(
      `সতর্কতা! আপনি কি নিশ্চিত যে "${selectedTicket.subject}" চ্যাটটি উভয়পাশ থেকেই মুছে ফেলতে চান?\n\nএর ফলে শিক্ষার্থী এবং অ্যাডমিন উভয়ের পোর্টাল থেকেই এই কথোপকথন সম্পূর্ণভাবে চিরতরে ডিলিট হয়ে যাবে।`
    );
    if (!confirmDelete) return;

    haptics.tap();
    setIsDeletingTicket(true);

    try {
      const res = await fetch(`/api/admin/support/ticket/${selectedTicket.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setNotice('চ্যাটটি উভয়পাশ থেকেই সফলভাবে মুছে ফেলা হয়েছে।');
        setSelectedTicketId(null);
        await loadTickets(false);
        setTimeout(() => setNotice(null), 3500);
      } else {
        setNotice(data.message || 'চ্যাট মুছতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setNotice('সার্ভার সংযোগ সমস্যা।');
    } finally {
      setIsDeletingTicket(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedTicket) return;
    if (!window.confirm('আপনি কি এই নির্দিষ্ট মেসেজটি উভয়পাশ থেকেই মুছে ফেলতে চান?')) return;

    haptics.tap();
    try {
      const res = await fetch(`/api/admin/support/ticket/${selectedTicket.id}/message/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        await loadTickets(true);
        setNotice('মেসেজটি উভয়পাশ থেকেই মুছে ফেলা হয়েছে।');
        setTimeout(() => setNotice(null), 2500);
      } else {
        setNotice(data.message || 'মেসেজ মুছতে সমস্যা হয়েছে।');
      }
    } catch {
      setNotice('সার্ভার এরর।');
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const openTicketsCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn font-bangla">
      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>১:১ শিক্ষার্থী সাপোর্ট ও লাইভ চ্যাট ইনবক্স</span>
              {openTicketsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse font-mono">
                  {openTicketsCount} Unread
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">প্রতিটি শিক্ষার্থীর সাথে সুরক্ষিত ১:১ প্রাইভেট কথোপকথন</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap">
          {(['all', 'open', 'replied', 'resolved'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === s 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs' 
                  : 'bg-slate-50 dark:bg-[#080d1a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {s === 'all' ? 'সব' : s === 'open' ? 'নতুন বার্তা' : s === 'replied' ? 'উত্তরপ্রাপ্ত' : 'সমাধানকৃত'}
            </button>
          ))}

          <button
            type="button"
            onClick={() => loadTickets()}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left tickets list, Right ticket details and reply form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Ticket List */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col max-h-[640px]">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>চ্যাট তালিকা ({filteredTickets.length})</span>
            <span className="text-[10px] text-slate-400 font-mono">1:1 Private</span>
          </h4>

          <div className="overflow-y-auto space-y-2 flex-1 pr-1">
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                কোনো সাপোর্ট বার্তা নেই।
              </div>
            ) : (
              filteredTickets.map(t => {
                const isSelected = selectedTicket?.id === t.id;
                const lastMsg = t.messages && t.messages.length > 0 
                  ? t.messages[t.messages.length - 1] 
                  : { text: t.message, timestamp: t.updatedAt };

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-[#080d1a] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                        {t.customerName || 'বেনামী শিক্ষার্থী'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        t.status === 'open' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800' :
                        t.status === 'replied' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                        'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}>
                        {t.status === 'open' ? 'নতুন বার্তা' : t.status === 'replied' ? 'উত্তর পাঠানো' : 'সমাধান'}
                      </span>
                    </div>

                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate mb-0.5">
                      {t.subject}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                      {lastMsg.text}
                    </p>

                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                      <span>{t.keyMasked}</span>
                      <span>{t.messages?.length || 1} টি বার্তা</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation & Reply Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between max-h-[640px]">
          {selectedTicket ? (
            <div className="flex flex-col h-full">
              {/* Conversation Header & Actions */}
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {selectedTicket.customerName || 'বেনামী'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{selectedTicket.keyMasked}</span>
                    {selectedTicket.clientDevice && (
                      <>
                        <span>•</span>
                        <span className="text-[10px] truncate max-w-[120px]">{selectedTicket.clientDevice}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedTicket.status === 'open' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800' :
                    selectedTicket.status === 'replied' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                    'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  }`}>
                    {selectedTicket.status === 'open' ? 'নতুন বার্তা' : selectedTicket.status === 'replied' ? 'উত্তর পাঠানো' : 'সমাধানকৃত'}
                  </span>

                  {/* Delete Conversation from Both Sides */}
                  <button
                    type="button"
                    onClick={handleDeleteEntireChat}
                    disabled={isDeletingTicket}
                    className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="উভয়পাশ থেকেই সম্পূর্ণ চ্যাট মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">উভয়পাশ থেকে মুছুন</span>
                  </button>
                </div>
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 my-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800/80 pr-2">
                {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    কোনো বার্তা নেই।
                  </div>
                ) : (
                  selectedTicket.messages.map((m: SupportMessage) => {
                    const isAdmin = m.sender === 'admin';
                    return (
                      <div 
                        key={m.id} 
                        className={`group flex flex-col ${isAdmin ? 'items-end' : 'items-start'} max-w-full`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 font-mono px-1">
                          {isAdmin && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{m.senderName}</span>
                          <span>•</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          
                          {/* Delete individual message for both sides */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity p-0.5 cursor-pointer ml-1"
                            title="এই বার্তাটি উভয়পাশ থেকেই মুছুন (Delete for Everyone)"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] break-words whitespace-pre-wrap ${
                          isAdmin 
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

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <div className="relative">
                  <textarea
                    rows={2}
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    maxLength={3000}
                    placeholder="শিক্ষার্থীকে উত্তর লিখুন (১:১ প্রাইভেট রিপ্লাই)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500 resize-none pr-16"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-mono">
                    {replyMessage.length}/3000
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={markResolved}
                      onChange={e => setMarkResolved(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                    <span>টিকেটটি 'সমাধানকৃত' চিহ্নিত করুন</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingReply || !replyMessage.trim()}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>রিপ্লাই পাঠান</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <MessageSquare className="w-8 h-8 opacity-40 text-slate-400" />
              <span>বাম পাশের তালিকা থেকে একটি কথোপকথন নির্বাচন করুন।</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

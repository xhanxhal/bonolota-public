import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Search,
  Check,
  AlertCircle,
  Sparkles
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
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

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
    // Auto-poll every 3.5 seconds for instant real-time student messages
    const timer = setInterval(() => {
      loadTickets(true);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Sort strictly by latest message timestamp so newly messaging users jump straight to the top
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const getLatestTime = (t: SupportTicket) => {
        if (t.messages && t.messages.length > 0) {
          return Math.max(...t.messages.map(m => m.timestamp));
        }
        return t.updatedAt || t.createdAt;
      };
      return getLatestTime(b) - getLatestTime(a);
    });
  }, [tickets]);

  // Filter by status and search query
  const filteredTickets = useMemo(() => {
    return sortedTickets.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = (t.customerName || '').toLowerCase().includes(query);
        const keyMatch = (t.keyMasked || '').toLowerCase().includes(query);
        const msgMatch = (t.messages || []).some(m => m.text.toLowerCase().includes(query));
        return nameMatch || keyMatch || msgMatch;
      }
      return true;
    });
  }, [sortedTickets, statusFilter, searchQuery]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  useEffect(() => {
    if (selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages?.length, selectedTicketId]);

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicket || !replyMessage.trim() || isSubmittingReply) return;

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
        setNotice('রিপ্লাই সফলভাবে পাঠানো হয়েছে!');
        setTimeout(() => setNotice(null), 3000);
      } else {
        setNotice(data.message || 'উত্তর পাঠাতে ব্যর্থ হয়েছে।');
      }
    } catch {
      setNotice('সার্ভার এরর');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleDeleteEntireChat = async () => {
    if (!selectedTicket) return;
    const confirmDelete = window.confirm(
      `সতর্কতা! আপনি কি নিশ্চিত যে "${selectedTicket.customerName || 'এই ব্যবহারকারীর'}" সাথে সম্পূর্ণ চ্যাটটি উভয়পাশ থেকেই মুছে ফেলতে চান?\n\nএর ফলে শিক্ষার্থী ও অ্যাডমিন উভয়ের স্ক্রিন এবং ডাটাবেজ থেকে এই কথোপকথন সম্পূর্ণভাবে চিরতরে ডিলিট হয়ে যাবে।`
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
        setNotice('চ্যাটটি উভয়পাশ থেকেই মুছে ফেলা হয়েছে।');
        setSelectedTicketId(null);
        await loadTickets(false);
        setTimeout(() => setNotice(null), 3000);
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

  const openTicketsCount = tickets.filter(t => t.status === 'open').length;

  const getInitial = (name?: string) => {
    if (!name) return 'ব';
    const clean = name.trim();
    return clean.charAt(0).toUpperCase();
  };

  const formatMessageTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn font-bangla">
      
      {/* Toast Alert Notice */}
      {notice && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notice}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">✕</button>
        </div>
      )}

      {/* 24-Hour Auto-Delete & Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-950/20">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                ১:১ লাইভ চ্যাট ও মেসেঞ্জার ইনবক্স
              </h3>
              {openTicketsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {openTicketsCount} টি নতুন
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>শিক্ষার্থী ও ব্যবহারকারীদের সাথে রিয়েল-টাইম ১:১ চ্যাট</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                <Clock className="w-3 h-3" />
                <span>২৪ ঘণ্টা পর সব চ্যাট স্বয়ংক্রিয়ভাবে মুছে যাবে (Auto 24h Purge)</span>
              </span>
            </p>
          </div>
        </div>

        {/* Global Refresh & Count */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => loadTickets()}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* MESSENGER INTERFACE: Split Column Desktop / Responsive Stack Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 min-h-[620px] max-h-[780px]">
        
        {/* LEFT COLUMN: Messenger User Conversations List */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-xs flex flex-col h-full overflow-hidden">
          
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="শিক্ষার্থীর নাম বা কি দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Messenger Category Filters */}
          <div className="flex items-center gap-1 pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto scrollbar-none">
            {(['all', 'open', 'replied', 'resolved'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {s === 'all' ? `সব (${tickets.length})` : s === 'open' ? `নতুন (${openTicketsCount})` : s === 'replied' ? 'উত্তরপ্রাপ্ত' : 'সমাধান'}
              </button>
            ))}
          </div>

          {/* Conversations Scroll Feed */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredTickets.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <MessageSquare className="w-8 h-8 opacity-30" />
                <span>কোনো কথোপকথন পাওয়া যায়নি।</span>
              </div>
            ) : (
              filteredTickets.map(t => {
                const isSelected = selectedTicket?.id === t.id;
                const lastMsg = t.messages && t.messages.length > 0 
                  ? t.messages[t.messages.length - 1] 
                  : { text: t.message, timestamp: t.updatedAt, sender: 'customer' };
                const isUnread = t.status === 'open';

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      haptics.tap();
                      setSelectedTicketId(t.id);
                    }}
                    className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 relative ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/80 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-[#080d1a]/80 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    {/* User Avatar Circle with Online Dot */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {getInitial(t.customerName)}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                        isUnread ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                      }`} />
                    </div>

                    {/* Chat Item Details */}
                    <div className="flex-1 min-w-0">
                      {/* USER NAME PROMINENTLY ON TOP */}
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {t.customerName || 'বেনামী শিক্ষার্থী'}
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                          {formatMessageTime(lastMsg.timestamp)}
                        </span>
                      </div>

                      {/* Last Message Snippet */}
                      <p className={`text-[11px] truncate leading-tight ${
                        isUnread 
                          ? 'font-bold text-slate-900 dark:text-white' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {lastMsg.sender === 'admin' ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">আপনি: </span> : null}
                        {lastMsg.text}
                      </p>

                      {/* Badges: Key Masked & Status */}
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {t.keyMasked || 'অনিবন্ধিত'}
                        </span>
                        {isUnread && (
                          <span className="px-1.5 py-0.2 rounded-md bg-rose-500 text-white font-bold font-sans">
                            নতুন
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Messenger Chat Window */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col h-full overflow-hidden">
          {selectedTicket ? (
            <div className="flex flex-col h-full">
              
              {/* MESSENGER TOP BAR: PROMINENT USER NAME */}
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-base flex items-center justify-center shadow-xs">
                      {getInitial(selectedTicket.customerName)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  </div>

                  <div className="min-w-0">
                    {/* USER NAME DISPLAYED CLEARLY AT THE TOP */}
                    <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                      {selectedTicket.customerName || 'বেনামী শিক্ষার্থী'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {selectedTicket.keyMasked}
                      </span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{selectedTicket.clientDevice || 'ডিভাইস'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Mark Resolved & Delete from both sides */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      haptics.tap();
                      const nextStatus = selectedTicket.status === 'resolved' ? 'open' : 'resolved';
                      await fetch('/api/admin/support/reply', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          ticketId: selectedTicket.id,
                          replyMessage: '',
                          markResolved: nextStatus === 'resolved',
                        }),
                      });
                      await loadTickets(true);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      selectedTicket.status === 'resolved'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title="সমাধান স্ট্যাটাস পরিবর্তন করুন"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">
                      {selectedTicket.status === 'resolved' ? 'সমাধানকৃত' : 'সমাধান করুন'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteEntireChat}
                    disabled={isDeletingTicket}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="উভয় পাশ থেকেই সম্পূর্ণ চ্যাট চিরতরে মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">উভয়পাশ থেকে ডিলিট</span>
                  </button>
                </div>
              </div>

              {/* MESSENGER CHAT MESSAGES THREAD */}
              <div className="flex-1 overflow-y-auto space-y-3.5 my-3 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-[#070b14] border border-slate-200/70 dark:border-slate-800/80 pr-2">
                {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    কোনো মেসেজ নেই।
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
                          
                          {/* Delete individual message for everyone */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(m.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity p-0.5 cursor-pointer ml-1"
                            title="মেসেজটি উভয়পাশ থেকেই মুছুন (Delete for Everyone)"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Messenger Bubble Shape */}
                        <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] break-words whitespace-pre-wrap ${
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

              {/* MESSENGER REPLY INPUT BAR */}
              <form onSubmit={handleSendReply} className="pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-1.5">
                <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-[#070b14] border border-slate-300 dark:border-slate-700 rounded-2xl p-1.5 sm:p-2 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 transition-colors">
                  <textarea
                    ref={replyInputRef}
                    rows={2}
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmittingReply}
                    maxLength={3000}
                    placeholder={`${selectedTicket.customerName || 'শিক্ষার্থীকে'} সরাসরি মেসেঞ্জার রিপ্লাই লিখুন...`}
                    className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none resize-none p-1.5 leading-relaxed min-h-[44px] max-h-[120px]"
                  />

                  <button
                    type="submit"
                    disabled={isSubmittingReply || !replyMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-xs active:scale-95"
                    title="রিপ্লাই পাঠান (Enter)"
                  >
                    {isSubmittingReply ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">পাঠান</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between px-1 text-[10px] text-slate-400 font-mono">
                  <span>Enter চেপে রিপ্লাই পাঠান • Shift+Enter নতুন লাইন</span>
                  <span>{replyMessage.length}/3000</span>
                </div>
              </form>

            </div>
          ) : (
            <div className="py-28 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2 h-full">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                একটি চ্যাট নির্বাচন করুন
              </p>
              <p className="text-slate-400 text-xs max-w-xs">
                বাম পাশের তালিকা থেকে যেকোনো শিক্ষার্থীর চ্যাটে ক্লিক করে সরাসরি মেসেঞ্জার স্টাইলে কথা বলুন।
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

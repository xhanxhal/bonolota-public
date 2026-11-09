import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  RefreshCw, 
  User, 
  Check, 
  Clock,
  CheckCircle2
} from 'lucide-react';
import { SupportTicket } from '../../../server/types';
import { haptics } from '../../utils/haptics';

export const SupportInboxTab: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [markResolved, setMarkResolved] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'replied' | 'resolved'>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/support/tickets', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const tList: SupportTicket[] = data.tickets || [];
        setTickets(tList);
        if (selectedTicket) {
          const fresh = tList.find(t => t.id === selectedTicket.id);
          if (fresh) setSelectedTicket(fresh);
        }
      }
    } catch (e) {
      console.error('Failed to load support tickets:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    haptics.tap();
    setIsSubmittingReply(true);
    try {
      const res = await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          replyMessage: replyMessage.trim(),
          markResolved,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setReplyMessage('');
        loadTickets();
        setNotice('উত্তর সফলভাবে পাঠানো হয়েছে এবং শিক্ষার্থীর ডিভাইসে নোটিফিকেশন পৌঁছেছে!');
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

  const filteredTickets = tickets.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  const openTicketsCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn font-bangla">
      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#0f172a] border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>শিক্ষার্থী সাপোর্ট ও ফিডব্যাক ইনবক্স</span>
              {openTicketsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse font-mono">
                  {openTicketsCount} Unread
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">শিক্ষার্থীদের জিজ্ঞাসা ও সরাসরি মেসেজ রিপ্লাই পোর্টাল</p>
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
                  : 'bg-[#080d1a] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {s === 'all' ? 'সব' : s === 'open' ? 'নতুন' : s === 'replied' ? 'উত্তরপ্রাপ্ত' : 'সমাধানকৃত'}
            </button>
          ))}

          <button
            type="button"
            onClick={loadTickets}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left tickets list, Right ticket details and reply form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col max-h-[600px]">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            টিকেট তালিকা ({filteredTickets.length})
          </h4>

          <div className="overflow-y-auto space-y-2 flex-1 pr-1">
            {filteredTickets.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                কোনো টিকেট নেই।
              </div>
            ) : (
              filteredTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                    selectedTicket?.id === t.id
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                      : 'bg-[#080d1a] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="font-bold text-white text-xs truncate">{t.customerName || 'বেনামী'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'open' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      t.status === 'replied' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {t.status === 'open' ? 'নতুন' : t.status === 'replied' ? 'উত্তরপ্রাপ্ত' : 'সমাধান'}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-200 text-xs truncate mb-0.5">
                    {t.subject}
                  </p>
                  <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                    {t.message}
                  </p>

                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                    <span>{t.keyMasked}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString('bn-BD')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details & Reply Panel */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-4">
              {/* Ticket Top Meta */}
              <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1 font-semibold text-slate-200">
                      <User className="w-3 h-3 text-emerald-400" />
                      {selectedTicket.customerName || 'বেনামী'}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">{selectedTicket.keyMasked}</span>
                  </div>
                </div>

                <span className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedTicket.status === 'open' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  selectedTicket.status === 'replied' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {selectedTicket.status === 'open' ? 'নতুন বার্তা' : selectedTicket.status === 'replied' ? 'উত্তর পাঠানো হয়েছে' : 'সমাধানকৃত'}
                </span>
              </div>

              {/* Student's Message Body */}
              <div className="p-3.5 rounded-2xl bg-[#080d1a] border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.message}
              </div>

              {/* Previous Admin Reply if exists */}
              {selectedTicket.adminReply && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>প্রদত্ত উত্তর:</span>
                    <span className="text-[10px] text-slate-400 ml-auto font-mono">
                      {selectedTicket.repliedAt ? new Date(selectedTicket.repliedAt).toLocaleString('bn-BD') : ''}
                    </span>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap">{selectedTicket.adminReply}</p>
                </div>
              )}

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    শিক্ষার্থীকে রিপ্লাই পাঠান:
                  </label>
                  <textarea
                    rows={3}
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="আপনার উত্তর লিখুন..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080d1a] border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markResolved}
                      onChange={e => setMarkResolved(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                    <span>রিপ্লাইয়ের সাথে টিকেটটি 'সমাধানকৃত' মার্ক করুন</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingReply || !replyMessage.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>রিপ্লাই পাঠান</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              বাম পাশের তালিকা থেকে একটি টিকেট নির্বাচন করুন।
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

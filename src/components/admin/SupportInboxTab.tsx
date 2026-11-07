import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  User, 
  Key, 
  Smartphone, 
  Globe, 
  Check, 
  Filter 
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
        setNotice('উত্তর সফলভাবে পাঠানো হয়েছে এবং শিক্ষার্থীর ডিভাইসে নোটিফিকেশন পাঠানো হয়েছে!');
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
    <div className="space-y-6 animate-fadeIn font-sans">
      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>শিক্ষার্থী সাপোর্ট ও ফিডব্যাক ইনবক্স (Support Inbox)</span>
              {openTicketsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                  {openTicketsCount} টি অপঠিত
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">শিক্ষার্থীদের সমস্যা, পরামর্শ ও সরাসরি মেসেজ রিপ্লাই পোর্টাল</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'open', 'replied', 'resolved'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === s 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {s === 'all' ? 'সব' : s === 'open' ? 'নতুন (Open)' : s === 'replied' ? 'উত্তরপ্রাপ্ত' : 'সমাধানকৃত'}
            </button>
          ))}

          <button
            type="button"
            onClick={loadTickets}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Left tickets list, Right ticket details and reply form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col max-h-[700px]">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            টিকেট তালিকা ({filteredTickets.length})
          </h4>

          <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                কোনো টিকেট পাওয়া যায়নি।
              </div>
            ) : (
              filteredTickets.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs ${
                    selectedTicket?.id === t.id
                      ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-white text-xs truncate">{t.customerName || 'বেনামী শিক্ষার্থী'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'open' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      t.status === 'replied' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {t.status === 'open' ? 'নতুন' : t.status === 'replied' ? 'উত্তরপ্রাপ্ত' : 'সমাধানকৃত'}
                    </span>
                  </div>

                  <p className="font-semibold text-slate-200 text-xs truncate mb-1">
                    {t.subject}
                  </p>
                  <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                    {t.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                    <span>{t.keyMasked}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString('bn-BD')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details & Reply Panel */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-5">
              {/* Ticket Top Meta */}
              <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedTicket.subject}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-200">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      {selectedTicket.customerName || 'বেনামী'}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{selectedTicket.keyMasked}</span>
                    <span>•</span>
                    <span className="text-[11px] font-mono">{selectedTicket.clientIp || 'IP: Unknown'}</span>
                  </div>
                </div>

                <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold ${
                  selectedTicket.status === 'open' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  selectedTicket.status === 'replied' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {selectedTicket.status === 'open' ? 'নতুন আবেদন' : selectedTicket.status === 'replied' ? 'উত্তর প্রেরিত' : 'সমাধানকৃত'}
                </span>
              </div>

              {/* Student Message Body */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 block mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>শিক্ষার্থীর বার্তা:</span>
                </span>
                <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.message}
                </p>
                <div className="mt-3 text-[10px] text-slate-500 font-mono">
                  প্রেরিত সময়: {new Date(selectedTicket.createdAt).toLocaleString('bn-BD')}
                </div>
              </div>

              {/* Existing Admin Reply if any */}
              {selectedTicket.adminReply && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60">
                  <span className="text-[11px] font-bold text-indigo-300 block mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>পূর্ববর্তী অ্যাডমিন উত্তর:</span>
                  </span>
                  <p className="text-sm text-indigo-100 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.adminReply}
                  </p>
                  {selectedTicket.repliedAt && (
                    <div className="mt-2 text-[10px] text-indigo-400/80 font-mono">
                      উত্তর প্রেরিত: {new Date(selectedTicket.repliedAt).toLocaleString('bn-BD')}
                    </div>
                  )}
                </div>
              )}

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                  <span>শিক্ষার্থীকে উত্তর দিন (Direct Reply):</span>
                </label>
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="আপনার উত্তর এখানে লিখুন। এটি শিক্ষার্থীর অ্যাপে পপআপ নোটিফিকেশন হিসেবে চলে যাবে..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={markResolved}
                      onChange={e => setMarkResolved(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span>টিকেটটি সমাধানকৃত (Resolved) হিসেবে চিহ্নিত করুন</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingReply || !replyMessage.trim()}
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer text-xs shadow-lg shadow-indigo-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>উত্তর পাঠান</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-24 text-center text-slate-400 text-xs">
              <MessageSquare className="w-12 h-12 mb-3 text-slate-600" />
              <p>বামপাশের তালিকা থেকে যেকোনো টিকেটে ক্লিক করে বার্তা দেখুন ও রিপ্লাই দিন।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

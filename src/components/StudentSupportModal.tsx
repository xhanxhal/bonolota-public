import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { SupportTicket } from '../../server/types';
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
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const loadMyTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch('/api/support/my-tickets', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMyTickets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    haptics.tap();
    setIsSubmitting(true);
    setNotice(null);

    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setNotice({ ok: true, text: 'আপনার মেসেজটি সফলভাবে অ্যাডমিনের কাছে পৌঁছেছে। অতি দ্রুত সমাধান জানানো হবে।' });
        setSubject('');
        setMessage('');
        loadMyTickets();
        setTimeout(() => setActiveTab('history'), 1500);
      } else {
        setNotice({ ok: false, text: data.message || 'মেসেজ পাঠাতে সমস্যা হয়েছে।' });
      }
    } catch {
      setNotice({ ok: false, text: 'নেটওয়ার্ক সংযোগ ত্রুটি।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-scaleUp">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6 text-teal-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
              সহায়তা ও সাপোর্ট ইনবক্স (Student Support)
            </h3>
            <p className="text-xs text-slate-400 font-mono truncate">
              {customerName ? `${customerName} • ` : ''}{keyMasked || 'বনলতা স্টুডেন্ট'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            নতুন মেসেজ / সহায়তা চান
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              loadMyTickets();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>পূর্ববর্তী আবেদন ও উত্তর</span>
            {tickets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-950 text-teal-300 font-mono font-bold">
                {tickets.length}
              </span>
            )}
          </button>
        </div>

        {notice && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
            notice.ok ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}>
            {notice.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Tab 1: Create Ticket Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmitTicket} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                সমস্যার বিষয় (Subject)
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="যেমন: ইউনিট সিঙ্ক সমস্যা বা রিভিশন প্রশ্ন..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                বিস্তারিত বার্তা বা প্রশ্ন (Message)
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="আপনার সমস্যা বা বার্তাটি পরিষ্কারভাবে বর্ণনা করুন..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !message.trim()}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-500 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-600/30 text-xs"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>মেসেজ পাঠান</span>
            </button>
          </form>
        )}

        {/* Tab 2: History & Replies */}
        {activeTab === 'history' && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {isLoadingTickets ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                <span>টিকেট লোড হচ্ছে...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/40 rounded-2xl border border-slate-800">
                আপনি এখনও কোনো সাপোর্ট আবেদন করেননি।
              </div>
            ) : (
              tickets.map(t => (
                <div key={t.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-white text-xs">{t.subject}</strong>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'open' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      t.status === 'replied' ? 'bg-teal-950 text-teal-300 border border-teal-800' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {t.status === 'open' ? 'প্রক্রিয়াধীন' : t.status === 'replied' ? 'উত্তর এসেছে' : 'সমাধানকৃত'}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    {t.message}
                  </p>

                  {t.adminReply && (
                    <div className="p-2.5 rounded-xl bg-teal-950/50 border border-teal-800/70 text-teal-100 text-[11px]">
                      <strong className="text-teal-300 block mb-1">🛡️ অ্যাডমিন উত্তর:</strong>
                      <p className="leading-relaxed whitespace-pre-wrap">{t.adminReply}</p>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 font-mono text-right">
                    {new Date(t.createdAt).toLocaleDateString('bn-BD')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

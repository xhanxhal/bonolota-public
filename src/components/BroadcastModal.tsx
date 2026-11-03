import React from 'react';
import { 
  Megaphone, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Tag 
} from 'lucide-react';
import { BroadcastAnnouncement } from '../hooks/useBroadcastAnnouncements';
import { NavTab } from './Navbar';

interface BroadcastModalProps {
  announcement: BroadcastAnnouncement;
  onDismiss: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  announcement,
  onDismiss,
  onNavigateTab,
}) => {
  const typeConfigs = {
    urgent: {
      badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      headerBg: 'from-rose-500/20 via-rose-500/5 to-transparent',
      icon: <AlertTriangle className="w-6 h-6 text-rose-500 animate-bounce" />,
      tag: 'জরুরি নোটিশ',
      btnColor: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-950/40 text-white',
    },
    update: {
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      headerBg: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
      icon: <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />,
      tag: 'নতুন আপডেট',
      btnColor: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-950/40 text-white',
    },
    promotion: {
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      headerBg: 'from-amber-500/20 via-amber-500/5 to-transparent',
      icon: <Tag className="w-6 h-6 text-amber-400" />,
      tag: 'বিশেষ অফার',
      btnColor: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-amber-950/30',
    },
    info: {
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      headerBg: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      icon: <Megaphone className="w-6 h-6 text-emerald-400" />,
      tag: 'সাধারণ নোটিশ',
      btnColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40 text-white',
    },
  };

  const config = typeConfigs[announcement.type] || typeConfigs.info;

  const handleActionClick = () => {
    onDismiss();
    if (!announcement.actionUrl) return;

    if (announcement.actionUrl.startsWith('http://') || announcement.actionUrl.startsWith('https://')) {
      window.open(announcement.actionUrl, '_blank', 'noopener,noreferrer');
    } else if (onNavigateTab) {
      onNavigateTab(announcement.actionUrl as NavTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative font-bangla transition-all transform scale-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Glow Header */}
        <div className={`p-6 pb-4 bg-gradient-to-b ${config.headerBg} border-b border-slate-100 dark:border-slate-800/60 flex items-start justify-between gap-4`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              {config.icon}
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.badgeBg}`}>
                {config.tag}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {new Date(announcement.createdAt).toLocaleDateString('bn-BD', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
            {announcement.title}
          </h2>

          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 max-h-60 overflow-y-auto">
            {announcement.message}
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onDismiss}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
            >
              বুঝেছি / বন্ধ করুন
            </button>

            {announcement.actionUrl && (
              <button
                type="button"
                onClick={handleActionClick}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${config.btnColor}`}
              >
                <span>{announcement.actionText || 'এখনই দেখুন'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

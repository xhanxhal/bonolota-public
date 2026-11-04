import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  X, 
  ExternalLink, 
  AlertTriangle, 
  Sparkles, 
  Tag,
  Bell,
  Clock
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
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    announcement.autoDismissSeconds && announcement.autoDismissSeconds > 0
      ? announcement.autoDismissSeconds
      : null
  );

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onDismiss]);

  const handleActionClick = () => {
    onDismiss();
    if (!announcement.actionUrl) return;

    if (announcement.actionUrl.startsWith('http://') || announcement.actionUrl.startsWith('https://')) {
      window.open(announcement.actionUrl, '_blank', 'noopener,noreferrer');
    } else if (onNavigateTab) {
      onNavigateTab(announcement.actionUrl as NavTab);
    }
  };

  const isToast = announcement.displayStyle === 'toast';

  // ==========================================
  // 1. MINI SHORT ALERT POPUP (Image 1 Style)
  // ==========================================
  if (isToast) {
    return (
      <aside 
        aria-label="বিজ্ঞপ্তি অ্যালার্ট"
        className="fixed top-5 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-200"
      >
        <div className="bg-slate-900/95 dark:bg-black/95 text-white border-2 border-amber-500/70 rounded-full sm:rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
                  {announcement.title}
                </h4>
                {secondsLeft !== null && (
                  <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/20 px-1.5 py-0.2 rounded-full shrink-0 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{secondsLeft}s</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {announcement.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // ==========================================
  // 2. CENTER DISPLAY NOTIFICATION (Image 2 Style)
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 font-bangla">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl sm:rounded-4xl shadow-2xl p-6 sm:p-8 pt-10 text-center relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          title="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Centered Protruding Bell Badge (Image 2 style) */}
        <div className="relative -mt-16 sm:-mt-18 mx-auto w-20 h-20 rounded-full bg-amber-50 dark:bg-slate-800 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 flex items-center justify-center shadow-inner">
            <Bell className="w-7 h-7 text-amber-900 fill-amber-900" />
          </div>
          {/* Red Notification Badge */}
          <span className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 text-white font-black text-xs flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
            1
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
          {announcement.title}
        </h3>

        {/* Message */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 whitespace-pre-wrap max-h-48 overflow-y-auto px-2">
          {announcement.message}
        </p>

        {/* Action Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleActionClick}
            className="w-full py-3 px-5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-[0.99] shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{announcement.actionText || 'বিস্তারিত দেখুন'}</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          {secondsLeft !== null && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{secondsLeft} সেকেন্ডের মধ্যে স্বয়ংক্রিয়ভাবে বন্ধ হবে</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

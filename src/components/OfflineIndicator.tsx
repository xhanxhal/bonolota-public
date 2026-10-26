import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, Database, Wifi, RotateCw, X, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { haptics } from '../utils/haptics';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setDismissed(false);
      setShowReconnected(false);
    } else if (wasOfflineRef.current && isOnline) {
      // Transitioned from offline to online
      wasOfflineRef.current = false;
      setShowReconnected(true);
      haptics.success();
      
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const handleManualReload = () => {
    haptics.tap();
    window.location.reload();
  };

  // If reconnected toast should show
  if (showReconnected) {
    return (
      <aside
        aria-label="Online Reconnected Notification"
        className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-emerald-900/95 dark:bg-emerald-950/95 text-white shadow-2xl border border-emerald-400/40 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 font-sans"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Wifi className="w-4 h-4 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span>ইন্টারনেট সংযোগ ফিরে এসেছে!</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-emerald-100 font-bangla leading-tight">
              অটো-রিলোড হবে না, আপনার কুইজ ও পড়ার প্রগ্রেস সুরক্ষিত আছে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleManualReload}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg transition-colors border border-white/20"
            title="নতুন আপডেটের জন্য রিলোড করতে পারেন"
          >
            <RotateCw className="w-3 h-3" />
            <span>রিফ্রেশ</span>
          </button>
          <button
            type="button"
            onClick={() => setShowReconnected(false)}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  if (isOnline || dismissed) return null;

  return (
    <aside
      aria-label="Offline Mode Notification"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/95 dark:bg-emerald-950/95 text-white shadow-2xl border border-emerald-500/30 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 font-sans"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <WifiOff className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <span>অফলাইন মোড চালু</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-300 font-bangla leading-tight flex items-center gap-1">
            <Database className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>ক্যাশড ডাটাবেস সক্রিয় • ইন্টারনেট ছাড়াই সব শব্দ পড়তে পারবেন</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        title="বন্ধ করুন"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};

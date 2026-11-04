import React from 'react';
import { 
  Bell, 
  X, 
  ExternalLink, 
  CheckCheck, 
  Sparkles, 
  AlertTriangle, 
  Tag, 
  Megaphone,
  CheckCircle2,
  BellRing,
  Trash2
} from 'lucide-react';
import { BroadcastAnnouncement } from '../hooks/useBroadcastAnnouncements';
import { NavTab } from './Navbar';

interface BroadcastDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: BroadcastAnnouncement[];
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onDeleteAnnouncement: (id: string) => void;
  onClearAll: () => void;
  onSelectTab: (tab: NavTab) => void;
  isPushSupported: boolean;
  pushPermission: NotificationPermission;
  onRequestPushPermission: () => Promise<boolean>;
}

export const BroadcastDrawer: React.FC<BroadcastDrawerProps> = ({
  isOpen,
  onClose,
  announcements,
  unreadCount,
  onMarkAllAsRead,
  onMarkAsRead,
  onDeleteAnnouncement,
  onClearAll,
  onSelectTab,
  isPushSupported,
  pushPermission,
  onRequestPushPermission,
}) => {
  if (!isOpen) return null;

  const typeMeta = {
    urgent: {
      badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      tag: 'জরুরি নোটিশ',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />,
    },
    update: {
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      tag: 'নতুন আপডেট',
      icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,
    },
    promotion: {
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      tag: 'বিশেষ অফার',
      icon: <Tag className="w-3.5 h-3.5 text-amber-400" />,
    },
    info: {
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      tag: 'তথ্য',
      icon: <Megaphone className="w-3.5 h-3.5 text-emerald-400" />,
    },
  };

  const handleAction = (item: BroadcastAnnouncement) => {
    onMarkAsRead(item.id);
    onClose();
    if (!item.actionUrl) return;

    if (item.actionUrl.startsWith('http://') || item.actionUrl.startsWith('https://')) {
      window.open(item.actionUrl, '_blank', 'noopener,noreferrer');
    } else {
      onSelectTab(item.actionUrl as NavTab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-bangla">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-slate-900 dark:text-white">নোটিফিকেশন ও ঘোষণা</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-sm">
                      {unreadCount}টি নতুন
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">অ্যাডমিন কর্তৃক সম্প্রচারিত লাইভ বার্তা</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Web Push Opt-in Banner */}
          {isPushSupported && (
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <BellRing className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-xs text-indigo-950 dark:text-indigo-200 font-medium truncate">
                  {pushPermission === 'granted'
                    ? 'ব্রাউজার পুশ নোটিফিকেশন সক্রিয় আছে'
                    : 'ব্রাউজার নোটিফিকেশন চালু করুন'}
                </span>
              </div>
              {pushPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={onRequestPushPermission}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  চালু করুন
                </button>
              ) : (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> অন
                </span>
              )}
            </div>
          )}

          {/* Drawer Subheader: Mark All as Read & Clear All */}
          {announcements.length > 0 && (
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={onClearAll}
                className="font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="সব নোটিফিকেশন মুছে ফেলুন"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সব মুছে ফেলুন</span>
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>সবগুলো পঠিত মার্ক করুন</span>
                </button>
              )}
            </div>
          )}

          {/* Announcements List Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {announcements.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Bell className="w-6 h-6 opacity-40" />
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">এখন কোনো নোটিফিকেশন নেই</p>
                <p className="text-xs text-slate-400 mt-1">অ্যাডমিন কোনো ঘোষণা বা আপডেট পাঠালে এখানে দেখতে পাবেন।</p>
              </div>
            ) : (
              announcements.map((item) => {
                const meta = typeMeta[item.type] || typeMeta.info;
                return (
                  <div
                    key={item.id}
                    onClick={() => onMarkAsRead(item.id)}
                    className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.badge}`}>
                        {meta.icon}
                        <span>{meta.tag}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.createdAt).toLocaleDateString('bn-BD', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAnnouncement(item.id);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>

                    {item.actionUrl && (
                      <div className="pt-1.5 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(item);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white hover:bg-emerald-600 dark:hover:bg-emerald-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <span>{item.actionText || 'এখনই দেখুন'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-center">
            <p className="text-[11px] text-slate-400">
              বনলতা এডুকেশন প্ল্যাটফর্ম • লাইসেন্সিং ও ব্রডকাস্ট সিস্টেম
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

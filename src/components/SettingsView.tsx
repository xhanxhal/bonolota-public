import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  RotateCcw, 
  Check, 
  AlertTriangle,
  Sliders,
  Sparkles,
  Database,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  Wifi,
  Smartphone
} from 'lucide-react';
import { UserSettings } from '../data/types';
import { storage } from '../utils/storage';
import { haptics } from '../utils/haptics';
import { offlineDatabaseCache, OfflineCacheMetadata } from '../utils/offlineDatabaseCache';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  licenseInfo?: {
    isAuthenticated: boolean;
    daysLeft?: number;
    expiresAt?: number;
    keyMasked?: string;
  };
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  licenseInfo,
  onLogout,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [cacheMeta, setCacheMeta] = useState<OfflineCacheMetadata | null>(() => offlineDatabaseCache.getMetadata());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    if (!cacheMeta) {
      const initial = offlineDatabaseCache.init();
      setCacheMeta(initial);
    }
  }, [cacheMeta]);

  const handleSyncOfflineCache = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const updated = offlineDatabaseCache.refreshCache();
      setCacheMeta(updated);
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 400);
  };

  const handleToggleSound = () => {
    const updated = storage.saveSettings({ soundEnabled: !settings.soundEnabled });
    onUpdateSettings(updated);
  };

  const handleToggleHaptics = () => {
    const isCurrentlyEnabled = settings.hapticsEnabled !== false;
    const nextState = !isCurrentlyEnabled;
    const updated = storage.saveSettings({ hapticsEnabled: nextState });
    onUpdateSettings(updated);
    if (nextState) {
      haptics.toggle();
    }
  };

  const handleToggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    const updated = storage.saveSettings({ theme: newTheme });
    onUpdateSettings(updated);
  };

  const handleDailyGoalChange = (goal: number) => {
    const updated = storage.saveSettings({ dailyGoal: goal });
    onUpdateSettings(updated);
  };

  const handleSpeechRateChange = (rate: number) => {
    const updated = storage.saveSettings({ speechRate: rate });
    onUpdateSettings(updated);
  };

  const handleResetData = () => {
    storage.resetAllData();
    setShowResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-2 shadow-sm font-bangla">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>অ্যাপ কাস্টমাইজেশন (Customization)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
          সেটিংস ও পছন্দসমূহ (Settings)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          শব্দের শুদ্ধ উচ্চারণ গতি, দৈনিক লক্ষ্যমাত্রা ও অ্যাপের থিম নিয়ন্ত্রণ করুন।
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm font-bangla">
        {/* Subscription & Access Key Status */}
        <div className="p-6 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">সাবস্ক্রিপশন ও লাইসেন্স স্ট্যাটাস</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  সক্রিয় ({licenseInfo?.daysLeft !== undefined ? `${licenseInfo.daysLeft} দিন বাকি` : 'Active'})
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                মাস্কড কি: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{licenseInfo?.keyMasked || 'BONOLOTA-****-****'}</span>
                {licenseInfo?.expiresAt && ` • মেয়াদ শেষ: ${new Date(licenseInfo.expiresAt).toLocaleDateString()}`}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              লগআউট ও ডিসকানেক্ট
            </button>
          </div>
        </div>

        {/* Sound Effects Toggle */}
        <div className="p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">সাউন্ড এফেক্টস ও উচ্চারণ (Audio)</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                settings.soundEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {settings.soundEnabled ? 'চালু' : 'বন্ধ'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              সঠিক উত্তর, ফ্লিপ এবং উচ্চারণের জন্য অডিও প্রতিক্রিয়া।
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleSound}
            aria-label="Toggle Sound"
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              settings.soundEnabled 
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700' 
                : 'border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Haptic Feedback (Vibration) Toggle */}
        <div className="p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">হ্যাপটিক ফিডব্যাক (Haptic Vibration)</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                settings.hapticsEnabled !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}>
                {settings.hapticsEnabled !== false ? 'চালু' : 'বন্ধ'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              মোবাইলে ফ্ল্যাশ কার্ড ফ্লিপ, কুইজ উত্তর ও বাটনে স্পর্শজনিত সূক্ষ্ম ভাইব্রেশন প্রতিক্রিয়া।
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleHaptics}
            aria-label="Toggle Haptic Feedback"
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              settings.hapticsEnabled !== false 
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-300' 
                : 'border-slate-200 bg-slate-100 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Theme Selector Section */}
        <div className="p-6 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">থিম প্রদর্শন (Appearance & Theme)</h3>
            <p className="text-xs text-slate-500">
              আপনার পছন্দের থিমটি নির্বাচন করুন — লাইট ভার্সন অথবা ডার্ক ভার্সন:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Light Theme Card */}
            <button
              type="button"
              onClick={() => {
                if (settings.theme !== 'light') {
                  const updated = storage.saveSettings({ theme: 'light' });
                  onUpdateSettings(updated);
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                settings.theme === 'light'
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">লাইট ভার্সন (Light Theme)</h4>
                    <p className="text-[11px] text-slate-500">হোয়াইট মিনিমাল ও গ্রিন গ্রেডিয়েন্ট</p>
                  </div>
                </div>
                {settings.theme === 'light' && (
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                )}
              </div>
            </button>

            {/* Dark Theme Card */}
            <button
              type="button"
              onClick={() => {
                if (settings.theme !== 'dark') {
                  const updated = storage.saveSettings({ theme: 'dark' });
                  onUpdateSettings(updated);
                }
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                settings.theme === 'dark'
                  ? 'border-emerald-500 bg-slate-900 text-white ring-2 ring-emerald-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-800 text-teal-400 border border-slate-700">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">ডার্ক ভার্সন (Dark Theme)</h4>
                    <p className="text-[11px] text-slate-400">মিডনাইট ব্যাকগ্রাউন্ড ও এমারেল্ড অ্যাকসেন্ট</p>
                  </div>
                </div>
                {settings.theme === 'dark' && (
                  <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="p-6 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">দৈনিক শেখার লক্ষ্য (Daily Goal)</h3>
            <p className="text-xs text-slate-500">
              প্রতিদিন কয়টি করে শব্দ আয়ত্ত করতে চান?
            </p>
          </div>

          <div className="flex flex-wrap gap-2 font-sans">
            {[5, 10, 15, 20, 25].map(goal => (
              <button
                key={goal}
                type="button"
                onClick={() => handleDailyGoalChange(goal)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.dailyGoal === goal
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {goal} words / day
              </button>
            ))}
          </div>
        </div>

        {/* Speech Rate */}
        <div className="p-6 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">ইংরেজি উচ্চারণের গতি (Pronunciation Speed)</h3>
            <p className="text-xs text-slate-500">
              শব্দ শোনার সময় কথা বলার গতি কেমন হবে।
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { rate: 0.75, label: '০.৭৫x (ধীর গতি)' },
              { rate: 0.9, label: '০.৯x (আদর্শ গতি)' },
              { rate: 1.0, label: '১.০x (স্বাভাবিক)' },
            ].map(item => (
              <button
                key={item.rate}
                type="button"
                onClick={() => handleSpeechRateChange(item.rate)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.speechRate === item.rate
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* PWA App Installation Section */}
        <div className="p-6 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">প্রগ্রেসিভ ওয়েব অ্যাপ (PWA Installation)</h3>
            <p className="text-xs text-slate-500">
              ফোনে বা কম্পিউটারে নেটিভ অ্যাপের মতো ইনস্টল করে ফুলস্ক্রিনে ব্যবহার করুন।
            </p>
          </div>
          <PWAInstallButton variant="settings" />
        </div>

        {/* Offline Vocabulary Cache Status & Management */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">অফলাইন ভোকাবুলারি ডাটাবেস (Offline Vocab Cache)</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  সক্রিয় (Cached)
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-bangla">
                সার্ভিস ওয়ার্কার এবং লোকাল স্টোরেজে সম্পূর্ণ ডাটাবেস ক্যাশ থাকায় ইন্টারনেট সংযোগ ছাড়াই সমস্ত ৫০টি ইউনিট এবং ১,৮৫০+ শব্দ নির্বিঘ্নে পড়া যাবে।
              </p>
            </div>

            <button
              type="button"
              onClick={handleSyncOfflineCache}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'ক্যাশ সিঙ্ক হচ্ছে...' : 'ক্যাশ রিফ্রেশ'}</span>
            </button>
          </div>

          {/* Cache Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>মোট শব্দ</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-sans">
                {cacheMeta?.totalWords || 1850}+ টি শব্দ
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                <HardDrive className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>ইউনিট সংখ্যা</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 font-sans">
                {cacheMeta?.totalUnits || 50} টি ইউনিট
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>অফলাইন রেডি</span>
              </div>
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>১০০% প্রস্তুত</span>
              </div>
            </div>
          </div>

          {syncSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>লোকাল স্টোরেজ ও সার্ভিস ওয়ার্কার ক্যাশ সফলভাবে আপডেট করা হয়েছে!</span>
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="p-6 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-rose-600">সব অগ্রগতি রিসেট করুন (Reset Data)</h3>
            <p className="text-xs text-slate-500">
              কুইজের স্কোর, মুখস্থ শব্দের রেকর্ড এবং সমস্ত অগ্রগতি মুছে ফেলে নতুন করে শুরু করুন।
            </p>
          </div>

          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer transition-colors"
            >
              অগ্রগতি রিসেট করুন
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer hover:bg-rose-700"
              >
                হ্যাঁ, সমস্ত ডাটা মুছে ফেলুন
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

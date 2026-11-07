import React, { useState, useRef, useEffect } from 'react';
import { 
  Flame, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  BookOpen, 
  CheckCircle2,
  LayoutGrid,
  Layers,
  HelpCircle,
  Info,
  X,
  Award,
  BarChart2,
  ChevronRight,
  Grid,
  Bell
} from 'lucide-react';
import { UserSettings, LearningStats } from '../data/types';
import { NavTab } from './Navbar';
import { haptics } from '../utils/haptics';

interface ModernHeaderProps {
  stats: LearningStats;
  settings: UserSettings;
  onToggleSound: () => void;
  onToggleTheme: () => void;
  onSelectTab: (tab: NavTab) => void;
  currentTab: NavTab;
  unreadAnnouncementsCount?: number;
  onOpenAnnouncements?: () => void;
  onOpenSupport?: () => void;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  stats,
  settings,
  onToggleSound,
  onToggleTheme,
  onSelectTab,
  currentTab,
  unreadAnnouncementsCount = 0,
  onOpenAnnouncements,
  onOpenSupport,
}) => {
  const [showStatsPopup, setShowStatsPopup] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (statsRef.current && !statsRef.current.contains(event.target as Node)) {
        setShowStatsPopup(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowStatsPopup(false);
      }
    };

    if (showStatsPopup) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showStatsPopup]);

  const totalWords = 1850;
  const masteredPercent = Math.min(100, Math.round((stats.wordsMastered / totalWords) * 100));
  const studiedPercent = Math.min(100, Math.round((stats.wordsStudied / totalWords) * 100));

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors flex-nowrap">
      {/* Mobile Brand / Logo */}
      <div className="flex items-center gap-2 lg:hidden shrink-0">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2 text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center justify-center p-0.5 shrink-0">
            <img
              src="/assets/aistudio/Botanical_Book_B_Emblem_8fbb1e88.png"
              alt="Bonolota Icon"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-tight font-sans">
              Bonolota
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bangla whitespace-nowrap">
              ১,৮৫০+ শব্দ
            </div>
          </div>
        </button>
      </div>

      {/* Desktop Quick Nav Segmented Tab Bar - Strictly Single Line, Clean Minimal */}
      <nav aria-label="Desktop Navigation Tabs" className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 font-bangla flex-nowrap shrink-0 whitespace-nowrap">
        <button
          type="button"
          onClick={() => {
            haptics.tap();
            onSelectTab('home');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            currentTab === 'home'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>হোম</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tap();
            onSelectTab('learn');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            currentTab === 'learn'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>শব্দ গ্রিড</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tap();
            onSelectTab('flashcards');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            currentTab === 'flashcards'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ফ্ল্যাশ কার্ড</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tap();
            onSelectTab('quiz');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            currentTab === 'quiz'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>কুইজ</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tap();
            onSelectTab('info');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            currentTab === 'info' || currentTab === 'archive'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white/70 dark:hover:bg-slate-800/70'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>ইনফো</span>
        </button>
      </nav>

      {/* Metrics & Control Actions - Single Line with no overflow */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto font-bangla shrink-0">
        {/* Streak & Stats Indicator with Clickable Popup */}
        <div className="relative" ref={statsRef}>
          <button
            type="button"
            onClick={() => setShowStatsPopup(prev => !prev)}
            aria-expanded={showStatsPopup}
            aria-label="দৈনিক স্ট্রিক ও অগ্রগতি পপআপ"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs border ${
              showStatsPopup
                ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/30'
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 active:scale-95'
            }`}
            title="দৈনিক স্ট্রিক ও বিস্তারিত স্ট্যাটস দেখতে ক্লিক করুন"
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
            <span className="font-sans font-bold">{stats.learningStreak}</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold hidden sm:inline">দিন</span>
            {/* Mobile notification dot indicating interactivity */}
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 sm:hidden"></span>
          </button>

          {/* Stats Popup Modal (Accessible on Mobile and Desktop) */}
          {showStatsPopup && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
                onClick={() => setShowStatsPopup(false)}
              />

              <div className="fixed sm:absolute right-2 sm:right-0 top-14 sm:top-full sm:mt-2 z-50 w-[calc(100vw-16px)] sm:w-80 max-w-[340px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 font-bangla animate-in fade-in slide-in-from-top-2 duration-150 text-slate-900 dark:text-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center">
                      <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm leading-tight text-slate-900 dark:text-white">
                        শেখার স্ট্যাটস ও অগ্রগতি
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        দৈনিক অনুশীলন সারাংশ
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStatsPopup(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    aria-label="বন্ধ করুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Streak & Mastery Banner */}
                <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-amber-50/80 via-amber-50/30 to-orange-50/40 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-800/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                      ধারাবাহিক স্ট্রিক
                    </span>
                    <span className="font-sans font-extrabold text-amber-700 dark:text-amber-400 text-sm">
                      {stats.learningStreak} দিন
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 font-medium">
                    প্রতিদিন অ্যাপে ফিরে এসে শেখার স্ট্রিক ধরে রাখুন!
                  </p>
                </div>

                {/* Mastery Progress Bar */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      মুখস্থের অগ্রগতি
                    </span>
                    <span className="font-sans font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                      {stats.wordsMastered} / {totalWords}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, masteredPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{masteredPercent}% সম্পূর্ণ আয়ত্ত</span>
                    <span>{studiedPercent}% পঠিত</span>
                  </div>
                </div>

                {/* 4 Mini Stat Badges */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">পড়া হয়েছে</span>
                    <span className="font-sans font-extrabold text-sm text-slate-800 dark:text-slate-200">{stats.wordsStudied}</span>
                    <span className="text-[10px] text-slate-400 ml-1">শব্দ</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">কুইজ দক্ষতা</span>
                    <span className="font-sans font-extrabold text-sm text-teal-600 dark:text-teal-400">{stats.quizAccuracy || 0}%</span>
                    <span className="text-[10px] text-slate-400 ml-1">স্কোর</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">সংরক্ষিত শব্দ</span>
                    <span className="font-sans font-extrabold text-sm text-amber-600 dark:text-amber-400">{stats.favoritesCount || 0}</span>
                    <span className="text-[10px] text-slate-400 ml-1">টি</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">রিভিশন বাকি</span>
                    <span className="font-sans font-extrabold text-sm text-rose-600 dark:text-rose-400">{stats.needsRevisionCount || 0}</span>
                    <span className="text-[10px] text-slate-400 ml-1">টি</span>
                  </div>
                </div>

                {/* Full Progress View Link */}
                <button
                  type="button"
                  onClick={() => {
                    setShowStatsPopup(false);
                    onSelectTab('progress');
                  }}
                  className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>পূর্ণাঙ্গ পরিসংখ্যান ও বিশ্লেষণ দেখুন</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mastered Counter */}
        <button 
          type="button"
          onClick={() => onSelectTab('progress')}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 cursor-pointer transition-all shadow-xs whitespace-nowrap"
          title={`শেখা হয়েছে: ${stats.wordsMastered} / ১৮৫০ (ক্লিক করে অগ্রগতি দেখুন)`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-sans font-bold text-emerald-700 dark:text-emerald-300">{stats.wordsMastered}</span>
          <span className="text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400">/ ১৮৫০ মুখস্থ</span>
        </button>

        {/* Audio Sound Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
            settings.soundEnabled
              ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/60'
              : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200/60'
          }`}
          title={settings.soundEnabled ? 'উচ্চারণ চালু আছে' : 'উচ্চারণ বন্ধ'}
        >
          {settings.soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Two-Theme Selector (Light & Dark) */}
        <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-2xs font-bangla">
          <button
            type="button"
            onClick={() => settings.theme !== 'light' && onToggleTheme()}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              settings.theme === 'light'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
            title="লাইট থিম"
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] hidden sm:inline">লাইট</span>
          </button>

          <button
            type="button"
            onClick={() => settings.theme !== 'dark' && onToggleTheme()}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
              settings.theme === 'dark'
                ? 'bg-slate-900 text-emerald-300 shadow-2xs font-bold border border-slate-700'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
            title="ডার্ক থিম"
          >
            <Moon className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[10px] hidden sm:inline">ডার্ক</span>
          </button>
        </div>

        {/* Broadcast Announcements Notification Bell */}
        <button
          type="button"
          onClick={() => {
            haptics.tap();
            onOpenAnnouncements?.();
          }}
          aria-label="নোটিফিকেশন ও ঘোষণা"
          title="নোটিফিকেশন ও ঘোষণা"
          className="relative p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Bell className="w-4 h-4" />
          {unreadAnnouncementsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
              {unreadAnnouncementsCount > 9 ? '9+' : unreadAnnouncementsCount}
            </span>
          )}
        </button>

        {/* Student Support Button */}
        <button
          type="button"
          onClick={() => {
            haptics.tap();
            onOpenSupport?.();
          }}
          aria-label="সহায়তা ও সাপোর্ট ইনবক্স"
          title="সহায়তা ও সাপোর্ট ইনবক্স"
          className="p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 transition-all cursor-pointer shadow-xs shrink-0"
        >
          <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </button>

        {/* ALL SECTIONS / EXPLORE BUTTON (Direct Full Page Navigation - No Popup) */}
        <div className="relative font-bangla shrink-0">
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              onSelectTab('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="সকল সেকশন ও প্র্যাকটিস হাব"
            className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center shadow-xs ${
              currentTab === 'explore'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:bg-emerald-50/70 dark:hover:bg-slate-700/60'
            }`}
            title="সকল বিশেষ সেকশন ও হাব পেজ"
          >
            <Grid className={`w-4 h-4 ${currentTab === 'explore' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};

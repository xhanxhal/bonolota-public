import React from 'react';
import { 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Info, 
  RotateCw, 
  BarChart2, 
  Star, 
  Settings, 
  LayoutGrid,
  Flame,
  Award,
  Sun,
  Moon,
  Heart,
  Zap,
  Scale,
  FileText,
  Share2,
  Printer,
  Sparkles,
  Grid
} from 'lucide-react';
import { NavTab } from './Navbar';
import { LearningStats } from '../data/types';

interface ModernSidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  stats: LearningStats;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
  theme = 'light',
  onToggleTheme,
}) => {
  interface NavItem {
    id: NavTab;
    labelBn: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const primaryNavItems: NavItem[] = [
    { id: 'home', labelBn: 'হোম ড্যাশবোর্ড', icon: LayoutGrid },
    { id: 'explore', labelBn: 'সকল সেকশন হাব', icon: Grid, badge: '১৫' },
    { id: 'learn', labelBn: 'শব্দ তালিকা', icon: BookOpen },
    { id: 'flashcards', labelBn: 'ফ্ল্যাশ কার্ড', icon: Layers },
    { id: 'quiz', labelBn: 'কুইজ পরীক্ষা', icon: HelpCircle },
  ];

  const specialNavItems: NavItem[] = [
    { id: 'match-game', labelBn: 'শব্দ মেলানো গেম', icon: Zap, badge: 'নতুন' },
    { id: 'confusing-words', labelBn: 'Confusing Words', icon: Scale },
    { id: 'odd-one-out', labelBn: 'Odd One Out কুইজ', icon: HelpCircle },
    { id: 'sentence-completion', labelBn: 'শূন্যস্থান পূরণ', icon: FileText },
    { id: 'stories', labelBn: 'ভোকাবুলারি স্টোরিজ', icon: BookOpen, badge: '৫০ ইউনিট' },
    { id: 'thematic-clusters', labelBn: 'থিমেটিক ক্লাস্টার', icon: Sparkles },
    { id: 'card-generator', labelBn: 'স্টাডি কার্ড মেকার', icon: Share2 },
    { id: 'cheat-sheet', labelBn: 'প্রিন্ট শিট / PDF', icon: Printer },
  ];

  const utilityNavItems: NavItem[] = [
    { id: 'revision', labelBn: 'ভুল শব্দ রিভিশন', icon: RotateCw },
    { id: 'favorites', labelBn: 'সংরক্ষিত প্রিয় শব্দ', icon: Star },
    { id: 'progress', labelBn: 'অগ্রগতি ও স্ট্যাটস', icon: BarChart2 },
    { id: 'info', labelBn: 'ইনফো ও পরিচিতি', icon: Info },
    { id: 'settings', labelBn: 'সেটিংস ও পছন্দ', icon: Settings },
  ];

  const masteredPercent = Math.min(100, Math.round((stats.wordsMastered / 1850) * 100));

  return (
    <aside className="hidden lg:flex flex-col justify-between w-64 h-screen sticky top-0 border-r border-slate-200/90 dark:border-slate-800 p-4 bg-white dark:bg-[#0b1120] shrink-0 z-30 select-none shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
      <div className="space-y-4">
        {/* Brand Header */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-emerald-50/50 dark:hover:bg-slate-800/60 transition-all cursor-pointer text-left w-full group border border-transparent hover:border-emerald-100"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm shadow-emerald-500/10 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center p-0.5">
            <img
              src="/assets/aistudio/Botanical_Book_B_Emblem_8fbb1e88.png"
              alt="Bonolota Icon"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 font-sans">
              <span>Bonolota</span>
              <span className="text-[10px] font-bangla font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                স্মার্ট
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-bangla">
              ১,৮৫০+ ভোকাবুলারি
            </p>
          </div>
        </button>

        {/* Navigation list - Pure Bengali with Grouped Categories */}
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] pr-1 space-y-3 font-bangla scrollbar-thin">
          {/* Primary Learning Tabs */}
          <nav aria-label="Primary Navigation" className="space-y-1">
            {primaryNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50/60 dark:from-emerald-950/60 dark:to-teal-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/60'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight">
                      {item.labelBn}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Special Features & Games */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1">
              🎮 বিশেষ প্র্যাকটিস ও গেম
            </span>
            {specialNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50/60 dark:from-emerald-950/60 dark:to-teal-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/60'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold leading-tight">
                      {item.labelBn}
                    </span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Personal Utilities */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1">
              📊 পার্সোনাল ও সেটিংস
            </span>
            {utilityNavItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50/60 dark:from-emerald-950/60 dark:to-teal-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/60'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold leading-tight">
                      {item.labelBn}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Progress Widget */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 font-bangla">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white dark:from-slate-900 dark:to-slate-900/80 border border-emerald-100 dark:border-slate-800 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              মাস্টারি অগ্রগতি
            </span>
            <span className="font-sans font-bold text-emerald-700 dark:text-emerald-400 text-xs">
              {stats.wordsMastered} / ১৮৫০
            </span>
          </div>

          <div className="h-2 w-full bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, masteredPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{masteredPercent}% সম্পূর্ণ</span>
            <span className="flex items-center gap-1 text-amber-600 font-bold">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {stats.learningStreak} দিন স্ট্রিক
            </span>
          </div>
        </div>

        {/* Two-Theme Selector in Sidebar */}
        {onToggleTheme && (
          <div className="flex items-center justify-between p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => theme !== 'light' && onToggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                theme === 'light'
                  ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">লাইট থিম</span>
            </button>
            <button
              type="button"
              onClick={() => theme !== 'dark' && onToggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900 text-emerald-300 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[11px]">ডার্ক থিম</span>
            </button>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-center text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
          <span>Made with</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline animate-pulse" />
          <span>by</span>
          <a
            href="https://xhanxhal.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline decoration-emerald-500/40 hover:decoration-emerald-500 underline-offset-2"
          >
            Chanchal
          </a>
        </div>
      </div>
    </aside>
  );
};

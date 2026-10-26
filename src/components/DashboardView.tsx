import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Star, 
  Award, 
  Sparkles, 
  Layers, 
  HelpCircle,
  RotateCw,
  Flame,
  ArrowRight,
  LayoutGrid,
  LayoutList,
  CheckCircle2,
  ChevronRight,
  Search,
  Check,
  TrendingUp,
  GraduationCap,
  Lightbulb
} from 'lucide-react';
import { VocabWord, UnitInfo } from '../data/types';
import { getAllWords, getAllUnits } from '../data/units';
import { storage } from '../utils/storage';
import { searchUnitsAndWords, isFuzzyWordMatch } from '../utils/searchUtils';
import { NavTab } from './Navbar';

interface DashboardViewProps {
  onStartLesson: (unitId: number) => void;
  onOpenFlashcards: (unitId: number, filter?: 'all' | 'favorites' | 'difficult') => void;
  onStartQuiz: (unitId?: number) => void;
  onOpenRevision: () => void;
  onOpenArchive: () => void;
  onOpenWordDetail: (word: VocabWord) => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartLesson,
  onOpenFlashcards,
  onStartQuiz,
  onOpenRevision,
  onOpenArchive,
  onOpenWordDetail,
  onNavigateTab,
}) => {
  const allWords = getAllWords();
  const allUnits = getAllUnits();
  const stats = storage.getLearningStats();
  const progressMap = storage.getProgress();

  const [searchUnitQuery, setSearchUnitQuery] = useState('');
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>(() => {
    try {
      const saved = localStorage.getItem('bonolota_unit_view_mode');
      return saved === 'detailed' ? 'detailed' : 'compact';
    } catch {
      return 'compact';
    }
  });

  const handleSetViewMode = (mode: 'detailed' | 'compact') => {
    setViewMode(mode);
    try {
      localStorage.setItem('bonolota_unit_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Compute stats per unit
  const unitStatsMap = useMemo(() => {
    const map: Record<number, { studied: number; mastered: number; total: number; percent: number }> = {};
    for (const unit of allUnits) {
      let studied = 0;
      let mastered = 0;
      for (const w of unit.words) {
        const p = progressMap[w.id];
        if (storage.isWordStudied(p)) studied++;
        if (storage.isWordMastered(p)) mastered++;
      }
      const total = unit.words.length;
      const percent = total > 0 ? Math.round((studied / total) * 100) : 0;
      map[unit.id] = { studied, mastered, total, percent };
    }
    return map;
  }, [allUnits, progressMap]);

  // Find the current active unit in strict sequence (1 to 50):
  // Shows the unit currently being studied. Once ALL words in that unit are studied (100%), advances to the next unit.
  // Never jumps ahead to unit 2 if unit 1 is not yet finished.
  const activeUnit = useMemo(() => {
    for (const unit of allUnits) {
      const uStat = unitStatsMap[unit.id];
      const isWordsComplete = uStat && uStat.total > 0 && uStat.studied >= uStat.total;

      // The first unit not yet 100% finished in numerical order is the current lesson!
      if (!isWordsComplete) {
        return unit;
      }
    }
    // If all 50 units completed, show the last unit
    return allUnits[allUnits.length - 1] || null;
  }, [allUnits, unitStatsMap]);

  // Smart filtered units and words
  const searchResult = useMemo(() => {
    return searchUnitsAndWords(allUnits, allWords, searchUnitQuery);
  }, [allUnits, allWords, searchUnitQuery]);

  const { filteredUnits, matchedWords, wordsByUnit, exactUnitNumber } = searchResult;

  const displayedUnits = filteredUnits;

  const totalMasteredPercent = allWords.length > 0 
    ? Math.min(100, Math.round((stats.wordsMastered / allWords.length) * 100)) 
    : 0;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200 w-full">
      {/* MINIMAL WHITE THEME HERO WITH GREENISH GRADIENT ACCENTS */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 p-6 sm:p-8 sm:py-10 shadow-sm border border-emerald-100/90 dark:border-emerald-900/40 relative overflow-hidden">
        {/* Subtle decorative mesh gradients */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          <div className="flex-1 min-w-0 space-y-3.5 max-w-2xl font-bangla">
            {/* Bengali Top Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>সম্পূর্ণ সিলেবাস: ৫০টি ইউনিট · ১,৮৫০+ শব্দভাণ্ডার (মূল ১,০৫০ + ব্যারন ৮০০)</span>
            </div>

            {/* Hero Title */}
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              বাংলা অর্থসহ <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">১,৮৫০+ ইংরেজি শব্দ</span> আয়ত্ত করুন
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              প্রতিটি ইউনিটে পাবেন শুদ্ধ উচ্চারণ, পদ প্রকরণ, প্রাসঙ্গিক বাংলা অর্থ, সহজ ইংরেজি সংজ্ঞা ও বাস্তব উদাহরণ বাক্য। সব শব্দ একসাথে সাজানো।
            </p>

            {/* 4 Summary Stats Cards Grid - Symmetrical 2x2 Clean Layout */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-2">
              {/* Box 1: মোট শব্দ */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between gap-2.5 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                    মোট শব্দ
                  </div>
                  <div className="text-base sm:text-lg font-black font-sans text-slate-900 dark:text-white mt-0.5 leading-tight flex items-baseline gap-1">
                    ১,৮৫০ <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">টি</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700/80 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
              </div>

              {/* Box 2: পড়া হয়েছে */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-800/90 border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs flex items-center justify-between gap-2.5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    পড়া হয়েছে
                  </div>
                  <div className="text-base sm:text-lg font-black font-sans text-emerald-700 dark:text-emerald-300 mt-0.5 leading-tight flex items-baseline gap-1">
                    {stats.wordsStudied} <span className="text-[10px] sm:text-[11px] font-medium text-emerald-600/70 dark:text-emerald-400/70">/ ১,৮৫০</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                </div>
              </div>

              {/* Box 3: মুখস্থ */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-800/90 border border-amber-200/80 dark:border-amber-800/60 shadow-2xs flex items-center justify-between gap-2.5 hover:border-amber-300 dark:hover:border-amber-700 transition-all">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400">
                    মুখস্থ হয়েছে
                  </div>
                  <div className="text-base sm:text-lg font-black font-sans text-amber-700 dark:text-amber-300 mt-0.5 leading-tight flex items-baseline gap-1">
                    {stats.wordsMastered} <span className="text-[10px] sm:text-[11px] font-medium text-amber-600/70 dark:text-amber-400/70">/ ১,৮৫০</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/70 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>

              {/* Box 4: সম্পূর্ণ হয়েছে */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-800/90 border border-teal-200/80 dark:border-teal-800/60 shadow-2xs flex items-center justify-between gap-2.5 hover:border-teal-300 dark:hover:border-teal-700 transition-all">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-semibold text-teal-700 dark:text-teal-400">
                    সিলেবাস অর্জন
                  </div>
                  <div className="text-base sm:text-lg font-black font-sans text-teal-700 dark:text-teal-300 mt-0.5 leading-tight flex items-baseline gap-1">
                    {totalMasteredPercent}% <span className="text-[10px] sm:text-[11px] font-medium text-teal-600/70 dark:text-teal-400/70">সম্পন্ন</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/70 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick jump to active unit card (Displays sequential curriculum unit being studied) */}
          {activeUnit && (() => {
            const activeStat = unitStatsMap[activeUnit.id] || { studied: 0, total: activeUnit.words.length, percent: 0, mastered: 0 };
            const isAllFiftyComplete = activeUnit.id === 50 && activeStat.percent === 100;

            return (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-emerald-100 dark:border-slate-700 space-y-3 shrink-0 w-full lg:w-80 shadow-sm font-bangla">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>বর্তমান পাঠ</span>
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ইউনিট {activeUnit.id}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {activeStat.percent === 0 ? 'নতুন পাঠ' : activeStat.percent === 100 ? 'সম্পন্ন' : 'চলমান'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1">
                    {activeUnit.title.replace(/^Unit \d+:\s*/, '')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-bangla">
                    {activeUnit.subtitle} · {activeUnit.words.length}টি শব্দ
                  </p>
                </div>

                {/* Live progress indicator for the current unit */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bangla">
                    <span>অগ্রগতি: <strong className="text-slate-700 dark:text-slate-200">{activeStat.studied}</strong> / {activeStat.total} শব্দ</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{activeStat.percent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(activeStat.percent > 0 ? 4 : 0, activeStat.percent)}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartLesson(activeUnit.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/25 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <span className="font-bangla">
                    {isAllFiftyComplete
                      ? 'সম্পূর্ণ সিলেবাস রিভিশন করুন'
                      : activeStat.percent === 0
                      ? `ইউনিট ${activeUnit.id} শুরু করুন`
                      : activeStat.percent === 100
                      ? `ইউনিট ${activeUnit.id} কুইজ পরীক্ষা দিন`
                      : `ইউনিট ${activeUnit.id} পড়া চালিয়ে যান`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* UNIT VIEW CONTROLS & SEARCH BAR */}
      <div className="space-y-3 font-bangla pt-1">
        {/* View Mode Toggle: Grid & Detailed full width filling right side */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-2xs w-full">
          <button
            type="button"
            onClick={() => handleSetViewMode('compact')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              viewMode === 'compact'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="কমপ্যাক্ট গ্রিড ভিউ"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="font-bangla text-xs">গ্রিড ভিউ</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetViewMode('detailed')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              viewMode === 'detailed'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="বিস্তারিত কার্ড ভিউ"
          >
            <LayoutList className="w-4 h-4" />
            <span className="font-bangla text-xs">বিস্তারিত ভিউ</span>
          </button>
        </div>

        {/* Search Units Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchUnitQuery}
            onChange={(e) => setSearchUnitQuery(e.target.value)}
            placeholder="শব্দ বা ইউনিট খুঁজুন (যেমন: Unit 1, abandon, ইত্যাদি)..."
            className="w-full pl-10 pr-8 py-2.5 rounded-2xl text-xs font-medium border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-emerald-500 shadow-2xs"
          />
          {searchUnitQuery && (
            <button
              type="button"
              onClick={() => setSearchUnitQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* MATCHED WORDS DIRECT ACCESS PREVIEW */}
      {searchUnitQuery.trim() && matchedWords.length > 0 && (
        <div className="rounded-2xl border border-emerald-200/90 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 p-4 shadow-xs space-y-3 font-bangla animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                খুঁজে পাওয়া শব্দসমূহ ({matchedWords.length}টি)
              </h4>
              {matchedWords.length > 0 && isFuzzyWordMatch(matchedWords[0], searchUnitQuery) && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80 font-bold flex items-center gap-1">
                  <span>কাছাকাছি শব্দ: হয়তো খুঁজছেন</span>
                  <span className="font-sans font-bold underline">{matchedWords[0].word}</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              শব্দে ক্লিক করে বিস্তারিত জানুন বা সংশ্লিষ্ট ইউনিটে যান
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {matchedWords.slice(0, 6).map((word) => {
              const isFuzzy = isFuzzyWordMatch(word, searchUnitQuery);
              return (
                <div
                  key={word.id}
                  onClick={() => onOpenWordDetail(word)}
                  className="group flex items-start justify-between gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-sans font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {word.word}
                      </span>
                      {isFuzzy && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 font-bangla font-semibold">
                          কাছাকাছি বানান
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-sans">
                        {word.pronunciation}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                      {word.banglaMeaning}
                    </p>
                  </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartLesson(word.unitId);
                  }}
                  className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  title={`ইউনিট ${word.unitId}-এ যান`}
                >
                  ইউনিট {word.unitId} →
                </button>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* NO RESULTS STATE */}
      {filteredUnits.length === 0 ? (
        <div className="p-10 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-slate-500 font-bangla space-y-2.5">
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">কোনো ইউনিট বা শব্দ খুঁজে পাওয়া যায়নি</p>
          <p className="text-xs text-slate-400">অনুগ্রহ করে অন্য শব্দ দিয়ে খুঁজুন</p>
          <button
            type="button"
            onClick={() => setSearchUnitQuery('')}
            className="px-4 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            সার্চ রিসেট করুন
          </button>
        </div>
      ) : viewMode === 'compact' ? (
        /* COMPACT GRID VIEW (Only Unit Number, Word Count, and Progress) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {displayedUnits.map((unit) => {
            const uStat = unitStatsMap[unit.id] || { studied: 0, mastered: 0, total: unit.words.length, percent: 0 };
            const isComplete = uStat.percent === 100;
            const isActive = activeUnit?.id === unit.id;

            return (
              <div
                key={unit.id}
                onClick={() => onStartLesson(unit.id)}
                className={`group rounded-2xl border p-3.5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between select-none relative ${
                  isComplete
                    ? 'border-emerald-200/90 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-400'
                    : isActive
                    ? 'border-emerald-500 dark:border-emerald-500 bg-white dark:bg-slate-900 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                {/* Top Row: Unit Number & Completion Icon / Percent */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="font-bangla text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    ইউনিট {unit.id < 10 ? `০${unit.id}` : unit.id}
                  </span>
                  {isComplete ? (
                    <span className="text-emerald-600 dark:text-emerald-400" title="সম্পন্ন">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="text-[11px] font-sans font-bold text-slate-500 dark:text-slate-400">
                      {uStat.percent}%
                    </span>
                  )}
                </div>

                {/* Middle: Word count with 'চলমান' on the same line */}
                <div className="my-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white font-bangla group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {unit.words.length}টি শব্দ
                    </div>
                    {isActive && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold font-bangla shrink-0">
                        চলমান
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bangla flex items-center justify-between mt-0.5">
                    <span>দিন {unit.number}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold group-hover:underline">শব্দ পড়ুন →</span>
                  </div>
                  {wordsByUnit[unit.id] && wordsByUnit[unit.id].length > 0 && (
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold font-bangla truncate mt-1 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/80">
                      🔍 {wordsByUnit[unit.id].length}টি ম্যাচিং: {wordsByUnit[unit.id][0].word}
                    </div>
                  )}
                </div>

                {/* Bottom: Progress info & Progress bar with 'মুখস্থ' count on the right */}
                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bangla">
                    <span>পড়া: <strong className="text-slate-700 dark:text-slate-300 font-bold">{uStat.studied}</strong>/{uStat.total}</span>
                    <span className={uStat.mastered > 0 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-400"}>
                      মুখস্থ: <strong className={uStat.mastered > 0 ? "text-amber-800 dark:text-amber-300 font-bold" : "text-slate-600 dark:text-slate-400"}>{uStat.mastered}</strong>/{uStat.total}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(uStat.percent > 0 ? 5 : 0, uStat.percent)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DETAILED CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedUnits.map((unit) => {
            const uStat = unitStatsMap[unit.id] || { studied: 0, mastered: 0, total: unit.words.length, percent: 0 };
            const isComplete = uStat.percent === 100;
            const isActive = activeUnit?.id === unit.id;

            return (
              <div
                key={unit.id}
                onClick={() => onStartLesson(unit.id)}
                className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all duration-200 cursor-pointer relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Unit Header Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bangla text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        ইউনিট {unit.id < 10 ? `০${unit.id}` : unit.id}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 font-bangla">
                        দিন {unit.number}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold font-bangla shrink-0">
                          চলমান
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-bangla">
                        {unit.words.length}টি শব্দ
                      </span>
                    </div>
                  </div>

                  {/* Unit Title and Subtitle */}
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors tracking-tight line-clamp-1">
                      {unit.title.replace(/^Unit \d+:\s*/, '')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed font-bangla">
                      {unit.description}
                    </p>
                  </div>

                  {/* Matching Search Words Banner if search is active */}
                  {wordsByUnit[unit.id] && wordsByUnit[unit.id].length > 0 && (
                    <div className="p-2 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bangla flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold">🔍 ম্যাচিং শব্দ ({wordsByUnit[unit.id].length}টি):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">
                        {wordsByUnit[unit.id].slice(0, 3).map((w: VocabWord) => w.word).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Word Preview Chips with Bangla Meanings */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {unit.words.slice(0, 3).map((w: VocabWord, wIdx: number) => (
                      <span
                        key={wIdx}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center gap-1"
                      >
                        <strong className="font-semibold text-slate-900 dark:text-white">{w.word}</strong>
                        <span className="text-slate-400 text-[10px]">·</span>
                        <span className="font-bangla text-slate-500 dark:text-slate-400 text-[10px]">{w.banglaMeaning.split(/[,;]/)[0]}</span>
                      </span>
                    ))}
                    {unit.words.length > 3 && (
                      <span className="text-[10px] font-bangla text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 self-center font-medium">
                        +আরো {unit.words.length - 3}টি
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bangla">
                      <span>পড়া: <strong className="text-slate-700 dark:text-slate-300 font-bold">{uStat.studied}</strong>/{uStat.total}</span>
                      <span className={uStat.mastered > 0 ? "text-amber-700 dark:text-amber-400 font-bold" : "text-slate-400"}>
                        মুখস্থ: <strong className={uStat.mastered > 0 ? "text-amber-800 dark:text-amber-300 font-bold" : "text-slate-600 dark:text-slate-400"}>{uStat.mastered}</strong>/{uStat.total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(uStat.percent > 0 ? 5 : 0, uStat.percent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons with proper alignment */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onStartLesson(unit.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200/70 dark:border-emerald-800/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                    <span className="font-bangla">শব্দ গ্রিড দেখুন</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenFlashcards(unit.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="ফ্ল্যাশ কার্ড"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartQuiz(unit.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="কুইজ পরীক্ষা"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

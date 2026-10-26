import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Star, 
  Search, 
  Filter, 
  CheckCircle2, 
  Check, 
  RotateCcw, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  LayoutGrid, 
  LayoutList,
  List, 
  Lightbulb, 
  ArrowRight, 
  ExternalLink,
  GraduationCap,
  Volume2
} from 'lucide-react';
import { VocabWord, UnitInfo, PartOfSpeech } from '../data/types';
import { getAllUnits, getUnitById, getAllWords } from '../data/units';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sound';
import { filterAndRankWords, isFuzzyWordMatch } from '../utils/searchUtils';
import { AudioButton } from './AudioButton';

interface LessonViewProps {
  unitId?: number;
  onOpenWordDetail?: (word: VocabWord, list?: VocabWord[]) => void;
  onNavigateToFlashcards?: (unitId: number) => void;
  onNavigateToQuiz?: (unitId: number) => void;
  onBackToUnits?: () => void;
  onSelectUnit?: (unitId: number) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({
  unitId = 1,
  onOpenWordDetail,
  onNavigateToFlashcards,
  onNavigateToQuiz,
  onBackToUnits,
  onSelectUnit,
}) => {
  const allUnits = getAllUnits();
  const currentUnit = getUnitById(unitId) || allUnits[0] || null;
  const settings = storage.getSettings();

  const allWords = useMemo(() => getAllWords(), []);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'current' | 'all'>('current');
  const [selectedPos, setSelectedPos] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'studied' | 'unstudied' | 'favorites' | 'mastered'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'detailed'>(() => {
    try {
      const saved = localStorage.getItem('bonolota_lesson_view_mode');
      return saved === 'detailed' ? 'detailed' : 'grid';
    } catch {
      return 'grid';
    }
  });

  const handleSetViewLayout = (mode: 'grid' | 'detailed') => {
    setViewLayout(mode);
    try {
      localStorage.setItem('bonolota_lesson_view_mode', mode);
    } catch {
      // ignore
    }
  };

  // Trigger state update when progress changes
  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    // Reset filters on unit change
    setSearchQuery('');
    setSearchScope('current');
    setSelectedPos('all');
    setStatusFilter('all');
  }, [unitId]);

  if (!currentUnit) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-bold text-slate-500 font-bangla">ইউনিট খুঁজে পাওয়া যায়নি।</p>
        <button
          type="button"
          onClick={onBackToUnits}
          className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
        >
          সব ইউনিটে ফিরে যান
        </button>
      </div>
    );
  }

  // Get current progress map
  const progressMap = storage.getProgress();

  // Calculate unit statistics
  const unitStats = useMemo(() => {
    let studied = 0;
    let mastered = 0;
    let favorites = 0;

    for (const w of currentUnit.words) {
      const p = progressMap[w.id];
      if (p) {
        if (storage.isWordStudied(p)) studied++;
        if (storage.isWordMastered(p)) mastered++;
        if (p.isFavorite) favorites++;
      }
    }

    const percent = currentUnit.words.length > 0 
      ? Math.round((studied / currentUnit.words.length) * 100) 
      : 0;

    return { studied, mastered, favorites, total: currentUnit.words.length, percent };
  }, [currentUnit, progressMap, progressTick]);

  // Pre-calculate search matches for current unit and across all units
  const { currentUnitMatches, allWordsMatches } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { currentUnitMatches: [], allWordsMatches: [] };
    }
    const q = searchQuery.trim();
    const cur = filterAndRankWords(currentUnit.words, q);
    const all = filterAndRankWords(allWords, q);
    return { currentUnitMatches: cur, allWordsMatches: all };
  }, [currentUnit.words, allWords, searchQuery]);

  // Filter words inside this unit or across all units
  const filteredWords = useMemo(() => {
    const hasQuery = Boolean(searchQuery.trim());
    let baseList: VocabWord[];

    if (hasQuery) {
      baseList = searchScope === 'all' ? allWordsMatches : currentUnitMatches;
    } else {
      baseList = currentUnit.words;
    }

    return baseList.filter(w => {
      // Part of speech filter
      if (selectedPos !== 'all' && w.partOfSpeech !== selectedPos) {
        return false;
      }

      // Status filter
      const p = progressMap[w.id];
      const isStudiedWord = storage.isWordStudied(p);
      const isMasteredWord = storage.isWordMastered(p);
      if (statusFilter === 'studied' && !isStudiedWord) return false;
      if (statusFilter === 'unstudied' && isStudiedWord) return false;
      if (statusFilter === 'favorites' && !p?.isFavorite) return false;
      if (statusFilter === 'mastered' && !isMasteredWord) return false;

      return true;
    });
  }, [currentUnit.words, searchQuery, searchScope, currentUnitMatches, allWordsMatches, selectedPos, statusFilter, progressMap, progressTick]);

  // Toggle favorite on word
  const handleToggleFavorite = (e: React.MouseEvent, wordId: string) => {
    e.stopPropagation();
    storage.toggleFavorite(wordId);
    soundManager.playCorrect(settings.soundEnabled);
    setProgressTick(prev => prev + 1);
  };

  // Toggle studied status (Manual tick marks word as read/studied, but NOT as mastered)
  const handleToggleStudied = (e: React.MouseEvent, wordId: string) => {
    e.stopPropagation();
    storage.toggleWordStudied(wordId);
    soundManager.playCorrect(settings.soundEnabled);
    setProgressTick(prev => prev + 1);
  };

  // Mark all visible as studied
  const handleMarkAllVisibleStudied = () => {
    for (const w of filteredWords) {
      storage.markWordStudied(w.id);
    }
    if (filteredWords.length >= currentUnit.words.length) {
      storage.saveLessonProgress(currentUnit.id, currentUnit.words.length, true);
    }
    soundManager.playCelebration(settings.soundEnabled);
    setProgressTick(prev => prev + 1);
  };


  // Part of speech color tags with bilingual labels
  const posBadge = (pos: PartOfSpeech) => {
    switch (pos) {
      case 'noun':
        return { label: 'noun (বিশেষ্য)', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80' };
      case 'verb':
        return { label: 'verb (ক্রিয়া)', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/80' };
      case 'adjective':
        return { label: 'adj (বিশেষণ)', color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200/80' };
      case 'adverb':
        return { label: 'adv (ক্রিয়া বিশেষণ)', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80' };
      default:
        return { label: pos, color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200' };
    }
  };

  // Short form part of speech label for minimal grid view (e.g. noun, verb, adj, adv)
  const getShortPosLabel = (pos: PartOfSpeech | string) => {
    const p = (pos || '').toLowerCase().trim();
    if (p.includes('adj')) return 'adj';
    if (p.includes('adv')) return 'adv';
    if (p.includes('verb') || p === 'v') return 'verb';
    if (p.includes('noun') || p === 'n') return 'noun';
    if (p.includes('prep')) return 'prep';
    if (p.includes('conj')) return 'conj';
    if (p.includes('pron')) return 'pron';
    return p;
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200 w-full">
      {/* TOP NAVIGATION & UNIT SELECTOR BAR - SINGLE ROW */}
      <div className="flex items-center justify-between gap-2 w-full">
        {onBackToUnits && (
          <button
            type="button"
            onClick={onBackToUnits}
            className="px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-emerald-50/60 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bangla font-semibold text-xs whitespace-nowrap">
              <span className="hidden sm:inline">সব </span>৫০টি ইউনিট রোডম্যাপ
            </span>
          </button>
        )}

        {/* Quick Unit Jump Switcher (Unit 1 to Unit 50) on right side */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <div className="relative">
            <select
              id="unit-jump-select"
              value={currentUnit.id}
              onChange={(e) => onSelectUnit && onSelectUnit(Number(e.target.value))}
              className="py-1.5 pl-3 pr-7 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs font-bangla appearance-none"
            >
              {allUnits.map((u) => (
                <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  ইউনিট {u.id}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Prev / Next Unit Arrow Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentUnit.id <= 1}
              onClick={() => onSelectUnit && onSelectUnit(currentUnit.id - 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-50 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors shadow-2xs"
              title="পূর্ববর্তী ইউনিট"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={currentUnit.id >= allUnits.length}
              onClick={() => onSelectUnit && onSelectUnit(currentUnit.id + 1)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-emerald-50 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors shadow-2xs"
              title="পরবর্তী ইউনিট"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MINIMAL WHITE THEME UNIT BANNER WITH GREENISH ACCENTS */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 p-4 sm:p-5 shadow-xs border border-emerald-100/90 dark:border-emerald-900/40 relative overflow-hidden">
        {/* Subtle decorative mesh blur */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bangla text-xs font-extrabold uppercase tracking-wider bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-2xs">
              ইউনিট {currentUnit.id} / {allUnits.length} · দিন {currentUnit.number}
            </span>
            <span className="text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-xl border border-teal-200/80 dark:border-teal-800 font-bangla">
              {currentUnit.words.length}টি গুরুত্বপূর্ণ শব্দ
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bangla">
              <span>ইউনিট অগ্রগতি: <strong className="text-slate-800 dark:text-slate-200">{unitStats.studied}</strong> / {unitStats.total} টি আয়ত্ত হয়েছে</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{unitStats.percent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200/70 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(3, unitStats.percent)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-2.5 sm:p-3 shadow-2xs space-y-2">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
          {/* Search Row: Search Input with 'সব পদ' Select directly on its right side in the same line */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="শব্দ বা বাংলা অর্থ খুঁজুন..."
                className="w-full pl-8.5 pr-7 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors font-bangla"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Part of Speech select: Directly on the right side of the search line */}
            <select
              value={selectedPos}
              onChange={(e) => setSelectedPos(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bangla shrink-0"
            >
              <option value="all">সব পদ</option>
              <option value="noun">বিশেষ্য (Noun)</option>
              <option value="verb">ক্রিয়া (Verb)</option>
              <option value="adjective">বিশেষণ (Adjective)</option>
              <option value="adverb">ক্রিয়া বিশেষণ (Adverb)</option>
            </select>
          </div>

          {/* Status filters with Bangla labels */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 shrink-0 overflow-x-auto no-scrollbar">
            {(['all', 'unstudied', 'studied', 'favorites', 'mastered'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setStatusFilter(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all font-bangla whitespace-nowrap ${
                  statusFilter === mode
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-white'
                }`}
              >
                {mode === 'all' && `সব (${currentUnit.words.length})`}
                {mode === 'unstudied' && 'নতুন'}
                {mode === 'studied' && 'পড়া হয়েছে'}
                {mode === 'favorites' && '★ প্রিয়'}
                {mode === 'mastered' && '✓ মুখস্থ'}
              </button>
            ))}
          </div>
        </div>

        {/* Search scope switcher & fuzzy indicator if search active */}
        {searchQuery.trim() && (
          <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bangla shrink-0">
              <button
                type="button"
                onClick={() => setSearchScope('current')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  searchScope === 'current'
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                এই ইউনিট ({currentUnitMatches.length})
              </button>
              <button
                type="button"
                onClick={() => setSearchScope('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  searchScope === 'all'
                    ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                সব ৫০টি ইউনিট ({allWordsMatches.length})
              </button>
            </div>

            {allWordsMatches.length > 0 && isFuzzyWordMatch(allWordsMatches[0], searchQuery) && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200/90 dark:border-amber-800/80 text-[11px] font-bangla text-amber-800 dark:text-amber-300 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>কাছাকাছি বানান: হয়তো খুঁজছেন </span>
                <span className="font-sans font-bold underline">{allWordsMatches[0].word}</span>
              </div>
            )}
          </div>
        )}

        {/* Compact bottom status if unstudied words remain */}
        {filteredWords.length > 0 && unitStats.studied < unitStats.total && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80 font-bangla">
            <span>প্রদর্শিত শব্দ: <strong className="text-slate-700 dark:text-slate-300 font-sans">{filteredWords.length}</strong>টি</span>
            <button
              type="button"
              onClick={handleMarkAllVisibleStudied}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Mark all as read</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW MODE TOGGLE (MATCHING HOME PAGE) */}
      <div className="flex items-center justify-between gap-2.5 font-bangla">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-2xs w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleSetViewLayout('grid')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewLayout === 'grid'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="কমপ্যাক্ট গ্রিড ভিউ (শুধু ইংরেজি ও বাংলা শব্দ)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="font-bangla text-xs">গ্রিড ভিউ</span>
          </button>
          <button
            type="button"
            onClick={() => handleSetViewLayout('detailed')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              viewLayout === 'detailed'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            title="বিস্তারিত কার্ড ভিউ (উদাহরণ ও বাক্যসহ)"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span className="font-bangla text-xs">বিস্তারিত</span>
          </button>
        </div>
      </div>

      {/* ZERO RESULTS EMPTY STATE */}
      {filteredWords.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4 font-bangla">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">
              {searchScope === 'current' && searchQuery.trim()
                ? `বর্তমান ইউনিট ${currentUnit.id}-এ কোনো ফলাফল পাওয়া যায়নি`
                : 'কোনো শব্দ পাওয়া যায়নি'}
            </h3>
            {searchScope === 'current' && searchQuery.trim() && allWordsMatches.length > 0 ? (
              <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 font-semibold max-w-md mx-auto">
                তবে অন্যান্য ইউনিটে এই শব্দের <strong className="font-bold underline">{allWordsMatches.length}টি</strong> ফলাফল পাওয়া গেছে!
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                অনুগ্রহ করে সার্চ বা ফিল্টারের মান পরিবর্তন করে আবার চেষ্টা করুন।
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {searchScope === 'current' && searchQuery.trim() && allWordsMatches.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchScope('all')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>সব ৫০টি ইউনিটে ফলাফল দেখুন ({allWordsMatches.length}টি)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedPos('all'); setStatusFilter('all'); setSearchScope('current'); }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              সার্চ ও ফিল্টার রিসেট করুন
            </button>
          </div>
        </div>
      )}

      {/* VIEW SWITCHER: DETAILED VIEW VS MINIMAL WORD GRID */}
      {viewLayout === 'detailed' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {filteredWords.map((word, idx) => {
            const p = progressMap[word.id];
            const isQuizMastered = storage.isWordMastered(p);
            const isStudied = storage.isWordStudied(p);
            const isFavorite = !!p?.isFavorite;
            const badgeInfo = posBadge(word.partOfSpeech);

            return (
              <div
                key={word.id}
                onClick={() => onOpenWordDetail && onOpenWordDetail(word, searchScope === 'all' ? filteredWords : currentUnit.words)}
                className={`group rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md relative flex flex-col justify-between h-full shadow-2xs ${
                  isQuizMastered
                    ? 'border-amber-300 dark:border-amber-600/70 bg-gradient-to-b from-amber-50/25 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 ring-1 ring-amber-300/40 dark:ring-amber-700/40'
                    : isStudied
                    ? 'border-emerald-200/80 dark:border-emerald-900/60 bg-white dark:bg-slate-900'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div className="flex-1 flex flex-col">
                  {/* Top Header: #1, Word, Speaker Icon on left; Star & Grid-style Tick button on right */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className={`text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-md shrink-0 select-none ${
                        isQuizMastered
                          ? 'text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/70'
                          : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800'
                      }`}>
                        #{idx + 1}
                      </span>
                      {word.unitId !== currentUnit.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectUnit && onSelectUnit(word.unitId);
                            setSearchScope('current');
                          }}
                          className="text-[10px] font-bangla font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title={`ইউনিট ${word.unitId}-এ যান`}
                        >
                          ইউনিট {word.unitId} →
                        </button>
                      )}
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors break-words">
                        {word.word}
                      </h3>
                      {searchQuery.trim() && isFuzzyWordMatch(word, searchQuery) && (
                        <span className="text-[10px] font-bangla font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 shrink-0">
                          কাছাকাছি বানান
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.speakWord(word.word, 0.9);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-emerald-400 transition-colors cursor-pointer rounded-md shrink-0"
                        title={`উচ্চারণ শুনুন: ${word.word}`}
                      >
                        <Volume2 className="w-4 h-4 stroke-[1.8]" />
                      </button>
                    </div>

                    {/* Quick Action Buttons: Matching Grid View Tick & Star */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, word.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isFavorite
                            ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50'
                            : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={isFavorite ? 'প্রিয় তালিকা থেকে বাদ দিন' : 'প্রিয় তালিকায় যোগ করুন'}
                      >
                        <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>

                      {/* Tick Button matching Grid View style */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleStudied(e, word.id)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          isQuizMastered
                            ? 'text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 ring-1 ring-amber-400 dark:ring-amber-500 shadow-xs'
                            : isStudied
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-300 dark:ring-emerald-800'
                            : 'text-slate-300 dark:text-slate-600 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={
                          isQuizMastered
                            ? 'কুইজে সঠিক উত্তর দিয়ে মুখস্থ সম্পন্ন হয়েছে'
                            : isStudied
                            ? 'পড়া সম্পন্ন হয়েছে'
                            : 'পড়া হয়েছে হিসেবে চিহ্নিত করুন'
                        }
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Subtitle: Pronunciation (Muted) · Part of Speech (Uppercase, compact) */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] sm:text-xs font-medium">
                      {word.pronunciation}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 font-bold mx-0.5 text-[10px]">·</span>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold tracking-wider text-[10px] uppercase">
                      {word.partOfSpeech}
                    </span>
                  </div>

                  {/* Bengali Meaning: Proportionate & clear */}
                  <div className="font-bangla font-bold text-base sm:text-lg text-[#064e3b] dark:text-emerald-300 leading-snug tracking-tight mt-1 mb-1.5">
                    {word.banglaMeaning}
                  </div>

                  {/* Example Sentence Box: Minimal, compact padding and tight line gaps, without emoji */}
                  {word.examples && word.examples[0] && (
                    <div className="rounded-xl bg-[#f8fafc] dark:bg-slate-800/40 px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-100 dark:border-slate-800/60 my-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-slate-800 dark:text-slate-100 text-xs sm:text-[13px] leading-snug">
                          “{word.examples[0].english}”
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            soundManager.speakWord(word.examples[0].english, 0.85);
                          }}
                          className="text-slate-400 hover:text-emerald-600 dark:text-slate-500 dark:hover:text-emerald-400 p-0.5 rounded shrink-0 transition-colors cursor-pointer"
                          title="বাক্যটি শুনুন"
                        >
                          <Volume2 className="w-3.5 h-3.5 stroke-[1.8]" />
                        </button>
                      </div>
                      {word.examples[0].bangla && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-bangla leading-snug">
                          {word.examples[0].bangla}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Synonyms & Antonyms - Compact & minimal */}
                  {(word.synonyms?.length > 0 || word.antonyms?.length > 0) && (
                    <div className="mt-2 pt-0.5 space-y-1 text-xs font-bangla">
                      {word.synonyms && word.synonyms.length > 0 && (
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                            সমার্থক:
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            {word.synonyms.slice(0, 4).join(', ')}
                          </span>
                        </div>
                      )}

                      {word.antonyms && word.antonyms.length > 0 && (
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                            বিপরীত:
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {word.antonyms.slice(0, 4).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Unit Number on left, compact 'বিস্তারিত দেখুন ->' on right */}
                <div className="mt-3.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span className="font-medium text-[11px] text-slate-400 dark:text-slate-500">
                    Unit {word.unitId} · #{idx + 1}{isQuizMastered ? ' · মুখস্থ' : ''}
                  </span>

                  <button
                    type="button"
                    onClick={() => onOpenWordDetail && onOpenWordDetail(word, searchScope === 'all' ? filteredWords : currentUnit.words)}
                    className="text-[#00875a] dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-bold text-xs flex items-center gap-1 font-bangla cursor-pointer group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>বিস্তারিত দেখুন</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MINIMAL WORD GRID VIEW FOR EASY MEMORIZATION (ENGLISH & BANGLA MEANING) */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 items-stretch">
          {filteredWords.map((word, idx) => {
            const p = progressMap[word.id];
            const isQuizMastered = storage.isWordMastered(p);
            const isStudied = storage.isWordStudied(p);
            const isFavorite = !!p?.isFavorite;
            const badgeInfo = posBadge(word.partOfSpeech);

            return (
              <div
                key={word.id}
                onClick={() => onOpenWordDetail && onOpenWordDetail(word, searchScope === 'all' ? filteredWords : currentUnit.words)}
                className={`group rounded-2xl border p-3 sm:p-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md relative flex flex-col justify-between ${
                  isQuizMastered
                    ? 'border-amber-300 dark:border-amber-700/80 bg-gradient-to-br from-amber-50/45 via-amber-50/20 to-white dark:from-amber-950/25 dark:via-slate-900 dark:to-slate-900 ring-1 ring-amber-300/40 dark:ring-amber-700/40 shadow-xs'
                    : isStudied
                    ? 'border-teal-200 dark:border-teal-900/60 bg-teal-50/10 dark:bg-teal-950/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <div>
                  {/* Top: index & short POS on left, star and tick button on right */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        isQuizMastered
                          ? 'text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300/60'
                          : 'text-slate-400 bg-slate-100 dark:bg-slate-800'
                      }`}>
                        #{idx + 1}
                      </span>
                      {word.unitId !== currentUnit.id && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectUnit && onSelectUnit(word.unitId);
                            setSearchScope('current');
                          }}
                          className="text-[9px] font-bangla font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
                          title={`ইউনিট ${word.unitId}-এ যান`}
                        >
                          ইউনিট {word.unitId}
                        </button>
                      )}
                      <span className={`text-[10px] font-semibold lowercase px-1.5 py-0.5 rounded border ${badgeInfo.color}`}>
                        {getShortPosLabel(word.partOfSpeech)}
                      </span>
                      {searchQuery.trim() && isFuzzyWordMatch(word, searchQuery) && (
                        <span className="text-[9px] font-bangla font-semibold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 shrink-0">
                          কাছাকাছি বানান
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, word.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50' : 'text-slate-300 hover:text-amber-500'
                        }`}
                        title={isFavorite ? 'প্রিয় তালিকা থেকে বাদ দিন' : 'প্রিয় তালিকায় যোগ করুন'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-500' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleToggleStudied(e, word.id)}
                        className={`p-1 rounded-lg transition-all cursor-pointer ${
                          isQuizMastered
                            ? 'text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 ring-1 ring-amber-400 dark:ring-amber-500 shadow-xs'
                            : isStudied
                            ? 'text-teal-700 bg-teal-50 dark:bg-teal-950/50'
                            : 'text-slate-300 hover:text-teal-600'
                        }`}
                        title={
                          isQuizMastered
                            ? 'কুইজে সঠিক উত্তর দিয়ে মুখস্থ সম্পন্ন হয়েছে'
                            : isStudied
                            ? 'পড়া সম্পন্ন হয়েছে'
                            : 'পড়া হয়েছে হিসেবে চিহ্নিত করুন'
                        }
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* English Word (Without pronunciation & without audio button) */}
                  <div className="mt-1">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug break-words">
                      {word.word}
                    </h3>
                  </div>

                  {/* Bangla Meaning for fast memorization */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <p className="font-bangla text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 leading-snug line-clamp-2">
                      {word.banglaMeaning}
                    </p>
                  </div>
                </div>

                {/* Bottom Card Footer: Status & Detail link */}
                <div className="mt-3 pt-2 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bangla text-slate-400">
                  {isQuizMastered ? (
                    <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-amber-600 fill-amber-500/30" /> মুখস্থ
                    </span>
                  ) : isStudied ? (
                    <span className="font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> পড়া হয়েছে
                    </span>
                  ) : (
                    <span className="text-slate-400">নতুন শব্দ</span>
                  )}
                  <span className={`font-semibold group-hover:underline flex items-center gap-0.5 ${
                    isQuizMastered
                      ? 'text-amber-800 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    বিস্তারিত <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Star, 
  Grid, 
  List, 
  Check, 
  Sparkles, 
  Volume2, 
  BookOpen, 
  X,
  ArrowRight
} from 'lucide-react';
import { VocabWord, PartOfSpeech, WordDifficulty } from '../data/types';
import { getAllWords, getAllUnits } from '../data/units';
import { storage } from '../utils/storage';
import { getWordSearchScore, isFuzzyWordMatch } from '../utils/searchUtils';
import { AudioButton } from './AudioButton';

interface ArchiveViewProps {
  onOpenWordDetail: (word: VocabWord, wordList: VocabWord[]) => void;
  onNavigateToFlashcards?: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  onOpenWordDetail,
  onNavigateToFlashcards,
}) => {
  const allUnits = getAllUnits();
  const allWords = useMemo(() => getAllWords(), []);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<number>(0);
  const [selectedPos, setSelectedPos] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'studied' | 'unseen' | 'difficult' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState<'az' | 'za' | 'difficulty'>('az');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [updateTick, setUpdateTick] = useState(0);

  const filteredWords = useMemo(() => {
    const progress = storage.getProgress();
    const q = searchQuery.trim().toLowerCase();

    return allWords.filter(w => {
      if (selectedUnit !== 0 && w.unitId !== selectedUnit) return false;
      if (selectedPos !== 'all' && w.partOfSpeech !== selectedPos) return false;
      if (selectedDifficulty !== 'all' && w.difficulty !== selectedDifficulty) return false;

      const p = progress[w.id];
      if (selectedStatus === 'favorites' && !p?.isFavorite) return false;
      if (selectedStatus === 'studied' && (!p || p.status === 'unseen')) return false;
      if (selectedStatus === 'unseen' && p && p.status !== 'unseen') return false;
      if (selectedStatus === 'difficult' && !p?.needsPractice) return false;

      if (q) {
        const score = getWordSearchScore(w, q);
        if (score === 0) return false;
      }

      return true;
    }).sort((a, b) => {
      if (q) {
        const scoreA = getWordSearchScore(a, q);
        const scoreB = getWordSearchScore(b, q);
        if (scoreB !== scoreA) return scoreB - scoreA;
      }

      if (sortBy === 'az') return a.word.localeCompare(b.word);
      if (sortBy === 'za') return b.word.localeCompare(a.word);
      if (sortBy === 'difficulty') {
        const weights = { beginner: 1, intermediate: 2, advanced: 3 };
        return weights[a.difficulty] - weights[b.difficulty];
      }
      return 0;
    });
  }, [allWords, searchQuery, selectedUnit, selectedPos, selectedDifficulty, selectedStatus, sortBy, updateTick]);

  const handleToggleFav = (e: React.MouseEvent, wordId: string) => {
    e.stopPropagation();
    storage.toggleFavorite(wordId);
    setUpdateTick(prev => prev + 1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedUnit(0);
    setSelectedPos('all');
    setSelectedDifficulty('all');
    setSelectedStatus('all');
    setSortBy('az');
  };

  const hasActiveFilters = searchQuery || selectedUnit !== 0 || selectedPos !== 'all' || selectedDifficulty !== 'all' || selectedStatus !== 'all';

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Top Search & Filter Bar */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4 shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight font-bangla">
              শব্দভাণ্ডার অনুসন্ধান ও ফিল্টার
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-sans">
              ১,৮৫০+ শব্দ
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-bangla">
            ৫০টি ইউনিটের সমস্ত ১,৮৫০টি ইংরেজি শব্দ ও বাংলা অর্থ একসাথে অনুসন্ধান করুন
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ইংরেজি শব্দ বা বাংলা অর্থ দিয়ে খুঁজুন..."
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bangla"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter dropdowns and toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Unit */}
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnit(Number(e.target.value))}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bangla"
            >
              <option value={0}>সব ৫০টি ইউনিট ({allWords.length} শব্দ)</option>
              {allUnits.map(u => (
                <option key={u.id} value={u.id}>ইউনিট {u.id} ({u.words.length} শব্দ)</option>
              ))}
            </select>

            {/* Part of Speech */}
            <select
              value={selectedPos}
              onChange={e => setSelectedPos(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bangla"
            >
              <option value="all">সব পদ</option>
              <option value="noun">বিশেষ্য (Noun)</option>
              <option value="verb">ক্রিয়া (Verb)</option>
              <option value="adjective">বিশেষণ (Adjective)</option>
              <option value="adverb">ক্রিয়া বিশেষণ (Adverb)</option>
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bangla"
            >
              <option value="all">সব লেভেল</option>
              <option value="beginner">সহজ</option>
              <option value="intermediate">মধ্যম</option>
              <option value="advanced">উচ্চতর</option>
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bangla"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="favorites">★ প্রিয় শব্দ</option>
              <option value="studied">✓ পড়া হয়েছে</option>
              <option value="unseen">নতুন শব্দ</option>
              <option value="difficult">ভুল শব্দ</option>
            </select>
          </div>

          {/* Right controls: Sorting & View mode */}
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bangla"
            >
              <option value="az">ক্রমানুসারে: A থেকে Z</option>
              <option value="za">ক্রমানুসারে: Z থেকে A</option>
              <option value="difficulty">কঠিনতা অনুসারে</option>
            </select>

            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="গ্রিড ভিউ"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="তালিকা ভিউ"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1 border-t border-slate-100 dark:border-slate-800 font-bangla">
          <span>
            প্রদর্শিত হচ্ছে <strong className="text-slate-800 dark:text-white font-sans">{filteredWords.length}</strong> / {allWords.length} টি শব্দ
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-emerald-700 hover:underline cursor-pointer font-bold"
            >
              ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      </div>

      {/* Words Content Area */}
      {filteredWords.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-sm font-bangla">
          <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">কোনো শব্দ পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            অনুগ্রহ করে সার্চ বা ফিল্টারের মান পরিবর্তন করে আবার চেষ্টা করুন।
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700"
          >
            ফিল্টার রিসেট করুন
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW: MINIMAL WHITE CARDS WITH GREEN ACCENTS */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {filteredWords.map(word => {
            const progress = storage.getWordProgress(word.id);
            const isStudied = progress.status !== 'unseen' || progress.reviewCount > 0;
            const isMastered = progress.status === 'mastered';

            return (
              <div
                key={word.id}
                onClick={() => onOpenWordDetail(word, filteredWords)}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer relative h-full"
              >
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                        Unit {word.unitId}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{word.partOfSpeech}</span>
                      {isMastered && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-bold font-bangla">মুখস্থ</span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleToggleFav(e, word.id)}
                      aria-label="Star word"
                      className="p-1 rounded-md text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          progress.isFavorite ? 'fill-amber-500 text-amber-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                          {word.word}
                        </h3>
                        {searchQuery.trim() && isFuzzyWordMatch(word, searchQuery) && (
                          <span className="text-[10px] font-bangla font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80">
                            কাছাকাছি বানান
                          </span>
                        )}
                      </div>
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <AudioButton word={word.word} size="sm" />
                      </div>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {word.pronunciation}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 min-h-[72px] flex flex-col justify-center">
                    <p className="font-bangla text-base font-bold text-emerald-950 dark:text-emerald-200 leading-snug">
                      {word.banglaMeaning}
                    </p>
                  </div>

                  {word.examples[0] && (
                    <div className="min-h-[50px] flex flex-col justify-center">
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium line-clamp-2 italic">
                        "{word.examples[0].english}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400 font-mono capitalize text-[11px]">{word.difficulty}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-bangla">
                    বিস্তারিত দেখুন <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
          {filteredWords.map(word => {
            const progress = storage.getWordProgress(word.id);
            const isStudied = progress.status !== 'unseen';

            return (
              <div
                key={word.id}
                onClick={() => onOpenWordDetail(word, filteredWords)}
                className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleFav(e, word.id)}
                    className="p-1 text-slate-300 hover:text-amber-500 shrink-0 cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        progress.isFavorite ? 'fill-amber-500 text-amber-500' : ''
                      }`}
                    />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                        {word.word}
                      </h4>
                      {searchQuery.trim() && isFuzzyWordMatch(word, searchQuery) && (
                        <span className="text-[9px] font-bangla font-semibold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80">
                          কাছাকাছি বানান
                        </span>
                      )}
                      <AudioButton word={word.word} size="sm" />
                      <span className="hidden sm:inline text-xs font-mono text-slate-400">
                        {word.pronunciation}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-0.5">
                      <span className="capitalize">{word.partOfSpeech}</span>
                      <span>·</span>
                      <span>Unit {word.unitId}</span>
                      {isStudied && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-bold font-bangla">পড়া হয়েছে</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bangla text-base font-bold text-emerald-900 dark:text-emerald-200">
                    {word.banglaMeaning}
                  </p>
                  <span className="text-[11px] font-mono text-slate-400 capitalize">{word.difficulty}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

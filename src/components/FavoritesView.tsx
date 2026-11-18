import React, { useMemo, useState, useEffect } from 'react';
import { Star, Layers, ArrowRight, LayoutGrid, LayoutList } from 'lucide-react';
import { VocabWord } from '../data/types';
import { getAllWords } from '../data/units';
import { storage } from '../utils/storage';
import { haptics } from '../utils/haptics';
import { AudioButton } from './AudioButton';

interface FavoritesViewProps {
  onOpenWordDetail: (word: VocabWord, list?: VocabWord[]) => void;
  onStartFlashcards: (filter: 'favorites') => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onOpenWordDetail,
  onStartFlashcards,
}) => {
  const allWords = getAllWords();
  const [progressTick, setProgressTick] = useState(0);
  const progress = storage.getProgress();

  const [viewLayout, setViewLayout] = useState<'detailed' | 'grid'>(() => {
    try {
      const saved = localStorage.getItem('bonolota_favorites_view_mode');
      return saved === 'grid' ? 'grid' : 'detailed';
    } catch {
      return 'detailed';
    }
  });

  useEffect(() => {
    const handleSync = () => setProgressTick(t => t + 1);
    window.addEventListener('bonolota_progress_updated', handleSync);
    return () => window.removeEventListener('bonolota_progress_updated', handleSync);
  }, []);

  const handleSetViewLayout = (mode: 'detailed' | 'grid') => {
    haptics.tap();
    setViewLayout(mode);
    try {
      localStorage.setItem('bonolota_favorites_view_mode', mode);
    } catch {
      // ignore storage errors
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, wordId: string) => {
    e.stopPropagation();
    haptics.toggle();
    storage.toggleFavorite(wordId);
    setProgressTick(t => t + 1);
  };

  const favoriteWords = useMemo(() => {
    return allWords.filter(w => progress[w.id]?.isFavorite);
  }, [allWords, progress, progressTick]);

  return (
    <div className="space-y-5 sm:space-y-6 select-none animate-in fade-in duration-200">
      {/* Top Banner with Greenish & Amber Accent */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-50/80 via-emerald-50/40 to-white dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 border border-amber-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 text-xs font-bold font-bangla">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>সংরক্ষিত বুকমার্ক তালিকা (Saved Words)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight font-bangla">
            প্রিয় শব্দসমূহ ({favoriteWords.length}টি শব্দ)
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 font-bangla">
            দ্রুত রিভিশন ও অনুশীলনের জন্য আপনার বুকমার্ক করা বিশেষ শব্দাবলি।
          </p>
        </div>

        {favoriteWords.length > 0 && (
          <button
            type="button"
            onClick={() => onStartFlashcards('favorites')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/25 transition-all font-bangla self-start sm:self-auto shrink-0"
          >
            <Layers className="w-4 h-4" />
            <span>ফ্ল্যাশ কার্ড অনুশীলন</span>
          </button>
        )}
      </div>

      {favoriteWords.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-sm font-bangla">
          <Star className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            কোনো প্রিয় শব্দ সংরক্ষিত নেই
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
            শব্দ গ্রিড বা শব্দভাণ্ডারে যেকোনো শব্দের স্টার (★) আইকনে ক্লিক করে এখানে বুকমার্ক করুন।
          </p>
        </div>
      ) : (
        <>
          {/* View Mode Switcher (Grid View vs Detailed View) */}
          <div className="flex items-center justify-between gap-2.5 font-bangla">
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
                title="বিস্তারিত কার্ড ভিউ"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="font-bangla text-xs">বিস্তারিত</span>
              </button>
            </div>
          </div>

          {viewLayout === 'grid' ? (
            /* COMPACT GRID VIEW FOR QUICK MEMORIZATION */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 items-stretch">
              {favoriteWords.map((word, idx) => (
                <div
                  key={word.id}
                  onClick={() => onOpenWordDetail(word, favoriteWords)}
                  className="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 hover:border-emerald-300 dark:hover:border-emerald-700 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded text-slate-400 bg-slate-100 dark:bg-slate-800">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/80 dark:border-emerald-800/60 px-1.5 py-0.5 rounded">
                          Unit {word.unitId}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, word.id)}
                        className="p-1 rounded-lg text-amber-500 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors cursor-pointer shrink-0"
                        title="প্রিয় তালিকা থেকে বাদ দিন"
                        aria-label="প্রিয় তালিকা থেকে বাদ দিন"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500" />
                      </button>
                    </div>

                    <div className="mt-1">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug break-words">
                        {word.word}
                      </h3>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <p className="font-bangla text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 leading-snug line-clamp-2">
                        {word.banglaMeaning}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bangla text-slate-400">
                    <span className="capitalize font-sans">{word.partOfSpeech}</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
                      বিস্তারিত <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* DETAILED CARD VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteWords.map(word => (
                <div
                  key={word.id}
                  onClick={() => onOpenWordDetail(word, favoriteWords)}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer relative"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded shrink-0">
                          Unit {word.unitId}
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">{word.word}</h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, word.id)}
                          className="p-1.5 rounded-lg text-amber-500 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors cursor-pointer"
                          title="প্রিয় তালিকা থেকে বাদ দিন"
                          aria-label="প্রিয় তালিকা থেকে বাদ দিন"
                        >
                          <Star className="w-4 h-4 fill-amber-500" />
                        </button>
                        <AudioButton word={word.word} size="sm" />
                      </div>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-1">{word.pronunciation}</p>

                    <div className="mt-3 p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50">
                      <p className="font-bangla text-base font-bold text-emerald-950 dark:text-emerald-200 leading-snug">
                        {word.banglaMeaning}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium font-bangla">
                    <span className="capitalize">{word.partOfSpeech}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                      বিস্তারিত দেখুন <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

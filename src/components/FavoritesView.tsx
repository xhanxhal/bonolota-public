import React, { useMemo } from 'react';
import { Star, Layers, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { VocabWord } from '../data/types';
import { getAllWords } from '../data/units';
import { storage } from '../utils/storage';
import { AudioButton } from './AudioButton';

interface FavoritesViewProps {
  onOpenWordDetail: (word: VocabWord) => void;
  onStartFlashcards: (filter: 'favorites') => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  onOpenWordDetail,
  onStartFlashcards,
}) => {
  const allWords = getAllWords();
  const progress = storage.getProgress();

  const favoriteWords = useMemo(() => {
    return allWords.filter(w => progress[w.id]?.isFavorite);
  }, [allWords, progress]);

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
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
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/25 transition-all font-bangla"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteWords.map(word => (
            <div
              key={word.id}
              onClick={() => onOpenWordDetail(word)}
              className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer relative"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      Unit {word.unitId}
                    </span>
                    <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">{word.word}</h4>
                  </div>
                  <AudioButton word={word.word} size="sm" />
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
    </div>
  );
};

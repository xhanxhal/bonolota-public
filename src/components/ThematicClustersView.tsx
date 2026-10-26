import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  Layers, 
  Scale, 
  Landmark, 
  Coins, 
  Heart, 
  Brain, 
  Users,
  BookOpen,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { VocabWord } from '../data/types';
import { getAllWords } from '../data/units';
import { getWordEnrichment, THEMATIC_CATEGORIES } from '../data/wordEnrichments';
import { AudioButton } from './AudioButton';

interface ThematicClustersViewProps {
  onOpenWordDetail: (word: VocabWord) => void;
  onBackToHome?: () => void;
}

export const ThematicClustersView: React.FC<ThematicClustersViewProps> = ({
  onOpenWordDetail,
  onBackToHome,
}) => {
  const allWords = useMemo(() => getAllWords(), []);
  const [selectedTheme, setSelectedTheme] = useState<string>('Crime, Court & Law');
  const [searchQuery, setSearchQuery] = useState('');

  // Group words by their thematic category
  const themeWords = useMemo(() => {
    return allWords.filter(w => {
      const enrichment = getWordEnrichment(w);
      const matchesCategory = selectedTheme === 'all' || enrichment.thematicCategory === selectedTheme;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        w.word.toLowerCase().includes(q) ||
        w.banglaMeaning.includes(q) ||
        (enrichment.banglaIdiom && enrichment.banglaIdiom.idiom.includes(q))
      );
    });
  }, [allWords, selectedTheme, searchQuery]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 font-bangla animate-in fade-in duration-200">
      {/* Top Banner - Minimal Homepage Style */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 p-5 sm:p-6 shadow-xs border border-emerald-100/90 dark:border-emerald-900/40 text-slate-900 dark:text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>হোম</span>
                </button>
              )}
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200/80 dark:border-emerald-800/80">
                বিষয়ভিত্তিক ম্যাপিং
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              বিষয়ভিত্তিক থিমেটিক ক্লাস্টার
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
              বাস্তব জীবনের ক্ষেত্র (যেমন: আইন, অর্থনীতি, বিজ্ঞান, মেজাজ) অনুযায়ী সম্পর্কিত শব্দ শিখুন।
            </p>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {THEMATIC_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
          const isSelected = selectedTheme === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedTheme(cat.id);
                setSearchQuery('');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300'
              }`}
            >
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input within Theme */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={`"${selectedTheme}" বিষয়ের মধ্যে শব্দ খুঁজুন...`}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-500 shadow-2xs"
        />
      </div>

      {/* Words Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 font-bold">
          <span>মোট শব্দ সংখ্যা: {themeWords.length} টি</span>
          <span>কার্ডে ক্লিক করে বিস্তারিত দেখুন</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {themeWords.map(word => {
            const enrichment = getWordEnrichment(word);

            return (
              <div
                key={word.id}
                onClick={() => onOpenWordDetail(word)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs hover:shadow-md transition-all cursor-pointer group space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-sans font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {word.word}
                      </h4>
                      <AudioButton word={word.word} size="sm" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {word.pronunciation}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                    {word.partOfSpeech}
                  </span>
                </div>

                {/* Meaning */}
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                  {word.banglaMeaning}
                </p>

                {/* Bangla Idiom / Colloquial Equivalence if present */}
                {enrichment.banglaIdiom && (
                  <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold">উপমা: </span>
                    "{enrichment.banglaIdiom.idiom}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

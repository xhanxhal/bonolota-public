import React, { useState } from 'react';
import { 
  RotateCw, 
  AlertTriangle, 
  Check, 
  Sparkles, 
  Layers, 
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { VocabWord } from '../data/types';
import { getAllWords } from '../data/units';
import { storage } from '../utils/storage';
import { AudioButton } from './AudioButton';

interface RevisionViewProps {
  onStartFlashcardDrill: (wordIds: string[]) => void;
  onOpenWordDetail: (word: VocabWord) => void;
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  onStartFlashcardDrill,
  onOpenWordDetail,
}) => {
  const allWords = getAllWords();
  const progress = storage.getProgress();

  const level1Words = allWords.filter(w => progress[w.id]?.repetitionLevel === 1 || progress[w.id]?.needsPractice);
  const level2Words = allWords.filter(w => progress[w.id]?.repetitionLevel === 2 && !progress[w.id]?.needsPractice);
  const level3Words = allWords.filter(w => progress[w.id]?.repetitionLevel === 3);
  const level4Words = allWords.filter(w => progress[w.id]?.repetitionLevel === 4);

  const dueWordIds = storage.getRevisionWordIds();
  const dueWords = allWords.filter(w => dueWordIds.includes(w.id));

  const [activeTab, setActiveTab] = useState<'due' | 'mistakes' | 'levels'>('due');

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Top Banner with Clean Rose/Emerald Minimal Aesthetic */}
      <div className="rounded-3xl bg-gradient-to-br from-rose-50/80 via-emerald-50/40 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/70 dark:bg-rose-950/70 text-rose-900 dark:text-rose-300 text-xs font-bold font-bangla">
            <RotateCw className="w-3.5 h-3.5 text-rose-600" />
            <span>স্পেসড রিপিটেশন রিভিশন (Spaced Repetition)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight font-bangla">
            ভুল শব্দ সংশোধন ও পুনরাবৃত্তি (Fix Your Mistakes)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 font-bangla">
            কঠিন ও ভুল হওয়া শব্দগুলো নিয়মিত অনুশীলনের মাধ্যমে দীর্ঘস্থায়ী স্মৃতিতে পরিণত করুন।
          </p>
        </div>

        {dueWords.length > 0 && (
          <button
            type="button"
            onClick={() => onStartFlashcardDrill(dueWordIds)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/25 transition-all font-bangla"
          >
            <Layers className="w-4 h-4" />
            <span>আজকের রিভিশন ({dueWords.length})</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-fit font-bangla">
        <button
          type="button"
          onClick={() => setActiveTab('due')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'due'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700'
          }`}
        >
          আজকের রিভিশন ({dueWords.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mistakes')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'mistakes'
              ? 'bg-white dark:bg-slate-900 text-rose-800 dark:text-rose-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-rose-700'
          }`}
        >
          ভুল শব্দসমূহ ({level1Words.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('levels')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'levels'
              ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700'
          }`}
        >
          স্মরণ দক্ষতার মাত্রা (Retention)
        </button>
      </div>

      {/* TAB CONTENT: DAILY DUE */}
      {activeTab === 'due' && (
        <div className="space-y-4">
          {dueWords.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-sm font-bangla">
              <Check className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                আজকের কোনো শব্দ বাকি নেই!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
                এই মুহূর্তে রিভিশনের জন্য নির্ধারিত কোনো শব্দ নেই। নতুন ইউনিট শুরু করুন!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 font-bangla">
                <span>{dueWords.length}টি শব্দ পুনরাবৃত্তির অপেক্ষায় রয়েছে</span>
                <button
                  type="button"
                  onClick={() => onStartFlashcardDrill(dueWordIds)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span>সবগুলো প্র্যাকটিস করুন</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dueWords.map(word => {
                  const p = storage.getWordProgress(word.id);
                  return (
                    <div
                      key={word.id}
                      onClick={() => onOpenWordDetail(word)}
                      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer relative"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">{word.word}</h4>
                          <AudioButton word={word.word} size="sm" />
                        </div>
                        <p className="font-bangla text-base font-bold text-emerald-950 dark:text-emerald-200 mt-2">
                          {word.banglaMeaning}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium font-bangla">
                        <span>লেভেল {p.repetitionLevel}</span>
                        <span>{p.incorrectCount} বার ভুল</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: REVIEW MISTAKES */}
      {activeTab === 'mistakes' && (
        <div className="space-y-4">
          {level1Words.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-4 shadow-sm font-bangla">
              <Sparkles className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                কোনো ভুল শব্দ চিহ্নিত নেই!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-sm mx-auto">
                আপনি সব শব্দ নিখুঁতভাবে আয়ত্ত করেছেন। দারুণ কাজ!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-rose-700 font-bangla">
                <span>{level1Words.length}টি শব্দ অনুশীলনের প্রয়োজন</span>
                <button
                  type="button"
                  onClick={() => onStartFlashcardDrill(level1Words.map(w => w.id))}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-rose-700 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  <span>ভুলগুলো পরিষ্কার করুন</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {level1Words.map(word => {
                  const p = storage.getWordProgress(word.id);
                  return (
                    <div
                      key={word.id}
                      onClick={() => onOpenWordDetail(word)}
                      className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between hover:border-rose-400 hover:shadow-md transition-all cursor-pointer relative"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">{word.word}</h4>
                          <AudioButton word={word.word} size="sm" />
                        </div>
                        <p className="font-bangla text-base font-bold text-rose-900 dark:text-rose-300 mt-2">
                          {word.banglaMeaning}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-rose-600 font-medium font-bangla">
                        <span>Unit {word.unitId}</span>
                        <span>{p.incorrectCount} বার ভুল হয়েছে</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: RETENTION LEVELS */}
      {activeTab === 'levels' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-bangla">
          {[
            { level: 1, title: 'লেভেল ১ (প্রাথমিক)', count: level1Words.length, color: 'border-rose-200 bg-rose-50/50 text-rose-800', desc: 'ভুল বা নতুন শব্দ' },
            { level: 2, title: 'লেভেল ২ (শেখার পর্যায়ে)', count: level2Words.length, color: 'border-amber-200 bg-amber-50/50 text-amber-800', desc: '১ বার সফল রিভিশন' },
            { level: 3, title: 'লেভেল ৩ (আয়ত্তের কাছাকাছি)', count: level3Words.length, color: 'border-teal-200 bg-teal-50/50 text-teal-800', desc: '২-৩ বার সফল রিভিশন' },
            { level: 4, title: 'লেভেল ৪ (স্থায়ী স্মৃতি)', count: level4Words.length, color: 'border-emerald-200 bg-emerald-50/50 text-emerald-800', desc: 'সম্পূর্ণ মুখস্থ ও পরীক্ষিত' },
          ].map(lvl => (
            <div key={lvl.level} className={`p-5 rounded-2xl border ${lvl.color} bg-white dark:bg-slate-900 space-y-2 shadow-2xs`}>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{lvl.title}</h4>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans">{lvl.count}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{lvl.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

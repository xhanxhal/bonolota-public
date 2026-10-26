import React, { useEffect, useState } from 'react';
import { 
  X, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  Edit3,
  Check,
  Share2,
  Gauge
} from 'lucide-react';
import { VocabWord, ExampleSentence } from '../data/types';
import { AudioButton } from './AudioButton';
import { storage } from '../utils/storage';
import { getWordEnrichment } from '../data/wordEnrichments';
import { haptics } from '../utils/haptics';

interface WordDetailModalProps {
  word: VocabWord | null;
  allWords?: VocabWord[];
  onClose: () => void;
  onSelectWord?: (word: VocabWord) => void;
  onToggleFavorite?: (wordId: string) => void;
  onOpenCardGenerator?: (word: VocabWord) => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  allWords = [],
  onClose,
  onSelectWord,
  onToggleFavorite,
  onOpenCardGenerator,
}) => {
  const currentIndex = word ? allWords.findIndex(w => w.id === word.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allWords.length - 1;

  // Student Personal Note state
  const [userNote, setUserNote] = useState('');
  const [isSavedNote, setIsSavedNote] = useState(false);

  // Animation state for smooth entrance & exit
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = React.useRef(false);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const handleRequestClose = React.useCallback((afterClose?: () => void) => {
    haptics.tap();
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      if (afterClose) {
        afterClose();
      } else {
        onClose();
      }
    }, 190);
  }, [onClose]);

  useEffect(() => {
    if (word) {
      setUserNote(storage.getUserNote(word.id));
      setIsSavedNote(false);
    }
  }, [word]);

  useEffect(() => {
    if (!word) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept arrow keys if user is typing a note
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }
      if (isClosingRef.current) return;

      if (e.key === 'Escape') {
        handleRequestClose();
      } else if (e.key === 'ArrowLeft' && hasPrev && onSelectWord) {
        haptics.tap();
        onSelectWord(allWords[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && hasNext && onSelectWord) {
        haptics.tap();
        onSelectWord(allWords[currentIndex + 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [word, currentIndex, hasPrev, hasNext, allWords, handleRequestClose, onSelectWord]);

  if (!word) return null;

  const progress = storage.getWordProgress(word.id);
  const enrichment = getWordEnrichment(word);

  const handleFavoriteClick = () => {
    haptics.toggle();
    storage.toggleFavorite(word.id);
    if (onToggleFavorite) onToggleFavorite(word.id);
  };

  const handleToggleNeedsPractice = () => {
    haptics.toggle();
    storage.setNeedsPractice(word.id, !progress.needsPractice);
    if (onSelectWord) onSelectWord({ ...word });
  };

  const handleSaveNote = () => {
    haptics.success();
    storage.saveUserNote(word.id, userNote);
    setIsSavedNote(true);
    setTimeout(() => setIsSavedNote(false), 2000);
  };

  const toneColorMap = {
    positive: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    negative: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    neutral: 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-300 dark:border-blue-800'
  };

  const toneLabelMap = {
    positive: 'পজিটিভ',
    negative: 'নেগেটিভ',
    neutral: 'নিরপেক্ষ'
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={() => handleRequestClose()}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 ${
          isClosing ? 'modal-content-exit' : 'modal-content-enter'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Minimal Single-Line Top Bar: Strictly 1 line covering all meta & actions */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs gap-2 flex-nowrap">
          {/* Left: Minimal metadata tags in a single line */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink min-w-0">
            <span className="font-mono text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] border border-emerald-200 dark:border-emerald-800 shrink-0">
              Unit {word.unitId}
            </span>
            <span className="capitalize text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
              {word.partOfSpeech}
            </span>
            {/* Tone Badge: Red (Negative), Green (Positive), Blue (Neutral) */}
            <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border font-bangla flex items-center gap-1 shrink-0 ${toneColorMap[enrichment.tone]}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                enrichment.tone === 'positive' 
                  ? 'bg-emerald-500' 
                  : enrichment.tone === 'negative' 
                  ? 'bg-rose-500' 
                  : 'bg-blue-500'
              }`} />
              <span>{toneLabelMap[enrichment.tone]}</span>
            </span>
          </div>

          {/* Right: Action Buttons in the same single line */}
          <div className="flex items-center gap-1 shrink-0">
            {onOpenCardGenerator && (
              <button
                type="button"
                onClick={() => {
                  handleRequestClose(() => onOpenCardGenerator(word));
                }}
                className="p-1.5 rounded-lg text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 cursor-pointer transition-colors"
                title="স্টাডি কার্ড মেকার ও শেয়ার"
                aria-label="স্টাডি কার্ড মেকার ও শেয়ার"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleFavoriteClick}
              aria-label={progress.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                progress.isFavorite
                  ? 'bg-amber-50 border-amber-200 text-amber-500 dark:bg-amber-950/40 dark:border-amber-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 hover:text-amber-500'
              }`}
              title={progress.isFavorite ? 'সংরক্ষিত প্রিয় থেকে সরান' : 'প্রিয় তালিকায় যোগ করুন'}
            >
              <Star className={`w-3.5 h-3.5 ${progress.isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => handleRequestClose()}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Word Display Section */}
        <div className="pt-1 pb-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                  {word.word}
                </h2>
                <AudioButton word={word.word} size="md" />
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {word.pronunciation}
              </p>
            </div>

            {/* Difficult Word Toggle Icon Button (No Text, on right side of main word) */}
            <button
              type="button"
              onClick={handleToggleNeedsPractice}
              aria-label={progress.needsPractice ? 'কঠিন শব্দ চিহ্নিত (ক্লিক করে আনমার্ক করুন)' : 'কঠিন শব্দ হিসেবে চিহ্নিত করুন'}
              title={progress.needsPractice ? 'কঠিন শব্দ হিসেবে চিহ্নিত (ক্লিক করে আনমার্ক করুন)' : 'কঠিন শব্দ হিসেবে চিহ্নিত করুন'}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                progress.needsPractice
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 shadow-xs ring-2 ring-rose-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-800'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${progress.needsPractice ? 'fill-rose-500/30' : ''}`} />
            </button>
          </div>

          {/* Primary Bangla Meaning */}
          <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 font-bangla">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              বাংলা অর্থ ও তাৎপর্য:
            </span>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-950 dark:text-emerald-200 mt-0.5 leading-snug">
              {word.banglaMeaning}
            </p>
          </div>

          {/* Example Sentences: Directly under word meaning */}
          <div className="mt-3 font-bangla">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>বাস্তব উদাহরণ বাক্য ও বাংলা অনুবাদ (Example Sentences)</span>
            </h4>
            <div className="space-y-2">
              {word.examples.map((ex: ExampleSentence, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-[13px] font-medium text-slate-800 dark:text-slate-100 leading-snug italic font-sans">
                      "{ex.english}"
                    </p>
                    <AudioButton word={ex.english} size="sm" />
                  </div>
                  {ex.bangla && (
                    <p className="font-bangla text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                      {ex.bangla}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* #45: বাংলা বাগধারা ও সমার্থ ভাব (Bangla Colloquial & Idiom Equivalence) */}
          {enrichment.banglaIdiom && (
            <div className="mt-2.5 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/40 font-bangla">
              <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 text-xs font-bold">
                <Lightbulb className="w-4 h-4 text-indigo-600" />
                <span>বাস্তব বাংলা উপমা ও প্রবাদ ভাব:</span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-extrabold">
                  "{enrichment.banglaIdiom.idiom}"
                </span>
              </div>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-1">
                {enrichment.banglaIdiom.explanation}
              </p>
            </div>
          )}

          {/* #14: Word Family (মূল শব্দের পদ পরিবর্তন — Noun ➔ Verb ➔ Adj ➔ Adv) */}
          {enrichment.wordFamily && (
            <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 font-bangla">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">
                শব্দ পরিবার (Word Family / পদ পরিবর্তন):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {enrichment.wordFamily.noun && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Noun</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{enrichment.wordFamily.noun}</span>
                  </div>
                )}
                {enrichment.wordFamily.verb && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Verb</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{enrichment.wordFamily.verb}</span>
                  </div>
                )}
                {enrichment.wordFamily.adjective && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Adjective</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{enrichment.wordFamily.adjective}</span>
                  </div>
                )}
                {enrichment.wordFamily.adverb && (
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Adverb</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-sans">{enrichment.wordFamily.adverb}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* #16: Collocations & Word Partners */}
          {enrichment.collocation && (
            <div className="mt-2.5 p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/30 font-bangla">
              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider block mb-1">
                উপযুক্ত শব্দযুগল ও প্রিপজিশন (Collocation):
              </span>
              <p className="font-sans font-bold text-sm text-teal-950 dark:text-teal-200">
                "{enrichment.collocation.phrase}"
              </p>
              <p className="text-xs text-teal-800 dark:text-teal-300 mt-0.5">
                {enrichment.collocation.bangla}
              </p>
            </div>
          )}

          {/* #29: Common Usage Pitfalls */}
          {enrichment.pitfall && (
            <div className="mt-2.5 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 font-bangla">
              <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 text-xs font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>সচরাচর ভুল ও ব্যাকরণগত সতর্কতা (Common Pitfall):</span>
              </div>
              <div className="text-xs space-y-0.5">
                <p className="text-rose-700 dark:text-rose-400 font-mono line-through font-medium">
                  ✗ {enrichment.pitfall.wrong}
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                  ✓ {enrichment.pitfall.correct}
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1">
                  {enrichment.pitfall.tip}
                </p>
              </div>
            </div>
          )}

          {/* #27: Degree of Intensity Scale */}
          {enrichment.intensity && (
            <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 font-bangla">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                  তীব্রতার মাত্রা বা স্কেল (Degree of Intensity)
                </span>
                <span className="text-[10px] text-slate-400">লেভেল {enrichment.intensity.level}/৪</span>
              </div>
              <div className="flex items-center gap-1.5">
                {enrichment.intensity.spectrum.map((wordName, i) => (
                  <div
                    key={i}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-center text-[10px] font-sans font-bold border ${
                      i + 1 <= enrichment.intensity!.level
                        ? 'bg-indigo-600 text-white border-indigo-700'
                        : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {wordName}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Memory Tip & Roots */}
        {word.memoryTip && (
          <div className="mt-2.5 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 font-bangla">
            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>মনে রাখার বিশেষ কৌশল (Memory Tip & Root)</span>
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
              {word.memoryTip}
            </p>
          </div>
        )}

        {/* Synonyms & Antonyms */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-bangla">
          {word.synonyms.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                সমার্থক শব্দ (Synonyms)
              </span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {word.synonyms.map((s: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-sans"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {word.antonyms.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                বিপরীত শব্দ (Antonyms)
              </span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {word.antonyms.map((a: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-sans"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* #19: Student Personal Mnemonic Note Editor */}
        <div className="mt-3.5 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 font-bangla">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              আপনার ব্যক্তিগত নোট বা মনে রাখার ট্রিক (Personal Note):
            </span>
            {isSavedNote && (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> সংরক্ষিত হয়েছে!
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={userNote}
              onChange={e => setUserNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveNote()}
              placeholder="যেমন: নিজের কোনো পরিচিত উদাহরণ, ট্রিক বা শর্টকাট লিখে রাখুন..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-amber-300/80 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
            <button
              type="button"
              onClick={handleSaveNote}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-colors shrink-0 shadow-xs"
            >
              সেভ করুন
            </button>
          </div>
        </div>

        {/* Bottom Navigation between words */}
        {allWords.length > 1 && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between font-bangla">
            <button
              type="button"
              disabled={!hasPrev}
              onClick={() => {
                haptics.tap();
                if (onSelectWord) onSelectWord(allWords[currentIndex - 1]);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-30 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>পূর্ববর্তী শব্দ</span>
            </button>

            <span className="text-xs font-bold font-mono text-slate-400">
              {currentIndex + 1} / {allWords.length}
            </span>

            <button
              type="button"
              disabled={!hasNext}
              onClick={() => {
                haptics.tap();
                if (onSelectWord) onSelectWord(allWords[currentIndex + 1]);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-30 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <span>পরবর্তী শব্দ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

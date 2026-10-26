import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Check, 
  X, 
  Sparkles, 
  Volume2, 
  Star, 
  RotateCcw,
  BookOpen,
  Award,
  Layers
} from 'lucide-react';
import { VocabWord } from '../data/types';
import { getAllWords, getWordsByUnit, getAllUnits } from '../data/units';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sound';
import { haptics } from '../utils/haptics';
import { AudioButton } from './AudioButton';
import { fireCelebrationConfetti } from '../utils/celebration';

interface FlashcardsViewProps {
  initialUnitId?: number;
  initialFilter?: 'all' | 'favorites' | 'difficult';
  onNavigateToQuiz?: () => void;
  onOpenWordDetail?: (word: VocabWord) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  initialUnitId = 1,
  initialFilter = 'all',
  onNavigateToQuiz,
  onOpenWordDetail,
}) => {
  const units = getAllUnits();
  const settings = storage.getSettings();

  const [selectedUnit, setSelectedUnit] = useState<number>(initialUnitId);
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'difficult'>(initialFilter);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Session stats
  const [sessionResults, setSessionResults] = useState<{
    known: string[];
    needsPractice: string[];
  }>({
    known: [],
    needsPractice: []
  });

  // Sync initialUnitId and initialFilter if props change
  useEffect(() => {
    setSelectedUnit(initialUnitId);
  }, [initialUnitId]);

  useEffect(() => {
    setFilterMode(initialFilter);
  }, [initialFilter]);

  // Build flashcard deck based on unit and filter
  const baseCards = useMemo(() => {
    let list: VocabWord[] = [];
    if (selectedUnit === 0) {
      list = getAllWords();
    } else {
      list = getWordsByUnit(selectedUnit);
    }

    const progress = storage.getProgress();
    if (filterMode === 'favorites') {
      list = list.filter(w => progress[w.id]?.isFavorite);
    } else if (filterMode === 'difficult') {
      list = list.filter(w => progress[w.id]?.needsPractice || (progress[w.id]?.incorrectCount > 0 && progress[w.id]?.correctCount <= progress[w.id]?.incorrectCount));
    }

    return list;
  }, [selectedUnit, filterMode]);

  const [cards, setCards] = useState<VocabWord[]>(baseCards);

  // Sync cards when baseCards change
  useEffect(() => {
    setCards(baseCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setSessionResults({ known: [], needsPractice: [] });
  }, [baseCards]);

  const currentCard: VocabWord | undefined = cards[currentIndex];

  const handleFlip = useCallback(() => {
    haptics.flip();
    setIsFlipped(prev => {
      soundManager.playFlip(settings.soundEnabled);
      return !prev;
    });
  }, [settings.soundEnabled]);

  const handleNext = useCallback(() => {
    haptics.tap();
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionCompleted(true);
      fireCelebrationConfetti();
      haptics.celebrate();
      soundManager.playCelebration(settings.soundEnabled);
    }
  }, [currentIndex, cards.length, settings.soundEnabled]);

  const handlePrev = useCallback(() => {
    haptics.tap();
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleKnowIt = useCallback(() => {
    if (!currentCard) return;
    storage.recordWordReview(currentCard.id, true, false);
    haptics.success();
    soundManager.playCorrect(settings.soundEnabled);

    setSessionResults(prev => ({
      ...prev,
      known: prev.known.includes(currentCard.id) ? prev.known : [...prev.known, currentCard.id],
      needsPractice: prev.needsPractice.filter(id => id !== currentCard.id)
    }));

    handleNext();
  }, [currentCard, settings.soundEnabled, handleNext]);

  const handleNeedPractice = useCallback(() => {
    if (!currentCard) return;
    storage.recordWordReview(currentCard.id, false, true);
    haptics.error();
    soundManager.playIncorrect(settings.soundEnabled);

    setSessionResults(prev => ({
      ...prev,
      needsPractice: prev.needsPractice.includes(currentCard.id) ? prev.needsPractice : [...prev.needsPractice, currentCard.id]
    }));

    handleNext();
  }, [currentCard, settings.soundEnabled, handleNext]);

  const handleShuffle = () => {
    haptics.tap();
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsShuffled(true);
  };

  const handleRestart = () => {
    haptics.tap();
    setCards(baseCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setSessionResults({ known: [], needsPractice: [] });
  };

  const handleRetryMissed = () => {
    const missed = baseCards.filter(w => sessionResults.needsPractice.includes(w.id));
    if (missed.length > 0) {
      setCards(missed);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionCompleted(false);
      setSessionResults({ known: [], needsPractice: [] });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1') {
        e.preventDefault();
        handleNeedPractice();
      } else if (e.key === '2') {
        e.preventDefault();
        handleKnowIt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleKnowIt, handleNeedPractice]);

  const progressPercent = cards.length > 0 ? Math.round(((currentIndex + 1) / cards.length) * 100) : 0;

  return (
    <div className="w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-4xl mx-auto select-none animate-in fade-in duration-150 flex flex-col justify-start">
      {/* Top Deck Controls Bar - Compact Single Line Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:p-2.5 lg:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs mb-2 sm:mb-3">
        {/* Unit Selector */}
        <div className="flex items-center gap-1.5 min-w-0">
          <label htmlFor="card-unit-select" className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-bangla shrink-0">
            ইউনিট:
          </label>
          <select
            id="card-unit-select"
            value={selectedUnit}
            onChange={e => setSelectedUnit(Number(e.target.value))}
            className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bangla max-w-[170px] sm:max-w-[210px] truncate"
          >
            <option value={0}>সব ৫০টি ইউনিট (১,৮৫০+)</option>
            {units.map(u => (
              <option key={u.id} value={u.id}>
                ইউনিট {u.id}: {u.title.replace(/^Unit \d+:\s*/, '')}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bangla text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-xs font-semibold ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700'
            }`}
          >
            সব
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('favorites')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              filterMode === 'favorites'
                ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
            }`}
          >
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>প্রিয়</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('difficult')}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-xs font-semibold ${
              filterMode === 'difficult'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            ভুল
          </button>
        </div>

        {/* Deck actions (Shuffle & Restart) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleShuffle}
            title="এলোমেলো করুন (Shuffle)"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:border-emerald-200 transition-colors cursor-pointer shadow-2xs"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRestart}
            title="রিস্টার্ট করুন (Restart)"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-700 hover:border-emerald-200 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {cards.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 space-y-3 shadow-xs font-bangla">
          <Layers className="w-10 h-10 text-emerald-600 mx-auto opacity-80" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            এই তালিকায় কোনো শব্দ নেই!
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            {filterMode === 'favorites'
              ? 'এখনো কোনো শব্দ প্রিয় হিসেবে চিহ্নিত করেননি।'
              : 'চমৎকার! বর্তমানে কোনো ভুল বা সমস্যাযুক্ত শব্দ নেই।'}
          </p>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            সব শব্দ দেখুন
          </button>
        </div>
      ) : sessionCompleted ? (
        /* Summary Screen - Compact without scroll */
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-emerald-100 dark:border-slate-800 p-6 sm:p-8 text-center space-y-4 animate-in zoom-in-95 duration-200 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200 dark:border-emerald-800">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-bangla">
              চমৎকার সেশন সম্পন্ন!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-bangla">
              আপনি এই ডেকের সব {cards.length}টি ফ্ল্যাশ কার্ড সম্পন্ন করেছেন।
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 font-sans">
                {sessionResults.known.length}
              </span>
              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mt-0.5 font-bangla">
                পেরেছেন
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 font-sans">
                {sessionResults.needsPractice.length}
              </span>
              <p className="text-[11px] font-bold text-rose-800 dark:text-rose-300 mt-0.5 font-bangla">
                পুনরায় দেখতে হবে
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 font-bangla">
            {sessionResults.needsPractice.length > 0 && (
              <button
                type="button"
                onClick={handleRetryMissed}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                ভুলগুলো আবার দেখুন ({sessionResults.needsPractice.length})
              </button>
            )}
            <button
              type="button"
              onClick={handleRestart}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
            >
              ডেক রিস্টার্ট
            </button>
            {onNavigateToQuiz && (
              <button
                type="button"
                onClick={onNavigateToQuiz}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                কুইজ দিন
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Active Minimal Flashcard Screen - Designed specifically to fit viewport without scrolling */
        <div className="space-y-2.5 sm:space-y-3">
          
          {/* Progress bar & Card Navigation */}
          <div className="flex items-center justify-between gap-3 font-bangla px-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              title="পূর্ববর্তী কার্ড (Left Arrow)"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 flex items-center gap-2.5">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-500 font-mono shrink-0">
                {currentIndex + 1} / {cards.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= cards.length - 1}
              title="পরবর্তী কার্ড (Right Arrow)"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3D Flashcard Container - Adaptive responsive height that fits any viewport */}
          <div className="perspective-1000 w-full h-[clamp(210px,36vh,300px)] sm:h-[clamp(260px,42vh,380px)] lg:h-[clamp(340px,48vh,480px)]">
            <div
              onClick={handleFlip}
              className={`relative w-full h-full rounded-2xl sm:rounded-3xl cursor-pointer transition-transform duration-500 transform-style-preserve-3d shadow-xs border border-slate-200/90 dark:border-slate-800 ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT OF CARD: Minimal White Surface */}
              <div className="absolute inset-0 w-full h-full backface-hidden p-4 sm:p-6 lg:p-8 flex flex-col justify-between bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl select-none">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs lg:text-sm font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    {currentCard?.partOfSpeech} · ইউনিট {currentCard?.unitId}
                  </span>

                  <span className="text-[10px] sm:text-[11px] lg:text-xs font-semibold px-2 py-0.5 lg:px-3 lg:py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 font-bangla">
                    উল্টাতে ট্যাপ করুন (Space)
                  </span>
                </div>

                <div className="text-center my-auto py-2">
                  <h3 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {currentCard?.word}
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base font-mono text-slate-400 mt-1 sm:mt-1.5">
                    {currentCard?.pronunciation}
                  </p>

                  <div className="mt-2.5 sm:mt-3.5 lg:mt-5 flex items-center justify-center">
                    {currentCard && <AudioButton word={currentCard.word} size="sm" showLabel />}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] sm:text-xs lg:text-sm font-bold text-emerald-700 dark:text-emerald-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bangla text-slate-400 font-normal">কীবোর্ড: ১ ও ২ বাটন</span>
                  <div className="flex items-center gap-1 font-bangla">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>অর্থ দেখতে ক্লিক করুন</span>
                  </div>
                </div>
              </div>

              {/* BACK OF CARD: Mint / Soft Green Surface with prominent Bangla Meaning */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 p-4 sm:p-6 lg:p-8 flex flex-col justify-between bg-gradient-to-br from-emerald-50/95 via-teal-50/40 to-white dark:from-slate-900 dark:via-emerald-950/40 dark:to-slate-900 rounded-2xl sm:rounded-3xl select-none overflow-y-auto border border-emerald-100 dark:border-slate-800">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60 dark:border-emerald-800/60">
                  <h4 className="text-base sm:text-lg lg:text-xl font-bold text-emerald-800 dark:text-emerald-300">
                    {currentCard?.word}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentCard && onOpenWordDetail) onOpenWordDetail(currentCard);
                    }}
                    className="text-[11px] sm:text-xs lg:text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer font-bangla"
                  >
                    বিস্তারিত দেখুন
                  </button>
                </div>

                <div className="my-auto py-2 text-center">
                  <span className="text-[10px] sm:text-[11px] lg:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bangla">
                    বাংলা অর্থ
                  </span>
                  <p className="font-bangla text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
                    {currentCard?.banglaMeaning}
                  </p>
                </div>

                {currentCard?.examples[0] && (
                  <div className="p-2 sm:p-2.5 lg:p-3.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-emerald-100 dark:border-slate-700 text-left">
                    <p className="text-xs sm:text-sm lg:text-base font-medium text-slate-700 dark:text-slate-200 italic line-clamp-2">
                      "{currentCard.examples[0].english}"
                    </p>
                    <p className="font-bangla text-[11px] sm:text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {currentCard.examples[0].bangla}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS: NEED PRACTICE vs I KNOW IT (Natural responsive flow without scroll) */}
          <div className="grid grid-cols-2 gap-2.5 lg:gap-4 pt-1 sm:pt-2 font-bangla">
            <button
              type="button"
              onClick={handleNeedPractice}
              className="py-2.5 sm:py-3 lg:py-3.5 px-3 lg:px-6 rounded-xl sm:rounded-2xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-800 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-900 text-xs sm:text-sm lg:text-base font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
            >
              <X className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-rose-600 shrink-0" />
              <span>আবার দেখতে হবে <span className="font-sans text-[10px] lg:text-xs opacity-75">(1)</span></span>
            </button>

            <button
              type="button"
              onClick={handleKnowIt}
              className="py-2.5 sm:py-3 lg:py-3.5 px-3 lg:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm lg:text-base font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-emerald-600/20 transition-all active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
              <span>আমি পারি <span className="font-sans text-[10px] lg:text-xs opacity-80">(2)</span></span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  ArrowRight,
  Award,
  CheckCircle2,
  AlertCircle,
  Layers,
  HelpCircle,
  Hash,
  Check,
  RotateCcw,
  RotateCw,
  Trophy,
  Clock,
  Timer,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { QuizMode, QuizQuestion, VocabWord } from '../data/types';
import { generateQuizQuestions, getEligibleWordPool } from '../utils/quizGenerator';
import { getAllUnits } from '../data/units';
import { storage } from '../utils/storage';
import { soundManager } from '../utils/sound';
import { haptics } from '../utils/haptics';
import { fireCelebrationConfetti } from '../utils/celebration';
import { AudioButton } from './AudioButton';

interface QuizViewProps {
  initialUnitId?: number;
  onOpenWordDetail?: (word: VocabWord) => void;
  onNavigateToFlashcards?: (unitId: number) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  initialUnitId = 1,
  onOpenWordDetail,
  onNavigateToFlashcards,
}) => {
  const settings = storage.getSettings();
  const allUnits = getAllUnits();

  // Setup state
  const [isQuizActive, setIsQuizActive] = useState(false);
  // Multi-unit selection state (array of unit IDs)
  const [selectedUnits, setSelectedUnits] = useState<number[]>([initialUnitId]);
  const [quizMode, setQuizMode] = useState<QuizMode>('mixed');
  // Question count mode: 'all' (all words from selected units), presets, or 'custom'
  const [countPreset, setCountPreset] = useState<'all' | '10' | '20' | '30' | '50' | 'custom'>('10');
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [onlyDifficult, setOnlyDifficult] = useState<boolean>(false);
  const [showAllUnitsGrid, setShowAllUnitsGrid] = useState<boolean>(true);

  // Sync initialUnitId if passed from outside
  useEffect(() => {
    if (initialUnitId) {
      setSelectedUnits([initialUnitId]);
    }
  }, [initialUnitId]);

  // Compute total available words for the selected units
  const availablePool = useMemo(() => {
    const revisionIds = onlyDifficult ? storage.getRevisionWordIds() : undefined;
    return getEligibleWordPool(selectedUnits, revisionIds);
  }, [selectedUnits, onlyDifficult]);

  // Determine effective question count
  // Requirement: "question count jeno custom dewa jay ar na dile selected unit a joto question thakbe sob e asbe"
  const parsedCustom = parseInt(customCountInput.trim(), 10);
  const effectiveCount = useMemo(() => {
    if (countPreset === 'all') {
      return availablePool.length;
    }
    if (countPreset === 'custom') {
      // If custom count is not entered, or empty, or <= 0: ALL questions come!
      if (!customCountInput.trim() || isNaN(parsedCustom) || parsedCustom <= 0) {
        return availablePool.length;
      }
      return Math.min(parsedCustom, availablePool.length);
    }
    const presetVal = parseInt(countPreset, 10);
    return Math.min(presetVal, availablePool.length);
  }, [countPreset, customCountInput, parsedCustom, availablePool.length]);

  // Unit selection helpers
  const handleToggleUnit = (unitId: number) => {
    haptics.selection();
    setSelectedUnits(prev => {
      if (prev.includes(unitId)) {
        if (prev.length <= 1) return prev; // Keep at least one unit selected
        return prev.filter(id => id !== unitId);
      }
      return [...prev, unitId].sort((a, b) => a - b);
    });
  };

  const handleSelectAllUnits = () => {
    haptics.selection();
    setSelectedUnits(allUnits.map(u => u.id));
  };

  const handleSelectRange = (start: number, end: number) => {
    haptics.selection();
    const range: number[] = [];
    for (let i = start; i <= end; i++) {
      if (i <= allUnits.length) range.push(i);
    }
    setSelectedUnits(range);
  };

  // Active quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isLastAnswerCorrect, setIsLastAnswerCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [answersLog, setAnswersLog] = useState<{
    question: QuizQuestion;
    chosenOptionId: string;
    isCorrect: boolean;
    timeSpent: number;
  }[]>([]);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [showResultTips, setShowResultTips] = useState(false);
  const [feedbackTab, setFeedbackTab] = useState<'answer' | 'tips'>('answer');

  // Format seconds as '05s', '18s' or '1:05s'
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    if (mins > 0) {
      return `${mins}:${remaining < 10 ? '0' : ''}${remaining}s`;
    }
    return `${remaining < 10 ? '0' : ''}${remaining}s`;
  };

  // Per-question timer
  useEffect(() => {
    if (!isQuizActive || isQuizCompleted || isAnswerSubmitted) return;

    const timer = setInterval(() => {
      setQuestionSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuizActive, isQuizCompleted, isAnswerSubmitted, currentIndex]);

  const startQuiz = (overrideQuestions?: QuizQuestion[]) => {
    haptics.tap();
    let qList = overrideQuestions;
    if (!qList) {
      const revisionIds = onlyDifficult ? storage.getRevisionWordIds() : undefined;
      // If count is not given or preset is 'all' or custom is blank, pass null so all questions are generated!
      let countParam: number | null = null;
      if (countPreset !== 'all') {
        if (countPreset === 'custom') {
          countParam = (!customCountInput.trim() || isNaN(parsedCustom) || parsedCustom <= 0) ? null : parsedCustom;
        } else {
          countParam = parseInt(countPreset, 10);
        }
      }

      qList = generateQuizQuestions(selectedUnits, quizMode, countParam, revisionIds);
    }

    if (qList.length === 0) {
      alert('নির্বাচিত ইউনিটে কোনো শব্দ পাওয়া যায়নি। অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।');
      return;
    }

    setQuestions(qList);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setIsLastAnswerCorrect(false);
    setScore(0);
    setAnswersLog([]);
    setQuestionSeconds(0);
    setShowTips(false);
    setShowResultTips(false);
    setFeedbackTab('answer');
    setIsQuizCompleted(false);
    setIsQuizActive(true);
  };

  const handleSelectOption = (optionId: string) => {
    if (isAnswerSubmitted) return;
    haptics.tap();
    setSelectedOptionId(optionId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOptionId || isAnswerSubmitted) return;

    const currentQ = questions[currentIndex];
    const chosenOption = currentQ.options.find(o => o.id === selectedOptionId);
    const isCorrect = !!chosenOption?.isCorrect;

    setIsAnswerSubmitted(true);
    setIsLastAnswerCorrect(isCorrect);
    setFeedbackTab('answer');
    const isSpelling = currentQ.type === 'spelling' || quizMode === 'spelling';
    storage.recordQuizAnswer(currentQ.targetWord.id, isCorrect, isSpelling);

    if (isCorrect) {
      setScore(prev => prev + 1);
      haptics.success();
      soundManager.playCorrect(settings.soundEnabled);
    } else {
      haptics.error();
      soundManager.playIncorrect(settings.soundEnabled);
    }

    setAnswersLog(prev => [
      ...prev,
      {
        question: currentQ,
        chosenOptionId: selectedOptionId,
        isCorrect,
        timeSpent: Math.max(1, questionSeconds),
      }
    ]);
  };

  const handleNextQuestion = () => {
    haptics.tap();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setIsLastAnswerCorrect(false);
      setQuestionSeconds(0);
      setShowTips(false);
      setFeedbackTab('answer');
    } else {
      // Quiz Finished
      setIsQuizCompleted(true);
      const total = questions.length;
      const finalScore = score + (isLastAnswerCorrect ? 0 : 0);
      const percent = Math.round((finalScore / total) * 100);

      const missed = answersLog
        .filter(a => !a.isCorrect)
        .map(a => a.question.targetWord.id);

      // Save primary unit or 0 for multi-unit
      storage.saveQuizResult({
        unitId: selectedUnits.length === 1 ? selectedUnits[0] : 0,
        mode: quizMode,
        totalQuestions: total,
        correctAnswers: finalScore,
        scorePercent: percent,
        missedWordIds: missed,
      });

      if (percent >= 70) {
        fireCelebrationConfetti({
          isHighScore: true,
          isPerfect: percent === 100
        });
        haptics.celebrate();
        soundManager.playCelebration(settings.soundEnabled);
      }
    }
  };

  // Keyboard shortcut listener (1-4 for options, Enter for Check / Continue)
  useEffect(() => {
    if (!isQuizActive || isQuizCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      if (!isAnswerSubmitted) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = parseInt(e.key, 10) - 1;
          if (currentQ.options[idx]) {
            handleSelectOption(currentQ.options[idx].id);
          }
        } else if (e.key === 'Enter' && selectedOptionId) {
          handleSubmitAnswer();
        }
      } else if (e.key === 'Enter') {
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuizActive, isQuizCompleted, isAnswerSubmitted, selectedOptionId, currentIndex, questions]);

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex) / questions.length) * 100) : 0;

  return (
    <div className="w-full max-w-4xl lg:max-w-3xl xl:max-w-3xl mx-auto select-none animate-in fade-in duration-150 lg:py-2">
      {!isQuizActive ? (
        /* QUIZ SETUP SCREEN - COMPACT VIEWPORT-FRIENDLY DESIGN */
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-7 lg:p-7 shadow-xs lg:shadow-md space-y-4 lg:space-y-5">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 font-bangla">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>কুইজ পরীক্ষা প্রস্তুতি</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight font-bangla">
                স্মরণশক্তি যাচাই করুন
              </h2>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-bangla block">
                উপলব্ধ শব্দ
              </span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">
                {availablePool.length}
              </span>
            </div>
          </div>

          {/* 1. MULTIPLE UNIT SELECTOR */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 font-bangla flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>ইউনিট নির্বাচন ({selectedUnits.length}টি ইউনিট নির্বাচিত):</span>
              </label>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1 text-[11px] font-bangla">
                <button
                  type="button"
                  onClick={handleSelectAllUnits}
                  className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer font-bold ${
                    selectedUnits.length === allUnits.length
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  সব ৫০টি
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRange(1, 10)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer font-bold"
                >
                  ১-১০
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRange(11, 20)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer font-bold"
                >
                  ১১-২০
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRange(21, 30)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer font-bold"
                >
                  ২১-৩০
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRange(31, 40)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer font-bold"
                >
                  ৩১-৪০
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectRange(41, 50)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer font-bold"
                >
                  ৪১-৫০
                </button>
              </div>
            </div>

            {/* Interactive Grid of Unit Numbers (1 to 50) */}
            <div className="p-2.5 sm:p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/80 shadow-inner dark:shadow-none">
              <div className="grid grid-cols-10 sm:grid-cols-10 md:grid-cols-10 gap-1 sm:gap-1.5 lg:gap-2 max-h-24 sm:max-h-28 lg:max-h-36 overflow-y-auto pr-1">
                {allUnits.map(unit => {
                  const isSelected = selectedUnits.includes(unit.id);
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => handleToggleUnit(unit.id)}
                      title={`ইউনিট ${unit.id}: ${unit.title} (${unit.words.length} শব্দ)`}
                      className={`h-7 sm:h-7.5 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs scale-[1.03] ring-1 ring-emerald-400/50'
                          : 'bg-white dark:bg-slate-800/95 text-slate-700 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {unit.id}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-bangla px-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/70">
                <span>এক বা একাধিক ইউনিটে ক্লিক করে অন/অফ করুন</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {selectedUnits.length === allUnits.length
                    ? 'সব ৫০টি ইউনিট নির্বাচিত'
                    : `বাছাইকৃত: ${selectedUnits.join(', ')}`}
                </span>
              </div>
            </div>
          </div>

          {/* 2. QUIZ MODE SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 font-bangla">
              কুইজের ধরন
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
              {[
                { id: 'mixed', title: 'মিশ্র কুইজ', desc: 'সব ধরণের প্রশ্ন একসাথে' },
                { id: 'en-to-bn', title: 'En → বাংলা অর্থ', desc: 'ইংরেজি শব্দের বাংলা অর্থ' },
                { id: 'bn-to-en', title: 'বাংলা → English', desc: 'বাংলা অর্থ থেকে ইংরেজি' },
                { id: 'spelling', title: 'সঠিক বানান', desc: 'সঠিক ইংরেজি বানান বাছাই' },
                { id: 'fill-blank', title: 'শূন্যস্থান পূরণ', desc: 'প্রাসঙ্গিক বাক্য চর্চা' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setQuizMode(m.id as QuizMode)}
                  className={`p-2 sm:p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                    quizMode === m.id
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-xs text-slate-900 dark:text-white font-bangla">{m.title}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-bangla mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. CUSTOM QUESTION COUNT */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 font-bangla flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600" />
                <span>প্রশ্ন সংখ্যা নির্ধারণ করুন</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 font-bangla">
                {countPreset === 'all' || (countPreset === 'custom' && (!customCountInput.trim() || isNaN(parsedCustom) || parsedCustom <= 0))
                  ? `নির্বাচিত ইউনিটের সব (${availablePool.length}টি) প্রশ্ন আসবে`
                  : `মোট ${effectiveCount}টি প্রশ্ন আসবে`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* "সব প্রশ্ন" Option */}
              <button
                type="button"
                onClick={() => {
                  setCountPreset('all');
                  setCustomCountInput('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer font-bangla ${
                  countPreset === 'all'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                সব প্রশ্ন ({availablePool.length}টি)
              </button>

              {/* Standard Presets */}
              {[10, 20, 30, 50].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => {
                    setCountPreset(String(cnt) as any);
                    setCustomCountInput('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    countPreset === String(cnt)
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cnt}টি
                </button>
              ))}

              {/* Custom Number Input Button & Box */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCountPreset('custom')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer font-bangla ${
                    countPreset === 'custom'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  কাস্টম সংখ্যা:
                </button>

                <input
                  type="number"
                  min="1"
                  max={availablePool.length}
                  value={customCountInput}
                  onChange={(e) => {
                    setCustomCountInput(e.target.value);
                    setCountPreset('custom');
                  }}
                  onFocus={() => setCountPreset('custom')}
                  placeholder="যেমন: ১৫"
                  className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-sans"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bangla">
              {countPreset === 'custom' && !customCountInput.trim() ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  * কোনো নির্দিষ্ট সংখ্যা না দিলে নির্বাচিত ইউনিটের সবগুলো ({availablePool.length}টি) প্রশ্ন অন্তর্ভুক্ত হবে।
                </span>
              ) : countPreset === 'all' ? (
                <span>নির্বাচিত ইউনিটগুলোর সকল উপলব্ধ শব্দ থেকে পূর্ণ কুইজ তৈরি হবে।</span>
              ) : (
                <span>উপলব্ধ {availablePool.length}টি শব্দের মধ্যে দৈবচয়নে {effectiveCount}টি প্রশ্ন তৈরি হবে।</span>
              )}
            </p>
          </div>

          {/* 4. MISTAKES ONLY TOGGLE */}
          <div className="flex items-center gap-2.5 py-1 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 font-bangla">
            <input
              type="checkbox"
              id="quiz-difficult-toggle"
              checked={onlyDifficult}
              onChange={e => setOnlyDifficult(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
            />
            <label htmlFor="quiz-difficult-toggle" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              শুধু পূর্বে ভুল হওয়া শব্দগুলোর ওপর কুইজ নিন
            </label>
          </div>

          {/* 5. START BUTTON */}
          <button
            type="button"
            onClick={() => startQuiz()}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold cursor-pointer shadow-sm shadow-emerald-600/25 transition-all font-bangla flex items-center justify-center gap-2"
          >
            <span>কুইজ পরীক্ষা শুরু করুন ({effectiveCount}টি প্রশ্ন)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : isQuizCompleted ? (
        /* COMPACT VICTORY / RESULT SCREEN - REWARDING CELEBRATION WITH CONFETTI OVERLAY */
        (() => {
          const finalPercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
          const isHighScore = finalPercent >= 70;
          const isPerfect = finalPercent === 100;

          return (
            <div className={`rounded-2xl sm:rounded-3xl border bg-white dark:bg-slate-900 p-5 sm:p-7 lg:p-8 text-center space-y-4 lg:space-y-6 animate-in zoom-in-95 duration-200 shadow-sm lg:shadow-md relative overflow-hidden ${
              isPerfect 
                ? 'border-amber-300 dark:border-amber-600/80' 
                : isHighScore 
                ? 'border-emerald-300 dark:border-emerald-700/80' 
                : 'border-slate-200 dark:border-slate-800'
            }`}>
              {/* Subtle Ambient Radial Highlight for High Scores */}
              {isHighScore && (
                <div 
                  className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-44 rounded-full blur-3xl pointer-events-none opacity-40 ${
                    isPerfect ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} 
                />
              )}

              {/* Award / Trophy Icon Badge */}
              <div className="relative inline-block">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto transition-transform hover:scale-105 border ${
                  isPerfect
                    ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-sm shadow-amber-500/20'
                    : isHighScore
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  {isPerfect ? (
                    <Trophy className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
                  ) : (
                    <Award className="w-7 h-7 sm:w-8 sm:h-8" />
                  )}
                </div>
                {isHighScore && (
                  <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black text-white shadow-xs ${
                    isPerfect ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}>
                    {isPerfect ? '100%' : '★'}
                  </span>
                )}
              </div>

              <div>
                <span className={`text-[11px] font-extrabold uppercase tracking-wider font-bangla ${
                  isPerfect
                    ? 'text-amber-600 dark:text-amber-400'
                    : isHighScore
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {isPerfect ? '🌟 পারফেক্ট স্কোর! 🌟' : isHighScore ? '🎉 কুইজ বিজয়ী! 🎉' : 'পরীক্ষা সম্পন্ন হয়েছে'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 font-bangla">
                  {isPerfect 
                    ? 'অসাধারণ কৃতিত্ব!' 
                    : isHighScore 
                    ? 'চমৎকার ফলাফল!' 
                    : 'কুইজের ফলাফল'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5 font-bangla">
                  আপনি মোট <strong className="font-sans font-bold text-slate-900 dark:text-white">{questions.length}</strong>টি প্রশ্নের মধ্যে <strong className="font-sans font-bold text-emerald-600 dark:text-emerald-400">{score}</strong>টি সঠিক উত্তর দিয়েছেন।
                </p>
              </div>

              {/* High Score Celebration Banner & Confetti Re-trigger */}
              {isHighScore && (
                <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left transition-all ${
                  isPerfect
                    ? 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-200'
                    : 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold font-bangla">
                      {isPerfect
                        ? 'অভিনন্দন! আপনি শতভাগ নির্ভুল উত্তর দিয়ে শীর্ষ সাফল্য অর্জন করেছেন!'
                        : finalPercent >= 85
                        ? 'দুর্দান্ত পারফরম্যান্স! আপনি উচ্চ নির্ভুলতার সাথে উত্তীর্ণ হয়েছেন।'
                        : 'দারুণ কাজ! আপনার প্রচেষ্টা প্রশংসনীয়।'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      fireCelebrationConfetti({ isHighScore: true, isPerfect });
                      soundManager.playCelebration(settings.soundEnabled);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-750 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-slate-700 text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer font-bangla shrink-0"
                    title="কনফেটি অ্যানিমেশন আবার চালু করুন"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>আবার কনফেটি ওড়ান</span>
                  </button>
                </div>
              )}

              {/* Score & Accuracy Badges */}
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-sans">
                    {score} / {questions.length}
                  </span>
                  <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mt-0.5 font-bangla">
                    সঠিক উত্তর
                  </p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80">
                  <span className="text-xl sm:text-2xl font-black text-teal-700 dark:text-teal-300 font-sans">
                    {finalPercent}%
                  </span>
                  <p className="text-[11px] font-bold text-teal-800 dark:text-teal-300 mt-0.5 font-bangla">
                    নির্ভুলতা
                  </p>
                </div>
              </div>

              {/* QUESTIONS REQUIRING REVISION (Took More Time) */}
              {(() => {
                const totalQ = questions.length;
                const avgSeconds = totalQ > 0 
                  ? Math.round(answersLog.reduce((acc, a) => acc + (a.timeSpent || 0), 0) / totalQ) 
                  : 0;

                // Identify questions taking notable time (>= 5s or >= avgSeconds) or missed
                const slowThreshold = Math.max(5, avgSeconds);
                const highTimeQuestions = answersLog
                  .filter(a => a.timeSpent >= slowThreshold || !a.isCorrect)
                  .sort((a, b) => b.timeSpent - a.timeSpent);

                const displaySlowQuestions = highTimeQuestions.length > 0
                  ? highTimeQuestions
                  : [...answersLog].sort((a, b) => b.timeSpent - a.timeSpent).slice(0, 3);

                if (displaySlowQuestions.length === 0) return null;

                return (
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/20 p-3 sm:p-4 text-left space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <h3 className="text-xs sm:text-sm font-extrabold text-amber-950 dark:text-amber-200 font-bangla">
                          যেসব প্রশ্নে বেশি সময় লেগেছে (বেশি বেশি পড়তে হবে)
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bangla">
                        গড় সময়: {avgSeconds} সে./প্রশ্ন
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 font-bangla leading-relaxed">
                      নিচের শব্দগুলোর উত্তর দিতে অপেক্ষাকৃত বেশি সময় ব্যয় হয়েছে। দ্রুত আয়ত্ত করতে এগুলো বেশি বেশি রিভিশন দিন:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {displaySlowQuestions.map((item, idx) => (
                        <div 
                          key={item.question.id || idx}
                          className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 shadow-2xs flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {item.question.targetWord.word}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 hidden xs:inline">
                                {item.question.targetWord.pronunciation}
                              </span>
                              <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold font-bangla ${
                                item.isCorrect 
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' 
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                              }`}>
                                {item.isCorrect ? 'সঠিক' : 'ভুল'}
                              </span>
                            </div>
                            <p className="text-[11px] font-bangla text-slate-600 dark:text-slate-300 truncate mt-0.5">
                              {item.question.targetWord.banglaMeaning}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-[10.5px] font-mono font-bold text-amber-800 dark:text-amber-300 whitespace-nowrap">
                              ⏱️ {item.timeSpent} সে.
                            </span>
                            <AudioButton word={item.question.targetWord.word} size="sm" className="!p-1 !rounded-md" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* COLLAPSIBLE MEMORY & RETENTION TIPS */}
              <div className="text-left font-bangla">
                <button
                  type="button"
                  onClick={() => setShowResultTips(prev => !prev)}
                  className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Lightbulb className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold block">
                        💡 শব্দ মনে রাখার বিশেষ টিপস ও কৌশল
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        ক্লিক করে ভোকাবুলারি রিটেনশন টিপস এক্সপ্যান্ড করুন
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>{showResultTips ? 'সংকুচিত করুন' : 'টিপস দেখুন'}</span>
                    {showResultTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {showResultTips && (
                  <div className="mt-2 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] flex items-center justify-center font-mono font-bold">1</span>
                          স্পেসড রিপিটেশন (Spaced Repetition)
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          যে শব্দগুলোতে বেশি সময় লেগেছে বা ভুল হয়েছে, সেগুলো ১ম দিন, ৩য় দিন এবং ৭ম দিন বিরতিতে ফ্ল্যাশকার্ডে ঝালিয়ে নিন।
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 text-[10px] flex items-center justify-center font-mono font-bold">2</span>
                          রুট ওয়ার্ড ও প্রিফিক্স বিশ্লেষণ
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          শব্দের মূল রুট (Root) এবং প্রিফিক্স লক্ষ্য করুন (যেমন: <em>ab-</em> মানে দূরে সরে যাওয়া, <em>bene-</em> মানে ভালো)। এতে একই পরিবারের বহু শব্দ মনে থাকে।
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-[10px] flex items-center justify-center font-mono font-bold">3</span>
                          বাস্তব বাক্যে প্রয়োগ
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          শব্দটির উদাহরণ বাক্যটি পড়ুন এবং আপনার ব্যক্তিগত জীবনের কোনো পরিচিত পরিস্থিতির সাথে মিলিয়ে একটি নিজস্ব বাক্য তৈরি করুন।
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-750">
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center justify-center font-mono font-bold">4</span>
                          উচ্চারণ শুনে মুখে বলা
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          অডিও বাটনে ক্লিক করে সঠিক উচ্চারণ শুনুন এবং নিজে ৩ বার জোরে উচ্চারণ করুন। উচ্চারণের শব্দ স্মৃতি মস্তিষ্কে দীর্ঘস্থায়ী ছাপ ফেলে।
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 font-bangla">
                <button
                  type="button"
                  onClick={() => startQuiz()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>আবার পরীক্ষা দিন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuizActive(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  ইউনিট ও প্রশ্ন পরিবর্তন করুন
                </button>
              </div>
            </div>
          );
        })()
      ) : (
        /* ACTIVE QUESTION INTERFACE - COMPACT, FITS PERFECTLY IN VIEWPORT WITHOUT SCROLL */
        <div className="space-y-1.5 sm:space-y-2.5">
          
          {/* Top Bar with Exit, Progress Bar, Question Counter & Live Score */}
          <div className="flex items-center justify-between gap-3 py-0.5 lg:py-2 lg:gap-4">
            <button
              type="button"
              onClick={() => setIsQuizActive(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
              title="কুইজ বন্ধ করুন"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Smooth Progress Bar */}
            <div className="flex-1 h-1.5 sm:h-2 lg:h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Question Counter & Score */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-slate-500 font-mono">
                {currentIndex + 1} / {questions.length}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 font-bangla">
                স্কোর: {score}
              </span>
            </div>
          </div>

          {/* Question Prompt Card */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 lg:p-6 space-y-1.5 sm:space-y-2 lg:space-y-3.5 shadow-xs lg:shadow-md">
            
            {/* Question Header: Question Number + Compact Audio Pill (Left) + Question Timer (Right) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-bangla">
                  প্রশ্ন {currentIndex + 1}
                </span>

                {/* Inline Audio Pronunciation Pill - Compact and smaller as requested */}
                {currentQuestion.type !== 'fill-blank' && currentQuestion.type !== 'spelling' && currentQuestion.question.includes(`"${currentQuestion.targetWord.word}"`) && (
                  <div className="inline-flex items-center gap-1 py-0.5 px-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] shadow-2xs">
                    <AudioButton word={currentQuestion.targetWord.word} size="sm" className="!p-1 !rounded-md" />
                    <span className="font-mono text-slate-600 dark:text-slate-300 text-[10px]">
                      {currentQuestion.targetWord.pronunciation}
                    </span>
                  </div>
                )}

                {/* Inline Spelling Mode Audio Prompt */}
                {currentQuestion.type === 'spelling' && (
                  <div className="inline-flex items-center gap-1 py-0.5 px-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bangla shadow-xs">
                    <AudioButton word={currentQuestion.targetWord.word} size="sm" className="!p-1 !rounded-md" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      {isAnswerSubmitted ? `উচ্চারণ: ${currentQuestion.targetWord.pronunciation}` : 'উচ্চারণ শুনুন'}
                    </span>
                  </div>
                )}
              </div>

              {/* Question Timer Box on Extreme Right */}
              <div 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-bold shadow-2xs shrink-0" 
                title="এই নির্দিষ্ট প্রশ্নে ব্যয়িত সময়"
              >
                <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <span>{formatSeconds(questionSeconds)}</span>
              </div>
            </div>

            {/* Question Title & Subtitle - Scaled to prevent any scroll on large questions */}
            <div className="space-y-0.5 lg:space-y-1">
              <h3 className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug lg:leading-normal font-bangla">
                {currentQuestion.questionBangla || currentQuestion.question}
              </h3>
              {currentQuestion.questionBangla && currentQuestion.question !== currentQuestion.questionBangla && (
                <p className="text-[10.5px] sm:text-[11px] lg:text-xs text-slate-400 font-sans leading-tight line-clamp-1">
                  {currentQuestion.question}
                </p>
              )}
            </div>

            {/* 4 Multiple Choice Options (compact 2x2 Grid on sm+, clean single column on mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 lg:gap-2.5">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = selectedOptionId === opt.id;
                let optStyle = 'border-slate-200 dark:border-slate-700/90 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs';

                if (isAnswerSubmitted) {
                  if (opt.isCorrect) {
                    optStyle = 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/50 font-bold shadow-xs';
                  } else if (isSelected && !opt.isCorrect) {
                    optStyle = 'border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-950/90 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/50 font-bold shadow-xs';
                  } else {
                    optStyle = 'opacity-40 border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500';
                  }
                } else if (isSelected) {
                  optStyle = 'border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/40 font-bold shadow-xs';
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`py-1.5 px-2.5 sm:py-2 sm:px-3 lg:py-2.5 lg:px-3.5 rounded-xl lg:rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer font-bangla ${optStyle}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 lg:w-5.5 lg:h-5.5 rounded-md lg:rounded-lg bg-slate-100 dark:bg-slate-700 text-[11px] lg:text-xs font-mono font-bold flex items-center justify-center text-slate-600 dark:text-slate-200 shrink-0">
                        {optIdx + 1}
                      </span>
                      <span className="font-semibold text-xs sm:text-sm lg:text-[14.5px] truncate text-slate-900 dark:text-slate-100">
                        {opt.text}
                      </span>
                    </div>

                    {isAnswerSubmitted && opt.isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1.5" />
                    )}
                    {isAnswerSubmitted && isSelected && !opt.isCorrect && (
                      <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Button: Check Answer / Next Question */}
            <div className="pt-0.5 font-bangla">
              {!isAnswerSubmitted ? (
                <button
                  type="button"
                  disabled={!selectedOptionId}
                  onClick={handleSubmitAnswer}
                  className="w-full py-2 sm:py-2.5 lg:py-3 rounded-xl lg:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm lg:text-sm cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>উত্তর যাচাই করুন (Enter)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="w-full py-2 sm:py-2.5 lg:py-3 rounded-xl lg:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm lg:text-sm cursor-pointer shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
                >
                  <span>পরবর্তী প্রশ্ন (Enter)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Answer Feedback Alert on Submit (Smooth Slide-Fade Transition: No Flip, Clearly Readable Example, Explicit Correct Answer) */}
            {isAnswerSubmitted && (() => {
              const correctOption = currentQuestion.options.find(o => o.isCorrect);
              const correctAnswerText = correctOption ? correctOption.text : currentQuestion.targetWord.banglaMeaning;

              return (
                <div className={`p-2.5 sm:p-3 lg:p-3.5 rounded-xl lg:rounded-2xl border animate-in fade-in duration-150 font-bangla text-xs lg:text-sm space-y-1.5 ${
                  isLastAnswerCorrect 
                    ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700/80 text-emerald-950 dark:text-emerald-100 shadow-2xs' 
                    : 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700/80 text-rose-950 dark:text-rose-100 shadow-2xs'
                }`}>
                  {/* Top Bar inside Feedback: Status & Correct Answer (Plain text, no box) + Toggle Tips Button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {isLastAnswerCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                      <span className="font-extrabold text-xs">
                        {isLastAnswerCorrect ? 'সঠিক উত্তর:' : 'ভুল উত্তর! সঠিক উত্তর:'}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {correctAnswerText}
                      </span>
                    </div>

                    {/* Single Tips Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setFeedbackTab(prev => prev === 'tips' ? 'answer' : 'tips')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                        feedbackTab === 'tips'
                          ? 'bg-amber-500 text-white shadow-2xs'
                          : 'bg-amber-100/80 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 hover:bg-amber-200/80 border border-amber-300/70 dark:border-amber-700'
                      }`}
                      title="মনে রাখার টিপস"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{feedbackTab === 'tips' ? 'উদাহরণ' : 'টিপস'}</span>
                    </button>
                  </div>

                  {/* Example Sentence without labels */}
                  {feedbackTab === 'answer' && currentQuestion.targetWord.examples && currentQuestion.targetWord.examples[0] && (
                    <div className="pt-1 border-t border-current/10 text-xs leading-relaxed space-y-0.5 animate-in fade-in duration-150">
                      <div className="text-slate-800 dark:text-slate-200 italic font-sans">
                        "{currentQuestion.targetWord.examples[0].english}"
                      </div>
                      {currentQuestion.targetWord.examples[0].bangla && (
                        <div className="text-slate-600 dark:text-slate-400 text-[11px] font-bangla">
                          {currentQuestion.targetWord.examples[0].bangla}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Memory Tips (Smooth slide-in-from-right animation, NOT 3D flip) */}
                  {feedbackTab === 'tips' && (
                    <div className="pt-1 border-t border-current/10 text-xs leading-relaxed space-y-1 animate-in fade-in slide-in-from-right-2 duration-150">
                      <div className="flex items-start gap-1.5 text-amber-950 dark:text-amber-200">
                        <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-amber-900 dark:text-amber-300">মনে রাখার কৌশল: </span>
                          <p className="text-[11px] leading-relaxed">
                            {currentQuestion.targetWord.memoryTip || `"${currentQuestion.targetWord.word}" শব্দটি উদাহরণ বাক্যের প্রেক্ষাপটের সাথে মিলিয়ে মনে রাখুন।`}
                          </p>
                          {currentQuestion.targetWord.synonyms && currentQuestion.targetWord.synonyms.length > 0 && (
                            <p className="text-[10px] text-amber-800 dark:text-amber-300">
                              <span className="font-bold">সমার্থক শব্দ: </span>
                              {currentQuestion.targetWord.synonyms.slice(0, 3).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        </div>
      )}
    </div>
  );
};

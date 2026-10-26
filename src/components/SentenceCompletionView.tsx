import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  RotateCw, 
  Trophy, 
  ArrowRight,
  Flame,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';
import { sound } from '../utils/sound';
import { triggerConfetti } from '../utils/celebration';

interface SentenceCompletionViewProps {
  onBackToHome?: () => void;
}

interface CompletionQuestion {
  id: string;
  sentence: string;
  correctWord: string;
  banglaMeaning: string;
  options: string[];
  explanationBn: string;
}

const CURATED_COMPLETION_QUESTIONS: CompletionQuestion[] = [
  {
    id: 'sc-1',
    sentence: 'The politician made a _______ attempt to win the election by promising things he clearly knew he could never deliver.',
    correctWord: 'Specious',
    banglaMeaning: 'আপাতদৃষ্টিতে ভালো মনে হলেও ভেতরে ফাঁপা বা প্রতারণামূলক',
    options: ['Specious', 'Meticulous', 'Pragmatic', 'Venerable'],
    explanationBn: 'Specious অর্থ বাহ্যত সত্য মনে হলেও মূলত ফাঁপা ও ভিত্তিহীন।'
  },
  {
    id: 'sc-2',
    sentence: 'The diplomat’s _______ response avoided offending either party while cleverly revealing nothing about his true intentions.',
    correctWord: 'Equivocal',
    banglaMeaning: 'দ্ব্যর্থবোধক / অস্পষ্ট বক্তব্য',
    options: ['Equivocal', 'Candid', 'Dogmatic', 'Bellicose'],
    explanationBn: 'Equivocal অর্থ উদ্দেশ্যমূলকভাবে দ্ব্যর্থবোধক কথা বলা।'
  },
  {
    id: 'sc-3',
    sentence: 'Unlike his extravagant brother who squandered his money, Jamal was extraordinarily _______ with his finances.',
    correctWord: 'Parsimonious',
    banglaMeaning: 'অতি সাবধানী / ব্যয়কুণ্ঠ / কৃপণ',
    options: ['Parsimonious', 'Prodigal', 'Ostentatious', 'Audacious'],
    explanationBn: 'অপব্যয়ী ভাইয়ের বিপরীত বোঝাতে Parsimonious (সংযমী/কৃপণ) সঠিক।'
  },
  {
    id: 'sc-4',
    sentence: 'The company CEO was so _______ to criticism that she fired anyone who expressed even the mildest disagreement.',
    correctWord: 'Intolerant',
    banglaMeaning: 'অসহনশীল / বিরুদ্ধমত সহ্য না করা',
    options: ['Intolerant', 'Magnanimous', 'Amiable', 'Compliant'],
    explanationBn: 'সামান্য মতদ্বৈততাতেই বরখাস্ত করায় তিনি ছিলেন Intolerant।'
  },
  {
    id: 'sc-5',
    sentence: 'The research scientist’s _______ work habits and attention to detail ensured that no experimental error was overlooked.',
    correctWord: 'Meticulous',
    banglaMeaning: 'খুঁটিনাটি বিষয়ে অত্যন্ত সতর্ক ও নিখুঁত',
    options: ['Meticulous', 'Cursory', 'Slovenly', 'Capricious'],
    explanationBn: 'খুঁটিনাটি বিষয়ে চরম সতর্কতার সমর্থক Meticulous।'
  },
  {
    id: 'sc-6',
    sentence: 'Although the team suffered a crushing defeat, the captain remained remarkably _______, offering grace to the victors.',
    correctWord: 'Magnanimous',
    banglaMeaning: 'উদারচিত্ত / মহৎ হৃদয়ের অধিকারী',
    options: ['Magnanimous', 'Petulant', 'Vindictive', 'Callous'],
    explanationBn: 'পরাজিত হয়েও বিজয়ীদের প্রতি উদারতা দেখানোই Magnanimous।'
  }
];

export const SentenceCompletionView: React.FC<SentenceCompletionViewProps> = ({
  onBackToHome,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = CURATED_COMPLETION_QUESTIONS[currentIndex];

  const handleSelectOption = (word: string) => {
    if (isAnswered) return;
    setSelectedWord(word);
    setIsAnswered(true);

    if (word.toLowerCase() === currentQ.correctWord.toLowerCase()) {
      sound.playSuccess();
      setScore(s => s + 100);
      setStreak(st => st + 1);
    } else {
      sound.playError();
      setStreak(0);
    }
  };

  const handleNext = () => {
    setSelectedWord(null);
    setIsAnswered(false);
    if (currentIndex < CURATED_COMPLETION_QUESTIONS.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setIsFinished(true);
      triggerConfetti();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedWord(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setIsFinished(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-2.5 font-bangla animate-in fade-in duration-200">
      {/* Ultra Compact Adaptive Header: fits mobile without scroll */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="হোমে ফিরুন"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white whitespace-nowrap">
              শূন্যস্থান পূরণ
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70">
              {currentIndex + 1} / {CURATED_COMPLETION_QUESTIONS.length}
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-sans text-xs font-bold border border-emerald-200/80 dark:border-emerald-800/80">
            <Flame className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
            <span>{streak}x</span>
          </div>
          <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-sans text-xs font-extrabold border border-slate-200 dark:border-slate-700">
            {score}
          </div>
        </div>
      </div>

      {!isFinished ? (
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
          {/* Sentence Display with Blank */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed font-sans">
              "{currentQ.sentence}"
            </p>
            <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-bangla">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">
                <strong>অর্থ: </strong>
                {currentQ.banglaMeaning}
              </span>
            </div>
          </div>

          {/* 4 Choices in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {currentQ.options.map(word => {
              const isSelected = selectedWord === word;
              const isCorrectOpt = word.toLowerCase() === currentQ.correctWord.toLowerCase();

              let style = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 hover:bg-emerald-50/20';
              if (isAnswered) {
                if (isCorrectOpt) {
                  style = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20';
                } else if (isSelected && !isCorrectOpt) {
                  style = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300';
                }
              }

              return (
                <button
                  key={word}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(word)}
                  className={`py-2 px-3 rounded-xl text-left border transition-all cursor-pointer shadow-2xs min-h-[46px] sm:min-h-[50px] flex items-center justify-between active:scale-[0.98] ${style}`}
                >
                  <span className="font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {word}
                  </span>
                  {isAnswered && (
                    isCorrectOpt ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                    ) : isSelected ? (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-1" />
                    ) : null
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {isAnswered && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/90 dark:border-emerald-800/90 text-xs space-y-1.5 animate-in fade-in">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-[11px] sm:text-xs">
                {selectedWord?.toLowerCase() === currentQ.correctWord.toLowerCase() ? '✓ সঠিক উত্তর!' : `✗ ভুল উত্তর! সঠিক শব্দ: ${currentQ.correctWord}`} — {currentQ.explanationBn}
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>{currentIndex < CURATED_COMPLETION_QUESTIONS.length - 1 ? 'পরবর্তী প্রশ্ন' : 'ফলাফল দেখুন'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Completion View */
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-center space-y-4 animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
            <Trophy className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              অভিনন্দন! সব সম্পন্ন হয়েছে! 🎉
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              আপনি সফলভাবে সবকটি শূন্যস্থান পূরণ করেছেন।
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-xs mx-auto">
            <span className="text-[10px] text-slate-400 block font-medium">অর্জিত পয়েন্ট</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-sans">{score}</span>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-2xs transition-all inline-flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>আবার শুরু করুন</span>
          </button>
        </div>
      )}
    </div>
  );
};

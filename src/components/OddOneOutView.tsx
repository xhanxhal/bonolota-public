import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCw, 
  Trophy, 
  ArrowRight,
  Flame,
  ArrowLeft
} from 'lucide-react';
import { sound } from '../utils/sound';
import { triggerConfetti } from '../utils/celebration';

interface OddOneOutViewProps {
  onBackToHome?: () => void;
}

interface OddOneOutQuestion {
  id: string;
  theme: string;
  options: {
    word: string;
    bangla: string;
    isOdd: boolean;
  }[];
  explanationBn: string;
}

const CURATED_ODD_ONE_OUT_QUESTIONS: OddOneOutQuestion[] = [
  {
    id: 'ooo-1',
    theme: 'স্বভাব ও সততা (Honesty)',
    options: [
      { word: 'Candid', bangla: 'অকপট / সত্যবাদী', isOdd: false },
      { word: 'Veracious', bangla: 'সত্যনিষ্ঠ / নির্ভুল', isOdd: false },
      { word: 'Ingenuous', bangla: 'সরল / ভানহীন', isOdd: false },
      { word: 'Mendacious', bangla: 'মিথ্যাবাদী / অসত্য', isOdd: true },
    ],
    explanationBn: 'Candid, Veracious এবং Ingenuous সততার সমর্থক। Mendacious অর্থ মিথ্যাবাদী—তাই এটি অমিল (Odd one out)।'
  },
  {
    id: 'ooo-2',
    theme: 'সাহস ও নির্ভীকতা (Bravery)',
    options: [
      { word: 'Audacious', bangla: 'দুঃসাহসী / নির্ভীক', isOdd: false },
      { word: 'Intrepid', bangla: 'ভয়ডরহীন / অকুতোভয়', isOdd: false },
      { word: 'Dauntless', bangla: 'অদম্য / অকুতোভয়', isOdd: false },
      { word: 'Timorous', bangla: 'ভীরু / দুর্বলচিত্ত', isOdd: true },
    ],
    explanationBn: 'Audacious, Intrepid এবং Dauntless সাহসের সমর্থক। কিন্তু Timorous অর্থ ভীতু বা দুর্বলচিত্ত।'
  },
  {
    id: 'ooo-3',
    theme: 'অর্থ ও খরচ (Money)',
    options: [
      { word: 'Parsimonious', bangla: 'অতি কৃপণ / ব্যয়কুণ্ঠ', isOdd: false },
      { word: 'Miserly', bangla: 'কৃপণ / হাতভারী', isOdd: false },
      { word: 'Penurious', bangla: 'চরম কৃপণ / নিস্ব', isOdd: false },
      { word: 'Prodigal', bangla: 'উড়নচণ্ডী / অপব্যয়ী', isOdd: true },
    ],
    explanationBn: 'Parsimonious, Miserly এবং Penurious অর্থ কৃপণতা। Prodigal অর্থ দু’হাতে টাকা ওড়ানো বা অপব্যয়ী।'
  },
  {
    id: 'ooo-4',
    theme: 'শব্দ ও কোলাহল (Noise)',
    options: [
      { word: 'Cacophony', bangla: 'কর্কশ আওয়াজ', isOdd: false },
      { word: 'Clamor', bangla: 'চিৎকার / কোলাহল', isOdd: false },
      { word: 'Din', bangla: 'বিকট শব্দ', isOdd: false },
      { word: 'Euphony', bangla: 'শ্রুতিমধুর সুর', isOdd: true },
    ],
    explanationBn: 'Cacophony, Clamor এবং Din হলো বিশৃঙ্খল কর্কশ শব্দ। Euphony অর্থ মিষ্টি সুর বা মধুর ধ্বনি।'
  },
  {
    id: 'ooo-5',
    theme: 'স্থায়িত্ব ও সময় (Time)',
    options: [
      { word: 'Ephemeral', bangla: 'ক্ষণস্থায়ী / সাময়িক', isOdd: false },
      { word: 'Transient', bangla: 'ক্ষণস্থায়ী / অস্থায়ী', isOdd: false },
      { word: 'Fleeting', bangla: 'ক্ষণস্থায়ী / দ্রুত শেষ', isOdd: false },
      { word: 'Perennial', bangla: 'চিরস্থায়ী / বারোমেসে', isOdd: true },
    ],
    explanationBn: 'Ephemeral, Transient এবং Fleeting অল্প সময়ের জন্য টেকে। Perennial অর্থ চিরস্থায়ী বা বারোমেসে।'
  },
  {
    id: 'ooo-6',
    theme: 'মনোভাব ও মেজাজ (Peace & Calm)',
    options: [
      { word: 'Placid', bangla: 'শান্ত / নির্বিকার', isOdd: false },
      { word: 'Serene', bangla: 'প্রশান্ত / নিরুদ্বেগ', isOdd: false },
      { word: 'Tranquil', bangla: 'শান্ত ও নিরিবিলি', isOdd: false },
      { word: 'Belligerent', bangla: 'যুদ্ধংদেহী / মারমুখী', isOdd: true },
    ],
    explanationBn: 'Placid, Serene এবং Tranquil শব্দগুলো প্রশান্তি বোঝায়। কিন্তু Belligerent অর্থ মারমুখী বা ঝগড়াটে।'
  }
];

export const OddOneOutView: React.FC<OddOneOutViewProps> = ({
  onBackToHome,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = CURATED_ODD_ONE_OUT_QUESTIONS[currentIndex];

  const handleSelectOption = (word: string, isOdd: boolean) => {
    if (isAnswered) return;
    setSelectedWord(word);
    setIsAnswered(true);

    if (isOdd) {
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
    if (currentIndex < CURATED_ODD_ONE_OUT_QUESTIONS.length - 1) {
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
      {/* Ultra Compact Adaptive Header: fits on mobile without scroll */}
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
              Odd One Out
            </span>
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70">
              {currentIndex + 1} / {CURATED_ODD_ONE_OUT_QUESTIONS.length}
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
        <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          {/* Question Theme & Prompt in one tight line */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
              কোন শব্দটি বাকি ৩টির সাথে অমিল?
            </h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
              {currentQ.theme}
            </span>
          </div>

          {/* 4 Choices in 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {currentQ.options.map(opt => {
              const isSelected = selectedWord === opt.word;

              let style = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 hover:bg-emerald-50/20';
              if (isAnswered) {
                if (opt.isOdd) {
                  style = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20';
                } else if (isSelected && !opt.isOdd) {
                  style = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300';
                }
              }

              return (
                <button
                  key={opt.word}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(opt.word, opt.isOdd)}
                  className={`p-2.5 sm:p-3 rounded-xl text-left border transition-all cursor-pointer shadow-2xs min-h-[52px] sm:min-h-[58px] flex flex-col justify-between active:scale-[0.98] ${style}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-sans font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {opt.word}
                    </span>
                    {isAnswered && (
                      opt.isOdd ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-1" />
                      ) : null
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                    {opt.bangla}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Explanation Banner & Next Button */}
          {isAnswered && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200/90 dark:border-emerald-800/90 text-xs space-y-1.5 animate-in fade-in">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-[11px] sm:text-xs">
                  💡 {currentQ.explanationBn}
                </span>
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>{currentIndex < CURATED_ODD_ONE_OUT_QUESTIONS.length - 1 ? 'পরবর্তী প্রশ্ন' : 'ফলাফল দেখুন'}</span>
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
              চমৎকার সমাপ্তি! 🎉
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Odd One Out কুইজ সফলভাবে সম্পন্ন করেছেন।
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

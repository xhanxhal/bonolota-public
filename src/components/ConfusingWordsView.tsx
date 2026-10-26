import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Search, 
  Volume2, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Lightbulb,
  Check,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { CONFUSING_WORDS, ConfusingWordItem } from '../data/confusingWordsData';
import { AudioButton } from './AudioButton';
import { sound } from '../utils/sound';

interface ConfusingWordsViewProps {
  onBackToHome?: () => void;
}

export const ConfusingWordsView: React.FC<ConfusingWordsViewProps> = ({
  onBackToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'quiz'>('browse');

  // Interactive Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const filteredPairs = useMemo(() => {
    if (!searchQuery.trim()) return CONFUSING_WORDS;
    const q = searchQuery.toLowerCase().trim();
    return CONFUSING_WORDS.filter(item => 
      item.pair[0].word.toLowerCase().includes(q) ||
      item.pair[1].word.toLowerCase().includes(q) ||
      item.pair[0].banglaMeaning.includes(q) ||
      item.pair[1].banglaMeaning.includes(q) ||
      item.mnemonicTip.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Generate quiz questions dynamically from the confusing words dataset
  const quizQuestions = useMemo(() => {
    return CONFUSING_WORDS.map((item, idx) => {
      const targetWord = idx % 2 === 0 ? item.pair[0] : item.pair[1];
      const otherWord = idx % 2 === 0 ? item.pair[1] : item.pair[0];
      
      const regex = new RegExp(`\\b${targetWord.word}\\b`, 'gi');
      const questionSentence = targetWord.example.replace(regex, '_______');

      return {
        item,
        targetWord,
        otherWord,
        questionSentence,
      };
    });
  }, []);

  const currentQuiz = quizQuestions[quizIndex];

  const handleSelectQuizAnswer = (word: string) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(word);
    setIsAnswerChecked(true);

    if (word.toLowerCase() === currentQuiz.targetWord.word.toLowerCase()) {
      sound.playSuccess();
      setQuizScore(s => s + 1);
    } else {
      sound.playError();
    }
  };

  const handleNextQuiz = () => {
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(i => i + 1);
    } else {
      setQuizIndex(0);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 font-bangla animate-in fade-in duration-200">
      {/* Top Banner - Minimal Homepage Style */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 p-5 sm:p-6 shadow-xs border border-emerald-100/90 dark:border-emerald-900/40 text-slate-900 dark:text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
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
                কনফিউশন নিরসন
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              সহজেই গুলিয়ে ফেলা শব্দের জোড়া (Confusing Words)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
              Compliment বনাম Complement, Ingenious বনাম Ingenuous — স্পষ্ট পার্থক্য ও নির্ভুল প্রয়োগ।
            </p>
          </div>

          {/* Tab Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              শব্দের জোড়া ({CONFUSING_WORDS.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              প্র্যাকটিস কুইজ
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="যেকোনো জোড়া শব্দ বা অর্থ দিয়ে খুঁজুন (যেমন: affect, stationery, ingenious)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-500 shadow-2xs"
            />
          </div>

          {/* Cards List */}
          <div className="space-y-3.5">
            {filteredPairs.map((item, index) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all space-y-3"
              >
                {/* Header line */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center font-sans border border-emerald-200/60 dark:border-emerald-800/60">
                      {index + 1}
                    </span>
                    <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white font-sans">
                      {item.pair[0].word} <span className="text-slate-400 font-normal">vs</span> {item.pair[1].word}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    জোড়া তুলনামূলক ড্রিল
                  </span>
                </div>

                {/* Side-by-side comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Left Word */}
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-sans font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                          {item.pair[0].word}
                        </h4>
                        <AudioButton word={item.pair[0].word} size="sm" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.pair[0].pronunciation}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700">
                        {item.pair[0].partOfSpeech}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                        {item.pair[0].banglaMeaning}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      💡 {item.pair[0].difference}
                    </p>

                    <p className="text-xs italic text-slate-600 dark:text-slate-300 font-sans pt-0.5">
                      "{item.pair[0].example}"
                    </p>
                  </div>

                  {/* Right Word */}
                  <div className="p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-sans font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                          {item.pair[1].word}
                        </h4>
                        <AudioButton word={item.pair[1].word} size="sm" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {item.pair[1].pronunciation}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700">
                        {item.pair[1].partOfSpeech}
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                        {item.pair[1].banglaMeaning}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                      💡 {item.pair[1].difference}
                    </p>

                    <p className="text-xs italic text-slate-600 dark:text-slate-300 font-sans pt-0.5">
                      "{item.pair[1].example}"
                    </p>
                  </div>
                </div>

                {/* Mnemonic Memory Trick */}
                <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">মনে রাখার কৌশল: </span>
                    {item.mnemonicTip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Interactive Quiz Mode */
        <div className="max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>প্রশ্ন {quizIndex + 1} / {quizQuestions.length}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-sans">স্কোর: {quizScore}</span>
          </div>

          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              বাক্যের শূন্যস্থানে সঠিক শব্দটি বেছে নিন:
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed font-sans p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              "{currentQuiz.questionSentence}"
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              বাংলা অর্থ: {currentQuiz.targetWord.banglaMeaning} ({currentQuiz.targetWord.partOfSpeech})
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[currentQuiz.item.pair[0].word, currentQuiz.item.pair[1].word].map(opt => {
              const isSelected = selectedAnswer === opt;
              const isCorrectOpt = opt.toLowerCase() === currentQuiz.targetWord.word.toLowerCase();

              let buttonStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-400';
              if (isAnswerChecked) {
                if (isCorrectOpt) {
                  buttonStyle = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/30';
                } else if (isSelected && !isCorrectOpt) {
                  buttonStyle = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300';
                }
              }

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={isAnswerChecked}
                  onClick={() => handleSelectQuizAnswer(opt)}
                  className={`p-3.5 rounded-xl font-sans font-extrabold text-base border transition-all cursor-pointer shadow-2xs ${buttonStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation if answered */}
          {isAnswerChecked && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs space-y-1.5 animate-in fade-in">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                {selectedAnswer?.toLowerCase() === currentQuiz.targetWord.word.toLowerCase() ? '✓ সঠিক উত্তর!' : '✗ ভুল উত্তর!'}
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {currentQuiz.item.mnemonicTip}
              </p>
              <button
                type="button"
                onClick={handleNextQuiz}
                className="mt-2 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>পরবর্তী প্রশ্ন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

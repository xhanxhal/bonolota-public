import React from 'react';
import { 
  Flame, 
  Target, 
  Trophy, 
  BookOpen, 
  Sparkles, 
  Check, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { LearningStats, VocabWord } from '../data/types';
import { getAllWords } from '../data/units';
import { storage } from '../utils/storage';
import { Mascot } from './Mascot';

interface DuolingoRightPanelProps {
  stats: LearningStats;
  onOpenFlashcards: (unitId: number, filter?: 'all' | 'favorites' | 'difficult') => void;
  onStartQuiz: () => void;
  onOpenWordDetail: (word: VocabWord) => void;
}

export const DuolingoRightPanel: React.FC<DuolingoRightPanelProps> = ({
  stats,
  onOpenFlashcards,
  onStartQuiz,
  onOpenWordDetail,
}) => {
  const allWords = getAllWords();
  const settings = storage.getSettings();
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  const revisionIds = storage.getRevisionWordIds();
  const revisionWords = allWords.filter(w => revisionIds.includes(w.id));

  // Daily goal calculation
  const goalTarget = settings.dailyGoal;
  const currentDailyDone = Math.min(goalTarget, stats.wordsStudied);
  const goalPercent = Math.min(100, Math.round((currentDailyDone / goalTarget) * 100));

  return (
    <div className="hidden xl:flex flex-col gap-5 w-80 shrink-0">
      {/* Streak Week Card */}
      <div className="duo-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#777777] dark:text-[#a5b2b8]">
            Study Streak
          </h3>
          <span className="font-black text-sm text-[#ff9600] flex items-center gap-1">
            🔥 {stats.learningStreak} days
          </span>
        </div>

        {/* 7 day circles */}
        <div className="flex items-center justify-between pt-1">
          {daysOfWeek.map((day, idx) => {
            const isToday = idx === todayIndex;
            const isDone = isToday && stats.learningStreak > 0;

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-extrabold text-[#afafaf]">{day}</span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                    isDone
                      ? 'bg-[#ff9600] text-white shadow-xs'
                      : isToday
                      ? 'border-2 border-dashed border-[#ff9600] text-[#ff9600]'
                      : 'bg-[#e5e5e5] dark:bg-[#37464f] text-[#afafaf]'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : day}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Quests Card (Duolingo signature quest box) */}
      <div className="duo-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h3 className="font-extrabold text-base text-[#4b4b4b] dark:text-white">
              Daily Quests
            </h3>
          </div>
          <span className="text-xs font-black text-[#58cc02] uppercase tracking-wider">
            {goalPercent}% Done
          </span>
        </div>

        <div className="space-y-3">
          {/* Quest 1 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#4b4b4b] dark:text-slate-300">
              <span>Study {goalTarget} words today</span>
              <span className="font-mono text-[#777777]">{currentDailyDone}/{goalTarget}</span>
            </div>
            <div className="h-3 w-full bg-[#e5e5e5] dark:bg-[#37464f] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#58cc02] rounded-full transition-all duration-300"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>

          {/* Quest 2 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-[#4b4b4b] dark:text-slate-300">
              <span>Score 80%+ on any quiz</span>
              <span className="font-mono text-[#777777]">{stats.quizzesTaken > 0 && stats.quizAccuracy >= 80 ? '1/1' : '0/1'}</span>
            </div>
            <div className="h-3 w-full bg-[#e5e5e5] dark:bg-[#37464f] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ffc800] rounded-full transition-all duration-300"
                style={{ width: `${stats.quizzesTaken > 0 && stats.quizAccuracy >= 80 ? 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Difficult Words Spotlight Card */}
      {revisionWords.length > 0 && (
        <div className="duo-card p-5 space-y-3 bg-[#fff0f0] dark:bg-[#2b1f24] border-[#ff4b4b]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#ff4b4b] uppercase tracking-wider">
              <span>Review Mistakes</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#ff4b4b] text-white font-mono text-xs font-black">
              {revisionWords.length}
            </span>
          </div>

          <p className="text-xs text-[#777777] dark:text-[#a5b2b8] font-bold leading-relaxed">
            You missed these words recently. Practice them now to build memory strength!
          </p>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {revisionWords.slice(0, 4).map(w => (
              <div
                key={w.id}
                onClick={() => onOpenWordDetail(w)}
                className="p-2 rounded-xl bg-white dark:bg-[#202f36] border border-[#ff4b4b]/20 flex items-center justify-between cursor-pointer hover:border-[#ff4b4b]"
              >
                <span className="font-black text-xs text-[#4b4b4b] dark:text-white">{w.word}</span>
                <span className="font-bangla text-xs font-bold text-[#ff4b4b] truncate max-w-[120px]">
                  {w.banglaMeaning}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onOpenFlashcards(1, 'difficult')}
            className="w-full py-2.5 rounded-xl btn-duo-red text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Practice Mistakes</span>
          </button>
        </div>
      )}

      {/* Unit 1 Guidebook Shortcut */}
      <div className="duo-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#58cc02]" />
          <h3 className="font-black text-sm text-[#4b4b4b] dark:text-white">
            Unit 1 Guidebook
          </h3>
        </div>
        <p className="text-xs text-[#777777] dark:text-[#a5b2b8] font-bold leading-relaxed">
          Quickly review all 64 words, Bangla definitions, roots (ambi, cede, err), and example sentences.
        </p>
        <button
          type="button"
          onClick={onStartQuiz}
          className="w-full py-2.5 rounded-xl btn-duo-green text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Target className="w-4 h-4" />
          <span>Quick Quiz Challenge</span>
        </button>
      </div>
    </div>
  );
};

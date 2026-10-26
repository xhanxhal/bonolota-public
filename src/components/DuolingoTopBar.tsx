import React from 'react';
import { Flame, Gem, Heart, Volume2, VolumeX, Moon, Sun } from 'lucide-react';
import { UserSettings, LearningStats } from '../data/types';
import { storage } from '../utils/storage';

interface DuolingoTopBarProps {
  stats: LearningStats;
  settings: UserSettings;
  onToggleSound: () => void;
  onToggleTheme: () => void;
}

export const DuolingoTopBar: React.FC<DuolingoTopBarProps> = ({
  stats,
  settings,
  onToggleSound,
  onToggleTheme,
}) => {
  // Gems / XP calculated from words studied and quizzes taken
  const xp = stats.wordsStudied * 10 + stats.wordsMastered * 25 + stats.quizzesTaken * 20;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white dark:bg-[#131f24] border-b-2 border-[#e5e5e5] dark:border-[#37464f] z-30">
      {/* Brand logo for mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-8 h-8 rounded-xl bg-[#58cc02] text-white flex items-center justify-center font-black text-base shadow-sm">
          শ
        </div>
        <span className="font-extrabold text-lg text-[#58cc02] tracking-tight">
          shobdosetu
        </span>
      </div>

      {/* Gamification Counters (Duolingo Style: Streak, Gems, Hearts) */}
      <div className="flex items-center gap-3 sm:gap-6 ml-auto">
        {/* Streak Counter */}
        <div
          title={`Day Streak: ${stats.learningStreak} days`}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-[#f7f7f7] dark:hover:bg-[#202f36] cursor-pointer transition-colors"
        >
          <span className="text-xl select-none">🔥</span>
          <span className={`font-extrabold text-sm sm:text-base font-mono tabular-nums ${
            stats.learningStreak > 0 ? 'text-[#ff9600]' : 'text-[#afafaf]'
          }`}>
            {stats.learningStreak}
          </span>
        </div>

        {/* Gems / XP Counter */}
        <div
          title={`Gems earned: ${xp}`}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-[#f7f7f7] dark:hover:bg-[#202f36] cursor-pointer transition-colors"
        >
          <span className="text-xl select-none">💎</span>
          <span className="font-extrabold text-sm sm:text-base font-mono tabular-nums text-[#1cb0f6]">
            {xp}
          </span>
        </div>

        {/* Hearts / Lives Counter */}
        <div
          title="Hearts (Unlimited study mode)"
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl hover:bg-[#f7f7f7] dark:hover:bg-[#202f36] cursor-pointer transition-colors"
        >
          <span className="text-xl select-none">❤️</span>
          <span className="font-extrabold text-sm sm:text-base font-mono tabular-nums text-[#ff4b4b]">
            5
          </span>
        </div>

        <div className="h-5 w-[2px] bg-[#e5e5e5] dark:bg-[#37464f] hidden sm:block" />

        {/* Sound toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          title={settings.soundEnabled ? 'Mute sound' : 'Enable sound effects'}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            settings.soundEnabled
              ? 'text-[#58cc02] hover:bg-[#58cc02]/10'
              : 'text-[#afafaf] hover:bg-[#f7f7f7] dark:hover:bg-[#202f36]'
          }`}
        >
          {settings.soundEnabled ? <Volume2 className="w-5 h-5 stroke-[2.5]" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title="Toggle Dark / Light Mode"
          className="p-2 rounded-xl text-[#777777] hover:bg-[#f7f7f7] dark:hover:bg-[#202f36] cursor-pointer transition-colors"
        >
          {settings.theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-[#ffc800]" />}
        </button>
      </div>
    </div>
  );
};

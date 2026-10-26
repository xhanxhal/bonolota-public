import React from 'react';
import { 
  Home, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Archive, 
  RotateCw, 
  BarChart2, 
  Star, 
  Settings,
  Sparkles
} from 'lucide-react';
import { NavTab } from './Navbar';

interface DuolingoSidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const DuolingoSidebar: React.FC<DuolingoSidebarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const navItems = [
    { id: 'home', label: 'LEARN', icon: Home, color: '#58cc02' },
    { id: 'learn', label: 'LESSONS', icon: BookOpen, color: '#58cc02' },
    { id: 'flashcards', label: 'FLASHCARDS', icon: Layers, color: '#1cb0f6' },
    { id: 'quiz', label: 'QUIZZES', icon: HelpCircle, color: '#ff9600' },
    { id: 'archive', label: 'VOCAB ARCHIVE', icon: Archive, color: '#ce82ff' },
    { id: 'revision', label: 'MISTAKES', icon: RotateCw, color: '#ff4b4b' },
    { id: 'favorites', label: 'SAVED WORDS', icon: Star, color: '#ffc800' },
    { id: 'progress', label: 'PROGRESS', icon: BarChart2, color: '#2b70c9' },
    { id: 'settings', label: 'SETTINGS', icon: Settings, color: '#777777' },
  ] as const;

  return (
    <aside className="hidden lg:flex flex-col justify-between w-64 h-screen sticky top-0 border-r-2 border-[#e5e5e5] dark:border-[#37464f] p-4 bg-white dark:bg-[#131f24] shrink-0 z-30 select-none">
      <div>
        {/* Brand header with Duolingo style green lowercase wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 px-3 py-4 mb-4 cursor-pointer text-left w-full hover:opacity-90"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#58cc02] border-b-4 border-[#46a302] text-white flex items-center justify-center font-black text-xl shadow-xs">
            শ
          </div>
          <span className="font-black text-2xl tracking-tight text-[#58cc02] lowercase">
            shobdosetu
          </span>
        </button>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-xs md:text-sm font-black tracking-wider transition-all duration-100 cursor-pointer ${
                  isActive
                    ? 'bg-[#ddf4ff] dark:bg-[#18394a] text-[#1cb0f6] border-2 border-[#84d8ff] dark:border-[#1cb0f6]'
                    : 'text-[#777777] dark:text-[#a5b2b8] hover:bg-[#f7f7f7] dark:hover:bg-[#202f36] border-2 border-transparent'
                }`}
              >
                <Icon
                  className="w-5 h-5 stroke-[2.5]"
                  style={{ color: isActive ? '#1cb0f6' : item.color }}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Mascot Tip */}
      <div className="p-3.5 rounded-2xl bg-[#f7f7f7] dark:bg-[#202f36] border border-[#e5e5e5] dark:border-[#37464f] text-xs text-[#777777] dark:text-[#a5b2b8] font-bold">
        <p className="leading-relaxed">
          💡 Practice 5 minutes daily to retain 90% of your Unit 1 vocabulary!
        </p>
      </div>
    </aside>
  );
};

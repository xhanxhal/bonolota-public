import React, { useState } from 'react';
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
  Menu, 
  X,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { UserSettings } from '../data/types';

export type NavTab = 
  | 'home' 
  | 'learn' 
  | 'flashcards' 
  | 'quiz' 
  | 'archive' 
  | 'info' 
  | 'revision' 
  | 'progress' 
  | 'favorites' 
  | 'settings'
  | 'match-game'
  | 'confusing-words'
  | 'odd-one-out'
  | 'sentence-completion'
  | 'stories'
  | 'thematic-clusters'
  | 'cheat-sheet'
  | 'card-generator'
  | 'explore';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  settings: UserSettings;
  onToggleSound: () => void;
  onQuickAction: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  settings,
  onToggleSound,
  onQuickAction,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'learn', label: 'Learn' },
    { id: 'flashcards', label: 'Flashcards' },
    { id: 'quiz', label: 'Quizzes' },
    { id: 'info', label: 'Info' },
    { id: 'revision', label: 'Revision' },
  ] as const;

  const secondaryLinks = [
    { id: 'progress', label: 'Progress', icon: BarChart2 },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* ZONE 1: BRAND WORDMARK */}
          <button
            type="button"
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              ব
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Bonolota
            </span>
          </button>

          {/* ZONE 2: PRIMARY NAVIGATION LINKS (Single-line, concise) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {navLinks.map(link => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleTabClick(link.id)}
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 ${
                  currentTab === link.id
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Secondary items */}
            {secondaryLinks.map(sec => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => handleTabClick(sec.id)}
                  title={sec.label}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    currentTab === sec.id
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: PRIMARY ACTION & UTILITIES */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick sound toggle */}
            <button
              type="button"
              onClick={onToggleSound}
              title={settings.soundEnabled ? 'Sound is on (Click to mute)' : 'Sound is off (Click to enable)'}
              className={`p-2 rounded-xl transition-colors cursor-pointer hidden sm:flex ${
                settings.soundEnabled
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={onQuickAction}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
            >
              Start Practice
            </button>

            {/* Mobile hamburger button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE EXPANDED MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-1 animate-in slide-in-from-top-2 duration-150">
          {[...navLinks, ...secondaryLinks].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id as NavTab)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                currentTab === item.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{item.label}</span>
              {currentTab === item.id && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
            </button>
          ))}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-4">
            <span className="text-xs font-semibold text-slate-500">Audio Sound Effects</span>
            <button
              type="button"
              onClick={onToggleSound}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                settings.soundEnabled
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200'
              }`}
            >
              {settings.soundEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

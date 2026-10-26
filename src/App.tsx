import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Info,
  LayoutGrid,
  Heart
} from 'lucide-react';
import { ModernSidebar } from './components/ModernSidebar';
import { ModernHeader } from './components/ModernHeader';
import { NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { LessonView } from './components/LessonView';
import { FlashcardsView } from './components/FlashcardsView';
import { QuizView } from './components/QuizView';
import { ArchiveView } from './components/ArchiveView';
import { InfoView } from './components/InfoView';
import { RevisionView } from './components/RevisionView';
import { ProgressView } from './components/ProgressView';
import { FavoritesView } from './components/FavoritesView';
import { SettingsView } from './components/SettingsView';
import { WordDetailModal } from './components/WordDetailModal';
import { MatchGameView } from './components/MatchGameView';
import { ConfusingWordsView } from './components/ConfusingWordsView';
import { OddOneOutView } from './components/OddOneOutView';
import { SentenceCompletionView } from './components/SentenceCompletionView';
import { StoryModeView } from './components/StoryModeView';
import { ThematicClustersView } from './components/ThematicClustersView';
import { CardGeneratorView } from './components/CardGeneratorView';
import { CheatSheetView } from './components/CheatSheetView';
import { ExploreSectionsView } from './components/ExploreSectionsView';
import { VocabWord, UserSettings, LearningStats } from './data/types';
import { getAllWords } from './data/units';
import { storage } from './utils/storage';
import { offlineDatabaseCache } from './utils/offlineDatabaseCache';
import { OfflineIndicator } from './components/OfflineIndicator';
import { haptics } from './utils/haptics';
import { useLicenseAuth } from './hooks/useLicenseAuth';
import { AccessKeyScreen } from './components/AccessKeyScreen';
import { AdminPortal } from './components/admin/AdminPortal';
import { Sparkles as SparklesIcon } from 'lucide-react';

export default function App() {
  const auth = useLicenseAuth();
  const [isAdminSlugMatched, setIsAdminSlugMatched] = useState<boolean | null>(null);

  // Check if current URL matches the private admin slug
  useEffect(() => {
    const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (rawPath.startsWith('x-')) {
      fetch('/api/system/verify-admin-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: rawPath }),
      })
        .then(res => res.json())
        .then(data => {
          setIsAdminSlugMatched(Boolean(data.valid));
        })
        .catch(() => {
          setIsAdminSlugMatched(false);
        });
    } else {
      setIsAdminSlugMatched(false);
    }
  }, []);

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const [stats, setStats] = useState<LearningStats>(() => storage.getLearningStats());
  
  // Word Detail Modal state
  const [activeWordDetail, setActiveWordDetail] = useState<VocabWord | null>(null);
  const [detailWordList, setDetailWordList] = useState<VocabWord[]>(() => getAllWords());
  const [cardGeneratorWord, setCardGeneratorWord] = useState<VocabWord | null>(null);

  // Flashcards configuration state
  const [flashcardsUnitId, setFlashcardsUnitId] = useState<number>(1);
  const [flashcardsFilter, setFlashcardsFilter] = useState<'all' | 'favorites' | 'difficult'>('all');

  // Active Unit selection for Lesson & Quiz
  const [selectedLessonUnitId, setSelectedLessonUnitId] = useState<number>(1);
  const [selectedQuizUnitId, setSelectedQuizUnitId] = useState<number>(1);

  // Initialize local offline database cache
  useEffect(() => {
    offlineDatabaseCache.init();
  }, []);

  // Refresh stats whenever user navigates tabs or studies
  useEffect(() => {
    setStats(storage.getLearningStats());
  }, [currentTab]);

  // Sync theme with DOM (both class and data-theme attribute)
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [settings.theme]);

  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
  };

  const handleToggleSound = () => {
    haptics.toggle();
    const updated = storage.saveSettings({ soundEnabled: !settings.soundEnabled });
    setSettings(updated);
  };

  const handleToggleTheme = () => {
    haptics.toggle();
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    const updated = storage.saveSettings({ theme: newTheme });
    setSettings(updated);
  };

  const handleOpenWordDetail = (word: VocabWord, customList?: VocabWord[]) => {
    haptics.tap();
    setActiveWordDetail(word);
    if (customList && customList.length > 0) {
      setDetailWordList(customList);
    } else {
      setDetailWordList(getAllWords());
    }
  };

  const handleStartLesson = (unitId: number) => {
    haptics.tap();
    setSelectedLessonUnitId(unitId);
    setCurrentTab('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartQuiz = (unitId: number = 1) => {
    haptics.tap();
    setSelectedQuizUnitId(unitId);
    setCurrentTab('quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFlashcards = (unitId: number, filter: 'all' | 'favorites' | 'difficult' = 'all') => {
    haptics.tap();
    setFlashcardsUnitId(unitId);
    setFlashcardsFilter(filter);
    setCurrentTab('flashcards');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartRevisionDrill = (wordIds: string[]) => {
    haptics.tap();
    setFlashcardsUnitId(1);
    setFlashcardsFilter('difficult');
    setCurrentTab('flashcards');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Route Handling (Completely hidden from public UI navigation)
  if (isAdminSlugMatched === true) {
    return <AdminPortal onExitAdmin={() => { window.location.href = '/'; }} />;
  }

  // Waiting for admin slug check if on potential admin path
  if (isAdminSlugMatched === null && window.location.pathname.replace(/^\/+|\/+$/g, '').startsWith('x-')) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Session authentication loading state
  if (auth.isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0b1120]">
        <div className="flex flex-col items-center gap-3 font-bangla">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">শব্দসেতু ভেরিফাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // If visitor is unauthenticated and hasn't chosen to explore the free preview
  if (!auth.isAuthenticated && !auth.isDemoMode) {
    return (
      <AccessKeyScreen
        onActivate={auth.activateKey}
        onExploreDemo={auth.enableDemoMode}
        isLoading={auth.isLoading}
        errorMessage={auth.error}
      />
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden flex bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* MODERN ELEGANT SIDEBAR (Desktop) */}
      <ModernSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        stats={stats}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* CENTER CONTENT COLUMN */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Demo Mode Notice Banner */}
        {auth.isDemoMode && (
          <aside aria-label="Demo notice" className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white text-xs sm:text-sm font-bold py-2.5 px-4 shadow-sm flex items-center justify-between font-bangla sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 shrink-0 animate-pulse text-amber-200" />
              <span>ডেমো মোড: আপনি ইউনিট ১ ট্রায়াল দিচ্ছেন (২০টি শব্দ)। সম্পূর্ণ ৫০টি ইউনিট আনলক করতে অ্যাক্সেস কি দিন।</span>
            </div>
            <button
              type="button"
              onClick={auth.exitDemoMode}
              className="px-3 py-1 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-xs hover:bg-slate-100 transition-all cursor-pointer whitespace-nowrap ml-2"
            >
              অ্যাক্সেস কি দিন →
            </button>
          </aside>
        )}

        {/* MODERN ELEGANT TOP BAR */}
        <ModernHeader
          stats={stats}
          settings={settings}
          onToggleSound={handleToggleSound}
          onToggleTheme={handleToggleTheme}
          onSelectTab={setCurrentTab}
          currentTab={currentTab}
        />

        {/* MAIN BODY: Generous max-w-7xl width for multi-column grid layout */}
        <main className={`flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 ${
          currentTab === 'quiz' || currentTab === 'flashcards' || currentTab === 'match-game' || currentTab === 'odd-one-out' || currentTab === 'sentence-completion'
            ? 'py-1 sm:py-2 pb-16 sm:pb-6 flex flex-col justify-start' 
            : currentTab === 'explore'
            ? 'py-2.5 sm:py-4 pb-20 sm:pb-8'
            : 'py-4 sm:py-6 pb-24 lg:pb-12'
        }`}>
          {currentTab === 'home' && (
            <DashboardView
              onStartLesson={handleStartLesson}
              onOpenFlashcards={handleOpenFlashcards}
              onStartQuiz={handleStartQuiz}
              onOpenRevision={() => setCurrentTab('revision')}
              onOpenArchive={() => setCurrentTab('info')}
              onOpenWordDetail={handleOpenWordDetail}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'learn' && (
            <LessonView
              unitId={selectedLessonUnitId}
              onOpenWordDetail={handleOpenWordDetail}
              onNavigateToFlashcards={(uid) => handleOpenFlashcards(uid)}
              onNavigateToQuiz={(uid) => handleStartQuiz(uid)}
              onBackToUnits={() => setCurrentTab('home')}
              onSelectUnit={(uid) => setSelectedLessonUnitId(uid)}
            />
          )}

          {currentTab === 'flashcards' && (
            <FlashcardsView
              initialUnitId={flashcardsUnitId}
              initialFilter={flashcardsFilter}
              onNavigateToQuiz={() => handleStartQuiz(flashcardsUnitId)}
              onOpenWordDetail={handleOpenWordDetail}
            />
          )}

          {currentTab === 'quiz' && (
            <QuizView
              initialUnitId={selectedQuizUnitId}
              onOpenWordDetail={handleOpenWordDetail}
              onNavigateToFlashcards={(uid) => handleOpenFlashcards(uid)}
            />
          )}

          {currentTab === 'match-game' && (
            <MatchGameView
              onBackToHome={() => setCurrentTab('home')}
              onOpenWordDetail={handleOpenWordDetail}
            />
          )}

          {currentTab === 'confusing-words' && (
            <ConfusingWordsView
              onBackToHome={() => setCurrentTab('home')}
            />
          )}

          {currentTab === 'odd-one-out' && (
            <OddOneOutView
              onBackToHome={() => setCurrentTab('home')}
            />
          )}

          {currentTab === 'sentence-completion' && (
            <SentenceCompletionView
              onBackToHome={() => setCurrentTab('home')}
            />
          )}

          {currentTab === 'stories' && (
            <StoryModeView
              onBackToHome={() => setCurrentTab('home')}
              onOpenWordDetailByName={(name) => {
                const found = getAllWords().find(w => w.word.toLowerCase() === name.toLowerCase());
                if (found) handleOpenWordDetail(found);
              }}
            />
          )}

          {currentTab === 'thematic-clusters' && (
            <ThematicClustersView
              onOpenWordDetail={handleOpenWordDetail}
              onBackToHome={() => setCurrentTab('home')}
            />
          )}

          {currentTab === 'card-generator' && (
            <CardGeneratorView
              initialWord={cardGeneratorWord || activeWordDetail}
              onBackToHome={() => setCurrentTab('home')}
            />
          )}

          {currentTab === 'cheat-sheet' && (
            <CheatSheetView
              onBackToHome={() => setCurrentTab('home')}
            />
          )}

          {currentTab === 'explore' && (
            <ExploreSectionsView
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBackToHome={() => setCurrentTab('home')}
            />
          )}

          {(currentTab === 'info' || currentTab === 'archive') && (
            <InfoView />
          )}

          {currentTab === 'revision' && (
            <RevisionView
              onStartFlashcardDrill={handleStartRevisionDrill}
              onOpenWordDetail={handleOpenWordDetail}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressView />
          )}

          {currentTab === 'favorites' && (
            <FavoritesView
              onOpenWordDetail={handleOpenWordDetail}
              onStartFlashcards={(filter) => handleOpenFlashcards(1, filter)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              licenseInfo={{
                isAuthenticated: auth.isAuthenticated,
                isDemoMode: auth.isDemoMode,
                daysLeft: auth.daysLeft,
                expiresAt: auth.expiresAt,
                keyMasked: auth.keyMasked,
              }}
              onLogout={auth.logout}
              onExitDemo={auth.exitDemoMode}
            />
          )}
        </main>

        {/* ELEGANT CREDIT FOOTER (Shown on all tabs without scroll overhead) */}
        <footer className={`w-full text-center text-xs text-slate-500 dark:text-slate-400 mt-auto select-none transition-all ${
          currentTab === 'quiz' || currentTab === 'flashcards'
            ? 'py-1 pb-16 lg:pb-1.5 text-[11px]'
            : 'py-3.5 pb-20 lg:pb-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30'
        }`}>
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse shrink-0 inline" />
            <span>by</span>
            <a 
              href="https://xhanxhal.github.io" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline decoration-emerald-500/50 hover:decoration-emerald-500 underline-offset-2"
            >
              Chanchal
            </a>
          </p>
        </footer>
      </div>

      {/* Word Detail Modal */}
      {activeWordDetail && (
        <WordDetailModal
          word={activeWordDetail}
          allWords={detailWordList}
          onClose={() => setActiveWordDetail(null)}
          onSelectWord={setActiveWordDetail}
          onOpenCardGenerator={(w) => {
            setCardGeneratorWord(w);
            setActiveWordDetail(null);
            setCurrentTab('card-generator');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* MOBILE BOTTOM NAVIGATION TAB BAR */}
      <nav aria-label="Mobile Navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg font-bangla">
        <button
          type="button"
          onClick={() => {
            haptics.tap();
            setCurrentTab('home');
          }}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
            currentTab === 'home' 
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <LayoutGrid className="w-4 h-4 mb-0.5" />
          <span>হোম</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tap();
            setSelectedLessonUnitId(1);
            setCurrentTab('learn');
          }}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
            currentTab === 'learn' 
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span>শব্দ গ্রিড</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tap();
            handleOpenFlashcards(1);
          }}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
            currentTab === 'flashcards' 
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span>ফ্ল্যাশ কার্ড</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tap();
            setCurrentTab('quiz');
          }}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
            currentTab === 'quiz' 
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <HelpCircle className="w-4 h-4 mb-0.5" />
          <span>কুইজ</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptics.tap();
            setCurrentTab('info');
          }}
          className={`flex-1 flex flex-col items-center py-1 px-1 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
            currentTab === 'info' || currentTab === 'archive' 
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <Info className="w-4 h-4 mb-0.5" />
          <span>ইনফো</span>
        </button>
      </nav>

      {/* Global Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}

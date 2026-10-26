import { WordProgress, QuizHistoryItem, UserSettings, LearningStats } from '../data/types';
import { getAllWords } from '../data/units';

const STORAGE_KEYS = {
  PROGRESS: 'bonolota_progress_v1',
  SETTINGS: 'bonolota_settings_v1',
  QUIZ_HISTORY: 'bonolota_quizzes_v1',
  LESSON_PROGRESS: 'bonolota_lesson_v1',
  STREAK_DATES: 'bonolota_streak_dates_v1',
  USER_NOTES: 'bonolota_user_notes_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  soundEnabled: true,
  hapticsEnabled: true,
  dailyGoal: 10,
  speechRate: 0.9,
  currentUnitId: 1,
};

function safeGetItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const legacyKey = key.replace('bonolota_', 'shobdosetu_');
    const item = localStorage.getItem(key) || localStorage.getItem(legacyKey);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage write failed', e);
  }
}

export const storage = {
  getProgress(): Record<string, WordProgress> {
    return safeGetItem<Record<string, WordProgress>>(STORAGE_KEYS.PROGRESS, {});
  },

  getWordProgress(wordId: string): WordProgress {
    const all = this.getProgress();
    if (all[wordId]) return all[wordId];

    return {
      wordId,
      status: 'unseen',
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      needsPractice: false,
      lastReviewedAt: null,
      nextReviewDue: null,
      repetitionLevel: 0,
      isFavorite: false,
    };
  },

  recordQuizAnswer(wordId: string, isCorrect: boolean, isSpellingQuiz: boolean = false): WordProgress {
    const all = this.getProgress();
    const current = this.getWordProgress(wordId);

    const now = new Date();
    const newReviewCount = current.reviewCount + 1;
    const newCorrect = current.correctCount + (isCorrect ? 1 : 0);
    const newIncorrect = current.incorrectCount + (isCorrect ? 0 : 1);

    let newStatus = current.status;
    let quizMastered = current.quizMastered || false;
    let repetitionLevel = current.repetitionLevel;
    let needsPractice = current.needsPractice;

    if (isCorrect) {
      if (!isSpellingQuiz) {
        // Correct in meaning/definition/context/fill-blank quiz => officially Mastered!
        newStatus = 'mastered';
        quizMastered = true;
        repetitionLevel = 4;
        needsPractice = false;
      } else {
        // Spelling quiz:
        // "spellings er quiz gulo mukhosto kora word a count hobena , oita to spell test"
        // Correct in spelling test does NOT count towards mastered words!
        repetitionLevel = Math.max(repetitionLevel, 2);
        needsPractice = false;
      }
    } else {
      // Answered incorrectly in quiz:
      // "dhoro ekta unit theke 10 ta quiz dile wrong korleo 10 ta count dekhay pora sobdo te , seita howa jabena"
      // 1. Not mastered!
      quizMastered = false;
      needsPractice = true;
      repetitionLevel = 1;

      // 2. Crucial: If the word was previously 'unseen' (never read or studied in lesson),
      // DO NOT mark it as 'learning' or studied! It remains 'unseen'!
      // If it was previously 'mastered', demote to 'learning'.
      if (current.status === 'mastered') {
        newStatus = 'learning';
      } else if (current.status === 'unseen') {
        newStatus = 'unseen';
      } else {
        newStatus = 'learning';
      }
    }

    const updated: WordProgress = {
      ...current,
      status: newStatus,
      quizMastered,
      reviewCount: newReviewCount,
      correctCount: newCorrect,
      incorrectCount: newIncorrect,
      needsPractice,
      repetitionLevel,
      lastReviewedAt: now.toISOString(),
      nextReviewDue: new Date(now.getTime() + (isCorrect ? 168 : 4) * 3600 * 1000).toISOString(),
    };

    all[wordId] = updated;
    safeSetItem(STORAGE_KEYS.PROGRESS, all);
    this.recordStudyActivity();

    return updated;
  },

  recordWordReview(wordId: string, isCorrect: boolean, forceNeedsPractice?: boolean): WordProgress {
    const all = this.getProgress();
    const current = this.getWordProgress(wordId);

    const now = new Date();
    const newReviewCount = current.reviewCount + 1;
    const newCorrect = current.correctCount + (isCorrect ? 1 : 0);
    const newIncorrect = current.incorrectCount + (isCorrect ? 0 : 1);

    // Spaced repetition level logic (Leitner 0-4)
    let newLevel = current.repetitionLevel;
    let needsPractice = forceNeedsPractice !== undefined ? forceNeedsPractice : current.needsPractice;

    if (isCorrect) {
      newLevel = Math.min(4, newLevel + 1);
      if (newLevel >= 2) {
        needsPractice = false;
      }
    } else {
      newLevel = Math.max(1, newLevel - 1);
      needsPractice = true;
    }

    // Interval hours based on level: L1 = 4h, L2 = 24h, L3 = 72h, L4 = 168h (7 days)
    const intervalHours = [0, 4, 24, 72, 168][newLevel] || 24;
    const nextDue = new Date(now.getTime() + intervalHours * 3600 * 1000);

    const updated: WordProgress = {
      ...current,
      // Flashcard drill keeps status as learning unless already earned quizMastered
      status: current.quizMastered ? 'mastered' : 'learning',
      reviewCount: newReviewCount,
      correctCount: newCorrect,
      incorrectCount: newIncorrect,
      needsPractice,
      repetitionLevel: newLevel,
      lastReviewedAt: now.toISOString(),
      nextReviewDue: nextDue.toISOString(),
    };

    all[wordId] = updated;
    safeSetItem(STORAGE_KEYS.PROGRESS, all);
    this.recordStudyActivity();

    return updated;
  },

  saveWordProgress(wordId: string, updates: Partial<WordProgress>): WordProgress {
    const all = this.getProgress();
    const current = this.getWordProgress(wordId);
    const updated: WordProgress = { ...current, ...updates };
    all[wordId] = updated;
    safeSetItem(STORAGE_KEYS.PROGRESS, all);
    this.recordStudyActivity();
    return updated;
  },

  // Ticking in lesson view marks as studied (reading completed), NOT mastered
  toggleWordStudied(wordId: string): WordProgress {
    const all = this.getProgress();
    const current = this.getWordProgress(wordId);
    const now = new Date().toISOString();

    const isAlreadyStudied = current.status !== 'unseen';
    const updated: WordProgress = {
      ...current,
      status: isAlreadyStudied ? 'unseen' : 'learning',
      studiedInLesson: !isAlreadyStudied,
      // Manual tick does NOT give quizMastered!
      quizMastered: isAlreadyStudied ? false : (current.quizMastered || false),
      repetitionLevel: isAlreadyStudied ? 0 : Math.max(1, current.repetitionLevel),
      lastReviewedAt: now,
    };

    all[wordId] = updated;
    safeSetItem(STORAGE_KEYS.PROGRESS, all);
    this.recordStudyActivity();
    return updated;
  },

  markWordMastered(wordId: string): WordProgress {
    return this.saveWordProgress(wordId, {
      status: 'mastered',
      quizMastered: true,
      correctCount: Math.max(1, this.getWordProgress(wordId).correctCount),
      repetitionLevel: 4,
      needsPractice: false,
      lastReviewedAt: new Date().toISOString(),
    });
  },

  markWordStudied(wordId: string): WordProgress {
    const all = this.getProgress();
    const current = this.getWordProgress(wordId);
    if (current.status === 'unseen') {
      current.status = 'learning';
      current.studiedInLesson = true;
      current.repetitionLevel = 1;
      current.lastReviewedAt = new Date().toISOString();
      all[wordId] = current;
      safeSetItem(STORAGE_KEYS.PROGRESS, all);
      this.recordStudyActivity();
    }
    return current;
  },

  toggleFavorite(wordId: string): boolean {
    const all = this.getProgress();
    const current = this.getWordProgress(wordId);
    const newFav = !current.isFavorite;
    current.isFavorite = newFav;
    all[wordId] = current;
    safeSetItem(STORAGE_KEYS.PROGRESS, all);
    return newFav;
  },

  setNeedsPractice(wordId: string, needs: boolean): void {
    const all = this.getProgress();
    const current = this.getWordProgress(wordId);
    current.needsPractice = needs;
    if (needs) {
      current.repetitionLevel = 1;
    }
    all[wordId] = current;
    safeSetItem(STORAGE_KEYS.PROGRESS, all);
  },

  getSettings(): UserSettings {
    const loaded = safeGetItem<UserSettings | null>(STORAGE_KEYS.SETTINGS, null);
    if (!loaded) {
      return { ...DEFAULT_SETTINGS };
    }
    const hasExplicitSound = safeGetItem<boolean | null>('bonolota_sound_explicit_v2', null) ?? safeGetItem<boolean | null>('shobdosetu_sound_explicit_v2', null);
    const soundEnabled = hasExplicitSound !== null ? !!loaded.soundEnabled : true;
    const hapticsEnabled = loaded.hapticsEnabled !== undefined ? !!loaded.hapticsEnabled : true;
    return {
      ...DEFAULT_SETTINGS,
      ...loaded,
      soundEnabled,
      hapticsEnabled,
    };
  },

  saveSettings(updates: Partial<UserSettings>): UserSettings {
    if ('soundEnabled' in updates) {
      safeSetItem('bonolota_sound_explicit_v2', true);
    }
    const current = this.getSettings();
    const merged = { ...current, ...updates };
    safeSetItem(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  },

  getQuizHistory(): QuizHistoryItem[] {
    return safeGetItem<QuizHistoryItem[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
  },

  saveQuizResult(result: Omit<QuizHistoryItem, 'id' | 'timestamp'>): QuizHistoryItem {
    const history = this.getQuizHistory();
    const item: QuizHistoryItem = {
      ...result,
      id: `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    history.unshift(item);
    // Keep max 50 recent quizzes
    safeSetItem(STORAGE_KEYS.QUIZ_HISTORY, history.slice(0, 50));
    this.recordStudyActivity();
    return item;
  },

  getLessonProgress(unitId: number): { lastIndex: number; isCompleted: boolean } {
    const all = safeGetItem<Record<string, { lastIndex: number; isCompleted: boolean }>>(STORAGE_KEYS.LESSON_PROGRESS, {});
    return all[unitId] || { lastIndex: 0, isCompleted: false };
  },

  saveLessonProgress(unitId: number, lastIndex: number, isCompleted: boolean): void {
    const all = safeGetItem<Record<string, { lastIndex: number; isCompleted: boolean }>>(STORAGE_KEYS.LESSON_PROGRESS, {});
    all[unitId] = { lastIndex, isCompleted };
    safeSetItem(STORAGE_KEYS.LESSON_PROGRESS, all);
    this.recordStudyActivity();
  },

  recordStudyActivity(): void {
    const dates = safeGetItem<string[]>(STORAGE_KEYS.STREAK_DATES, []);
    const today = new Date().toISOString().split('T')[0];
    if (!dates.includes(today)) {
      dates.push(today);
      safeSetItem(STORAGE_KEYS.STREAK_DATES, dates);
    }
  },

  calculateStreak(): number {
    const dates = safeGetItem<string[]>(STORAGE_KEYS.STREAK_DATES, []);
    if (dates.length === 0) return 0;

    const sorted = Array.from(new Set(dates)).sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If no activity today or yesterday, streak is broken
    if (sorted[0] !== today && sorted[0] !== yesterday) {
      return 0;
    }

    let streak = 0;
    let expectedDate = new Date(sorted[0]);

    for (const d of sorted) {
      const currentDate = new Date(d);
      const diffTime = Math.abs(expectedDate.getTime() - currentDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      if (diffDays <= 1) {
        streak++;
        expectedDate = currentDate;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },

  isWordStudied(p?: WordProgress): boolean {
    if (!p) return false;
    if (p.status === 'unseen') return false;
    if (p.status === 'mastered') return true;
    if (p.status === 'learning') {
      // Studied if marked in lesson, or has at least 1 correct answer,
      // or reviewed with success. If it was only missed in a quiz (correctCount === 0 && incorrectCount > 0)
      // and not marked in lesson, it is NOT considered studied!
      if (p.studiedInLesson === true) return true;
      if (p.correctCount > 0) return true;
      if (p.correctCount === 0 && p.incorrectCount > 0) return false;
      return true;
    }
    return false;
  },

  isWordMastered(p?: WordProgress): boolean {
    if (!p) return false;
    // Must have successfully passed quizMastered from substantive quiz test!
    return p.status === 'mastered' && p.quizMastered === true;
  },

  getLearningStats(): LearningStats {
    const allWords = getAllWords();
    const progress = this.getProgress();
    const quizzes = this.getQuizHistory();

    let studied = 0;
    let practiced = 0;
    let mastered = 0;
    let needsRevision = 0;
    let favorites = 0;

    allWords.forEach(w => {
      const p = progress[w.id];
      if (!p) return;
      if (this.isWordStudied(p)) studied++;
      if (p.reviewCount > 0) practiced++;
      // "spellings er quiz gulo mukhosto kora word a count hobena , oita to spell test"
      // "mukhosto kora sobdo r pora sobdo to ek na, keo porlei to mukhosto hoyna"
      if (this.isWordMastered(p)) {
        mastered++;
      }
      if (p.needsPractice || (p.incorrectCount > 0 && p.correctCount <= p.incorrectCount)) needsRevision++;
      if (p.isFavorite) favorites++;
    });

    let totalAccuracy = 0;
    if (quizzes.length > 0) {
      const sum = quizzes.reduce((acc, q) => acc + q.scorePercent, 0);
      totalAccuracy = Math.round(sum / quizzes.length);
    }

    const streakDates = safeGetItem<string[]>(STORAGE_KEYS.STREAK_DATES, []);
    const lastDate = streakDates.length > 0 ? streakDates[streakDates.length - 1] : null;

    return {
      totalWords: allWords.length,
      wordsStudied: studied,
      wordsPracticed: practiced,
      wordsMastered: mastered,
      needsRevisionCount: needsRevision,
      favoritesCount: favorites,
      quizAccuracy: totalAccuracy,
      quizzesTaken: quizzes.length,
      learningStreak: this.calculateStreak(),
      lastStudyDate: lastDate,
    };
  },

  getRevisionWordIds(): string[] {
    const allWords = getAllWords();
    const progress = this.getProgress();
    const now = new Date();

    const dueIds: string[] = [];
    allWords.forEach(w => {
      const p = progress[w.id];
      if (!p) return;
      if (p.needsPractice) {
        dueIds.push(w.id);
      } else if (p.nextReviewDue && new Date(p.nextReviewDue) <= now) {
        dueIds.push(w.id);
      } else if (p.incorrectCount > p.correctCount) {
        dueIds.push(w.id);
      }
    });

    return dueIds;
  },

  getUserNotes(): Record<string, string> {
    return safeGetItem<Record<string, string>>(STORAGE_KEYS.USER_NOTES, {});
  },

  getUserNote(wordId: string): string {
    const notes = this.getUserNotes();
    return notes[wordId] || '';
  },

  saveUserNote(wordId: string, note: string): void {
    const notes = this.getUserNotes();
    if (!note.trim()) {
      delete notes[wordId];
    } else {
      notes[wordId] = note.trim();
    }
    safeSetItem(STORAGE_KEYS.USER_NOTES, notes);
  },

  deleteUserNote(wordId: string): void {
    const notes = this.getUserNotes();
    delete notes[wordId];
    safeSetItem(STORAGE_KEYS.USER_NOTES, notes);
  },

  exportUserData(): string {
    const data = {
      progress: this.getProgress(),
      settings: this.getSettings(),
      quizzes: this.getQuizHistory(),
      lessonProgress: safeGetItem(STORAGE_KEYS.LESSON_PROGRESS, {}),
      streakDates: safeGetItem(STORAGE_KEYS.STREAK_DATES, []),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },

  importUserData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.progress) safeSetItem(STORAGE_KEYS.PROGRESS, parsed.progress);
      if (parsed.settings) safeSetItem(STORAGE_KEYS.SETTINGS, parsed.settings);
      if (parsed.quizzes) safeSetItem(STORAGE_KEYS.QUIZ_HISTORY, parsed.quizzes);
      if (parsed.lessonProgress) safeSetItem(STORAGE_KEYS.LESSON_PROGRESS, parsed.lessonProgress);
      if (parsed.streakDates) safeSetItem(STORAGE_KEYS.STREAK_DATES, parsed.streakDates);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  resetAllData(): void {
    if (typeof window === 'undefined') return;
    Object.values(STORAGE_KEYS).forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {
        console.warn('Remove item failed', e);
      }
    });
  }
};

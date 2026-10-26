export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'root/prefix';

export type WordDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ExampleSentence {
  english: string;
  bangla: string;
  context?: string;
}

export type WordTone = 'positive' | 'negative' | 'neutral';

export type ExamTag = 'BCS' | 'IBA' | 'GRE' | 'Bank' | 'DU';

export interface WordFamilyInfo {
  noun?: string;
  verb?: string;
  adjective?: string;
  adverb?: string;
}

export interface CollocationInfo {
  phrase: string;
  bangla: string;
}

export interface WordPitfall {
  wrong: string;
  correct: string;
  tip: string;
}

export interface IntensityScale {
  level: number;
  spectrum: string[];
}

export interface BanglaIdiomEquivalence {
  idiom: string;
  explanation: string;
}

export interface WordEnrichment {
  tone: WordTone;
  examTags: ExamTag[];
  banglaIdiom?: BanglaIdiomEquivalence;
  wordFamily?: WordFamilyInfo;
  collocation?: CollocationInfo;
  pitfall?: WordPitfall;
  intensity?: IntensityScale;
  idiomConnection?: { idiom: string; meaning: string };
  thematicCategory: string;
}

export interface VocabWord {
  id: string;
  unitId: number;
  word: string;
  banglaMeaning: string;
  pronunciation: string;
  partOfSpeech: PartOfSpeech;
  examples: ExampleSentence[];
  synonyms: string[];
  antonyms: string[];
  memoryTip?: string;
  difficulty: WordDifficulty;
  etymology?: string;
  enrichment?: WordEnrichment;
}

export interface UnitInfo {
  id: number;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  words: VocabWord[];
  themeColor?: string;
}

export interface WordProgress {
  wordId: string;
  status: 'unseen' | 'learning' | 'mastered';
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  needsPractice: boolean;
  lastReviewedAt: string | null;
  nextReviewDue: string | null;
  repetitionLevel: number; // 0 (unseen), 1 (needs practice), 2 (reviewing), 3 (proficient), 4 (mastered)
  isFavorite: boolean;
  quizMastered?: boolean;
  studiedInLesson?: boolean;
}

export interface QuizHistoryItem {
  id: string;
  timestamp: string;
  unitId: number;
  mode: QuizMode;
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  missedWordIds: string[];
}

export type QuizMode =
  | 'en-to-bn'
  | 'bn-to-en'
  | 'fill-blank'
  | 'context'
  | 'synonym'
  | 'spelling'
  | 'mixed';

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'context' | 'spelling';
  question: string;
  questionBangla?: string;
  targetWord: VocabWord;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  explanationBangla?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  soundEnabled: boolean;
  hapticsEnabled?: boolean;
  dailyGoal: number; // words per day
  speechRate: number;
  currentUnitId: number;
}

export interface LearningStats {
  totalWords: number;
  wordsStudied: number;
  wordsPracticed: number;
  wordsMastered: number;
  needsRevisionCount: number;
  favoritesCount: number;
  quizAccuracy: number;
  quizzesTaken: number;
  learningStreak: number;
  lastStudyDate: string | null;
}

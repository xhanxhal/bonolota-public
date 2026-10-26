import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Languages, 
  ChevronRight, 
  Lightbulb, 
  Volume2,
  ArrowLeft
} from 'lucide-react';
import { STORIES_DATA, StoryItem, StoryVocab } from '../data/storiesData';
import { AudioButton } from './AudioButton';

interface StoryModeViewProps {
  onBackToHome?: () => void;
  onOpenWordDetailByName?: (name: string) => void;
}

export const StoryModeView: React.FC<StoryModeViewProps> = ({
  onBackToHome,
  onOpenWordDetailByName,
}) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [showBanglaTranslation, setShowBanglaTranslation] = useState(false);
  const [selectedWordPopup, setSelectedWordPopup] = useState<StoryVocab | null>(null);

  const currentStory: StoryItem = STORIES_DATA[activeStoryIndex];

  // Helper to highlight interactive vocabulary words inside English passage
  const renderInteractiveParagraph = (text: string, vocabList: StoryVocab[]) => {
    const vocabMap = new Map<string, StoryVocab>();
    vocabList.forEach(v => vocabMap.set(v.word.toLowerCase(), v));

    // Regex to match any of the vocab words
    const wordsPattern = vocabList.map(v => v.word).join('|');
    const regex = new RegExp(`\\b(${wordsPattern})\\b`, 'gi');

    const parts = text.split(regex);

    return parts.map((part, index) => {
      const match = vocabMap.get(part.toLowerCase());
      if (match) {
        return (
          <button
            key={index}
            type="button"
            onClick={() => setSelectedWordPopup(match)}
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors cursor-pointer text-sm sm:text-base font-sans"
            title="অর্থ ও ব্যাখ্যা দেখতে ক্লিক করুন"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 font-bangla animate-in fade-in duration-200">
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
                কনটেক্সট ও গল্পে শব্দ আয়ত্ত
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              গল্পে শব্দ (Story & Context Mode)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
              মুখস্থ করার বদলে বাস্তব ছোট অনুচ্ছেদে শব্দের প্রয়োগ দেখে মনে রাখুন।
            </p>
          </div>

          {/* Translation Toggle */}
          <button
            type="button"
            onClick={() => setShowBanglaTranslation(prev => !prev)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
          >
            <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{showBanglaTranslation ? 'বাংলা অনুবাদ লুকান' : 'বাংলা অনুবাদ দেখুন'}</span>
          </button>
        </div>
      </div>

      {/* Story Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STORIES_DATA.map((story, idx) => (
          <button
            key={story.id}
            type="button"
            onClick={() => {
              setActiveStoryIndex(idx);
              setSelectedWordPopup(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
              activeStoryIndex === idx
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-800 hover:border-emerald-300'
            }`}
          >
            {story.titleBn}
          </button>
        ))}
      </div>

      {/* Main Reading Card */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-5">
        {/* Story Title & Meta */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider font-sans">
              {currentStory.genre}
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {currentStory.titleBn}
            </h3>
            <p className="text-xs font-sans text-slate-400">
              {currentStory.titleEn}
            </p>
          </div>

          <AudioButton word={currentStory.paragraphEn} size="md" />
        </div>

        {/* English Paragraph with Interactive Highlighted Words */}
        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            মূল অনুচ্ছেদ (English Passage — শব্দে ট্যাপ করুন):
          </span>
          <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-sans leading-relaxed">
            {renderInteractiveParagraph(currentStory.paragraphEn, currentStory.vocabulary)}
          </p>
        </div>

        {/* Word Detail Popup Banner */}
        {selectedWordPopup && (
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-sans font-extrabold text-base sm:text-lg text-emerald-900 dark:text-emerald-200">
                  {selectedWordPopup.word}
                </span>
                <AudioButton word={selectedWordPopup.word} size="sm" />
              </div>
              <button
                type="button"
                onClick={() => setSelectedWordPopup(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕ বন্ধ
              </button>
            </div>
            <p className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 font-bangla">
              বাংলা অর্থ: {selectedWordPopup.meaningBn}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
              {selectedWordPopup.explanation}
            </p>
          </div>
        )}

        {/* Bangla Translation */}
        {showBanglaTranslation && (
          <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-1.5 font-bangla animate-in fade-in">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
              সহজ বাংলা অনুবাদ:
            </span>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {currentStory.paragraphBn}
            </p>
          </div>
        )}

        {/* Vocabulary Word Pills in this Story */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5 font-bangla">
            এই গল্পের মূল শব্দভাণ্ডার:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {currentStory.vocabulary.map((vocab, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedWordPopup(vocab)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-700 text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {vocab.word}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-bangla truncate">
                  {vocab.meaningBn}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

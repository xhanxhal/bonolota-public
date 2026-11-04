import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft,
  Volume2, 
  VolumeX,
  Copy, 
  Check, 
  Search, 
  ArrowLeft, 
  ExternalLink, 
  ListFilter,
  X,
} from 'lucide-react';
import { STORY_UNITS, StoryUnit, StoryVocabItem } from '../data/storyUnitsData';
import { haptics } from '../utils/haptics';

interface StoryModeViewProps {
  onBackToHome?: () => void;
  onOpenWordDetailByName?: (name: string) => void;
}

export type ViewMode = 'dual' | 'en' | 'bn';
export type UnitCategory = 'all' | 'p1' | 'p2' | 'p3';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';

export const StoryModeView: React.FC<StoryModeViewProps> = ({
  onBackToHome,
  onOpenWordDetailByName,
}) => {
  const [activeUnitNumber, setActiveUnitNumber] = useState(1);
  const [activeCategory, setActiveCategory] = useState<UnitCategory>('all');
  const [unitSearch, setUnitSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('dual');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedWord, setSelectedWord] = useState<StoryVocabItem | null>(null);
  const [isUnitDrawerOpen, setIsUnitDrawerOpen] = useState(false);
  const [hoveredWordKey, setHoveredWordKey] = useState<string | null>(null);

  // Filter units by category and search
  const filteredUnits = useMemo(() => {
    let list = STORY_UNITS;
    if (activeCategory === 'p1') {
      list = list.filter(u => u.unit >= 1 && u.unit <= 5);
    } else if (activeCategory === 'p2') {
      list = list.filter(u => u.unit >= 6 && u.unit <= 30);
    } else if (activeCategory === 'p3') {
      list = list.filter(u => u.unit >= 31 && u.unit <= 50);
    }

    if (!unitSearch.trim()) return list;
    const q = unitSearch.toLowerCase().trim();
    return list.filter(u => 
      `unit ${u.unit}`.includes(q) ||
      u.unit.toString() === q ||
      u.title.toLowerCase().includes(q) ||
      u.words.some(w => w.toLowerCase().includes(q))
    );
  }, [activeCategory, unitSearch]);

  const currentUnit: StoryUnit = useMemo(() => {
    const found = STORY_UNITS.find(u => u.unit === activeUnitNumber);
    return found || STORY_UNITS[0];
  }, [activeUnitNumber]);

  // Is this unit part of Barron GRE (Units 31-50)?
  const isBarronUnit = currentUnit.unit >= 31;

  // Vocab map for fast lookup in current unit
  const vocabMap = useMemo(() => {
    const map = new Map<string, StoryVocabItem>();
    currentUnit.vocab_table.forEach(item => {
      map.set(item.word.toLowerCase(), item);
    });
    return map;
  }, [currentUnit]);

  // Reset speech and hover on unit change
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsTtsPlaying(false);
    setHoveredWordKey(null);
  }, [activeUnitNumber]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-To-Speech Pronounce Word
  const speakWord = useCallback((word: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore
    }
  }, []);

  // Text-To-Speech Play/Stop Story
  const togglePlayStory = () => {
    haptics.tap();
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setIsTtsPlaying(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const cleanText = currentUnit.story_en.replace(/\*\*/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'en-US';
      utterance.rate = 0.92;
      utterance.onend = () => setIsTtsPlaying(false);
      utterance.onerror = () => setIsTtsPlaying(false);
      setIsTtsPlaying(true);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsTtsPlaying(false);
    }
  };

  // Copy Story
  const handleCopyStory = async () => {
    haptics.success();
    let textToCopy = '';
    if (viewMode === 'bn') {
      textToCopy = `Unit ${currentUnit.unit} (বাংলা অনুবাদ)\n\n${currentUnit.story_bn.replace(/\*\*/g, '')}`;
    } else if (viewMode === 'en') {
      textToCopy = `Unit ${currentUnit.unit} (English Narrative)\n\n${currentUnit.story_en.replace(/\*\*/g, '')}`;
    } else {
      textToCopy = `Unit ${currentUnit.unit}\n\n[English Narrative]\n${currentUnit.story_en.replace(/\*\*/g, '')}\n\n[বাংলা অনুবাদ]\n${currentUnit.story_bn.replace(/\*\*/g, '')}`;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Font size classes
  const fontClasses: Record<FontSize, { en: string; bn: string }> = {
    sm: { en: 'text-xs sm:text-sm leading-relaxed', bn: 'text-xs sm:text-sm leading-relaxed' },
    base: { en: 'text-sm sm:text-base leading-relaxed', bn: 'text-sm sm:text-base leading-relaxed' },
    lg: { en: 'text-base sm:text-lg leading-relaxed', bn: 'text-base sm:text-lg leading-relaxed' },
    xl: { en: 'text-lg sm:text-xl leading-relaxed', bn: 'text-lg sm:text-xl leading-relaxed' },
  };

  // Render English Paragraphs with Clickable Vocabulary Words
  const renderStoryEnglish = (text: string) => {
    const paragraphs = text.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/\*\*([^*]+)\*\*/g);
      return (
        <p key={pIdx} className={`mb-4 text-slate-800 dark:text-slate-200 font-sans ${fontClasses[fontSize].en}`}>
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              const trimmed = part.trim();
              const vocab = vocabMap.get(trimmed.toLowerCase());
              const wordKey = trimmed.toLowerCase();
              const isHovered = hoveredWordKey === wordKey;

              return (
                <button
                  key={index}
                  type="button"
                  onMouseEnter={() => setHoveredWordKey(wordKey)}
                  onMouseLeave={() => setHoveredWordKey(null)}
                  onClick={() => {
                    haptics.tap();
                    if (vocab) {
                      setSelectedWord(vocab);
                    } else {
                      setSelectedWord({
                        word: trimmed,
                        pos: 'word',
                        meaning: 'ইউনিট শব্দ',
                        definition: 'Vocabulary word from unit narrative'
                      });
                    }
                  }}
                  className={`inline font-bold cursor-pointer align-baseline transition-all underline underline-offset-4 decoration-2 ${
                    isHovered
                      ? 'text-emerald-950 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-900/50 decoration-solid decoration-emerald-600 dark:decoration-emerald-400 rounded-sm px-1 -mx-0.5 shadow-2xs'
                      : 'text-emerald-700 dark:text-emerald-400 decoration-dotted decoration-emerald-500/80 dark:decoration-emerald-400/80 hover:text-emerald-900 dark:hover:text-emerald-200 hover:decoration-solid'
                  }`}
                  title="অর্থ ও উচ্চারণ দেখতে ক্লিক করুন"
                >
                  {part}
                </button>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </p>
      );
    });
  };

  // Bengali stop words
  const BN_STOPWORDS = useMemo(() => new Set([
    'বা', 'ও', 'এক', 'একটি', 'একজন', 'এর', 'করা', 'হওয়া', 'হওয়া', 'দেওয়া', 'দেওয়া', 
    'হয়ে', 'হয়ে', 'থেকে', 'দ্বারা', 'দিয়ে', 'দিয়ে', 'কোনো', 'বাস্তব', 'মৃদু', 'গভীর'
  ]), []);

  // Map Bangla bold phrase to English vocabulary
  const resolveBanglaToVocab = (bnPhrase: string, bIdx: number, pIdx: number): StoryVocabItem => {
    const enParagraphs = currentUnit.story_en.split('\n\n');
    const enPara = enParagraphs[pIdx] || '';
    const enBolds = (enPara.match(/\*\*([^*]+)\*\*/g) || []).map(s => s.replace(/\*\*/g, '').trim());
    
    const cleanBn = bnPhrase.replace(/^(একজন|একটি|বা|ও|এক|এর|হয়ে|মৃদু|গভীর)\s+/, '').trim();

    let bestMatch: StoryVocabItem | null = null;
    let highestScore = 0;

    for (let i = 0; i < enBolds.length; i++) {
      const enWord = enBolds[i];
      const vocab = vocabMap.get(enWord.toLowerCase());
      if (!vocab) continue;

      let score = 0;
      const cleanMeaning = vocab.meaning.replace(/[,/।()]+/g, ' ');
      const meaningWords = cleanMeaning.split(/\s+/).filter(w => w.length >= 2 && !BN_STOPWORDS.has(w));
      const bnWords = cleanBn.split(/\s+/).filter(w => w.length >= 2 && !BN_STOPWORDS.has(w));

      for (const bw of bnWords) {
        for (const mw of meaningWords) {
          if (bw === mw) {
            score += 100;
          } else if (bw.includes(mw) || mw.includes(bw)) {
            if (Math.min(bw.length, mw.length) >= 3) {
              score += 50;
            }
          }
        }
      }

      const dist = Math.abs(i - bIdx);
      score += Math.max(0, 30 - dist * 4);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = vocab;
      }
    }

    if (bestMatch && highestScore >= 25) return bestMatch;

    if (enBolds.length > 0) {
      const targetIdx = Math.min(bIdx, enBolds.length - 1);
      const targetWord = enBolds[targetIdx];
      const targetVocab = vocabMap.get(targetWord.toLowerCase());
      if (targetVocab) return targetVocab;
    }

    for (const item of currentUnit.vocab_table) {
      const cleanMeaning = item.meaning.replace(/[,/।()]+/g, ' ');
      const meaningWords = cleanMeaning.split(/\s+/).filter(w => w.length >= 2 && !BN_STOPWORDS.has(w));
      for (const mw of meaningWords) {
        if (cleanBn.includes(mw) && mw.length >= 3) return item;
      }
    }

    return currentUnit.vocab_table[0] || {
      word: 'Vocabulary',
      pos: 'word',
      meaning: bnPhrase,
    };
  };

  // Render Bangla Paragraphs with Clickable Highlighted Words
  const renderStoryBangla = (text: string) => {
    const paragraphs = text.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/\*\*([^*]+)\*\*/g);
      let boldCount = 0;
      return (
        <p key={pIdx} className={`mb-4 text-slate-700 dark:text-slate-300 font-bangla ${fontClasses[fontSize].bn}`}>
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              const currentBoldIndex = boldCount;
              boldCount++;
              const trimmed = part.trim();
              const matchedVocab = resolveBanglaToVocab(trimmed, currentBoldIndex, pIdx);
              const wordKey = matchedVocab.word.toLowerCase();
              const isHovered = hoveredWordKey === wordKey;

              return (
                <button
                  key={index}
                  type="button"
                  onMouseEnter={() => setHoveredWordKey(wordKey)}
                  onMouseLeave={() => setHoveredWordKey(null)}
                  onClick={() => {
                    haptics.tap();
                    setSelectedWord(matchedVocab);
                  }}
                  className={`inline font-bold cursor-pointer align-baseline transition-all underline underline-offset-4 decoration-2 ${
                    isHovered
                      ? 'text-emerald-950 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-900/50 decoration-solid decoration-emerald-600 dark:decoration-emerald-400 rounded-sm px-1 -mx-0.5 shadow-2xs'
                      : 'text-emerald-700 dark:text-emerald-400 decoration-dotted decoration-emerald-500/80 dark:decoration-emerald-400/80 hover:text-emerald-900 dark:hover:text-emerald-200 hover:decoration-solid'
                  }`}
                  title={`${matchedVocab.word} (${matchedVocab.meaning}) - বিস্তারিত দেখতে ক্লিক করুন`}
                >
                  {part}
                </button>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </p>
      );
    });
  };

  // Prev / Next Unit
  const handlePrevUnit = () => {
    haptics.tap();
    const prev = activeUnitNumber > 1 ? activeUnitNumber - 1 : 50;
    setActiveUnitNumber(prev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextUnit = () => {
    haptics.tap();
    const next = activeUnitNumber < 50 ? activeUnitNumber + 1 : 1;
    setActiveUnitNumber(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3 font-bangla animate-in fade-in duration-200 pb-16 lg:pb-8">
      {/* Top Header Bar */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 p-3 sm:p-4 shadow-2xs border border-emerald-100/90 dark:border-emerald-900/40 text-slate-900 dark:text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {onBackToHome && (
              <button
                type="button"
                onClick={() => {
                  haptics.tap();
                  onBackToHome();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>হোম</span>
              </button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                  বনলতা ভোকাবুলারি স্টোরিজ
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shrink-0">
                  ৫০টি সম্পূর্ণ ইউনিট
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal truncate hidden sm:block">
                গল্পে গল্পে ১,৮৫০টি অ্যাকাডেমিক ও ব্যারন GRE শব্দশিক্ষা • অডিও ও ফ্ল্যাশ কার্ড
              </p>
            </div>
          </div>

          {/* Unit Drawer Trigger on Mobile + Font Size Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setIsUnitDrawerOpen(true);
              }}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Unit {activeUnitNumber}</span>
            </button>

            {/* Font Size Adjuster */}
            <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setFontSize(prev => prev === 'xl' ? 'lg' : prev === 'lg' ? 'base' : 'sm');
                }}
                title="ছোট ফন্ট"
                className="px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.selection();
                  setFontSize(prev => prev === 'sm' ? 'base' : prev === 'base' ? 'lg' : 'xl');
                }}
                title="বড় ফন্ট"
                className="px-2 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold transition-colors cursor-pointer"
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Desktop Sidebar + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* DESKTOP SIDEBAR: Category Tabs + Search + Unit Selector */}
        <aside className="hidden lg:flex flex-col lg:col-span-3 xl:col-span-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3 shadow-2xs sticky top-20 max-h-[calc(100vh-100px)]">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>ইউনিট তালিকা (৫০টি)</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Unit {activeUnitNumber}
            </span>
          </div>

          {/* Category Tabs: all, p1, p2, p3 */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-2.5">
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setActiveCategory('all');
              }}
              className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-black shadow-2xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              সব (50)
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setActiveCategory('p1');
              }}
              className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                activeCategory === 'p1'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-black shadow-2xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Part 1
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setActiveCategory('p2');
              }}
              className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                activeCategory === 'p2'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-black shadow-2xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Part 2
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setActiveCategory('p3');
              }}
              className={`py-1 rounded-lg text-center transition-all cursor-pointer ${
                activeCategory === 'p3'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-black shadow-2xs'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Barron
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={unitSearch}
              onChange={(e) => setUnitSearch(e.target.value)}
              placeholder="ইউনিট বা শব্দ খুঁজুন..."
              className="w-full pl-8 pr-6 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 focus:outline-hidden focus:border-emerald-500 text-slate-800 dark:text-slate-100 font-bangla"
            />
            {unitSearch && (
              <button
                type="button"
                onClick={() => setUnitSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2-column Unit Grid */}
          <div className="overflow-y-auto flex-1 pr-1 grid grid-cols-2 gap-1.5 scrollbar-thin">
            {filteredUnits.map(unit => {
              const isSelected = unit.unit === activeUnitNumber;
              return (
                <button
                  key={unit.unit}
                  type="button"
                  onClick={() => {
                    haptics.tap();
                    setActiveUnitNumber(unit.unit);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs transition-all cursor-pointer border text-center font-sans ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 font-bold'
                  }`}
                >
                  <div className="font-extrabold">Unit {unit.unit}</div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                    {unit.words.length} শব্দ
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* MOBILE DRAWER: Unit Selector */}
        {isUnitDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsUnitDrawerOpen(false)}
            />
            <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col p-4 shadow-2xl border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ইউনিট নির্বাচন করুন (৫০টি)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUnitDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Category Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2.5">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    activeCategory === 'all'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-black shadow-2xs'
                      : ''
                  }`}
                >
                  সব (50)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('p1')}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    activeCategory === 'p1'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-black shadow-2xs'
                      : ''
                  }`}
                >
                  Part 1
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('p2')}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    activeCategory === 'p2'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-black shadow-2xs'
                      : ''
                  }`}
                >
                  Part 2
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('p3')}
                  className={`py-1.5 rounded-lg text-center transition-all ${
                    activeCategory === 'p3'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 font-black shadow-2xs'
                      : ''
                  }`}
                >
                  Barron
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  placeholder="ইউনিট বা শব্দ খুঁজুন..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                />
              </div>

              {/* Units 3-column Grid on Mobile */}
              <div className="overflow-y-auto flex-1 grid grid-cols-3 gap-2 pr-1 pb-4">
                {filteredUnits.map(unit => {
                  const isSelected = unit.unit === activeUnitNumber;
                  return (
                    <button
                      key={unit.unit}
                      type="button"
                      onClick={() => {
                        haptics.tap();
                        setActiveUnitNumber(unit.unit);
                        setIsUnitDrawerOpen(false);
                      }}
                      className={`py-2 px-2 rounded-xl text-center text-xs font-sans transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold'
                      }`}
                    >
                      <div>Unit {unit.unit}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {unit.words.length} শব্দ
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MAIN STORY CONTENT AREA */}
        <section className="col-span-1 lg:col-span-9 space-y-3 sm:space-y-4">
          {/* Unit Control Card */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-5 shadow-2xs space-y-3.5">
            {/* Top row: Unit title + Quick Unit Dropdown + Prev/Next buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shrink-0">
                    Unit {currentUnit.unit} / 50
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                    {currentUnit.words.length} Words
                  </span>

                  {/* Quick Dropdown: All 50 Units Select */}
                  <div className="inline-flex items-center gap-1 shrink-0">
                    <select
                      value={activeUnitNumber}
                      onChange={(e) => {
                        haptics.tap();
                        setActiveUnitNumber(Number(e.target.value));
                      }}
                      className="text-xs font-bold py-1 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="যেকোনো ইউনিটে সরাসরি যান (১ থেকে ৫০)"
                    >
                      {STORY_UNITS.map(u => (
                        <option key={u.unit} value={u.unit} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          Unit {u.unit} ({u.words.length} শব্দ)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
                  Unit {currentUnit.unit}
                </h2>
              </div>

              {/* Prev / Next Unit Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handlePrevUnit}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  title="পূর্ববর্তী ইউনিট"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>পূর্ববর্তী</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextUnit}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
                  title="পরবর্তী ইউনিট"
                >
                  <span>পরবর্তী</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* View Mode Switcher + Audio/Copy Toolbar (Clean 3 Story Modes) */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
              {/* 3 Clean Story View Mode Buttons: Dual, English Story, বাংলা অনুবাদ */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 overflow-x-auto scrollbar-none max-w-full">
                <button
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setViewMode('dual');
                  }}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'dual'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs font-black'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>📖</span>
                  <span>পাশাপাশি ভিউ (Dual)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setViewMode('en');
                  }}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'en'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs font-black'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🇬🇧</span>
                  <span>English Story</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setViewMode('bn');
                  }}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'bn'
                      ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-2xs font-black'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>🇧🇩</span>
                  <span>বাংলা অনুবাদ</span>
                </button>
              </div>

              {/* Utility Tools: TTS Play & Copy */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlayStory}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                    isTtsPlaying
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}
                  title="গল্পটি শুনুন"
                >
                  {isTtsPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isTtsPlaying ? 'অডিও থামান' : 'গল্প শুনুন'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyStory}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
                  title="ক্লিপবোর্ডে কপি করুন"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW 1: DUAL VIEW (Side by Side / Stacked on Mobile) */}
          {viewMode === 'dual' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-stretch">
              {/* Left Column: English Story */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🇬🇧</span>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                        English Story
                      </h3>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      শব্দে ট্যাপ করে অর্থ দেখুন
                    </span>
                  </div>
                  <div className="prose dark:prose-invert max-w-none">
                    {renderStoryEnglish(currentUnit.story_en)}
                  </div>
                </div>
              </div>

              {/* Right Column: Bengali Story */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🇧🇩</span>
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                        বাংলা অনুবাদ
                      </h3>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      শব্দে ট্যাপ করে ইংরেজি দেখুন
                    </span>
                  </div>
                  <div className="prose dark:prose-invert max-w-none">
                    {renderStoryBangla(currentUnit.story_bn)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: ENGLISH STORY ONLY */}
          {viewMode === 'en' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">🇬🇧</span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    English Story
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  শব্দে ক্লিক করে অর্থ দেখুন
                </span>
              </div>
              <div className="prose dark:prose-invert max-w-none pt-1">
                {renderStoryEnglish(currentUnit.story_en)}
              </div>
            </div>
          )}

          {/* VIEW 3: BANGLA STORY ONLY */}
          {viewMode === 'bn' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">🇧🇩</span>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    বাংলা অনুবাদ
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  শব্দে ক্লিক করে ইংরেজি দেখুন
                </span>
              </div>
              <div className="prose dark:prose-invert max-w-none pt-1">
                {renderStoryBangla(currentUnit.story_bn)}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* WORD DETAIL MODAL / BOTTOM POPOVER */}
      {selectedWord && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedWord(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-sans">
                  {selectedWord.pos || 'Vocabulary'}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-sans">
                  {selectedWord.word}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWord(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meaning card */}
            <div className="space-y-3">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
                  বাংলা অর্থ (Bangla Meaning)
                </span>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-200 font-bangla">
                  {selectedWord.meaning}
                </p>
              </div>

              {selectedWord.definition && (
                <div className="bg-amber-50/80 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-200/70 dark:border-amber-900/60">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 block mb-1">
                    Barron Core Definition
                  </span>
                  <p className="text-xs text-amber-950 dark:text-amber-200 font-sans leading-relaxed">
                    {selectedWord.definition}
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => speakWord(selectedWord.word)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>উচ্চারণ শুনুন</span>
              </button>

              {onOpenWordDetailByName && (
                <button
                  type="button"
                  onClick={() => {
                    const word = selectedWord.word;
                    setSelectedWord(null);
                    onOpenWordDetailByName(word);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
                >
                  <span>অভিধানে দেখুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Shuffle, 
  Search, 
  Printer, 
  Layers,
  Heart,
  ArrowLeft,
  Loader2,
  Leaf,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { VocabWord } from '../data/types';
import { getAllWords } from '../data/units';
import { getWordEnrichment } from '../data/wordEnrichments';
import { CardTheme } from '../utils/cardCanvasExport';
import { exportCardElementToJpeg, CardExportResult } from '../utils/cardDomExport';

interface CardGeneratorViewProps {
  initialWord?: VocabWord | null;
  onBackToHome?: () => void;
}

export const CardGeneratorView: React.FC<CardGeneratorViewProps> = ({
  initialWord,
  onBackToHome,
}) => {
  const allWords = useMemo(() => getAllWords(), []);
  const [selectedWord, setSelectedWord] = useState<VocabWord>(() => initialWord || allWords[0]);
  const [cardTheme, setCardTheme] = useState<CardTheme>('emerald');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const [previewModalData, setPreviewModalData] = useState<CardExportResult | null>(null);

  const enrichment = useMemo(() => getWordEnrichment(selectedWord), [selectedWord]);

  useEffect(() => {
    if (initialWord) {
      setSelectedWord(initialWord);
    }
  }, [initialWord]);

  const handlePickRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * allWords.length);
    setSelectedWord(allWords[randomIndex]);
  };

  const handleCopyText = () => {
    const text = `📖 Word of the Day: ${selectedWord.word} [${selectedWord.pronunciation}]
Part of Speech: ${selectedWord.partOfSpeech}
বাংলা অর্থ: ${selectedWord.banglaMeaning}
Example: "${selectedWord.examples[0]?.english || ''}"
(${selectedWord.examples[0]?.bangla || ''})
Synonyms: ${selectedWord.synonyms.join(', ')}
— Bonolota Vocabulary (bonolota.online)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `📖 Word of the Day: ${selectedWord.word} [${selectedWord.pronunciation}]
Part of Speech: ${selectedWord.partOfSpeech}
বাংলা অর্থ: ${selectedWord.banglaMeaning}
Example: "${selectedWord.examples[0]?.english || ''}"
(${selectedWord.examples[0]?.bangla || ''})
Synonyms: ${selectedWord.synonyms.join(', ')}
— Bonolota Vocabulary (bonolota.online)`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bonolota - ${selectedWord.word}`,
          text,
          url: window.location.href,
        });
      } catch {
        // user dismissed or cancelled
      }
    } else {
      handleCopyText();
    }
  };

  const handleDownloadJpeg = async () => {
    if (isDownloading || !cardRef.current) return;
    setIsDownloading(true);
    try {
      // Export directly from the live DOM card element using browser's native rendering
      const result = await exportCardElementToJpeg(cardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
      });
      
      setPreviewModalData(result);

      // Trigger automatic mobile & desktop file download
      const filename = `${selectedWord.word.toLowerCase()}_bonolota.jpeg`;
      if (result.blob) {
        const blobUrl = URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      } else {
        const link = document.createElement('a');
        link.download = filename;
        link.href = result.dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Failed to export photo card:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleNativeSharePhoto = async () => {
    if (!cardRef.current) return;
    try {
      let currentResult = previewModalData;
      if (!currentResult) {
        currentResult = await exportCardElementToJpeg(cardRef.current);
        setPreviewModalData(currentResult);
      }

      if (currentResult?.blob && navigator.canShare) {
        const file = new File(
          [currentResult.blob],
          `${selectedWord.word.toLowerCase()}_bonolota.jpeg`,
          { type: 'image/jpeg' }
        );

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Bonolota - ${selectedWord.word}`,
            text: `📖 ${selectedWord.word}: ${selectedWord.banglaMeaning} — bonolota.online`,
          });
          return;
        }
      }
    } catch {
      // user cancelled share
    }

    handleShare();
  };

  const handlePrintCard = () => {
    window.print();
  };

  // Theme styling configurations with botanical accents
  const themeStyles: Record<CardTheme, {
    container: string;
    badge: string;
    wordText: string;
    meaningBg: string;
    meaningText: string;
    tagBg: string;
    accent: string;
    leafColor: string;
  }> = {
    emerald: {
      container: 'bg-gradient-to-br from-[#ffffff] via-[#f4fdf7] to-[#ddfae8] text-slate-900 border-emerald-200/90 shadow-sm',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      wordText: 'text-emerald-950',
      meaningBg: 'bg-white/85 border-emerald-200/80 shadow-2xs backdrop-blur-xs',
      meaningText: 'text-emerald-900',
      tagBg: 'bg-emerald-100/70 text-emerald-800 border-emerald-200',
      accent: 'text-emerald-600',
      leafColor: 'text-emerald-700/15 dark:text-emerald-400/15',
    },
    botanical: {
      container: 'bg-gradient-to-br from-[#f8fcf9] via-[#edf7f1] to-[#daf1e2] text-slate-900 border-emerald-300/80 shadow-sm',
      badge: 'bg-[#bde8cd] text-emerald-950 border-emerald-400',
      wordText: 'text-emerald-950',
      meaningBg: 'bg-white/90 border-emerald-300/80 shadow-2xs backdrop-blur-xs',
      meaningText: 'text-emerald-950',
      tagBg: 'bg-[#c5ecd4] text-emerald-900 border-emerald-300',
      accent: 'text-emerald-700',
      leafColor: 'text-emerald-800/15 dark:text-emerald-300/15',
    },
    midnight: {
      container: 'bg-gradient-to-br from-[#05140e] via-[#092218] to-[#041a13] text-white border-emerald-800/60 shadow-md',
      badge: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
      wordText: 'text-white',
      meaningBg: 'bg-emerald-950/70 border-emerald-800/80 shadow-2xs backdrop-blur-xs',
      meaningText: 'text-emerald-300',
      tagBg: 'bg-emerald-900/60 text-emerald-200 border-emerald-800',
      accent: 'text-teal-400',
      leafColor: 'text-emerald-400/15 dark:text-emerald-400/15',
    },
    sunset: {
      container: 'bg-gradient-to-br from-[#fffdfa] via-[#fef6ec] to-[#fde5c8] text-slate-900 border-amber-200 shadow-sm',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      wordText: 'text-amber-950',
      meaningBg: 'bg-white/85 border-amber-200/80 shadow-2xs backdrop-blur-xs',
      meaningText: 'text-amber-950',
      tagBg: 'bg-amber-100/70 text-amber-900 border-amber-200',
      accent: 'text-amber-600',
      leafColor: 'text-amber-700/15 dark:text-amber-400/15',
    },
    indigo: {
      container: 'bg-gradient-to-br from-[#08111e] via-[#0c1e2a] to-[#09241b] text-white border-teal-800/60 shadow-md',
      badge: 'bg-teal-950/90 text-teal-300 border-teal-700',
      wordText: 'text-white',
      meaningBg: 'bg-teal-950/70 border-teal-800/90 shadow-2xs backdrop-blur-xs',
      meaningText: 'text-teal-200',
      tagBg: 'bg-teal-900/60 text-teal-200 border-teal-800',
      accent: 'text-teal-400',
      leafColor: 'text-teal-400/15 dark:text-teal-300/15',
    }
  };

  const currentStyle = themeStyles[cardTheme];

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allWords.filter(w => w.word.toLowerCase().includes(q) || w.banglaMeaning.includes(q)).slice(0, 8);
  }, [allWords, searchQuery]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5 font-bangla animate-in fade-in duration-200">
      {/* Top Banner - Minimal Homepage Style */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 p-4 sm:p-5 shadow-xs border border-emerald-100/90 dark:border-emerald-900/40 text-slate-900 dark:text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
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
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                <span>স্টাডি ও শেয়ারেবল কার্ড</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              স্টাডি কার্ড জেনারেটর (Card Maker)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-normal">
              বোটানিক্যাল থিমে যেকোনো শব্দের দৃষ্টিনন্দন অ্যাডাপ্টিভ কার্ড তৈরি করুন ও JPEG ডাউনলোড করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handlePickRandomWord}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Shuffle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>র‍্যান্ডম শব্দ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel: Word Search & Theme Selector */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search to select word */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="যেকোনো শব্দ দিয়ে কার্ড বানান (যেমন: Lucide, Ephemeral, Candid)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-500 shadow-2xs"
            />

            {/* Dropdown search results */}
            {searchFiltered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {searchFiltered.map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setSelectedWord(w);
                      setSearchQuery('');
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs hover:bg-emerald-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-sans font-bold text-slate-800 dark:text-slate-200">{w.word}</span>
                    <span className="text-slate-500 font-bangla">{w.banglaMeaning}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Switcher Pills */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-0.5 sm:pb-0">
            {(['emerald', 'botanical', 'midnight', 'sunset', 'indigo'] as CardTheme[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setCardTheme(t)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border flex items-center gap-1 ${
                  cardTheme === t
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Leaf className="w-3 h-3 opacity-70" />
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The Aesthetic Botanical Card Display - Fully Adaptive Layout */}
      <div className="flex justify-center px-1">
        <div
          ref={cardRef}
          className={`w-full max-w-md sm:max-w-lg mx-auto p-5 sm:p-7 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between min-h-[500px] sm:min-h-[540px] relative overflow-hidden select-none shadow-md ${currentStyle.container}`}
        >
          {/* Subtle Organic Texture Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          />

          {/* Botanical Leaf Silhouette - Top Right Vine Tendril */}
          <svg
            className={`absolute -top-1 -right-1 w-24 h-24 sm:w-32 sm:h-32 pointer-events-none transition-all duration-300 ${currentStyle.leafColor}`}
            viewBox="0 0 120 120"
            fill="currentColor"
          >
            <path d="M120 0 Q80 20 40 80" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M105 12 C115 5 120 15 112 25 C102 24 98 18 105 12 Z" />
            <path d="M90 24 C78 18 74 30 85 36 C92 34 94 28 90 24 Z" />
            <path d="M80 40 C92 32 100 44 90 52 C82 48 78 44 80 40 Z" />
            <path d="M68 55 C56 50 52 62 64 68 C70 65 72 58 68 55 Z" />
            <path d="M55 70 C68 62 74 74 64 82 C56 78 54 72 55 70 Z" />
            <path d="M40 80 C30 84 28 94 36 98 C44 94 43 85 40 80 Z" />
          </svg>

          {/* Botanical Leaf Silhouette - Bottom Left Fern Frond */}
          <svg
            className={`absolute -bottom-1 -left-1 w-24 h-24 sm:w-32 sm:h-32 pointer-events-none transition-all duration-300 ${currentStyle.leafColor}`}
            viewBox="0 0 120 120"
            fill="currentColor"
          >
            <path d="M0 120 Q40 100 80 40" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M22 105 C10 100 8 88 20 86 C26 92 26 100 22 105 Z" />
            <path d="M35 90 C24 84 22 72 34 74 C40 78 40 86 35 90 Z" />
            <path d="M50 75 C38 68 38 56 50 58 C56 62 55 70 50 75 Z" />
            <path d="M65 60 C55 52 56 42 66 44 C72 48 70 56 65 60 Z" />
            <path d="M30 100 C38 92 48 97 45 106 C36 106 31 102 30 100 Z" />
            <path d="M45 84 C53 76 63 81 60 90 C52 90 47 86 45 84 Z" />
            <path d="M60 68 C68 60 78 65 75 74 C67 74 62 70 60 68 Z" />
            <path d="M80 40 C88 30 100 32 98 44 C88 47 82 44 80 40 Z" />
          </svg>

          {/* Ambient Lighting Accents */}
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />

          {/* 1. Card Top Brand & Badge */}
          <div className="relative z-10 flex items-center justify-between gap-3 pb-3 border-b border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-black/10 p-0.5 shadow-2xs shrink-0">
                <img
                  src="/assets/aistudio/Botanical_Book_B_Emblem_8fbb1e88.png"
                  alt="Bonolota"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-extrabold text-sm sm:text-base tracking-tight font-sans text-slate-900 dark:text-white leading-tight">
                  Bonolota Vocabulary
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bangla leading-tight mt-1">
                  শব্দ ভাণ্ডার · Unit {selectedWord.unitId}
                </span>
              </div>
            </div>

            <div className="shrink-0">
              <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider flex items-center gap-1 shadow-2xs ${currentStyle.badge}`}>
                <Leaf className="w-3 h-3 opacity-80" />
                <span>{selectedWord.partOfSpeech}</span>
              </span>
            </div>
          </div>

          {/* 2. Middle Body: The Vocabulary Showcase - Natural Flow with Ample Breathing Room */}
          <div className="relative z-10 space-y-4 text-center my-auto py-2">
            {/* Word Heading & Pronunciation */}
            <div className="space-y-1 py-1">
              <h3 className={`text-3xl sm:text-4xl md:text-5xl font-black font-sans tracking-tight leading-normal ${currentStyle.wordText}`}>
                {selectedWord.word}
              </h3>
              <p className="text-xs sm:text-sm font-mono opacity-70 tracking-wider font-medium leading-normal">
                {selectedWord.pronunciation}
              </p>
            </div>

            {/* Primary Bangla Meaning */}
            <div className={`p-4 sm:p-5 rounded-2xl border text-center shadow-2xs backdrop-blur-xs space-y-1.5 ${currentStyle.meaningBg}`}>
              <span className="text-[11px] font-bold uppercase tracking-widest opacity-60 block leading-normal">
                বাংলা অর্থ
              </span>
              <p className={`text-lg sm:text-xl md:text-2xl font-black font-bangla leading-normal ${currentStyle.meaningText}`}>
                {selectedWord.banglaMeaning}
              </p>
            </div>

            {/* Example Sentence with Bengali Translation */}
            {selectedWord.examples[0] && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-1.5 text-center">
                <p className="text-xs sm:text-sm font-sans italic font-medium opacity-90 leading-relaxed">
                  "{selectedWord.examples[0].english}"
                </p>
                {selectedWord.examples[0].bangla && (
                  <p className="text-xs sm:text-sm font-bangla opacity-85 leading-normal">
                    {selectedWord.examples[0].bangla}
                  </p>
                )}
              </div>
            )}

            {/* Synonyms */}
            {selectedWord.synonyms.length > 0 && (
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap pt-1">
                <span className="text-[11px] sm:text-xs uppercase font-bold opacity-60">SYNONYMS:</span>
                {selectedWord.synonyms.slice(0, 4).map((s, idx) => (
                  <span
                    key={idx}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border font-sans shadow-2xs ${currentStyle.tagBg}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 3. Card Footer Credit: bonolota.online and Made with ❤️ by Chanchal */}
          <div className="relative z-10 pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2 text-xs opacity-85 font-sans">
            <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
              bonolota.online
            </span>
            <span className="font-bangla font-semibold text-right whitespace-nowrap">
              Made with ❤️ by Chanchal
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: JPEG Download, Format Text Copy, Print */}
      <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
        <button
          type="button"
          onClick={handleDownloadJpeg}
          disabled={isDownloading}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{isDownloading ? 'ডাউনলোড হচ্ছে...' : 'JPEG ডাউনলোড'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyText}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'কপি হয়েছে!' : 'ফরম্যাট টেক্সট কপি'}</span>
        </button>

        <button
          type="button"
          onClick={handleNativeSharePhoto}
          className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          title="ফটো সেভ বা শেয়ার করুন"
        >
          <Share2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>ফটো শেয়ার</span>
        </button>

        <button
          type="button"
          onClick={handlePrintCard}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>প্রিন্ট / PDF</span>
        </button>
      </div>

      {/* Generated Photo Card Preview & Save Modal */}
      {previewModalData && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPreviewModalData(null)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-3.5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white font-bangla">
                    আপনার ফটো কার্ড প্রস্তুত!
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                    {selectedWord.word} — High Resolution JPEG
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewModalData(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Generated Image Preview */}
            <div className="relative group rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 flex items-center justify-center p-1">
              <img
                src={previewModalData.dataUrl}
                alt={`${selectedWord.word} Vocabulary Photo Card`}
                className="w-full h-auto max-h-[55vh] object-contain rounded-xl shadow-inner select-none pointer-events-auto"
              />
            </div>

            {/* Mobile Long Press Tip */}
            <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200 font-bangla flex items-start gap-2 leading-relaxed">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>মোবাইল টিপ:</strong> ব্রাউজারে স্বয়ংক্রিয় ডাউনলোড ছাড়া সরাসরি ছবির ওপর ২ সেকেন্ড চেপে ধরে (Long Press) <strong>'Save to Photos'</strong> বা 'Save Image' চেপে সরাসরি গ্যালারিতে সংরক্ষণ করতে পারেন।
              </span>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1 font-bangla">
              <button
                type="button"
                onClick={() => {
                  const filename = `${selectedWord.word.toLowerCase()}_bonolota.jpeg`;
                  if (previewModalData.blob) {
                    const blobUrl = URL.createObjectURL(previewModalData.blob);
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = blobUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
                  } else {
                    const link = document.createElement('a');
                    link.download = filename;
                    link.href = previewModalData.dataUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>পুনরায় ডাউনলোড</span>
              </button>

              <button
                type="button"
                onClick={handleNativeSharePhoto}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 transition-all"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>ফটো সেভ / শেয়ার</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

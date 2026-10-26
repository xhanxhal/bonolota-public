import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCw, 
  Trophy, 
  Flame, 
  Timer, 
  CheckCircle2, 
  Zap, 
  Shuffle,
  ArrowLeft
} from 'lucide-react';
import { VocabWord } from '../data/types';
import { getAllWords, getAllUnits } from '../data/units';
import { sound } from '../utils/sound';
import { triggerConfetti } from '../utils/celebration';
import { haptics } from '../utils/haptics';

interface MatchGameViewProps {
  onBackToHome?: () => void;
  onOpenWordDetail?: (word: VocabWord) => void;
}

interface TileItem {
  id: string;
  wordId: string;
  text: string;
  type: 'english' | 'bangla';
  isMatched: boolean;
  wordObj: VocabWord;
}

export const MatchGameView: React.FC<MatchGameViewProps> = ({
  onBackToHome,
}) => {
  const allWords = useMemo(() => getAllWords(), []);
  const allUnits = useMemo(() => getAllUnits(), []);

  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [roundWords, setRoundWords] = useState<VocabWord[]>([]);
  const [englishTiles, setEnglishTiles] = useState<TileItem[]>([]);
  const [banglaTiles, setBanglaTiles] = useState<TileItem[]>([]);
  
  const [selectedEnglish, setSelectedEnglish] = useState<TileItem | null>(null);
  const [selectedBangla, setSelectedBangla] = useState<TileItem | null>(null);
  const [wrongMatchPair, setWrongMatchPair] = useState<{ enId: string; bnId: string } | null>(null);

  const [matchedCount, setMatchedCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const PAIR_COUNT = 6;

  // Initialize a new round
  const startNewRound = (unitId: number = selectedUnitId) => {
    setSelectedUnitId(unitId);
    setSelectedEnglish(null);
    setSelectedBangla(null);
    setWrongMatchPair(null);
    setMatchedCount(0);
    setStreak(0);
    setScore(0);
    setSeconds(0);
    setIsGameOver(false);

    const pool = unitId === 0 
      ? [...allWords].sort(() => 0.5 - Math.random()) 
      : (allUnits.find(u => u.id === unitId)?.words || allWords);

    const shuffledWords = [...pool].sort(() => 0.5 - Math.random()).slice(0, PAIR_COUNT);
    setRoundWords(shuffledWords);

    const en: TileItem[] = shuffledWords.map(w => ({
      id: `en-${w.id}`,
      wordId: w.id,
      text: w.word,
      type: 'english' as const,
      isMatched: false,
      wordObj: w
    })).sort(() => 0.5 - Math.random());

    const bn: TileItem[] = shuffledWords.map(w => ({
      id: `bn-${w.id}`,
      wordId: w.id,
      text: w.banglaMeaning.split(/[,;]/)[0].trim(),
      type: 'bangla' as const,
      isMatched: false,
      wordObj: w
    })).sort(() => 0.5 - Math.random());

    setEnglishTiles(en);
    setBanglaTiles(bn);
  };

  useEffect(() => {
    startNewRound(1);
  }, []);

  // Timer
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver]);

  // Match evaluator effect
  useEffect(() => {
    if (!selectedEnglish || !selectedBangla) return;

    if (selectedEnglish.wordId === selectedBangla.wordId) {
      sound.playSuccess();
      const newStreak = streak + 1;
      setStreak(newStreak);
      setScore(s => s + 100 + newStreak * 20);

      setEnglishTiles(prev => prev.map(t => t.id === selectedEnglish.id ? { ...t, isMatched: true } : t));
      setBanglaTiles(prev => prev.map(t => t.id === selectedBangla.id ? { ...t, isMatched: true } : t));

      setSelectedEnglish(null);
      setSelectedBangla(null);

      const nextMatched = matchedCount + 1;
      setMatchedCount(nextMatched);

      if (nextMatched === PAIR_COUNT) {
        setIsGameOver(true);
        triggerConfetti();
      }
    } else {
      sound.playError();
      setStreak(0);
      const enId = selectedEnglish.id;
      const bnId = selectedBangla.id;
      setWrongMatchPair({ enId, bnId });

      const timer = setTimeout(() => {
        setSelectedEnglish(null);
        setSelectedBangla(null);
        setWrongMatchPair(null);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [selectedEnglish, selectedBangla]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2.5 font-bangla animate-in fade-in duration-200">
      {/* Ultra Compact Adaptive Header: fits on mobile with no scroll */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        {/* Left: Back button + Title & Unit */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="হোমে ফিরুন"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white whitespace-nowrap">
              শব্দ মেলানো
            </span>

            {/* Compact Unit Selector Dropdown */}
            <select
              value={selectedUnitId}
              onChange={e => startNewRound(Number(e.target.value))}
              className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value={0}>🎲 মিক্স</option>
              {allUnits.map(u => (
                <option key={u.id} value={u.id}>Unit {u.id}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Live Metrics & Shuffle in a tight single row */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {/* Time */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold border border-slate-200/80 dark:border-slate-700">
            <Timer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{formatTime(seconds)}</span>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-sans text-xs font-bold border border-emerald-200/80 dark:border-emerald-800/80">
            <Flame className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
            <span>{streak}x</span>
          </div>

          {/* Score */}
          <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-sans text-xs font-extrabold border border-slate-200 dark:border-slate-700">
            {score}
          </div>

          {/* Shuffle / New Round */}
          <button
            type="button"
            onClick={() => startNewRound(selectedUnitId)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="নতুন শব্দ দিয়ে খেলুন"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Game Board - ALWAYS 2-COLUMN SIDE-BY-SIDE ON MOBILE */}
      {!isGameOver ? (
        <div className="p-2 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Left Column: English Words */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  English ({PAIR_COUNT - matchedCount})
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline">
                  ট্যাপ করে নির্বাচন
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {englishTiles.map(tile => {
                  const isSelected = selectedEnglish?.id === tile.id;
                  const isWrong = wrongMatchPair?.enId === tile.id;

                  if (tile.isMatched) {
                    return (
                      <div
                        key={tile.id}
                        className="py-2 px-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-between opacity-40 cursor-default min-h-[44px] sm:min-h-[48px]"
                      >
                        <span className="font-sans font-bold text-xs sm:text-sm line-through truncate">{tile.text}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                    );
                  }

                  return (
                    <button
                      key={tile.id}
                      type="button"
                      onClick={() => {
                        haptics.tap();
                        setSelectedEnglish(tile);
                      }}
                      className={`w-full py-2 px-2.5 rounded-xl text-left font-sans font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs border min-h-[44px] sm:min-h-[48px] flex items-center justify-between active:scale-[0.98] ${
                        isWrong
                          ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-400 hover:bg-emerald-50/20 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="truncate">{tile.text}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Bangla Meanings */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider font-bangla">
                  বাংলা অর্থ
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline">
                  জোড়া মেলান
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {banglaTiles.map(tile => {
                  const isSelected = selectedBangla?.id === tile.id;
                  const isWrong = wrongMatchPair?.bnId === tile.id;

                  if (tile.isMatched) {
                    return (
                      <div
                        key={tile.id}
                        className="py-2 px-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-between opacity-40 cursor-default min-h-[44px] sm:min-h-[48px]"
                      >
                        <span className="font-bangla font-bold text-xs sm:text-sm line-through truncate">{tile.text}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                    );
                  }

                  return (
                    <button
                      key={tile.id}
                      type="button"
                      onClick={() => {
                        haptics.tap();
                        setSelectedBangla(tile);
                      }}
                      className={`w-full py-2 px-2.5 rounded-xl text-left font-bangla font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs border min-h-[44px] sm:min-h-[48px] flex items-center justify-between active:scale-[0.98] ${
                        isWrong
                          ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-400 hover:bg-emerald-50/20 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="truncate">{tile.text}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Victory & Completion Screen */
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-center space-y-4 animate-in zoom-in-95">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
            <Trophy className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              চমৎকার! সব জোড়া মিলিয়েছেন! 🎉
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              আপনি মাত্র <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatTime(seconds)}</span> সেকেন্ডে শেষ করেছেন।
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-w-[90px]">
              <span className="text-[10px] text-slate-400 block font-medium">স্কোর</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-sans">{score}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 min-w-[90px]">
              <span className="text-[10px] text-slate-400 block font-medium">স্ট্রিক</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-sans">{PAIR_COUNT}x</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => startNewRound(selectedUnitId)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-2xs transition-all inline-flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>আবার খেলুন (নতুন শব্দ)</span>
          </button>
        </div>
      )}
    </div>
  );
};

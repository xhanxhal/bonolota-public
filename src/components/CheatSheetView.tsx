import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  Eye, 
  EyeOff, 
  Layers, 
  BookOpen, 
  Search, 
  FileText,
  ArrowLeft 
} from 'lucide-react';
import { getAllWords, getAllUnits } from '../data/units';
import { VocabWord } from '../data/types';

interface CheatSheetViewProps {
  onBackToHome?: () => void;
}

export const CheatSheetView: React.FC<CheatSheetViewProps> = ({
  onBackToHome,
}) => {
  const allUnits = useMemo(() => getAllUnits(), []);
  const allWords = useMemo(() => getAllWords(), []);

  const [selectedUnitId, setSelectedUnitId] = useState<number>(1);
  const [hideBangla, setHideBangla] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const displayWords = useMemo(() => {
    let list: VocabWord[] = [];
    if (selectedUnitId === 0) {
      list = allWords.slice(0, 100);
    } else {
      const u = allUnits.find(unit => unit.id === selectedUnitId);
      list = u ? u.words : [];
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(w => w.word.toLowerCase().includes(q) || w.banglaMeaning.includes(q));
  }, [allUnits, allWords, selectedUnitId, searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 font-bangla animate-in fade-in duration-200">
      {/* Top Banner - Minimal Homepage Style (Hidden in Print) */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 p-5 sm:p-6 shadow-xs border border-emerald-100/90 dark:border-emerald-900/40 text-slate-900 dark:text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
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
              প্রিন্ট ও অফলাইন রিভিশন শিট
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            প্রিন্ট শিট ও চিট শিট (Printable Cheat Sheet)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal">
            A4 সাইজে সাজানো পরিচ্ছন্ন টেবিল—সরাসরি প্রিন্ট করুন অথবা ব্রাউজার থেকে "Save as PDF" করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-2xs cursor-pointer transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>প্রিন্ট / PDF ডাউনলোড</span>
        </button>
      </div>

      {/* Filter and View Controls (Hidden in Print) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500">ইউনিট:</span>
          <select
            value={selectedUnitId}
            onChange={e => setSelectedUnitId(Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            {allUnits.map(u => (
              <option key={u.id} value={u.id}>Unit {u.id}: {u.title.split(':')[1] || u.title} ({u.words.length} শব্দ)</option>
            ))}
          </select>
        </div>

        {/* Self-Test Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHideBangla(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              hideBangla
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {hideBangla ? <EyeOff className="w-3.5 h-3.5 text-emerald-600" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{hideBangla ? 'বাংলা অর্থ দেখানো হচ্ছে না (Self-Test)' : 'বাংলা অর্থ লুকান (Self-Test)'}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs print:p-0 print:border-none print:shadow-none space-y-4">
        {/* Printable Header */}
        <div className="border-b-2 border-emerald-600 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-bangla">
              Bonolota Vocabulary — {selectedUnitId === 0 ? 'Core Vocabulary' : `Unit ${selectedUnitId}`} স্টাডি শিট
            </h3>
            <p className="text-xs text-slate-500 font-bangla">
              মোট শব্দ: {displayWords.length} টি · পূর্ণাঙ্গ স্টাডি ও দ্রুত রিভিশন শিট
            </p>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400">
            bonolota.app
          </div>
        </div>

        {/* Clean 2-Column Word List Table */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {displayWords.map((word, idx) => (
            <div
              key={word.id}
              className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs"
            >
              <div className="sm:w-1/3 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-slate-400 text-[10px] w-6">{idx + 1}.</span>
                  <span className="font-sans font-black text-base text-slate-900 dark:text-white">
                    {word.word}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {word.partOfSpeech}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 pl-7">
                  {word.pronunciation}
                </div>
              </div>

              {/* Bangla Meaning Column */}
              <div className="sm:w-1/3 font-bangla pl-7 sm:pl-0">
                <span className="text-slate-400 text-[10px] uppercase block font-semibold">বাংলা অর্থ:</span>
                <span className={`text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200 ${hideBangla ? 'filter blur-sm select-none' : ''}`}>
                  {word.banglaMeaning}
                </span>
              </div>

              {/* Example Column */}
              <div className="sm:w-1/3 font-sans text-slate-600 dark:text-slate-300 pl-7 sm:pl-0 text-[11px]">
                {word.examples[0] && (
                  <>
                    <p className="italic">"{word.examples[0].english}"</p>
                    {word.examples[0].bangla && !hideBangla && (
                      <p className="font-bangla text-slate-400 text-[10px] mt-0.5">{word.examples[0].bangla}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

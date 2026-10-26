import React from 'react';
import { 
  Trophy, 
  Flame, 
  Target, 
  BookOpen, 
  Check, 
  TrendingUp, 
  RotateCw, 
  Calendar, 
  Layers, 
  Award,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { storage } from '../utils/storage';
import { getAllWords } from '../data/units';

export const ProgressView: React.FC = () => {
  const stats = storage.getLearningStats();
  const settings = storage.getSettings();
  const quizHistory = storage.getQuizHistory();
  const allWords = getAllWords();

  const totalWords = allWords.length || 1850;
  const masteredPercent = Math.min(100, Math.round((stats.wordsMastered / totalWords) * 100));
  const studiedPercent = Math.min(100, Math.round((stats.wordsStudied / totalWords) * 100));
  const unseenCount = Math.max(0, totalWords - stats.wordsStudied);
  const xp = stats.wordsStudied * 10 + stats.wordsMastered * 25 + stats.quizzesTaken * 20;

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* Profile Header */}
      <div className="rounded-3xl border border-emerald-100 dark:border-slate-800 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 text-xs font-bold font-bangla">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>অগ্রগতি ও বিশ্লেষণ</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-bangla">
            শিক্ষার্থীর প্রোফাইল
          </h2>

          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 font-bangla">
            ১,৮৫০টি শব্দের মধ্য থেকে আপনার সক্রিয় শব্দভাণ্ডার বৃদ্ধি ও কুইজের দক্ষতা।
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
            <span className="font-bold text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl flex items-center gap-1">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" /> {stats.learningStreak} দিন ধারাবাহিক স্ট্রিক
            </span>
            <span className="font-bold text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1">
              <Award className="w-4 h-4 text-emerald-600" /> {xp} মোট XP অর্জিত
            </span>
          </div>
        </div>

        <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800 border border-emerald-200 shadow-sm flex flex-col items-center justify-center shrink-0">
          <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-sans">{masteredPercent}%</span>
          <span className="text-[10px] font-bold text-slate-400 font-bangla">সম্পূর্ণ আয়ত্ত</span>
        </div>
      </div>

      {/* Overview Cards with Minimal Surfaces */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-bangla">
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-teal-700 dark:text-teal-400">
            <span className="text-xs font-bold">পড়া হয়েছে</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
            {stats.wordsStudied}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">মোট ১,৮৫০টি শব্দের মধ্যে</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/90 dark:border-emerald-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-bold">মুখস্থ সম্পন্ন</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-sans">
            {stats.wordsMastered}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">লেভেল ৪ স্থায়ী স্মৃতি</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-bold">দৈনিক স্ট্রিক</span>
            <Flame className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
            {stats.learningStreak}d
          </p>
          <p className="text-[11px] text-slate-400 font-medium">সক্রিয় দিন সংখ্যা</p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
            <span className="text-xs font-bold">ভুল শব্দ</span>
            <RotateCw className="w-4 h-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-sans">
            {stats.needsRevisionCount}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">অনুশীলন প্রয়োজন</p>
        </div>
      </div>

      {/* Vocabulary Mastery Distribution */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xs">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-bangla">
          শব্দভাণ্ডার বণ্টন অনুপাত (Mastery Distribution)
        </h3>

        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div
            title={`Mastered: ${stats.wordsMastered} words`}
            style={{ width: `${(stats.wordsMastered / totalWords) * 100}%` }}
            className="bg-emerald-500 h-full transition-all"
          />
          <div
            title={`Learning: ${stats.wordsStudied - stats.wordsMastered} words`}
            style={{ width: `${(Math.max(0, stats.wordsStudied - stats.wordsMastered) / totalWords) * 100}%` }}
            className="bg-teal-500 h-full transition-all"
          />
          <div
            title={`Unseen: ${unseenCount} words`}
            style={{ width: `${(unseenCount / totalWords) * 100}%` }}
            className="bg-slate-200 dark:bg-slate-700 h-full transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs font-bangla">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">মুখস্থ: <strong className="text-emerald-700 font-sans">{stats.wordsMastered}</strong> ({masteredPercent}%)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-slate-600 dark:text-slate-300">শেখার পথে: <strong className="text-teal-700 font-sans">{Math.max(0, stats.wordsStudied - stats.wordsMastered)}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-slate-600 dark:text-slate-300">নতুন শব্দ: <strong className="text-slate-500 font-sans">{unseenCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Quiz History Logs */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xs">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-bangla">
          সাম্প্রতিক কুইজ পরীক্ষার ইতিহাস (Recent Quizzes)
        </h3>

        {quizHistory.length === 0 ? (
          <p className="text-xs text-slate-500 py-2 font-bangla">
            এখনো কোনো কুইজ সম্পন্ন হয়নি। কুইজ ট্যাব থেকে পরীক্ষা দিয়ে আপনার অগ্রগতি রেকর্ড করুন!
          </p>
        ) : (
          <div className="overflow-x-auto font-bangla">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold">
                  <th className="pb-3">তারিখ</th>
                  <th className="pb-3">মোড</th>
                  <th className="pb-3">স্কোর</th>
                  <th className="pb-3 text-right">নির্ভুলতা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {quizHistory.slice(0, 8).map(q => {
                  const dateStr = new Date(q.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <tr key={q.id}>
                      <td className="py-3 text-slate-500">{dateStr}</td>
                      <td className="py-3 capitalize text-slate-800 dark:text-slate-200">{q.mode.replace(/-/g, ' ')}</td>
                      <td className="py-3 font-mono text-slate-700 dark:text-slate-300">{q.correctAnswers} / {q.totalQuestions}</td>
                      <td className="py-3 text-right font-mono font-bold">
                        <span className={q.scorePercent >= 80 ? 'text-emerald-600' : q.scorePercent >= 60 ? 'text-amber-600' : 'text-rose-600'}>
                          {q.scorePercent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

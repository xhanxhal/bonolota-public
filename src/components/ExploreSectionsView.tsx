import React, { useState } from 'react';
import { 
  Zap, 
  Scale, 
  HelpCircle, 
  FileText, 
  BookOpen, 
  Sparkles, 
  Share2, 
  Printer, 
  RotateCw, 
  Star, 
  BarChart2, 
  Settings, 
  ArrowLeft, 
  Search, 
  Layers, 
  ChevronRight
} from 'lucide-react';
import { NavTab } from './Navbar';

interface ExploreSectionsViewProps {
  onSelectTab: (tab: NavTab) => void;
  onBackToHome: () => void;
}

interface SectionItem {
  id: NavTab;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'games' | 'advanced' | 'tools' | 'workspace';
  badge?: string;
  tagline: string;
}

export const ExploreSectionsView: React.FC<ExploreSectionsViewProps> = ({
  onSelectTab,
  onBackToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'games' | 'advanced' | 'tools' | 'workspace'>('all');

  const sections: SectionItem[] = [
    // 1. Interactive Games & Quizzes
    {
      id: 'match-game',
      title: 'শব্দ মেলানো গেম',
      subtitle: 'Timed Speed Match',
      description: 'টাইমারে ইংরেজি ও বাংলা অর্থ জোড়া মিলিয়ে হাই-স্কোর ড্রিল।',
      icon: Zap,
      category: 'games',
      badge: 'জনপ্রিয় গেম',
      tagline: 'টাইমার ড্রিল'
    },
    {
      id: 'odd-one-out',
      title: 'Odd One Out কুইজ',
      subtitle: 'অমিল শব্দ শনাক্তকরণ',
      description: 'চারটি শব্দের মধ্যে অমিল শব্দটি দ্রুত খুঁজে বের করার পরীক্ষা।',
      icon: HelpCircle,
      category: 'games',
      badge: 'নতুন মোড',
      tagline: '৪ বিকল্প ড্রিল'
    },
    {
      id: 'quiz',
      title: 'মক কুইজ পরীক্ষা',
      subtitle: 'টাইমড মডেল টেস্ট',
      description: 'ইউনিটভিত্তিক ও পূর্ণাঙ্গ এমসিকিউ মক টেস্ট এবং ব্যাখ্যা।',
      icon: HelpCircle,
      category: 'games',
      badge: 'মডেল টেস্ট',
      tagline: 'টাইমার কুইজ'
    },
    {
      id: 'flashcards',
      title: '৩ডি ফ্ল্যাশ কার্ড',
      subtitle: 'Spaced Repetition Flip',
      description: 'স্পেসড রিপিটিশন মেথডে থ্রি-ডি কার্ড ফ্লিপ করে দ্রুত রিভিশন।',
      icon: Layers,
      category: 'games',
      badge: 'মেমরি বুস্টার',
      tagline: 'স্পেসড মেমরি'
    },

    // 2. Advanced Vocabulary & Context
    {
      id: 'confusing-words',
      title: 'Confusing Words',
      subtitle: 'জোড়া শব্দের পার্থক্য ও ফাঁদ',
      description: 'বিভ্রান্তিকর জোড়া শব্দের স্পষ্ট পার্থক্য ও ভুল এড়ানোর কৌশল।',
      icon: Scale,
      category: 'advanced',
      badge: 'জরুরি ড্রিল',
      tagline: 'কনফিউশন নিরসন'
    },
    {
      id: 'sentence-completion',
      title: 'শূন্যস্থান পূরণ',
      subtitle: 'Sentence Fill-in',
      description: 'বাক্যের প্রেক্ষাপট ও ক্লু বুঝে সঠিক শব্দ নির্বাচনের ড্রিল।',
      icon: FileText,
      category: 'advanced',
      badge: 'কন্টেক্সট ড্রিল',
      tagline: 'বাক্যে প্রয়োগ'
    },
    {
      id: 'stories',
      title: 'গল্পে শব্দ (Story)',
      subtitle: 'Stories with Vocabulary',
      description: 'বাস্তবধর্মী ছোট গল্পের প্রতিটি লাইনে ব্যবহৃত শব্দের পাঠ।',
      icon: BookOpen,
      category: 'advanced',
      badge: 'কনটেক্সট মোড',
      tagline: 'পড়ুন ও শিখুন'
    },
    {
      id: 'thematic-clusters',
      title: 'থিমেটিক ক্লাস্টার',
      subtitle: 'বিষয়ভিত্তিক শব্দ গুচ্ছ',
      description: 'আইন, অর্থনীতি, অনুভূতি ইত্যাদি ক্ষেত্রভিত্তিক শব্দের ম্যাপিং।',
      icon: Sparkles,
      category: 'advanced',
      badge: 'স্মার্ট গুচ্ছ',
      tagline: 'বিষয়ভিত্তিক'
    },

    // 3. Tools & Export
    {
      id: 'card-generator',
      title: 'স্টাডি কার্ড মেকার',
      subtitle: 'Flash Card Maker',
      description: 'যেকোনো শব্দের দৃষ্টিনন্দন শেয়ারযোগ্য স্টাডি কার্ড তৈরি।',
      icon: Share2,
      category: 'tools',
      badge: 'শেয়ারেবল',
      tagline: 'ইমেজ মেকার'
    },
    {
      id: 'cheat-sheet',
      title: 'প্রিন্ট শিট / চিটশিট',
      subtitle: 'A4 Printable Cheat Sheet',
      description: 'অফলাইন পড়ার সুবিধার্থে প্রিন্ট-ফ্রেন্ডলি A4 টেবিল ও নোট।',
      icon: Printer,
      category: 'tools',
      badge: 'অফলাইন শিট',
      tagline: 'প্রিন্ট ও PDF'
    },
    {
      id: 'learn',
      title: 'শব্দ গ্রিড ও ডিকশনারি',
      subtitle: 'পূর্ণাঙ্গ শব্দকোষ ও ফিল্টার',
      description: 'প্রতিটি শব্দের উচ্চারণ, অর্থ, সমার্থক ও বিপরীত শব্দ ভাণ্ডার।',
      icon: BookOpen,
      category: 'tools',
      badge: 'মূল লাইব্রেরি',
      tagline: 'সার্চ ও ফিল্টার'
    },

    // 4. Workspace & Personal
    {
      id: 'revision',
      title: 'ভুল শব্দ রিভিশন ড্রিল',
      subtitle: 'Spaced Revision Hub',
      description: 'কুইজে ভুল হওয়া শব্দগুলোর তালিকা থেকে দুর্বলতা দূরীকরণ।',
      icon: RotateCw,
      category: 'workspace',
      badge: 'স্মার্ট ফোকাস',
      tagline: 'দুর্বল শব্দ ঠিক'
    },
    {
      id: 'favorites',
      title: 'সংরক্ষিত প্রিয় শব্দ',
      subtitle: 'Bookmarked Vocabulary',
      description: 'আপনার স্টার মার্ক করা গুরুত্বপূর্ণ শব্দের ব্যক্তিগত সংগ্রহ।',
      icon: Star,
      category: 'workspace',
      badge: 'বুকমার্ক',
      tagline: 'ব্যক্তিগত হাব'
    },
    {
      id: 'progress',
      title: 'অগ্রগতি ও অ্যানালিটিক্স',
      subtitle: 'Learning Analytics',
      description: 'স্ট্রিক, মাস্টার্ড শব্দ, কুইজ নির্ভুলতার সামগ্রিক চার্ট।',
      icon: BarChart2,
      category: 'workspace',
      badge: 'পরিসংখ্যান',
      tagline: 'পারফরম্যান্স'
    },
    {
      id: 'settings',
      title: 'সেটিংস ও পছন্দসমূহ',
      subtitle: 'Customization & Audio',
      description: 'সাউন্ড, লাইট/ডার্ক থিম ও অডিও সেটিংস কাস্টমাইজেশন।',
      icon: Settings,
      category: 'workspace',
      badge: 'কাস্টমাইজ',
      tagline: 'ব্যক্তিগত পছন্দ'
    }
  ];

  const filteredSections = sections.filter(sec => {
    const matchesCategory = activeCategory === 'all' || sec.category === activeCategory;
    const matchesSearch = 
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sec.badge && sec.badge.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'সকল', count: sections.length },
    { id: 'games', label: '🎮 গেম', count: sections.filter(s => s.category === 'games').length },
    { id: 'advanced', label: '🧠 বিশেষ', count: sections.filter(s => s.category === 'advanced').length },
    { id: 'tools', label: '🛠️ টুলস', count: sections.filter(s => s.category === 'tools').length },
    { id: 'workspace', label: '📊 ব্যক্তিগত', count: sections.filter(s => s.category === 'workspace').length },
  ];

  return (
    <div className="w-full space-y-3 font-bangla animate-in fade-in duration-200">
      {/* Compact Top Header Bar - Minimal Homepage Style */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 p-3 sm:p-4 shadow-2xs border border-emerald-100/90 dark:border-emerald-900/40 text-slate-900 dark:text-white flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>হোম</span>
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              সকল সেকশন ও প্র্যাকটিস হাব
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal hidden sm:block">
              ১৫টি ভোকাবুলারি ড্রিল, গেম, কুইজ ও টুলসের সমন্বিত লাইব্রেরি
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-[11px] font-bold border border-emerald-200/80 dark:border-emerald-800/80 shrink-0">
          ১৫টি ফিচার
        </span>
      </div>

      {/* Filter and Search Bar - Sleek Single Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="সেকশন খুঁজুন..."
            className="w-full pl-8 pr-4 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden text-slate-800 dark:text-slate-100 transition-all font-bangla placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 border border-transparent'
              }`}
            >
              {cat.label}
              <span className={`ml-1 px-1 py-0.2 rounded-full text-[9px] ${
                activeCategory === cat.id
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Sections - STRICTLY GRID STYLE (2-COL ON MOBILE, 3-COL ON SM, 4-COL ON LG) */}
      {filteredSections.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {filteredSections.map((sec) => {
            const Icon = sec.icon;

            return (
              <div
                key={sec.id}
                onClick={() => {
                  onSelectTab(sec.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group relative flex flex-col justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer overflow-hidden active:scale-[0.98]"
              >
                <div>
                  {/* Icon & Badge Header */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>

                    {sec.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70 truncate max-w-[80px] sm:max-w-[100px]">
                        {sec.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="space-y-0.5 mb-1">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 leading-snug">
                      {sec.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans tracking-tight line-clamp-1">
                      {sec.subtitle}
                    </p>
                  </div>

                  {/* Compact Description */}
                  <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                    {sec.description}
                  </p>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 truncate mr-1">
                    {sec.tagline}
                  </span>
                  
                  <span className="inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center space-y-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
            কোনো সেকশন পাওয়া যায়নি
          </h4>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer shadow-2xs"
          >
            সব দেখুন
          </button>
        </div>
      )}
    </div>
  );
};

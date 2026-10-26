import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  MessageSquare, 
  Heart, 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Info,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  X
} from 'lucide-react';
import { storage } from '../utils/storage';

export const InfoView: React.FC = () => {
  const [copiedMail, setCopiedMail] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  const developerEmail = 'chanchalislam1@icloud.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(developerEmail);
    setCopiedMail(true);
    setTimeout(() => setCopiedMail(false), 2000);
  };

  const handleResetProgress = () => {
    if (confirmInput.trim().toLowerCase() !== 'chanchal') return;
    storage.resetAllData();
    setIsResetSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200 font-bangla pb-12 select-none">
      
      {/* 1. DEVELOPER HERO PROFILE CARD */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 lg:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative gradient background */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6 text-center md:text-left">
          {/* Profile Picture with glowing ring */}
          <div className="relative shrink-0 group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 shadow-md shadow-emerald-500/20">
              <img 
                src="https://xhanxhal.github.io/assets/profile.jpg" 
                alt="Chanchal Profile" 
                className="w-full h-full object-cover rounded-[14px] sm:rounded-[20px] bg-slate-100 dark:bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 text-white p-1 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" title="Verified Developer">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>অ্যাপ ডেভেলপার ও ক্রিয়েটর</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Chanchal
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl">
              বাংলা ভাষাভাষী শিক্ষার্থীদের জন্য ইংরেজি ভোকাবুলারি শিক্ষাকে সহজ, আনন্দদায়ক ও বৈজ্ঞানিক পদ্ধতিতে দীর্ঘস্থায়ী করার লক্ষ্যেই এই অ্যাপ্লিকেশনটি তৈরি করা হয়েছে। নিয়মিত প্র্যাকটিস করুন এবং নিজের শব্দভাণ্ডারকে সমৃদ্ধ করুন।
            </p>

            {/* Portfolio Link */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <a
                href="https://xhanxhal.github.io"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>xhanxhal.github.io</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTACT CHANNELS GRID */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            সরাসরি যোগাযোগ ও বার্তা পাঠানোর মাধ্যম
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          
          {/* A. TELEGRAM */}
          <a
            href="https://t.me/xhanxhal"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-4 sm:p-5 rounded-2xl border border-sky-200/80 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20 hover:border-sky-400 dark:hover:border-sky-700 transition-all shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/30 group-hover:scale-105 transition-transform">
                <Send className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Telegram
                </h3>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-bold group-hover:bg-sky-500 group-hover:text-white group-hover:border-transparent transition-all shrink-0 flex items-center gap-1 shadow-2xs">
              <span>মেসেজ দিন</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>

          {/* B. WHATSAPP */}
          <a
            href="https://wa.me/8801720942573"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-4 sm:p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-400 dark:hover:border-emerald-700 transition-all shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  WhatsApp
                </h3>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold group-hover:bg-emerald-600 group-hover:text-white group-hover:border-transparent transition-all shrink-0 flex items-center gap-1 shadow-2xs">
              <span>চ্যাট করুন</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>

          {/* C. SECRET LETTER */}
          <a
            href="https://chithi.me/chanchal0"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-4 sm:p-5 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-400 dark:hover:border-rose-700 transition-all shadow-2xs hover:shadow-xs flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/30 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Secret Letter
                </h3>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold group-hover:bg-rose-600 group-hover:text-white group-hover:border-transparent transition-all shrink-0 flex items-center gap-1 shadow-2xs">
              <span>চিঠি পাঠান</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </a>

          {/* D. EMAIL */}
          <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Email
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-slate-750 transition-all cursor-pointer shadow-2xs"
                title="ইমেইল কপি করুন"
              >
                {copiedMail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href="mailto:chanchalislam1@icloud.com"
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
              >
                <span>মেইল করুন</span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* 3. ABOUT BONOLOTA VOCABULARY APP */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bonolota অ্যাপ সম্পর্কে
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          <strong>Bonolota</strong> একটি আধুনিক ও পূর্ণাঙ্গ ইংরেজি ভোকাবুলারি লার্নিং প্ল্যাটফর্ম। এটি বিসিএস (BCS), ব্যাংক নিয়োগ পরীক্ষা, আইবিএ (IBA), আইইএলটিএস (IELTS), জিআরই (GRE) সহ যেকোনো একাডেমিক ও জব রিক্রুটমেন্ট পরীক্ষার প্রস্তুতিতে সবচেয়ে নির্ভরযোগ্য সমাধান। ৫০টি সুপরিকল্পিত ইউনিটে ১,৮৫০+ হাই-ইল্ড ভোকাবুলারি সাজানো হয়েছে যাতে প্রতিদিন ধাপে ধাপে অগ্রগতি নিশ্চিত হয়।
        </p>

        {/* 4 Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <BookOpen className="w-5 h-5 text-emerald-600 mx-auto" />
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sans">১,৮৫০+</div>
            <div className="text-[11px] text-slate-500 font-bold">নির্বাচিত শব্দ</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <Layers className="w-5 h-5 text-teal-600 mx-auto" />
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sans">৫০টি</div>
            <div className="text-[11px] text-slate-500 font-bold">সিলেবাস ইউনিট</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <HelpCircle className="w-5 h-5 text-amber-600 mx-auto" />
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sans">৪ মোড</div>
            <div className="text-[11px] text-slate-500 font-bold">কুইজ পরীক্ষা</div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <ShieldCheck className="w-5 h-5 text-indigo-600 mx-auto" />
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-sans">১০০%</div>
          </div>
        </div>
      </div>

      {/* 4. PROGRESS RESET SECTION (Danger Zone) */}
      <div className="rounded-3xl border border-rose-200/80 dark:border-rose-950/70 bg-rose-50/40 dark:bg-rose-950/20 p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <RotateCcw className="w-4 h-4 shrink-0" />
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight">
                লার্নিং প্রগ্রেস রিসেট (Reset Progress)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              আপনার পড়া শব্দের অগ্রগতি, কুইজ স্কোর, ফেভারিট শব্দ ও স্ট্রিক হিস্ট্রি মুছে দিয়ে প্রথম থেকে শুরু করতে পারবেন।
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmInput('');
              setIsResetSuccess(false);
              setShowResetModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 text-xs font-bold transition-all shadow-2xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>প্রগ্রেস রিসেট করুন</span>
          </button>
        </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={() => !isResetSuccess && setShowResetModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-900/60 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close button */}
            {!isResetSuccess && (
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {isResetSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  প্রগ্রেস সফলভাবে রিসেট হয়েছে!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  অ্যাপটি নতুন করে লোড হচ্ছে...
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      প্রগ্রেস রিসেট নিশ্চিতকরণ
                    </h3>
                    <p className="text-[11px] text-slate-400">সতর্কতা: এই প্রক্রিয়াটি অপরিবর্তনীয়</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-150 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Type <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">"Chanchal"</span> to reset progress
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    সব পড়া শব্দ, মুখস্থ ট্র্যাকিং ও কুইজ হিস্ট্রি মুছে ফেলতে নিচের বক্সে অবিকল <strong>Chanchal</strong> লিখুন।
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    নিশ্চিতকরণ টেক্সট লিখুন:
                  </label>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="Chanchal"
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors"
                  >
                    বাতিল
                  </button>

                  <button
                    type="button"
                    disabled={confirmInput.trim().toLowerCase() !== 'chanchal'}
                    onClick={handleResetProgress}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1.5 shadow-sm shadow-rose-600/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>রিসেট নিশ্চিত করুন</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

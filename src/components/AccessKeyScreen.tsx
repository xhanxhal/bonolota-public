import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  MessageCircle, 
  Send, 
  ArrowRight, 
  Eye, 
  Loader2, 
  Clipboard, 
  Laptop2
} from 'lucide-react';
import { haptics } from '../utils/haptics';

interface AccessKeyScreenProps {
  onActivate: (key: string) => Promise<{ success: boolean; message?: string }>;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const AccessKeyScreen: React.FC<AccessKeyScreenProps> = ({
  onActivate,
  isLoading,
  errorMessage,
}) => {
  const [accessKey, setAccessKey] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHowToBuy, setShowHowToBuy] = useState(false);

  // Auto-format key with dashes as user types (e.g. BONOLOTA-XXXX-XXXX-XXXX)
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setAccessKey(raw);
    setLocalError(null);
  };

  const handlePaste = async () => {
    try {
      haptics.tap();
      const text = await navigator.clipboard.readText();
      if (text) {
        setAccessKey(text.trim().toUpperCase());
      }
    } catch {
      // Ignore clipboard read error
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = accessKey.trim();

    if (!cleanKey) {
      setLocalError('অনুগ্রহ করে আপনার অ্যাক্সেস কি লিখুন।');
      return;
    }

    if (cleanKey.length < 8) {
      setLocalError('অ্যাক্সেস কি-টি অসম্পূর্ণ বা ফরম্যাট সঠিক নয়।');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);
    haptics.tap();

    const res = await onActivate(cleanKey);
    setIsSubmitting(false);

    if (!res.success) {
      setLocalError(res.message || 'অ্যাক্টিভেশন ব্যর্থ হয়েছে।');
    }
  };

  const displayError = localError || errorMessage;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-[#0b1120] font-bangla transition-colors">
      <div className="w-full max-w-xl mx-auto">
        {/* Main Card */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-9 relative overflow-hidden backdrop-blur-sm">
          {/* Decorative ambient background blur */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Logo */}
          <div className="text-center mb-7 relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30 mb-4 ring-4 ring-emerald-50 dark:ring-emerald-950/40">
              <KeyRound className="w-8 h-8 animate-pulse" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              বনলতা <span className="text-emerald-600 dark:text-emerald-400 font-sans font-bold text-xl sm:text-2xl">| Bonolota</span>
            </h1>
            <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
              ব্যক্তিগত অ্যাক্সেস কি (Access Key) দিয়ে সম্পূর্ণ ভোকাবুলারি আনলক করুন
            </p>
          </div>

          {/* Key Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label htmlFor="accessKeyInput" className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>আপনার অ্যাক্সেস কি প্রদান করুন:</span>
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">Format: BONOLOTA-XXXX-XXXX-XXXX</span>
              </label>

              <div className="relative flex items-center">
                <input
                  id="accessKeyInput"
                  type="text"
                  value={accessKey}
                  onChange={handleKeyChange}
                  placeholder="BONOLOTA-7K9A-M4W2-X8P1"
                  autoComplete="off"
                  spellCheck="false"
                  disabled={isSubmitting || isLoading}
                  className="w-full px-4 py-3.5 pr-20 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-base sm:text-lg uppercase tracking-wider placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                />

                <button
                  type="button"
                  onClick={handlePaste}
                  title="ক্লিপবোর্ড থেকে পেস্ট করুন"
                  className="absolute right-2 px-2.5 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>পেস্ট</span>
                </button>
              </div>
            </div>

            {/* Error Message Box */}
            {displayError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold">{displayError}</p>
                  {displayError.includes('Bound') || displayError.includes('অন্য একটি ব্রাউজারে') ? (
                    <p className="mt-1 text-xs opacity-90">
                      💡 আপনি কি ব্রাউজার পরিবর্তন করেছেন? হোয়াটসঅ্যাপ বা টেলিগ্রামে অ্যাডমিনের সাথে যোগাযোগ করে ব্রাউজার বাইন্ডিং রিসেট করে নিতে পারেন।
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading || !accessKey.trim()}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ভেরিফাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>অ্যাক্টিভেট করে প্রবেশ করুন</span>
                </>
              )}
            </button>
          </form>

          {/* Purchase / Contact Instructions */}
          <div className="mt-6 pt-5 border-t border-slate-200/70 dark:border-slate-800/80 relative z-10 space-y-3">
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>কীভাবে অ্যাক্সেস কি পাবেন বা সাবস্ক্রিপশন কিনবেন?</span>
              </div>
              <p className="font-medium leading-relaxed text-xs">
                বনলতার ১,০০০+ শব্দ ও ৫০টি প্রিমিয়াম ইউনিটের ফুল অ্যাক্সেস পেতে সরাসরি যোগাযোগ করে একটি ইউনিক অ্যাক্সেস কি সংগ্রহ করুন:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href="https://wa.me/?text=Hello!+I+want+to+purchase+an+access+key+for+Bonolota+vocabulary+platform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>হোয়াটসঅ্যাপে যোগাযোগ</span>
                </a>

                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>টেলিগ্রামে যোগাযোগ</span>
                </a>
              </div>

              <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-800/30 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-1.5">
                  <Laptop2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>১টি অ্যাক্সেস কি একটি ব্রাউজারের সাথে নিরাপদে সংযুক্ত থাকে। ব্রাউজার বা ফোন পরিবর্তন করলে অ্যাডমিনকে জানিয়ে নতুন ব্রাউজারে রিসেট করে নিতে পারেন।</span>
                </div>
            </div>
          </div>
        </div>
        </div>

        {/* Footer info notice */}
        <div className="text-center mt-5 text-xs text-slate-500 dark:text-slate-400">
          <p>সুরক্ষিত লাইসেন্সিং সিস্টেম • Bonolota</p>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  KeyRound, 
  ArrowRight, 
  Loader2, 
  Clipboard, 
  Check,
  AlertCircle,
  MessageCircle,
  Send,
  User
} from 'lucide-react';
import { haptics } from '../utils/haptics';

interface AccessKeyScreenProps {
  onActivate: (key: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  isLoading: boolean;
  errorMessage?: string | null;
}

function autoFormatKey(raw: string): string {
  const upper = raw.toUpperCase().replace(/[^A-Z0-9*]/g, '');
  if (upper.startsWith('BONOLOTA')) {
    const after = upper.slice(8);
    const parts = after.match(/.{1,4}/g) || [];
    return ['BONOLOTA', ...parts].join('-').slice(0, 29);
  }
  return raw.toUpperCase().replace(/[^A-Z0-9*-]/g, '').slice(0, 32);
}

export const AccessKeyScreen: React.FC<AccessKeyScreenProps> = ({
  onActivate,
  isLoading,
  errorMessage,
}) => {
  const [accessKey, setAccessKey] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justPasted, setJustPasted] = useState(false);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = autoFormatKey(e.target.value);
    setAccessKey(formatted);
    setLocalError(null);
  };

  const handlePaste = async () => {
    try {
      haptics.tap();
      const text = await navigator.clipboard.readText();
      if (text) {
        const formatted = autoFormatKey(text.trim());
        setAccessKey(formatted);
        setJustPasted(true);
        setTimeout(() => setJustPasted(false), 2000);
      }
    } catch {
      // Ignore clipboard permission issue
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = accessKey.trim();

    if (!cleanKey) {
      setLocalError('অনুগ্রহ করে অ্যাক্সেস কি প্রদান করুন।');
      return;
    }

    if (cleanKey.length < 8) {
      setLocalError('অ্যাক্সেস কি ফরম্যাট সঠিক নয়।');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);
    haptics.tap();

    const res = await onActivate(cleanKey, customerName.trim() || undefined);
    setIsSubmitting(false);

    if (!res.success) {
      setLocalError(res.message || 'অ্যাক্টিভেশন সম্পন্ন করা যায়নি।');
    }
  };

  const displayError = localError || errorMessage;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] text-slate-800 font-bangla antialiased">
      <div className="w-full max-w-sm mx-auto">
        
        {/* Minimal Clean Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl overflow-hidden bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-xs">
              <img
                src="/assets/aistudio/Botanical_Book_B_Emblem_8fbb1e88.png"
                alt="Bonolota"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                বনলতা
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                অ্যাক্সেস কি দিয়ে সম্পূর্ণ প্ল্যাটফর্ম আনলক করুন
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                <label htmlFor="keyInput" className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>অ্যাক্সেস কি</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  BONOLOTA-XXXX
                </span>
              </div>

              <div className="relative flex items-center">
                <input
                  id="keyInput"
                  type="text"
                  value={accessKey}
                  onChange={handleKeyChange}
                  placeholder="BONOLOTA-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck="false"
                  disabled={isSubmitting || isLoading}
                  className="w-full px-3.5 py-2.5 pr-20 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-xs sm:text-sm uppercase tracking-wide placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-colors"
                />

                <button
                  type="button"
                  onClick={handlePaste}
                  className="absolute right-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {justPasted ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">পেস্ট</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                      <span>পেস্ট</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Student Name Input (Optional) */}
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                <label htmlFor="nameInput" className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>আপনার নাম <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span></span>
                </label>
              </div>

              <input
                id="nameInput"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="যেমন: চঞ্চল বা আরিফা"
                disabled={isSubmitting || isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-colors font-bangla"
              />
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-snug">{displayError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading || !accessKey.trim()}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>যাচাই হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Minimal WhatsApp & Telegram Buttons */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-[11px] text-slate-400 text-center font-medium">
              কি সংগ্রহ বা সহায়তার জন্য যোগাযোগ করুন:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="https://wa.me/?text=Hello!+I+need+an+access+key+for+Bonolota"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>হোয়াটসঅ্যাপ</span>
              </a>

              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100/80 border border-sky-200/70 text-sky-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>টেলিগ্রাম</span>
              </a>
            </div>
          </div>

        </div>

        {/* Minimal Subtle Footnote */}
        <p className="text-center mt-3 text-[11px] text-slate-400 font-medium">
          Bonolota
        </p>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Download, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  MoreVertical, 
  Monitor, 
  Layers
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { haptics } from '../utils/haptics';

interface PWAInstallButtonProps {
  variant?: 'header' | 'settings' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install, markAsInstalled, resetInstalled } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'ios' | 'android'>(() => isIOS ? 'ios' : 'android');
  const [isInstalling, setIsInstalling] = useState(false);

  // Sync platform tab when isIOS status is determined
  useEffect(() => {
    setActivePlatformTab(isIOS ? 'ios' : 'android');
  }, [isIOS]);

  // Lock body scroll when modal is open and handle escape key
  useEffect(() => {
    if (!showModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal]);

  // If already installed (standalone mode or marked installed)
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>বনলতা অ্যাপ ইনস্টল করা আছে (PWA Active)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              haptics.tap();
              resetInstalled();
            }}
            className="text-[11px] text-emerald-700 dark:text-emerald-400 underline hover:no-underline cursor-pointer self-start sm:self-auto font-bangla"
          >
            পুনরায় ইনস্টল বাটন সক্রিয় করুন
          </button>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    haptics.tap();
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await install();
        if (!success) {
          // If prompt was dismissed or couldn't complete, show manual instructions
          setShowModal(true);
        }
      } catch {
        setShowModal(true);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // For iOS or browsers without native beforeinstallprompt, show the instruction modal
      setShowModal(true);
    }
  };

  // If neither installable nor iOS, in settings we still explain it's available
  if (!isInstallable && !isIOS && variant !== 'settings') {
    // Show instruction button anyway so users on any browser can learn how to add to homescreen
  }

  // Modal Component rendered via Portal directly into document.body
  const modalContent = showModal && typeof document !== 'undefined' ? (
    createPortal(
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowModal(false);
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
      >
        <div 
          className="relative w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 font-bangla animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 id="install-modal-title" className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                  অ্যাপ ইনস্টল করার নিয়ম
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  হোমস্ক্রিনে যুক্ত করে অফলাইনে ব্যবহার করুন
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Platform Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActivePlatformTab('ios')}
              className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activePlatformTab === 'ios'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>iPhone / iPad (iOS)</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePlatformTab('android')}
              className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activePlatformTab === 'android'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Android / PC Chrome</span>
            </button>
          </div>

          {/* iOS Instructions */}
          {activePlatformTab === 'ios' ? (
            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-200">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs">
                💡 <strong>Safari ব্রাউজারে</strong> ওপেন করে নিচের ৩টি সহজ ধাপ অনুসরণ করুন:
              </div>

              <ol className="space-y-3 font-bangla">
                <li className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    ১
                  </span>
                  <div>
                    Safari ব্রাউজারের নিচে (অথবা উপরে) থাকা <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-sans"><Share2 className="w-3.5 h-3.5 text-blue-500" /> Share</strong> আইকনে চাপ দিন।
                  </div>
                </li>

                <li className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    ২
                  </span>
                  <div>
                    মেনু একটু নিচে স্ক্রল করে <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-sans"><PlusSquare className="w-3.5 h-3.5 text-emerald-600" /> Add to Home Screen</strong> সিলেক্ট করুন।
                  </div>
                </li>

                <li className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    ৩
                  </span>
                  <div>
                    স্ক্রিনের উপরের ডান কোণায় থাকা <strong className="text-emerald-700 dark:text-emerald-400 font-bold font-sans">"Add"</strong> বাটনে ট্যাপ করুন। ব্যাস! আপনার হোমস্ক্রিনে অ্যাপ আইকন তৈরি হয়ে যাবে।
                  </div>
                </li>
              </ol>
            </div>
          ) : (
            /* Android / Chrome / PC Instructions */
            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-200">
              <ol className="space-y-3 font-bangla">
                <li className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    ১
                  </span>
                  <div>
                    Chrome ব্রাউজারের উপরে ডান কোণায় <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-sans"><MoreVertical className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" /> মেনু (৩ ডট)</strong> এ চাপ দিন।
                  </div>
                </li>

                <li className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    ২
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-sans"><Download className="w-3.5 h-3.5 text-emerald-600" /> Install App / Add to Home screen</strong> অপশনটিতে ক্লিক করুন।
                  </div>
                </li>

                <li className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    ৩
                  </span>
                  <div>
                    পিসিতে থাকলে অ্যাড্রেস বারের ডান পাশে থাকা <strong className="text-emerald-700 dark:text-emerald-400 font-bold font-sans">ইনস্টল আইকন</strong> থেকেও সরাসরি ইনস্টল করা যায়।
                  </div>
                </li>
              </ol>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2 font-bangla border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                haptics.success();
                markAsInstalled();
                setShowModal(false);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>আমি ইনস্টল করেছি (বাটন হাইড করুন)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                haptics.tap();
                setShowModal(false);
              }}
              className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer text-center"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      {variant === 'settings' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center justify-between w-full p-3 rounded-xl border transition-all text-left bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/15 hover:to-teal-500/15 border-emerald-200 dark:border-emerald-800 cursor-pointer ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                হোমস্ক্রিন বা ডেসকটপে ইনস্টল করুন (Install App)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bangla">
                ইন্টারনেট ছাড়াই সরাসরি মোবাইল বা পিসি থেকে এক ক্লিকে ব্যবহারের জন্য
              </p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shrink-0 shadow-2xs font-bangla">
            {isInstalling ? 'ইনস্টল হচ্ছে...' : 'ইনস্টল'}
          </div>
        </button>
      ) : isIOS ? (
        /* iOS Header Install Button: Strictly Icon Only & Far Right matching header icons */
        <button
          type="button"
          onClick={handleInstallClick}
          className={`p-1.5 sm:p-2 rounded-lg border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0 ${className}`}
          title="iPhone / iPad-এ হোমস্ক্রিনে অ্যাপ ইনস্টল করার নিয়ম দেখুন"
          aria-label="হোমস্ক্রিনে ইনস্টল করুন"
        >
          <Download className="w-4 h-4" />
        </button>
      ) : (
        /* Other Platforms (Android/Desktop): Icon on mobile, text on sm+ */
        <button
          type="button"
          onClick={handleInstallClick}
          className={`p-1.5 sm:p-2 sm:px-2.5 rounded-lg border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${className}`}
          title="অ্যাপ ইনস্টল করুন"
          aria-label="অ্যাপ ইনস্টল"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline font-bangla">ইনস্টল</span>
        </button>
      )}

      {/* Render the modal safely into document.body outside of the header's stacking context */}
      {modalContent}
    </>
  );
};

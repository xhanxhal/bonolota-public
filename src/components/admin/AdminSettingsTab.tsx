import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Send, 
  Download, 
  Upload, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  AlertTriangle, 
  KeyRound, 
  Database,
  Radio,
  FileCheck
} from 'lucide-react';
import { haptics } from '../../utils/haptics';

export const AdminSettingsTab: React.FC = () => {
  // Telegram Settings State
  const [botToken, setBotToken] = useState('9095057691:AAF0QUtiS1JCtpzETygCbqno-PgMdThPoiE');
  const [chatId, setChatId] = useState('6745501942');
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramStatusMsg, setTelegramStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Backup & Restore State
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatusMsg, setRestoreStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Load existing Telegram configuration on mount
  useEffect(() => {
    fetch('/api/admin/telegram/config', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.telegram) {
          if (data.telegram.botToken) setBotToken(data.telegram.botToken);
          if (data.telegram.chatId) setChatId(data.telegram.chatId);
          if (typeof data.telegram.enabled === 'boolean') setTelegramEnabled(data.telegram.enabled);
        }
      })
      .catch(() => {});
  }, []);

  // Save Telegram Settings
  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    haptics.tap();
    setIsSavingTelegram(true);
    setTelegramStatusMsg(null);

    try {
      const res = await fetch('/api/admin/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          enabled: telegramEnabled,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTelegramStatusMsg({ ok: true, text: 'টেলিগ্রাম কনফিগারেশন সফলভাবে আপডেট হয়েছে।' });
      } else {
        setTelegramStatusMsg({ ok: false, text: data.message || 'সংরক্ষণ ব্যর্থ।' });
      }
    } catch {
      setTelegramStatusMsg({ ok: false, text: 'সার্ভারের সাথে যোগাযোগে ত্রুটি।' });
    } finally {
      setIsSavingTelegram(false);
    }
  };

  // Test Telegram Notification
  const handleTestTelegram = async () => {
    haptics.tap();
    setIsTestingTelegram(true);
    setTelegramStatusMsg(null);

    try {
      const res = await fetch('/api/admin/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          botToken: botToken.trim(),
          chatId: chatId.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setTelegramStatusMsg({ ok: true, text: '✅ ' + data.message });
      } else {
        setTelegramStatusMsg({ ok: false, text: '❌ ' + (data.message || 'টেস্ট নোটিফিকেশন পাঠাতে ব্যর্থ। টোকেন বা চ্যাট আইডি চেক করুন।') });
      }
    } catch {
      setTelegramStatusMsg({ ok: false, text: '❌ নেটওয়ার্ক ত্রুটি।' });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordStatusMsg({ ok: false, text: 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatusMsg({ ok: false, text: 'নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।' });
      return;
    }

    haptics.tap();
    setIsChangingPassword(true);
    setPasswordStatusMsg(null);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setPasswordStatusMsg({ ok: true, text: 'অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordStatusMsg({ ok: false, text: data.message || 'পাসওয়ার্ড পরিবর্তনে ব্যর্থ।' });
      }
    } catch {
      setPasswordStatusMsg({ ok: false, text: 'সার্ভার এরর।' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Download Full Database Backup JSON
  const handleDownloadBackup = async () => {
    haptics.tap();
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/backup', { credentials: 'include' });
      if (!res.ok) throw new Error('Backup failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bonolota_db_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setRestoreStatusMsg({ ok: true, text: 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে।' });
    } catch {
      setRestoreStatusMsg({ ok: false, text: 'ব্যাকআপ ডাউনলোডে সমস্যা হয়েছে।' });
    } finally {
      setIsExporting(false);
    }
  };

  // Upload & Restore Database JSON
  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('সতর্কতা! ব্যাকআপ ফাইল থেকে ডাটা রিস্টোর করলে বর্তমান ডাটাবেজ আপডেট হবে। আপনি কি নিশ্চিত?')) {
      e.target.value = '';
      return;
    }

    haptics.tap();
    setIsRestoring(true);
    setRestoreStatusMsg(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(json),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setRestoreStatusMsg({ ok: true, text: data.message || 'ডাটাবেজ সফলভাবে রিস্টোর হয়েছে!' });
      } else {
        setRestoreStatusMsg({ ok: false, text: data.message || 'রিস্টোর ব্যর্থ।' });
      }
    } catch (err: any) {
      setRestoreStatusMsg({ ok: false, text: `অবৈধ ব্যাকআপ ফাইল: ${err?.message || 'JSON Parse error'}` });
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* SECTION 1: Feature 57: Telegram Bot Webhook Integration */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <Send className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>টেলিগ্রাম বট ওয়েবহুক ও ইনস্ট্যান্ট সিকিউরিটি অ্যালার্ট</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                  Feature 57
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                নতুন অ্যাক্টিভেশন, ফ্রড অ্যাটেম্পট, হানি-পট ট্র্যাপ ও সাপোর্ট টিকেটের লাইভ নোটিফিকেশন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${telegramEnabled ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-xs font-semibold text-slate-300">
              {telegramEnabled ? 'অ্যালার্ট সক্রিয়' : 'অ্যালার্ট বন্ধ'}
            </span>
          </div>
        </div>

        {telegramStatusMsg && (
          <div className={`mb-4 p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            telegramStatusMsg.ok ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}>
            {telegramStatusMsg.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{telegramStatusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveTelegram} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                টেলিগ্রাম বট টোকেন (Bot Token)
              </label>
              <input
                type="text"
                value={botToken}
                onChange={e => setBotToken(e.target.value)}
                placeholder="e.g. 9095057691:AAF0QUtiS1JCtpzETygCbqno-PgMdThPoiE"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                BotFather থেকে প্রাপ্ত বট টোকেন। যেকোনো সময় পরিবর্তন করতে পারবেন।
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                আপনার পার্মানেন্ট টেলিগ্রাম চ্যাট/ইউজার আইডি (Chat ID)
              </label>
              <input
                type="text"
                value={chatId}
                onChange={e => setChatId(e.target.value)}
                placeholder="e.g. 6745501942"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-sky-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                আপনার নির্দিষ্ট টেলিগ্রাম ইউজার আইডি (ডিফল্ট: 6745501942)।
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={telegramEnabled}
                onChange={e => setTelegramEnabled(e.target.checked)}
                className="rounded text-sky-600 focus:ring-0 cursor-pointer"
              />
              <span>টেলিগ্রাম ইনস্ট্যান্ট পুশ অ্যালার্ট চালু রাখুন</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={isTestingTelegram || !botToken || !chatId}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isTestingTelegram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                <span>টেস্ট অ্যালার্ট পাঠান</span>
              </button>

              <button
                type="submit"
                disabled={isSavingTelegram}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-600/30 disabled:opacity-50"
              >
                {isSavingTelegram ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* SECTION 2: Feature 8 & Feature 12 in 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Feature 8: Admin Password Change */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>অ্যাডমিন পাসওয়ার্ড পরিবর্তন (Change Password)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  Feature 8
                </span>
              </h3>
              <p className="text-xs text-slate-400">নিরাপত্তা নিশ্চিত করতে অ্যাডমিন পাসওয়ার্ড আপডেট করুন</p>
            </div>
          </div>

          {passwordStatusMsg && (
            <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
              passwordStatusMsg.ok ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' : 'bg-rose-950/70 border-rose-800 text-rose-300'
            }`}>
              {passwordStatusMsg.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{passwordStatusMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                বর্তমান পাসওয়ার্ড (Current Password)
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                নতুন পাসওয়ার্ড (New Password, min 8 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড দিন"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                নতুন পাসওয়ার্ড পুনরায় লিখুন (Confirm)
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="পুনরায় কনফার্ম করুন"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword || !currentPassword || !newPassword}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-500 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-600/30 text-xs"
            >
              {isChangingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>পাসওয়ার্ড পরিবর্তন সম্পন্ন করুন</span>
            </button>
          </form>
        </div>

        {/* Feature 12: Full Database Backup & Restore */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>ডাটাবেজ ব্যাকআপ ও রিস্টোর (Backup & Restore)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Feature 12
                  </span>
                </h3>
                <p className="text-xs text-slate-400">লাইসেন্স, অডিট লগ, টিকেট ও ফায়ারওয়াল ব্যাকআপ</p>
              </div>
            </div>

            {restoreStatusMsg && (
              <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                restoreStatusMsg.ok ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' : 'bg-rose-950/70 border-rose-800 text-rose-300'
              }`}>
                {restoreStatusMsg.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{restoreStatusMsg.text}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Backup Download */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-slate-200 block mb-1">
                  ১-ক্লিক সম্পূর্ণ ব্যাকআপ ডাউনলোড:
                </span>
                <p className="text-[11px] text-slate-400 mb-3">
                  সমস্ত অ্যাক্টিভ কি, স্টুডেন্ট ডাটা, অডিট হিস্ট্রি এবং ফায়ারওয়াল রুলসহ একটি `.json` ব্যাকআপ স্ন্যাপশট ডাউনলোড হবে।
                </p>
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={isExporting}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                >
                  {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-400" />}
                  <span>ডাউনলোড ডাটাবেজ ব্যাকআপ (.json)</span>
                </button>
              </div>

              {/* Restore Upload */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-slate-200 block mb-1">
                  ব্যাকআপ ফাইল আপলোড ও রিস্টোর:
                </span>
                <p className="text-[11px] text-slate-400 mb-3">
                  পূর্ববর্তী ব্যাকআপ `.json` ফাইল নির্বাচন করে সম্পূর্ণ ডাটাবেজ মুহূর্তের মধ্যে ফিরিয়ে আনুন।
                </p>

                <label className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                  {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-emerald-300" />}
                  <span>{isRestoring ? 'রিস্টোর হচ্ছে...' : 'ব্যাকআপ ফাইল আপলোড করুন'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFile}
                    disabled={isRestoring}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar, 
  LogOut, 
  Database, 
  Eye, 
  EyeOff, 
  History, 
  PlusCircle, 
  Smartphone, 
  UserCheck, 
  UserX, 
  Lock 
} from 'lucide-react';
import { LicenseRecord, AuditLogEntry, AdminOverviewStats } from '../../../server/types';
import { haptics } from '../../utils/haptics';

interface AdminPortalProps {
  onExitAdmin?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onExitAdmin }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data
  const [activeTab, setActiveTab] = useState<'overview' | 'generate' | 'licenses' | 'audit'>('overview');
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Key Generation State
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [customDays, setCustomDays] = useState<string>('30');
  const [customerNote, setCustomerNote] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // License Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal for extending duration
  const [extendingLicense, setExtendingLicense] = useState<LicenseRecord | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);

  // Check admin session on mount
  const checkAdminSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/session', { credentials: 'include' });
      const data = await res.json();
      setIsAuthenticated(Boolean(data.authenticated));
      if (data.authenticated) {
        loadDashboardData();
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAdminSession();
  }, [checkAdminSession]);

  const loadDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const [statsRes, licRes, auditRes] = await Promise.all([
        fetch('/api/admin/overview', { credentials: 'include' }),
        fetch('/api/admin/licenses', { credentials: 'include' }),
        fetch('/api/admin/audit', { credentials: 'include' }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
      if (licRes.ok) {
        const licData = await licRes.json();
        setLicenses(licData.licenses || []);
      }
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData.logs || []);
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoggingIn(true);
    setLoginError(null);
    haptics.tap();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setIsAuthenticated(true);
        setPassword('');
        loadDashboardData();
      } else {
        setLoginError(data.message || 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।');
      }
    } catch {
      setLoginError('সার্ভারে সংযোগ ব্যর্থ হয়েছে।');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    haptics.tap();
    try {
      await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const duration = selectedDuration === -1 ? parseInt(customDays, 10) : selectedDuration;

    if (isNaN(duration) || duration <= 0) {
      setActionMessage({ type: 'error', text: 'সঠিক মেয়াদের দিন সংখ্যা লিখুন।' });
      return;
    }

    setIsGenerating(true);
    setActionMessage(null);
    haptics.tap();

    try {
      const res = await fetch('/api/admin/licenses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          durationDays: duration,
          customerNote: customerNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setGeneratedKey(data.plaintextKey);
        setCustomerNote('');
        loadDashboardData();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'লাইসেন্স তৈরি করা যায়নি।' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'সার্ভার এরর।' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    haptics.tap();
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleResetBinding = async (id: string, maskedKey: string) => {
    if (!window.confirm(`আপনি কি "${maskedKey}" এর ব্রাউজার বাইন্ডিং রিসেট করতে চান? এর ফলে গ্রাহক নতুন ডিভাইসে লগইন করতে পারবেন।`)) {
      return;
    }

    haptics.tap();
    try {
      const res = await fetch(`/api/admin/licenses/${id}/reset-binding`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({ type: 'success', text: `বাইন্ডিং রিসেট সফল হয়েছে (${maskedKey})` });
        loadDashboardData();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'রিসেট ব্যর্থ হয়েছে।' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'রিকোয়েস্ট প্রক্রিয়াকরণে সমস্যা।' });
    }
  };

  const handleToggleStatus = async (license: LicenseRecord) => {
    const isSuspending = license.status === 'active';
    const action = isSuspending ? 'suspend' : 'reactivate';
    const actionLabel = isSuspending ? 'স্থগিত' : 'পুনর্বহাল';

    if (!window.confirm(`আপনি কি "${license.keyMasked}" লাইসেন্সটি ${actionLabel} করতে চান?`)) {
      return;
    }

    haptics.tap();
    try {
      const res = await fetch(`/api/admin/licenses/${license.id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({ type: 'success', text: `লাইসেন্স সফলভাবে ${actionLabel} করা হয়েছে।` });
        loadDashboardData();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'অপারেশন ব্যর্থ।' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'সার্ভার এরর।' });
    }
  };

  const handleRevoke = async (id: string, maskedKey: string) => {
    if (!window.confirm(`সতর্কতা! আপনি কি "${maskedKey}" লাইসেন্সটি স্থায়ীভাবে বাতিল (Revoke) করতে চান? এটি আর কখনোই চালু করা যাবে না।`)) {
      return;
    }

    haptics.tap();
    try {
      const res = await fetch(`/api/admin/licenses/${id}/revoke`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({ type: 'success', text: `লাইসেন্স স্থায়ীভাবে বাতিল করা হয়েছে (${maskedKey})` });
        loadDashboardData();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'বাতিল করা যায়নি।' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'সার্ভার এরর।' });
    }
  };

  const handleExtendSubmit = async () => {
    if (!extendingLicense) return;
    haptics.tap();

    try {
      const res = await fetch(`/api/admin/licenses/${extendingLicense.id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ additionalDays: extendDays }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({ type: 'success', text: `মেয়াদ ${extendDays} দিন বৃদ্ধি করা হয়েছে।` });
        setExtendingLicense(null);
        loadDashboardData();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'মেয়াদ বাড়ানো যায়নি।' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'সার্ভার এরর।' });
    }
  };

  // Filtered Licenses
  const filteredLicenses = licenses.filter(lic => {
    const now = Date.now();
    let matchesStatus = true;

    if (statusFilter === 'active') {
      matchesStatus = lic.status === 'active' && now <= lic.expiresAt;
    } else if (statusFilter === 'expired') {
      matchesStatus = now > lic.expiresAt && lic.status !== 'revoked';
    } else if (statusFilter === 'bound') {
      matchesStatus = lic.browserBound && lic.status === 'active' && now <= lic.expiresAt;
    } else if (statusFilter === 'unbound') {
      matchesStatus = !lic.browserBound && lic.status === 'active' && now <= lic.expiresAt;
    } else if (statusFilter === 'suspended') {
      matchesStatus = lic.status === 'suspended';
    } else if (statusFilter === 'revoked') {
      matchesStatus = lic.status === 'revoked';
    }

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      lic.keyMasked.toLowerCase().includes(q) ||
      lic.id.toLowerCase().includes(q) ||
      (lic.customerNote && lic.customerNote.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // Render Login Card if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl shadow-black relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Central Admin Vault</h1>
            <p className="text-xs text-slate-400 mt-1">সুরক্ষিত অ্যাডমিনিস্ট্রেটর পোর্টাল</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="adminPasswordInput" className="block text-xs font-semibold text-slate-300 mb-1.5">
                অ্যাডমিন পাসওয়ার্ড
              </label>
              <div className="relative flex items-center">
                <input
                  id="adminPasswordInput"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  disabled={isLoggingIn}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 pr-11 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !password}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>লগইন করুন</span>
            </button>
          </form>

          {onExitAdmin && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onExitAdmin}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                ← মূল ওয়েবসাইটে ফিরুন
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Bonolota Licensing Vault</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950 border border-indigo-700/60 text-indigo-300">
                PROD
              </span>
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{stats?.isUsingFallbackStore ? 'Local Dev Cache' : 'Upstash Redis Connected'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDashboardData}
            title="রিফ্রেশ করুন"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Action alert banner */}
        {actionMessage && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between text-sm animate-fadeIn ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300' 
              : 'bg-rose-950/50 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span>{actionMessage.text}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setActionMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-4"
            >
              বন্ধ করুন
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ওভারভিউ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'generate'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন কি তৈরি করুন</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('licenses')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'licenses'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>লাইসেন্স তালিকা ({licenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>অডিট লগ</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">মোট লাইসেন্স</span>
                <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-900/40">
                <span className="text-[11px] font-medium text-emerald-400">সক্রিয় (Active)</span>
                <p className="text-2xl font-bold text-emerald-300 mt-1">{stats.active}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-teal-900/40">
                <span className="text-[11px] font-medium text-teal-400">বাইন্ডেড (Bound)</span>
                <p className="text-2xl font-bold text-teal-300 mt-1">{stats.activated}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-amber-900/40">
                <span className="text-[11px] font-medium text-amber-400">অব্যবহৃত (Unbound)</span>
                <p className="text-2xl font-bold text-amber-300 mt-1">{stats.unactivated}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400">মেয়াদোত্তীর্ণ (Expired)</span>
                <p className="text-2xl font-bold text-slate-300 mt-1">{stats.expired}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-orange-900/40">
                <span className="text-[11px] font-medium text-orange-400">স্থগিত (Suspended)</span>
                <p className="text-2xl font-bold text-orange-300 mt-1">{stats.suspended}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-rose-900/40">
                <span className="text-[11px] font-medium text-rose-400">বাতিল (Revoked)</span>
                <p className="text-2xl font-bold text-rose-300 mt-1">{stats.revoked}</p>
              </div>
            </div>

            {/* Quick Action & Recents */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Key Generator Callout */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center mb-3">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">নতুন গ্রাহকের জন্য কি তৈরি করুন</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    পেমেন্ট কনফার্মেশনের পর গ্রাহকের মেয়াদের জন্য একটি আনপ্রেডিক্টেবল অ্যাক্সেস কি জেনারেট করুন। মেয়াদ তৈরি করার মুহূর্ত থেকেই গণনা শুরু হবে।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('generate')}
                  className="mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 text-xs transition-colors cursor-pointer text-center"
                >
                  কি জেনারেটরে যান →
                </button>
              </div>

              {/* Recently Activated Table */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800">
                <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
                  <span>সম্প্রতি সক্রিয় হওয়া লাইসেন্স</span>
                  <span className="text-xs text-slate-400">সর্বশেষ ১০টি</span>
                </h3>

                {stats.recentlyActivated.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">এখনো কোনো লাইসেন্স অ্যাক্টিভেট হয়নি।</p>
                ) : (
                  <div className="space-y-2.5">
                    {stats.recentlyActivated.map(lic => (
                      <div key={lic.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-mono font-bold text-slate-200">{lic.keyMasked}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {lic.customerNote || 'নোট নেই'} • {lic.durationDays} দিন
                            {lic.deviceInfo ? ` • 🌐 ${lic.deviceInfo}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Bound
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {lic.activatedAt ? new Date(lic.activatedAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GENERATE KEY */}
        {activeTab === 'generate' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <span>নতুন অ্যাক্সেস কি জেনারেট করুন</span>
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                গ্রাহক পেমেন্ট করার পর সময়সীমা নির্বাচন করে কি তৈরি করুন।
              </p>

              {/* One-time Generated Key Banner if present */}
              {generatedKey && (
                <div className="mb-6 p-5 rounded-2xl bg-emerald-950/70 border-2 border-emerald-500 text-emerald-200 animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      নতুন কি সফলভাবে তৈরি হয়েছে!
                    </span>
                    <span className="text-[11px] text-emerald-400/80">এখনই কপি করুন</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800 flex items-center justify-between gap-2">
                    <span className="font-mono font-extrabold text-lg sm:text-xl text-white select-all tracking-wider">
                      {generatedKey}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow"
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-amber-300/90 flex items-start gap-1.5 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      সতর্কতা: সিকিউরিটির জন্য এই প্লেইনটেক্সট কি সার্ভার ডাটাবেজে সংরক্ষিত থাকে না। এই পেজ পরিবর্তন করার পর এটি আর দেখা যাবে না। তাই এখনই কপি করে গ্রাহককে পাঠিয়ে দিন।
                    </span>
                  </p>
                </div>
              )}

              <form onSubmit={handleGenerateKey} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    সাবস্ক্রিপশনের মেয়াদ (Duration)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[30, 90, 180, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDuration(d)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          selectedDuration === d
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {d} দিন
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedDuration(-1)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedDuration === -1
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      কাস্টম দিন
                    </button>
                  </div>

                  {selectedDuration === -1 && (
                    <div className="mt-3">
                      <input
                        type="number"
                        min="1"
                        max="3650"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        placeholder="কাস্টম দিন সংখ্যা লিখুন (e.g. 45)"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="customerNoteInput" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    গ্রাহক রেফারেন্স বা পেমেন্ট নোট (ঐচ্ছিক)
                  </label>
                  <input
                    id="customerNoteInput"
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g. Tanvir (017xxxxxxxx) - bKash TrxID #8A92"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    ভবিষ্যতে গ্রাহককে চিহ্নিত করার জন্য নাম, মোবাইল নম্বর বা পেমেন্ট ট্রানজেকশন আইডি লিখতে পারেন।
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>মেয়াদ গণনা নিয়ম:</span>
                  </p>
                  <p>
                    সাবস্ক্রিপশনের মেয়াদ কি তৈরির মুহূর্ত থেকেই শুরু হবে। গ্রাহক যে দিনই অ্যাক্টিভেট করুন না কেন, মেয়াদ এই নির্ধারিত সময়েই শেষ হবে।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 text-sm"
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  <span>অ্যাক্সেস কি জেনারেট করুন</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: LICENSES MANAGEMENT */}
        {activeTab === 'licenses' && (
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নোট বা কি দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {[
                  { id: 'all', label: 'সব' },
                  { id: 'active', label: 'সক্রিয়' },
                  { id: 'bound', label: 'Bound' },
                  { id: 'unbound', label: 'Unbound' },
                  { id: 'expired', label: 'মেয়াদোত্তীর্ণ' },
                  { id: 'suspended', label: 'স্থগিত' },
                  { id: 'revoked', label: 'বাতিল' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      statusFilter === f.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* License Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {filteredLicenses.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  কোনো লাইসেন্স পাওয়া যায়নি।
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-3 px-4">মাস্কড কি & নোট</th>
                        <th className="py-3 px-4">স্ট্যাটাস</th>
                        <th className="py-3 px-4">ব্রাউজার বাইন্ডিং</th>
                        <th className="py-3 px-4">মেয়াদোত্তীর্ণের তারিখ</th>
                        <th className="py-3 px-4">সর্বশেষ সক্রিয়</th>
                        <th className="py-3 px-4 text-right">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredLicenses.map((lic) => {
                        const now = Date.now();
                        const isExpired = now > lic.expiresAt;
                        const daysRemaining = Math.ceil((lic.expiresAt - now) / (1000 * 60 * 60 * 24));

                        return (
                          <tr key={lic.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* Key & Note */}
                            <td className="py-3.5 px-4">
                              <p className="font-mono font-bold text-white text-sm">{lic.keyMasked}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{lic.customerNote || 'নোট নেই'}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{lic.id}</p>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {lic.status === 'revoked' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                  <XCircle className="w-3 h-3" /> Revoked
                                </span>
                              ) : lic.status === 'suspended' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-950 text-orange-300 border border-orange-800">
                                  <AlertTriangle className="w-3 h-3" /> Suspended
                                </span>
                              ) : isExpired ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  <Clock className="w-3 h-3" /> Expired
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  <CheckCircle className="w-3 h-3" /> Active
                                </span>
                              )}
                            </td>

                            {/* Browser Binding */}
                            <td className="py-3.5 px-4">
                              {lic.browserBound ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 text-teal-400 font-semibold text-[11px]">
                                    <Smartphone className="w-3.5 h-3.5" /> Bound
                                  </span>
                                  {lic.deviceInfo && (
                                    <p className="text-[11px] font-bold text-slate-200 mt-0.5 flex items-center gap-1">
                                      <span>🌐</span>
                                      <span>{lic.deviceInfo}</span>
                                    </p>
                                  )}
                                  {lic.activatedAt && (
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      যুক্ত: {new Date(lic.activatedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                                  Unbound (লগইন হয়নি)
                                </span>
                              )}
                            </td>

                            {/* Expiry */}
                            <td className="py-3.5 px-4">
                              <p className="text-slate-200">{new Date(lic.expiresAt).toLocaleDateString()}</p>
                              <p className={`text-[10px] font-semibold ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {isExpired ? 'মেয়াদ শেষ' : `${daysRemaining} দিন বাকি`}
                              </p>
                            </td>

                            {/* Last Active */}
                            <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                              {lic.lastActiveAt ? new Date(lic.lastActiveAt).toLocaleString() : 'নেই'}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {/* Reset Binding Button */}
                                {lic.browserBound && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetBinding(lic.id, lic.keyMasked)}
                                    title="ব্রাউজার বাইন্ডিং রিসেট করুন"
                                    className="px-2.5 py-1 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-800 text-teal-300 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>রিসেট</span>
                                  </button>
                                )}

                                {/* Extend Button */}
                                <button
                                  type="button"
                                  onClick={() => setExtendingLicense(lic)}
                                  title="মেয়াদ বৃদ্ধি করুন"
                                  className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Calendar className="w-3 h-3" />
                                  <span>+দিন</span>
                                </button>

                                {/* Suspend / Reactivate */}
                                {lic.status !== 'revoked' && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(lic)}
                                    title={lic.status === 'active' ? 'স্থগিত করুন' : 'পুনর্বহাল করুন'}
                                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                                      lic.status === 'active'
                                        ? 'bg-orange-950/60 hover:bg-orange-900 border-orange-800 text-orange-300'
                                        : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-800 text-emerald-300'
                                    }`}
                                  >
                                    {lic.status === 'active' ? 'স্থগিত' : 'সক্রিয়'}
                                  </button>
                                )}

                                {/* Revoke */}
                                {lic.status !== 'revoked' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRevoke(lic.id, lic.keyMasked)}
                                    title="স্থায়ীভাবে বাতিল করুন"
                                    className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[11px] font-semibold transition-colors cursor-pointer"
                                  >
                                    বাতিল
                                  </button>
                                )}
                              </div>
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
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <span>অডিট ও নিরাপত্তা লগ</span>
            </h2>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">এখনো কোনো অডিট রেকর্ড নেই।</p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between text-xs gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
                          {log.action}
                        </span>
                        {log.licenseId && (
                          <span className="font-mono text-[10px] text-slate-500">
                            {log.licenseId}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Extend License Duration */}
      {extendingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">মেয়াদ বৃদ্ধি করুন</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">{extendingLicense.keyMasked}</p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">অতিরিক্ত দিন সংখ্যা:</label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExtendDays(d)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      extendDays === d
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    +{d} দিন
                  </button>
                ))}
              </div>

              <input
                type="number"
                min="1"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendingLicense(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleExtendSubmit}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  বৃদ্ধি নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  PlusCircle, 
  Smartphone, 
  UserCheck, 
  UserX, 
  Lock,
  Megaphone,
  Edit2,
  User,
  Trash2,
  Send,
  Bell,
  History,
  X,
  Flame,
  Award,
  BookOpen,
  Target,
  Trophy,
  Globe,
  Monitor,
  Cpu,
  MapPin,
  Activity,
  Radio,
  ShieldAlert,
  MessageSquare,
  Settings
} from 'lucide-react';
import { LicenseRecord, AuditLogEntry, AdminOverviewStats, BroadcastAnnouncement } from '../../../server/types';
import { haptics } from '../../utils/haptics';
import { LiveSecurityTab } from './LiveSecurityTab';
import { SupportInboxTab } from './SupportInboxTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { StudentTimelineModal } from './StudentTimelineModal';
import { ActivityHeatmap } from './ActivityHeatmap';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'generate' | 'licenses' | 'audit' | 'broadcast' | 'live_security' | 'support' | 'settings'>('overview');
  const [selectedTimelineLicense, setSelectedTimelineLicense] = useState<LicenseRecord | null>(null);
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastAnnouncement[]>([]);
  const [connectedClients, setConnectedClients] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Key Generation State
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [customDays, setCustomDays] = useState<string>('30');
  const [customerNote, setCustomerNote] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Customer Name Inline Edit in Licenses Table
  const [editingCustomerLicId, setEditingCustomerLicId] = useState<string | null>(null);
  const [editingCustomerName, setEditingCustomerName] = useState('');

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'urgent' | 'update' | 'promotion'>('info');
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'high'>('high');
  const [broadcastTargetMode, setBroadcastTargetMode] = useState<'all' | 'specific'>('all');
  const [broadcastTargetKey, setBroadcastTargetKey] = useState('');
  const [broadcastDisplayStyle, setBroadcastDisplayStyle] = useState<'toast' | 'center_modal'>('center_modal');
  const [broadcastDismissMode, setBroadcastDismissMode] = useState<'permanent' | '5s' | 'custom'>('permanent');
  const [broadcastCustomSeconds, setBroadcastCustomSeconds] = useState('5');
  const [broadcastActionUrl, setBroadcastActionUrl] = useState('');
  const [broadcastActionText, setBroadcastActionText] = useState('View Details →');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // License Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal for extending duration
  const [extendingLicense, setExtendingLicense] = useState<LicenseRecord | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);

  // Modal for viewing student learning progress & streaks
  const [selectedProgressLicense, setSelectedProgressLicense] = useState<LicenseRecord | null>(null);

  // Modal for inspecting student device, browser & IP telemetry
  const [selectedDeviceLicense, setSelectedDeviceLicense] = useState<LicenseRecord | null>(null);
  const [copiedUa, setCopiedUa] = useState(false);

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
      const [statsRes, licRes, auditRes, broadcastRes] = await Promise.all([
        fetch('/api/admin/overview', { credentials: 'include' }),
        fetch('/api/admin/licenses', { credentials: 'include' }),
        fetch('/api/admin/audit', { credentials: 'include' }),
        fetch('/api/broadcasts/admin/list', { credentials: 'include' }),
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
      if (broadcastRes.ok) {
        const bData = await broadcastRes.json();
        setBroadcasts(bData.announcements || []);
        if (typeof bData.connectedClients === 'number') {
          setConnectedClients(bData.connectedClients);
        }
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
          customerName: customerNameInput.trim() || undefined,
          customerNote: customerNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setGeneratedKey(data.plaintextKey);
        setCustomerNameInput('');
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

  const handleSaveCustomerName = async (licenseId: string) => {
    haptics.tap();
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customerName: editingCustomerName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({ type: 'success', text: 'শিক্ষার্থীর নাম সফলভাবে আপডেট করা হয়েছে।' });
        setEditingCustomerLicId(null);
        setEditingCustomerName('');
        loadDashboardData();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'নাম আপডেট করা যায়নি।' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'সার্ভার এরর।' });
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setActionMessage({ type: 'error', text: 'শিরোনাম ও মেসেজ উভয়ই পূরণ করুন।' });
      return;
    }

    if (broadcastTargetMode === 'specific' && !broadcastTargetKey.trim()) {
      setActionMessage({ type: 'error', text: 'টার্গেট কি নির্বাচন করুন।' });
      return;
    }

    setIsSendingBroadcast(true);
    setActionMessage(null);
    haptics.tap();

    let autoDismissSec: number | undefined = undefined;
    if (broadcastDismissMode === '5s') {
      autoDismissSec = 5;
    } else if (broadcastDismissMode === 'custom') {
      const parsed = parseInt(broadcastCustomSeconds, 10);
      autoDismissSec = isNaN(parsed) || parsed <= 0 ? 5 : parsed;
    }

    try {
      const res = await fetch('/api/broadcasts/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          type: broadcastType,
          priority: broadcastPriority,
          targetKey: broadcastTargetMode === 'specific' ? broadcastTargetKey.trim() : undefined,
          displayStyle: broadcastDisplayStyle,
          autoDismissSeconds: autoDismissSec,
          actionUrl: broadcastActionUrl.trim() || undefined,
          actionText: broadcastActionText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({ 
          type: 'success', 
          text: broadcastTargetMode === 'specific' 
            ? 'নির্দিষ্ট গ্রাহকের ব্রাউজারে নোটিফিকেশন পাঠানো হয়েছে!' 
            : 'সকল শিক্ষার্থীর স্ক্রিনে নোটিফিকেশন সফলভাবে ব্রডকাস্ট হয়েছে!' 
        });
        setBroadcastTitle('');
        setBroadcastMessage('');
        setBroadcastActionUrl('');
        loadDashboardData();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'নোটিফিকেশন পাঠানো যায়নি।' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'সার্ভারে সংযোগ ব্যর্থ হয়েছে।' });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleDeleteBroadcast = async (id: string, title: string) => {
    if (!window.confirm(`আপনি কি "${title}" নোটিফিকেশনটি মুছে ফেলতে চান?`)) return;
    haptics.tap();
    try {
      const res = await fetch(`/api/broadcasts/admin/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({ type: 'success', text: 'নোটিফিকেশন মুছে ফেলা হয়েছে।' });
        loadDashboardData();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'মুছে ফেলা যায়নি।' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'সার্ভার এরর।' });
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

  const handleSendRenewal = async (licId: string) => {
    haptics.tap();
    try {
      const res = await fetch(`/api/admin/licenses/${licId}/send-renewal`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setActionMessage({ type: 'success', text: data.message });
        loadDashboardData();
      } else {
        setActionMessage({ type: 'error', text: data.message || 'নবায়ন নোটিশ পাঠানো যায়নি।' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'সার্ভার এরর।' });
    }
  };

  // Aggregated student learning progress & streak summary
  const learningSummary = React.useMemo(() => {
    let activeStreaks = 0;
    let maxStreak = 0;
    let totalStudied = 0;
    let totalMastered = 0;
    let totalQuizzes = 0;
    let accuracySum = 0;
    let accuracyCount = 0;

    licenses.forEach((lic) => {
      if (lic.progress) {
        if (lic.progress.learningStreak > 0) {
          activeStreaks += 1;
          if (lic.progress.learningStreak > maxStreak) {
            maxStreak = lic.progress.learningStreak;
          }
        }
        totalStudied += lic.progress.wordsStudied || 0;
        totalMastered += lic.progress.wordsMastered || 0;
        totalQuizzes += lic.progress.quizzesTaken || 0;
        if (lic.progress.quizzesTaken > 0 && typeof lic.progress.quizAccuracy === 'number') {
          accuracySum += lic.progress.quizAccuracy;
          accuracyCount += 1;
        }
      }
    });

    const avgAccuracy = accuracyCount > 0 ? Math.round(accuracySum / accuracyCount) : 0;

    // Top learners sorted by streak first, then mastered words, then words studied
    const topLearners = [...licenses]
      .filter((lic) => lic.progress && (lic.progress.learningStreak > 0 || lic.progress.wordsStudied > 0))
      .sort((a, b) => {
        const streakDiff = (b.progress?.learningStreak || 0) - (a.progress?.learningStreak || 0);
        if (streakDiff !== 0) return streakDiff;
        const masterDiff = (b.progress?.wordsMastered || 0) - (a.progress?.wordsMastered || 0);
        if (masterDiff !== 0) return masterDiff;
        return (b.progress?.wordsStudied || 0) - (a.progress?.wordsStudied || 0);
      })
      .slice(0, 5);

    return {
      activeStreaks,
      maxStreak,
      totalStudied,
      totalMastered,
      totalQuizzes,
      avgAccuracy,
      topLearners,
    };
  }, [licenses]);

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
    } else if (statusFilter === 'streak') {
      matchesStatus = Boolean(lic.progress && lic.progress.learningStreak > 0);
    } else if (statusFilter === 'suspended') {
      matchesStatus = lic.status === 'suspended';
    } else if (statusFilter === 'revoked') {
      matchesStatus = lic.status === 'revoked';
    } else if (statusFilter === 'expiring') {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      matchesStatus = lic.status === 'active' && now <= lic.expiresAt && lic.expiresAt <= now + sevenDays;
    } else if (statusFilter === 'alerts') {
      matchesStatus = Boolean(lic.fraudAlert || lic.tamperAlert);
    }

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      lic.keyMasked.toLowerCase().includes(q) ||
      (lic.plaintextKey && lic.plaintextKey.toLowerCase().includes(q)) ||
      lic.id.toLowerCase().includes(q) ||
      (lic.customerName && lic.customerName.toLowerCase().includes(q)) ||
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

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'broadcast'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>নোটিফিকেশন ও ব্রডকাস্ট ({broadcasts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live_security')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'live_security'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>লাইভ ও সিকিউরিটি হাব</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'support'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>সাপোর্ট ইনবক্স</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>নিরাপত্তা ও সেটিংস</span>
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

            {/* Learning Progress & Streaks Analytics Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Flame className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>শিক্ষার্থীদের লার্নিং প্রগ্রেস ও স্ট্রিক ইনসাইটস</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                        LIVE
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">সকল সক্রিয় শিক্ষার্থীর লাইভ পড়া, কুইজ ও স্ট্রিক মেট্রিক</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('streak');
                    setActiveTab('licenses');
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>স্ট্রিকধারী সকল শিক্ষার্থী ({learningSummary.activeStreaks}) →</span>
                </button>
              </div>

              {/* Learning KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-800/40">
                  <div className="flex items-center justify-between text-amber-400 mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Flame className="w-4 h-4 fill-amber-400" />
                      মোট সক্রিয় স্ট্রিকধারী
                    </span>
                    <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-300 font-mono">
                      সর্বোচ্চ {learningSummary.maxStreak} দিন
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white">{learningSummary.activeStreaks} <span className="text-xs font-normal text-slate-400">জন শিক্ষার্থী</span></p>
                  <p className="text-[11px] text-slate-400 mt-1">ধারাবাহিকভাবে প্রতিদিন ভোকাবুলারি চর্চা করছেন</p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-800/40">
                  <div className="flex items-center justify-between text-indigo-400 mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      মোট পঠিত শব্দ
                    </span>
                    <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-300 font-mono">
                      Cumulative
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white">{learningSummary.totalStudied.toLocaleString()} <span className="text-xs font-normal text-slate-400">টি শব্দ</span></p>
                  <p className="text-[11px] text-slate-400 mt-1">শিক্ষার্থীরা মোট এতবার শব্দ পড়েছেন ও অনুশীলন করেছেন</p>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-800/40">
                  <div className="flex items-center justify-between text-emerald-400 mb-2">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Award className="w-4 h-4" />
                      সম্পূর্ণ আয়ত্তকৃত শব্দ
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300 font-mono">
                      গড় একুরেসি {learningSummary.avgAccuracy}%
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white">{learningSummary.totalMastered.toLocaleString()} <span className="text-xs font-normal text-slate-400">টি মাস্টার্ড</span></p>
                  <p className="text-[11px] text-slate-400 mt-1">মোট কুইজ দেওয়া হয়েছে {learningSummary.totalQuizzes} টি</p>
                </div>
              </div>

              {/* Top Learners Leaderboard */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>টপ লার্নার ও স্ট্রিক লিডারবোর্ড (Top 5 Learners)</span>
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">র‍্যাংক স্ট্রিক ও আয়ত্ত অনুযায়ী</span>
                </div>

                {learningSummary.topLearners.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">এখনো কোনো শিক্ষার্থীর পড়াশোনার ডেটা সিঙ্ক হয়নি।</p>
                ) : (
                  <div className="space-y-2">
                    {learningSummary.topLearners.map((learner, idx) => (
                      <div
                        key={learner.id}
                        className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            idx === 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : idx === 1
                              ? 'bg-slate-300/20 text-slate-200 border border-slate-400/30'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            #{idx + 1}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {learner.customerName || 'বেনামী শিক্ষার্থী'}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                ({learner.keyMasked})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>📖 {learner.progress?.wordsStudied || 0} শব্দ পড়া</span>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold">🏆 {learner.progress?.wordsMastered || 0} আয়ত্ত</span>
                              <span>•</span>
                              <span>🎯 {learner.progress?.quizAccuracy || 0}% কুইজ</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{learner.progress?.learningStreak || 0} দিন স্ট্রিক</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedProgressLicense(learner)}
                            className="px-2.5 py-1 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-semibold cursor-pointer transition-colors"
                          >
                            বিবরণ
                          </button>
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
                  <label htmlFor="customerNameInput" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>শিক্ষার্থীর নাম (ঐচ্ছিক)</span>
                  </label>
                  <input
                    id="customerNameInput"
                    type="text"
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    placeholder="e.g. তানভীর হাসান (শিক্ষার্থী চাইলে লগইনেও দিতে পারে)"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    এখানে নাম ফাঁকা রাখলে শিক্ষার্থী লগইনের সময় নিজে নাম লিখতে পারবে। পরবর্তীতে আপনি যেকোনো সময় সংশোধন করতে পারবেন।
                  </p>
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
                    ভবিষ্যতে গ্রাহককে চিহ্নিত করার জন্য মোবাইল নম্বর বা পেমেন্ট ট্রানজেকশন আইডি লিখতে পারেন।
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
                  { id: 'expiring', label: '⏳ মেয়াদ শেষ (৭ দিন)' },
                  { id: 'alerts', label: '⚠️ ফ্রড/ট্যাম্পার' },
                  { id: 'streak', label: '🔥 স্ট্রিকধারী' },
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
                        <th className="py-3 px-4">অ্যাক্সেস কি ও শিক্ষার্থী</th>
                        <th className="py-3 px-4">স্ট্যাটাস</th>
                        <th className="py-3 px-4">ব্রাউজার বাইন্ডিং</th>
                        <th className="py-3 px-4">লার্নিং প্রগ্রেস ও স্ট্রিক</th>
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
                            {/* Key & Student Name & Note */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-sm select-all">
                                  {lic.plaintextKey || lic.keyMasked}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    haptics.tap();
                                    navigator.clipboard.writeText(lic.plaintextKey || lic.keyMasked);
                                    setActionMessage({ type: 'success', text: `কি কপি করা হয়েছে (${lic.keyMasked})` });
                                  }}
                                  title="সম্পূর্ণ কি কপি করুন"
                                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Student Name */}
                              <div className="mt-1 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                {editingCustomerLicId === lic.id ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingCustomerName}
                                      onChange={(e) => setEditingCustomerName(e.target.value)}
                                      placeholder="শিক্ষার্থীর নাম..."
                                      className="px-2 py-0.5 rounded-lg bg-slate-950 border border-indigo-500 text-white text-xs w-36 focus:outline-none"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveCustomerName(lic.id)}
                                      className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                                      title="সংরক্ষণ করুন"
                                    >
                                      <Check className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCustomerLicId(null)}
                                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                                      title="বাতিল"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 group">
                                    <span className="text-xs font-semibold text-slate-200">
                                      {lic.customerName ? (
                                        lic.customerName
                                      ) : (
                                        <span className="text-slate-500 italic font-normal">নাম দেওয়া হয়নি</span>
                                      )}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCustomerLicId(lic.id);
                                        setEditingCustomerName(lic.customerName || '');
                                      }}
                                      className="p-0.5 opacity-60 group-hover:opacity-100 text-slate-400 hover:text-indigo-400 transition-opacity cursor-pointer"
                                      title="নাম সংশোধন বা যোগ করুন"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-400 mt-0.5">{lic.customerNote || 'নোট নেই'}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{lic.id}</p>

                              {/* Fraud & Tamper Badges */}
                              {lic.fraudAlert && (
                                <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-950/90 border border-rose-800 text-rose-300 text-[10px] font-bold animate-pulse" title={lic.fraudAlert}>
                                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                                  <span className="truncate">⚠️ ফ্রড অ্যালার্ট (অন্য ডিভাইস)</span>
                                </div>
                              )}
                              {lic.tamperAlert && (
                                <div className="mt-1.5 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-950/90 border border-amber-800 text-amber-300 text-[10px] font-bold" title={lic.tamperAlert}>
                                  <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="truncate">⚠️ ট্যাম্পার সনাক্ত</span>
                                </div>
                              )}
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

                            {/* Browser Binding & Device Telemetry */}
                            <td className="py-3.5 px-4">
                              {lic.browserBound ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1 text-teal-300 font-bold text-[10px] bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-800/80">
                                      <Smartphone className="w-3 h-3 text-teal-400" /> Bound
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDeviceLicense(lic)}
                                      className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-slate-700"
                                      title="ব্রাউজার, ডিভাইস ও আইপি সম্পূর্ণ বিবরণ দেখুন"
                                    >
                                      <Globe className="w-2.5 h-2.5 text-teal-400" />
                                      <span>ফুল ইনফো</span>
                                    </button>
                                  </div>

                                  {lic.deviceInfo && (
                                    <p className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                                      <span>🌐</span>
                                      <span className="truncate max-w-[150px]" title={lic.deviceInfo}>{lic.deviceInfo}</span>
                                    </p>
                                  )}

                                  {(lic.browserMetadata?.ip || lic.clientIp) && (
                                    <p className="text-[10px] font-mono text-indigo-300 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                                      <span>IP: {lic.browserMetadata?.ip || lic.clientIp}</span>
                                    </p>
                                  )}

                                  {lic.activatedAt && (
                                    <p className="text-[10px] text-slate-500">
                                      যুক্ত: {new Date(lic.activatedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-500 text-[11px] italic">
                                  Unbound (লগইন হয়নি)
                                </span>
                              )}
                            </td>

                            {/* Learning Progress & Streak */}
                            <td className="py-3.5 px-4">
                              {lic.progress ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                      lic.progress.learningStreak > 0 
                                        ? 'bg-amber-950/90 text-amber-300 border border-amber-700/80' 
                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                    }`}>
                                      <Flame className={`w-3.5 h-3.5 ${lic.progress.learningStreak > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                                      <span>{lic.progress.learningStreak} দিন স্ট্রিক</span>
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => setSelectedProgressLicense(lic)}
                                      className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                                      title="সম্পূর্ণ অগ্রগতি বিবরণ দেখুন"
                                    >
                                      বিস্তারিত
                                    </button>
                                  </div>

                                  <div className="text-[11px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                                    <span>📖 {lic.progress.wordsStudied || 0} পঠিত</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-emerald-400 font-semibold">🏆 {lic.progress.wordsMastered || 0} আয়ত্ত</span>
                                  </div>

                                  <div className="text-[10px] text-slate-400">
                                    <span>🎯 কুইজ: {lic.progress.quizAccuracy ?? 0}% ({lic.progress.quizzesTaken || 0} টেস্ট)</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 text-slate-500 text-[11px] italic">
                                    — শুরু করেনি
                                  </span>
                                  {lic.browserBound && (
                                    <p className="text-[10px] text-slate-500">লগইন হয়েছে, পড়া শুরু হয়নি</p>
                                  )}
                                </div>
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
                                {/* Feature 2: 1-Click Renewal Alert Button */}
                                {lic.status === 'active' && daysRemaining <= 7 && !isExpired && (
                                  <button
                                    type="button"
                                    onClick={() => handleSendRenewal(lic.id)}
                                    title="১-ক্লিক মেয়াদ শেষ সতর্কতা পাঠান"
                                    className="px-2.5 py-1 rounded-lg bg-amber-950/90 hover:bg-amber-900 border border-amber-700 text-amber-200 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                  >
                                    <span>⏳ নবায়ন নোটিশ</span>
                                  </button>
                                )}

                                {/* Feature 51: Action Timeline Button */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedTimelineLicense(lic)}
                                  title="শিক্ষার্থীর পূর্ণাঙ্গ অ্যাকশন টাইমলাইন দেখুন"
                                  className="px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <History className="w-3 h-3" />
                                  <span>টাইমলাইন</span>
                                </button>

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

        {/* TAB 5: BROADCAST & NOTIFICATIONS */}
        {activeTab === 'broadcast' && (
          <div className="space-y-6">
            {/* Top Info Banner */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-indigo-200">
                <Megaphone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  রিয়েল-টাইম নোটিফিকেশন সেন্টার: এখান থেকে সরাসরি শিক্ষার্থীদের ব্রাউজারে পপআপ বা মিনি অ্যালার্ট পাঠাতে পারবেন।
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px] shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>অনলাইন ক্লায়েন্ট: {connectedClients}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Broadcast Creation Form */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-400" />
                  <span>নতুন নোটিফিকেশন পাঠান</span>
                </h3>

                <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
                  {/* Target Audience */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      টার্গেট প্রাপক (Audience)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBroadcastTargetMode('all');
                          setBroadcastTargetKey('');
                        }}
                        className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          broadcastTargetMode === 'all'
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>👥 সকল শিক্ষার্থী (All)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastTargetMode('specific')}
                        className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          broadcastTargetMode === 'specific'
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>🎯 নির্দিষ্ট কি / ব্রাউজার</span>
                      </button>
                    </div>

                    {broadcastTargetMode === 'specific' && (
                      <div className="mt-2.5 space-y-1">
                        <label className="block text-[11px] text-slate-400">
                          গ্রাহকের লাইসেন্স কি নির্বাচন করুন:
                        </label>
                        <select
                          value={broadcastTargetKey}
                          onChange={(e) => setBroadcastTargetKey(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- যেকোনো একটি লাইসেন্স সিলেক্ট করুন --</option>
                          {licenses
                            .filter((lic) => lic.status === 'active')
                            .map((lic) => (
                              <option key={lic.id} value={lic.plaintextKey || lic.keyMasked}>
                                {lic.customerName ? `[${lic.customerName}] ` : ''}
                                {lic.plaintextKey || lic.keyMasked}
                                {lic.customerNote ? ` (${lic.customerNote})` : ''}
                              </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-indigo-300">
                          শুধুমাত্র এই কি দিয়ে লগইন থাকা ব্রাউজারেই এই নোটিফিকেশনটি পপআপ হবে।
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Display Style (Center Modal vs Mini Alert Toast) */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      প্রদর্শন ধরন (Display Style)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBroadcastDisplayStyle('center_modal')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          broadcastDisplayStyle === 'center_modal'
                            ? 'bg-indigo-950/70 border-indigo-500 text-white ring-1 ring-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-white mb-0.5">
                          <Bell className="w-3.5 h-3.5 text-amber-400" />
                          <span>মাঝখানে নোটিফিকেশন (Center Modal)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          ডিসপ্লের ঠিক মাঝখানে থ্রি-ডি বেল ব্যাজ ও অ্যাকশন বাটন সহ প্রিমিয়াম কার্ড।
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastDisplayStyle('toast')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          broadcastDisplayStyle === 'toast'
                            ? 'bg-indigo-950/70 border-indigo-500 text-white ring-1 ring-indigo-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-white mb-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                          <span>মিনি শর্ট অ্যালার্ট (Mini Toast)</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          স্ক্রিনের উপরে বা কোণায় ছোট রাউন্ডেড পিল আকারে কুইক নোটিশ।
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Auto-Dismiss Timer */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">
                      স্থায়িত্ব ও অটো-ক্লোজ টাইমার (Duration)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBroadcastDismissMode('permanent')}
                        className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                          broadcastDismissMode === 'permanent'
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        ♾️ স্থায়ী (ইউজার ক্রস করবে)
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastDismissMode('5s')}
                        className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                          broadcastDismissMode === '5s'
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        ⏱️ ৫ সেকেন্ডে চলে যাবে
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastDismissMode('custom')}
                        className={`py-2 px-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                          broadcastDismissMode === 'custom'
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        ⚙️ কাস্টম সেকেন্ড
                      </button>
                    </div>

                    {broadcastDismissMode === 'custom' && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">কত সেকেন্ড পর গায়েব হবে:</span>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={broadcastCustomSeconds}
                          onChange={(e) => setBroadcastCustomSeconds(e.target.value)}
                          className="w-24 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs text-center"
                        />
                        <span className="text-[11px] text-slate-400">সেকেন্ড</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Message */}
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      নোটিফিকেশন শিরোনাম (Title)
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. 1 New Notification অথবা Must have A-Z!"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      মেসেজ বা বিস্তারিত বার্তা (Message)
                    </label>
                    <textarea
                      rows={3}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="e.g. গুরুত্বপূর্ণ নোটিশ বা স্পেশাল আপডেট..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  {/* Action Button Details (especially for Center Modal) */}
                  {broadcastDisplayStyle === 'center_modal' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1 text-[11px]">
                          বাটন টেক্সট (Button Text)
                        </label>
                        <input
                          type="text"
                          value={broadcastActionText}
                          onChange={(e) => setBroadcastActionText(e.target.value)}
                          placeholder="View Details →"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1 text-[11px]">
                          বাটন লিংক (ঐচ্ছিক URL)
                        </label>
                        <input
                          type="text"
                          value={broadcastActionUrl}
                          onChange={(e) => setBroadcastActionUrl(e.target.value)}
                          placeholder="e.g. https://... অথবা #story"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingBroadcast}
                    className="w-full py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 text-xs mt-2"
                  >
                    {isSendingBroadcast ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>নোটিফিকেশন সম্প্রচার (Send Broadcast)</span>
                  </button>
                </form>
              </div>

              {/* Broadcasts History List */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
                <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span>পাঠানো নোটিফিকেশন সমূহ</span>
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    মোট: {broadcasts.length}
                  </span>
                </h3>

                {broadcasts.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    এখনো কোনো নোটিফিকেশন পাঠানো হয়নি।
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {broadcasts.map((b) => (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs relative group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-white text-xs leading-snug">{b.title}</h4>
                          <button
                            type="button"
                            onClick={() => handleDeleteBroadcast(b.id, b.title)}
                            title="মুছে ফেলুন"
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-slate-300 text-[11px] leading-relaxed mb-2 line-clamp-3">
                          {b.message}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          {/* Target Tag */}
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold ${
                              b.targetKey
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            }`}
                          >
                            {b.targetKey ? `🎯 কি: ${b.targetKey}` : '👥 All Students'}
                          </span>

                          {/* Style Tag */}
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {b.displayStyle === 'toast' ? '⚠️ Mini Toast' : '🔔 Center Modal'}
                          </span>

                          {/* Auto dismiss tag */}
                          {b.autoDismissSeconds ? (
                            <span className="px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                              ⏱️ {b.autoDismissSeconds}s Auto-close
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400">
                              স্থায়ী
                            </span>
                          )}

                          <span className="text-slate-500 ml-auto font-mono text-[9px]">
                            {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: LIVE & SECURITY HUB */}
        {activeTab === 'live_security' && <LiveSecurityTab />}

        {/* TAB 7: SUPPORT INBOX */}
        {activeTab === 'support' && <SupportInboxTab />}

        {/* TAB 8: SETTINGS & TELEGRAM */}
        {activeTab === 'settings' && <AdminSettingsTab />}
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

      {/* MODAL: STUDENT PROGRESS & STREAK DETAILS */}
      {selectedProgressLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-scaleUp font-sans">
            <button
              type="button"
              onClick={() => setSelectedProgressLicense(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5 pr-8">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 fill-amber-400 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  {selectedProgressLicense.customerName || 'বেনামী শিক্ষার্থী'}
                </h3>
                <p className="text-xs text-slate-400 font-mono truncate">
                  {selectedProgressLicense.plaintextKey || selectedProgressLicense.keyMasked}
                  {selectedProgressLicense.deviceInfo ? ` • 🌐 ${selectedProgressLicense.deviceInfo}` : ''}
                </p>
              </div>
            </div>

            {/* Streak Highlight Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-orange-950/50 to-slate-950 border border-amber-700/60 mb-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  ধারাবাহিক স্ট্রিক (Daily Streak)
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white mt-0.5 flex items-center gap-2">
                  <span>🔥 {selectedProgressLicense.progress?.learningStreak || 0}</span>
                  <span className="text-sm font-semibold text-amber-200">দিন একনাগাড়ে</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {(selectedProgressLicense.progress?.learningStreak || 0) > 0
                    ? 'শিক্ষার্থী নিয়মিত প্রতিদিন ভোকাবুলারি চর্চা ধরে রাখছেন'
                    : 'এখনও দৈনিক স্ট্রিক শুরু হয়নি'}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {selectedProgressLicense.progress?.lastStudyDate ? `পড়া হয়েছে` : `নতুন`}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">মোট পঠিত শব্দ</span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  📖 {selectedProgressLicense.progress?.wordsStudied || 0}
                </span>
                <span className="text-[10px] text-slate-500">শব্দ পাঠ করা হয়েছে</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">অনুশীলনকৃত শব্দ</span>
                <span className="text-lg font-black text-teal-300 mt-0.5 block">
                  ⚡ {selectedProgressLicense.progress?.wordsPracticed || 0}
                </span>
                <span className="text-[10px] text-slate-500">বার প্র্যাকটিস হয়েছে</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">সম্পূর্ণ আয়ত্ত</span>
                <span className="text-lg font-black text-emerald-300 mt-0.5 block">
                  🏆 {selectedProgressLicense.progress?.wordsMastered || 0}
                </span>
                <span className="text-[10px] text-slate-500">মাস্টার্ড শব্দ</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">রিভিশন প্রয়োজন</span>
                <span className="text-lg font-black text-rose-300 mt-0.5 block">
                  🔄 {selectedProgressLicense.progress?.needsRevisionCount || 0}
                </span>
                <span className="text-[10px] text-slate-500">কঠিন বা ভুল শব্দ</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">পছন্দের শব্দ (Stars)</span>
                <span className="text-lg font-black text-amber-300 mt-0.5 block">
                  ⭐ {selectedProgressLicense.progress?.favoritesCount || 0}
                </span>
                <span className="text-[10px] text-slate-500">বুকমার্ক করা</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">মোট কুইজ দেওয়া</span>
                <span className="text-lg font-black text-indigo-300 mt-0.5 block">
                  📝 {selectedProgressLicense.progress?.quizzesTaken || 0}
                </span>
                <span className="text-[10px] text-slate-500">টি সম্পন্ন টেস্ট</span>
              </div>
            </div>

            {/* Quiz Accuracy Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span>কুইজ একুরেসি হার (Accuracy Rate)</span>
                </span>
                <span className="font-mono font-bold text-white text-sm">
                  {selectedProgressLicense.progress?.quizAccuracy ?? 0}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, selectedProgressLicense.progress?.quizAccuracy || 0))}%` }}
                />
              </div>
            </div>

            {/* Feature 18: Activity Heatmap Calendar */}
            <ActivityHeatmap
              studyHistory={selectedProgressLicense.progress?.studyHistory}
              totalWordsStudied={selectedProgressLicense.progress?.wordsStudied}
              streak={selectedProgressLicense.progress?.learningStreak}
            />

            {/* Footer Timestamps */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <div>
                <span>সর্বশেষ অধ্যয়ন: </span>
                <span className="text-slate-300 font-medium">
                  {selectedProgressLicense.progress?.lastStudyDate
                    ? selectedProgressLicense.progress.lastStudyDate
                    : 'কোনো তারিখ নেই'}
                </span>
              </div>
              <div>
                <span>সার্ভারে সিঙ্ক: </span>
                <span className="text-slate-300 font-medium">
                  {selectedProgressLicense.lastActiveAt
                    ? new Date(selectedProgressLicense.lastActiveAt).toLocaleString()
                    : 'এখনও সিঙ্ক হয়নি'}
                </span>
              </div>
            </div>

            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setSelectedProgressLicense(null)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* MODAL: FULL DEVICE, BROWSER & IP TELEMETRY INSPECTOR */}
      {selectedDeviceLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-scaleUp font-sans max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedDeviceLicense(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-6 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-xs">
                <Globe className="w-6 h-6 text-teal-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    ব্রাউজার, ডিভাইস ও আইপি পূর্ণাঙ্গ বিবরণ
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-800 shrink-0">
                    DEVICE TELEMETRY
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                  শিক্ষার্থী: <span className="text-slate-200 font-bold">{selectedDeviceLicense.customerName || 'বেনামী'}</span> • {selectedDeviceLicense.plaintextKey || selectedDeviceLicense.keyMasked}
                </p>
              </div>
            </div>

            {/* Primary IP & Location Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 via-indigo-950/50 to-slate-950 border border-teal-700/60 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>ক্লায়েন্ট আইপি অ্যাড্রেস (Client IP)</span>
                </span>
                <p className="text-xl sm:text-2xl font-mono font-black text-white mt-0.5 select-all">
                  {selectedDeviceLicense.browserMetadata?.ip || selectedDeviceLicense.clientIp || '127.0.0.1 (Localhost)'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>টাইমজোন: <strong className="text-slate-200">{selectedDeviceLicense.browserMetadata?.timezone || 'অজানা'}</strong></span>
                  {selectedDeviceLicense.browserMetadata?.timezoneOffset && (
                    <span className="text-teal-300 font-mono">({selectedDeviceLicense.browserMetadata.timezoneOffset})</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ip = selectedDeviceLicense.browserMetadata?.ip || selectedDeviceLicense.clientIp || '';
                    if (ip) {
                      navigator.clipboard.writeText(ip);
                      setActionMessage({ type: 'success', text: `আইপি অ্যাড্রেস কপি করা হয়েছে (${ip})` });
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-900/60 hover:bg-teal-800 border border-teal-700 text-teal-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>আইপি কপি</span>
                </button>
              </div>
            </div>

            {/* Structured Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 text-xs">
              
              {/* 1. Browser & Engine */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-teal-400 font-bold border-b border-slate-800/80 pb-2">
                  <Globe className="w-4 h-4" />
                  <span>ব্রাউজার বিশদ (Browser)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">ব্রাউজারের নাম</span>
                    <span className="text-slate-200 font-bold text-xs mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.browserName || selectedDeviceLicense.deviceInfo?.split(' ')[0] || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ভার্সন (Version)</span>
                    <span className="text-slate-200 font-mono text-xs mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.browserVersion || 'Latest'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">সিস্টেম ল্যাঙ্গুয়েজ (Locale)</span>
                    <span className="text-slate-200 font-medium mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.language || 'bn-BD, en-US'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. OS & Device Type */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold border-b border-slate-800/80 pb-2">
                  <Monitor className="w-4 h-4" />
                  <span>অপারেটিং সিস্টেম ও ডিভাইস (OS & Device)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">ডিভাইস ক্যাটাগরি</span>
                    <span className="text-slate-200 font-bold text-xs mt-0.5 block flex items-center gap-1">
                      {selectedDeviceLicense.browserMetadata?.deviceType === 'Mobile' ? (
                        <>📱 Mobile Phone</>
                      ) : selectedDeviceLicense.browserMetadata?.deviceType === 'Tablet' ? (
                        <>📟 Tablet</>
                      ) : (
                        <>💻 Desktop / PC</>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">অপারেটিং সিস্টেম</span>
                    <span className="text-slate-200 font-bold text-xs mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.osName || 'Unknown OS'} {selectedDeviceLicense.browserMetadata?.osVersion || ''}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">প্ল্যাটফর্ম আর্কিটেকচার</span>
                    <span className="text-slate-200 font-mono text-[11px] mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.platform || 'Standard Web Host'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Screen & Display */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-slate-800/80 pb-2">
                  <Activity className="w-4 h-4" />
                  <span>ডিসপ্লে ও রেজোলিউশন (Display Specs)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">স্ক্রিন রেজোলিউশন</span>
                    <span className="text-slate-200 font-mono font-bold text-xs mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.screenResolution || '1920x1080'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">উইন্ডো সাইজ (Viewport)</span>
                    <span className="text-slate-200 font-mono text-xs mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.windowSize || 'Responsive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">পিক্সেল রেশিও (DPI)</span>
                    <span className="text-slate-200 font-mono mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.pixelRatio ? `${selectedDeviceLicense.browserMetadata.pixelRatio}x (Retina/High-DPI)` : '1x'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">কালার ডেপথ</span>
                    <span className="text-slate-200 font-mono mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.colorDepth ? `${selectedDeviceLicense.browserMetadata.colorDepth}-bit True Color` : '24-bit'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Hardware & Hardware Capability */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800/80 pb-2">
                  <Cpu className="w-4 h-4" />
                  <span>হার্ডওয়্যার ও ক্যাপাসিটি (Hardware Specs)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">টাচস্ক্রিন সুবিধা</span>
                    <span className="text-slate-200 font-bold mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.touchSupport ? '✅ Touchscreen সচল' : '🖱️ মাউস / নন-টাচ'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">নেটওয়ার্ক মাধ্যম</span>
                    <span className="text-slate-200 font-mono mt-0.5 block uppercase">
                      {selectedDeviceLicense.browserMetadata?.networkType || 'Broadband / Cellular'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">সিপিইউ কোর (CPU Cores)</span>
                    <span className="text-slate-200 font-mono mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.cpuCores ? `${selectedDeviceLicense.browserMetadata.cpuCores} Logic Cores` : 'মডার্ন প্রসেসর'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ডিভাইস মেমোরি (RAM)</span>
                    <span className="text-slate-200 font-mono mt-0.5 block">
                      {selectedDeviceLicense.browserMetadata?.deviceMemoryGb ? `~${selectedDeviceLicense.browserMetadata.deviceMemoryGb} GB RAM` : 'স্ট্যান্ডার্ড র‍্যাম'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* 5. Complete Raw User-Agent Header with Copy */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mb-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-400" />
                  <span>সম্পূর্ণ User-Agent স্ট্রিং (Raw Telemetry)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const ua = selectedDeviceLicense.browserMetadata?.userAgent || selectedDeviceLicense.boundUserAgent || navigator.userAgent;
                    navigator.clipboard.writeText(ua);
                    setCopiedUa(true);
                    setTimeout(() => setCopiedUa(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedUa ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUa ? 'কপি হয়েছে' : 'UA কপি করুন'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 font-mono text-[11px] text-slate-300 break-all select-all leading-relaxed">
                {selectedDeviceLicense.browserMetadata?.userAgent || selectedDeviceLicense.boundUserAgent || 'User-Agent header not recorded yet.'}
              </div>
            </div>

            {/* 6. Feature 38: Canvas & WebGL GPU Hardware Fingerprint Hash */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-950 border border-emerald-800/60 space-y-2 mb-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ক্যানভাস ও WebGL জিপিইউ হার্ডওয়্যার ফিঙ্গারপ্রিন্ট (GPU Hash)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  IMMUTABLE HARDWARE ID
                </span>
              </div>
              <p className="font-mono text-xs font-black text-white bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 select-all">
                {selectedDeviceLicense.browserMetadata?.canvasFingerprintHash || selectedDeviceLicense.canvasFingerprintHash || 'GPU-STANDARD-RASTER-HASH'}
              </p>
              <p className="text-[10px] text-slate-400">
                এই হার্ডওয়্যার হ্যাশটি ডিভাইসের GPU চিপের সাব-পিক্সেল রেন্ডারিং দ্বারা তৈরি। এটি VPN, ইনকগনিটো বা ব্রাউজার কুকি মুছে ফেলার মাধ্যমেও বাইপাস করা সম্ভব নয়।
              </p>
            </div>

            {/* Timestamps & Close */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="space-y-0.5">
                <p>
                  প্রথম অ্যাক্টিভেশন: <span className="text-slate-300 font-mono">{selectedDeviceLicense.activatedAt ? new Date(selectedDeviceLicense.activatedAt).toLocaleString() : 'নেই'}</span>
                </p>
                <p>
                  সর্বশেষ সক্রিয় (Last Active): <span className="text-slate-300 font-mono">{selectedDeviceLicense.lastActiveAt ? new Date(selectedDeviceLicense.lastActiveAt).toLocaleString() : 'নেই'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDeviceLicense(null)}
                className="w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GRANULAR STUDENT ACTION TIMELINE */}
      {selectedTimelineLicense && (
        <StudentTimelineModal
          license={selectedTimelineLicense}
          onClose={() => setSelectedTimelineLicense(null)}
        />
      )}
    </div>
  );
};

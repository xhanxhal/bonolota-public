import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  MapPin,
  Radio,
  MessageSquare,
  Settings,
  ArrowLeft,
  Sun,
  Moon
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

  // Theme State: Light / Dark Mode
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bonolota_theme') || localStorage.getItem('bonolota_admin_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return document.documentElement.classList.contains('dark') ? 'dark' : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem('bonolota_theme', theme);
      localStorage.setItem('bonolota_admin_theme', theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    haptics.toggle();
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

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
  const learningSummary = useMemo(() => {
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

  // Login Screen with Dual Theme
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl relative overflow-hidden">
          {/* Top Theme & Exit Actions */}
          <div className="flex items-center justify-between mb-4">
            {onExitAdmin ? (
              <button
                type="button"
                onClick={onExitAdmin}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1 font-bangla"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>মূল সাইট</span>
              </button>
            ) : <span />}

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shadow-xs">
              <img
                src="/assets/aistudio/Botanical_Book_B_Emblem_8fbb1e88.png"
                alt="Bonolota Icon"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <span>Bonolota Admin Vault</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bangla">সুরক্ষিত সেন্ট্রাল অ্যাডমিনিস্ট্রেশন পোর্টাল</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 font-bangla">
            <div>
              <label htmlFor="adminPasswordInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                অ্যাডমিন পাসওয়ার্ড
              </label>
              <div className="relative flex items-center">
                <input
                  id="adminPasswordInput"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="এডমিনিস্ট্রেটর পাসওয়ার্ড লিখুন"
                  disabled={isLoggingIn}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 pr-11 text-sm font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || !password}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md shadow-emerald-950/30"
            >
              {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>লগইন করুন</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white pb-16 transition-colors">
      {/* Top Header - Consistent with Bonolota Branding with Theme Toggle */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 shadow-xs transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 shrink-0 flex items-center justify-center shadow-xs">
            <img
              src="/assets/aistudio/Botanical_Book_B_Emblem_8fbb1e88.png"
              alt="Bonolota Emblem"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                Bonolota
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0 font-bold">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">{stats?.isUsingFallbackStore ? 'Local Dev Store' : 'Upstash Redis Connected'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Toggle Button (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
            title={theme === 'dark' ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-xs font-semibold hidden md:inline font-bangla">লাইট</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
                <span className="text-xs font-semibold hidden md:inline font-bangla">ডার্ক</span>
              </>
            )}
          </button>

          {onExitAdmin && (
            <button
              type="button"
              onClick={onExitAdmin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer font-bangla"
              title="মূল ওয়েবসাইটে ফিরে যান"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">মূল সাইট</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadDashboardData}
            title="রিফ্রেশ করুন"
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer font-bangla"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* Action alert banner */}
        {actionMessage && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm animate-fadeIn ${
            actionMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
              : 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />}
              <span>{actionMessage.text}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setActionMessage(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-3 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation - Mobile-friendly smooth horizontal scrolling bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800/80 mb-5 overflow-x-auto scrollbar-none whitespace-nowrap touch-pan-x font-bangla shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ওভারভিউ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'generate'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>নতুন কি</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('licenses')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'licenses'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>লাইসেন্স ({licenses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'audit'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>অডিট লগ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'broadcast'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>নোটিফিকেশন ({broadcasts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live_security')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'live_security'
                ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>লাইভ সিকিউরিটি</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'support'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>সাপোর্ট ইনবক্স</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>নিরাপত্তা ও সেটিংস</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-4 sm:space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-bangla">মোট লাইসেন্স</span>
                <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">{stats.total}</p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-emerald-200 dark:border-emerald-900/40 shadow-xs">
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 font-bangla">সক্রিয় (Active)</span>
                <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300 mt-0.5">{stats.active}</p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-teal-200 dark:border-teal-900/40 shadow-xs">
                <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400 font-bangla">বাইন্ডেড (Bound)</span>
                <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-teal-700 dark:text-teal-300 mt-0.5">{stats.activated}</p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-amber-200 dark:border-amber-900/40 shadow-xs">
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 font-bangla">অব্যবহৃত</span>
                <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-300 mt-0.5">{stats.unactivated}</p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-bangla">মেয়াদ শেষ</span>
                <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300 mt-0.5">{stats.expired}</p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-orange-200 dark:border-orange-900/40 shadow-xs">
                <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400 font-bangla">স্থগিত</span>
                <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-orange-700 dark:text-orange-300 mt-0.5">{stats.suspended}</p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-rose-200 dark:border-rose-900/40 shadow-xs">
                <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 font-bangla">বাতিল</span>
                <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-300 mt-0.5">{stats.revoked}</p>
              </div>
            </div>

            {/* Quick Action & Recents */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Quick Key Generator Callout */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0f172a] border border-emerald-200 dark:border-emerald-900/30 flex flex-col justify-between shadow-xs">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-bangla">নতুন গ্রাহকের জন্য কি তৈরি করুন</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed font-bangla">
                    পেমেন্ট কনফার্মেশনের পর গ্রাহকের মেয়াদের জন্য নিরাপদ কি জেনারেট করুন। মেয়াদ তৈরি করার মুহূর্ত থেকেই গণনা শুরু হয়।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('generate')}
                  className="mt-5 w-full py-2.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs transition-colors cursor-pointer text-center font-bangla shadow-xs"
                >
                  কি জেনারেটরে যান →
                </button>
              </div>

              {/* Recently Activated */}
              <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between font-bangla">
                  <span>সম্প্রতি সক্রিয় হওয়া লাইসেন্স</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">সর্বশেষ ১০টি</span>
                </h3>

                {stats.recentlyActivated.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center font-bangla">এখনো কোনো লাইসেন্স অ্যাক্টিভেট হয়নি।</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentlyActivated.map(lic => (
                      <div key={lic.id} className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">{lic.keyMasked}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-bangla">
                            {lic.customerName ? `${lic.customerName} • ` : ''}
                            {lic.customerNote || 'নোট নেই'} • {lic.durationDays} দিন
                            {lic.deviceInfo ? ` • 🌐 ${lic.deviceInfo}` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-medium">
                            Bound
                          </span>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
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
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
                    <Flame className="w-4 h-4 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-bangla">
                      <span>শিক্ষার্থীদের লার্নিং প্রগ্রেস ও স্ট্রিক ইনসাইটস</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        LIVE
                      </span>
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('streak');
                    setActiveTab('licenses');
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-bangla self-start sm:self-auto"
                >
                  <span>স্ট্রিকধারী শিক্ষার্থী ({learningSummary.activeStreaks}) →</span>
                </button>
              </div>

              {/* Learning KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-amber-200 dark:border-amber-900/30 shadow-xs">
                  <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1.5">
                    <span className="text-xs font-bold flex items-center gap-1.5 font-bangla">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />
                      মোট সক্রিয় স্ট্রিকধারী
                    </span>
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-800 dark:text-amber-300 font-mono">
                      সর্বোচ্চ {learningSummary.maxStreak} দিন
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                    {learningSummary.activeStreaks} <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-bangla">জন</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-bangla">ধারাবাহিকভাবে প্রতিদিন শব্দ চর্চা করছেন</p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-emerald-200 dark:border-emerald-900/30 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1.5">
                    <span className="text-xs font-bold flex items-center gap-1.5 font-bangla">
                      <BookOpen className="w-3.5 h-3.5" />
                      মোট পঠিত শব্দ
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-800 dark:text-emerald-300 font-mono">
                      Cumulative
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                    {learningSummary.totalStudied.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-bangla">টি</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-bangla">শিক্ষার্থীরা শব্দ পাঠ ও অনুশীলন করেছেন</p>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-teal-200 dark:border-teal-900/30 shadow-xs">
                  <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 mb-1.5">
                    <span className="text-xs font-bold flex items-center gap-1.5 font-bangla">
                      <Award className="w-3.5 h-3.5" />
                      আয়ত্তকৃত শব্দ
                    </span>
                    <span className="text-[10px] bg-teal-100 dark:bg-teal-500/20 px-2 py-0.5 rounded-full text-teal-800 dark:text-teal-300 font-mono">
                      গড় {learningSummary.avgAccuracy}% একুরেসি
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                    {learningSummary.totalMastered.toLocaleString()} <span className="text-xs font-normal text-slate-500 dark:text-slate-400 font-bangla">মাস্টার্ড</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-bangla">মোট কুইজ দেওয়া হয়েছে {learningSummary.totalQuizzes} টি</p>
                </div>
              </div>

              {/* Top Learners Leaderboard */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3 font-bangla">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>টপ লার্নার ও স্ট্রিক লিডারবোর্ড (Top 5)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">স্ট্রিক ও দক্ষতা ভিত্তিক</span>
                </div>

                {learningSummary.topLearners.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center font-bangla">এখনো কোনো শিক্ষার্থীর পড়াশোনার ডেটা সিঙ্ক হয়নি।</p>
                ) : (
                  <div className="space-y-2">
                    {learningSummary.topLearners.map((learner, idx) => (
                      <div
                        key={learner.id}
                        className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            idx === 0
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                              : idx === 1
                              ? 'bg-slate-200 dark:bg-slate-300/20 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-400/30'
                              : idx === 2
                              ? 'bg-amber-50 dark:bg-amber-700/20 text-amber-700 dark:text-amber-500 border border-amber-200 dark:border-amber-700/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            #{idx + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                {learner.customerName || 'বেনামী শিক্ষার্থী'}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                                ({learner.keyMasked})
                              </span>
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 font-bangla">
                              <span>📖 {learner.progress?.wordsStudied || 0} পঠিত</span>
                              <span>•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">🏆 {learner.progress?.wordsMastered || 0} আয়ত্ত</span>
                              <span>•</span>
                              <span>🎯 {learner.progress?.quizAccuracy || 0}% কুইজ</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400" />
                            <span>{learner.progress?.learningStreak || 0} দিন</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedProgressLicense(learner)}
                            className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
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
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 shadow-xl font-bangla">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>নতুন অ্যাক্সেস কি জেনারেট করুন</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                গ্রাহক পেমেন্ট করার পর সময়সীমা নির্বাচন করে আনপ্রেডিক্টেবল কি তৈরি করুন।
              </p>

              {/* Generated Key Banner */}
              {generatedKey && (
                <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200 animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      নতুন কি সফলভাবে তৈরি হয়েছে!
                    </span>
                    <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">এখনই কপি করুন</span>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#080d1a] border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2 shadow-xs">
                    <span className="font-mono font-bold text-base sm:text-lg text-slate-900 dark:text-white select-all tracking-wider break-all">
                      {generatedKey}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>

                  <p className="mt-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      সতর্কতা: সিকিউরিটির জন্য প্লেইনটেক্সট কি সার্ভারে জমা থাকে না। পেজ পরিবর্তন করার পর এটি আর দেখা যাবে না। এখনই কপি করে গ্রাহককে পাঠিয়ে দিন।
                    </span>
                  </p>
                </div>
              )}

              <form onSubmit={handleGenerateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    সাবস্ক্রিপশনের মেয়াদ (Duration)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[30, 90, 180, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDuration(d)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          selectedDuration === d
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-[#080d1a] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700'
                        }`}
                      >
                        {d} দিন
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSelectedDuration(-1)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedDuration === -1
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-[#080d1a] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      কাস্টম দিন
                    </button>
                  </div>

                  {selectedDuration === -1 && (
                    <div className="mt-2.5">
                      <input
                        type="number"
                        min="1"
                        max="3650"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        placeholder="কাস্টম দিন সংখ্যা লিখুন (e.g. 45)"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="customerNameInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>শিক্ষার্থীর নাম (ঐচ্ছিক)</span>
                  </label>
                  <input
                    id="customerNameInput"
                    type="text"
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    placeholder="e.g. তানভীর হাসান"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    ফাঁকা রাখলে শিক্ষার্থী লগইনের সময় নিজে নাম সেট করতে পারবেন।
                  </p>
                </div>

                <div>
                  <label htmlFor="customerNoteInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    গ্রাহক রেফারেন্স বা পেমেন্ট নোট (ঐচ্ছিক)
                  </label>
                  <input
                    id="customerNoteInput"
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g. Tanvir (017xxxxxxxx) - bKash TrxID #8A92"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                  <p className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>মেয়াদ গণনা নিয়ম:</span>
                  </p>
                  <p className="text-[11px]">
                    সাবস্ক্রিপশনের মেয়াদ কি তৈরির মুহূর্ত থেকেই শুরু হবে এবং নির্ধারিত দিনে স্বয়ংক্রিয়ভাবে এক্সপায়ার হবে।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/30 text-xs"
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
          <div className="space-y-3 sm:space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shadow-xs">
              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="নাম, কি বা নোট দিয়ে খুঁজুন..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap py-0.5 font-bangla">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {[
                  { id: 'all', label: 'সব' },
                  { id: 'active', label: 'সক্রিয়' },
                  { id: 'expiring', label: '⏳ শেষ (৭ দিন)' },
                  { id: 'alerts', label: '⚠️ ফ্রড/ট্যাম্পার' },
                  { id: 'streak', label: '🔥 স্ট্রিকধারী' },
                  { id: 'bound', label: 'Bound' },
                  { id: 'unbound', label: 'Unbound' },
                  { id: 'expired', label: 'মেয়াদ শেষ' },
                  { id: 'suspended', label: 'স্থগিত' },
                  { id: 'revoked', label: 'বাতিল' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      statusFilter === f.id
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-[#080d1a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty State */}
            {filteredLicenses.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs rounded-3xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 font-bangla">
                কোনো লাইসেন্স পাওয়া যায়নি।
              </div>
            ) : (
              <>
                {/* 1. MOBILE CARDS VIEW (< md) */}
                <div className="block md:hidden space-y-2.5">
                  {filteredLicenses.map((lic) => {
                    const now = Date.now();
                    const isExpired = now > lic.expiresAt;
                    const daysRemaining = Math.ceil((lic.expiresAt - now) / (1000 * 60 * 60 * 24));

                    return (
                      <div
                        key={lic.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 text-xs space-y-2.5 shadow-xs"
                      >
                        {/* Header: Key & Copy & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs select-all truncate">
                                {lic.plaintextKey || lic.keyMasked}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  haptics.tap();
                                  navigator.clipboard.writeText(lic.plaintextKey || lic.keyMasked);
                                  setActionMessage({ type: 'success', text: `কি কপি করা হয়েছে (${lic.keyMasked})` });
                                }}
                                title="কপি করুন"
                                className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 cursor-pointer shrink-0"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Customer Name inline edit */}
                            <div className="mt-1 flex items-center gap-1.5 font-bangla">
                              <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              {editingCustomerLicId === lic.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingCustomerName}
                                    onChange={(e) => setEditingCustomerName(e.target.value)}
                                    placeholder="নাম..."
                                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#080d1a] border border-emerald-500 text-slate-900 dark:text-white text-xs w-28 focus:outline-none"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveCustomerName(lic.id)}
                                    className="p-1 rounded-md bg-emerald-600 text-white cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCustomerLicId(null)}
                                    className="p-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {lic.customerName || <span className="text-slate-400 italic">নাম দেওয়া হয়নি</span>}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCustomerLicId(lic.id);
                                      setEditingCustomerName(lic.customerName || '');
                                    }}
                                    className="p-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {lic.customerNote && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-bangla">{lic.customerNote}</p>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="text-right shrink-0">
                            {lic.status === 'revoked' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                Revoked
                              </span>
                            ) : lic.status === 'suspended' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                                Suspended
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                Active
                              </span>
                            )}
                            <p className={`text-[10px] font-semibold mt-0.5 ${isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {isExpired ? 'মেয়াদ শেষ' : `${daysRemaining} দিন বাকি`}
                            </p>
                          </div>
                        </div>

                        {/* Mid Row: Device & Streak Summary */}
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bangla">
                          <div className="flex items-center gap-1.5 truncate pr-2">
                            {lic.browserBound ? (
                              <span className="text-teal-700 dark:text-teal-300 flex items-center gap-1 shrink-0 font-medium">
                                <Smartphone className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                <span>{lic.deviceInfo || 'Bound'}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">লগইন হয়নি (Unbound)</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {lic.progress && lic.progress.learningStreak > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5">
                                <Flame className="w-3 h-3 fill-amber-500 dark:fill-amber-400" />
                                <span>{lic.progress.learningStreak} দিন</span>
                              </span>
                            ) : null}

                            {lic.progress ? (
                              <button
                                type="button"
                                onClick={() => setSelectedProgressLicense(lic)}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline text-[10px] font-semibold cursor-pointer ml-1"
                              >
                                প্রগ্রেস
                              </button>
                            ) : null}
                          </div>
                        </div>

                        {/* Bottom Row: Actions */}
                        <div className="flex items-center justify-end gap-1.5 pt-0.5 flex-wrap font-bangla">
                          {lic.status === 'active' && daysRemaining <= 7 && !isExpired && (
                            <button
                              type="button"
                              onClick={() => handleSendRenewal(lic.id)}
                              className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-bold cursor-pointer"
                            >
                              নবায়ন
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedTimelineLicense(lic)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                          >
                            টাইমলাইন
                          </button>

                          {lic.browserBound && (
                            <button
                              type="button"
                              onClick={() => setSelectedDeviceLicense(lic)}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 text-[11px] font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                            >
                              ইনফো
                            </button>
                          )}

                          {lic.browserBound && (
                            <button
                              type="button"
                              onClick={() => handleResetBinding(lic.id, lic.keyMasked)}
                              className="px-2 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-[11px] font-semibold cursor-pointer"
                            >
                              রিসেট
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setExtendingLicense(lic)}
                            className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold cursor-pointer"
                          >
                            +দিন
                          </button>

                          {lic.status !== 'revoked' && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(lic)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                                lic.status === 'active'
                                  ? 'bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                              }`}
                            >
                              {lic.status === 'active' ? 'স্থগিত' : 'সক্রিয়'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. DESKTOP TABLE VIEW (hidden on mobile, block on md+) */}
                <div className="hidden md:block bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#080d1a] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold font-bangla">
                        <tr>
                          <th className="py-3 px-4">অ্যাক্সেস কি ও শিক্ষার্থী</th>
                          <th className="py-3 px-4">স্ট্যাটাস</th>
                          <th className="py-3 px-4">ব্রাউজার বাইন্ডিং</th>
                          <th className="py-3 px-4">লার্নিং প্রগ্রেস</th>
                          <th className="py-3 px-4">মেয়াদ</th>
                          <th className="py-3 px-4">সর্বশেষ সক্রিয়</th>
                          <th className="py-3 px-4 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 font-medium">
                        {filteredLicenses.map((lic) => {
                          const now = Date.now();
                          const isExpired = now > lic.expiresAt;
                          const daysRemaining = Math.ceil((lic.expiresAt - now) / (1000 * 60 * 60 * 24));

                          return (
                            <tr key={lic.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              {/* Key & Student Name & Note */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900 dark:text-white text-xs select-all">
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
                                    className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Student Name */}
                                <div className="mt-1 flex items-center gap-1.5 font-bangla">
                                  <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  {editingCustomerLicId === lic.id ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={editingCustomerName}
                                        onChange={(e) => setEditingCustomerName(e.target.value)}
                                        placeholder="শিক্ষার্থীর নাম..."
                                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#080d1a] border border-emerald-500 text-slate-900 dark:text-white text-xs w-32 focus:outline-none"
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
                                        className="p-1 rounded-md bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                                        title="বাতিল"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 group">
                                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                        {lic.customerName ? (
                                          lic.customerName
                                        ) : (
                                          <span className="text-slate-400 dark:text-slate-500 italic font-normal">নাম দেওয়া হয়নি</span>
                                        )}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCustomerLicId(lic.id);
                                          setEditingCustomerName(lic.customerName || '');
                                        }}
                                        className="p-0.5 opacity-60 group-hover:opacity-100 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-opacity cursor-pointer"
                                        title="নাম সংশোধন করুন"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-bangla">{lic.customerNote || 'নোট নেই'}</p>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4">
                                {lic.status === 'revoked' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                    <XCircle className="w-3 h-3" /> Revoked
                                  </span>
                                ) : lic.status === 'suspended' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                                    <AlertTriangle className="w-3 h-3" /> Suspended
                                  </span>
                                ) : isExpired ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                                    <Clock className="w-3 h-3" /> Expired
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                    <CheckCircle className="w-3 h-3" /> Active
                                  </span>
                                )}
                              </td>

                              {/* Browser Binding */}
                              <td className="py-3 px-4">
                                {lic.browserBound ? (
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 text-teal-800 dark:text-teal-300 font-bold text-[10px] bg-teal-100 dark:bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-300 dark:border-teal-800/80">
                                        <Smartphone className="w-3 h-3 text-teal-600 dark:text-teal-400" /> Bound
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedDeviceLicense(lic)}
                                        className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-300 text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-slate-300 dark:border-slate-700"
                                      >
                                        <Globe className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" />
                                        <span>ইনফো</span>
                                      </button>
                                    </div>

                                    {lic.deviceInfo && (
                                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[140px]" title={lic.deviceInfo}>
                                        🌐 {lic.deviceInfo}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 text-[11px] italic font-bangla">
                                    Unbound (লগইন হয়নি)
                                  </span>
                                )}
                              </td>

                              {/* Learning Progress & Streak */}
                              <td className="py-3 px-4">
                                {lic.progress ? (
                                  <div className="space-y-0.5 font-bangla">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        lic.progress.learningStreak > 0 
                                          ? 'bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                                      }`}>
                                        <Flame className={`w-3 h-3 ${lic.progress.learningStreak > 0 ? 'text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400' : 'text-slate-400'}`} />
                                        <span>{lic.progress.learningStreak} দিন</span>
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() => setSelectedProgressLicense(lic)}
                                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                      >
                                        বিস্তারিত
                                      </button>
                                    </div>

                                    <div className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                      <span>📖 {lic.progress.wordsStudied || 0} পঠিত</span>
                                      <span>•</span>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">🏆 {lic.progress.wordsMastered || 0}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 text-[11px] italic font-bangla">— শুরু করেনি</span>
                                )}
                              </td>

                              {/* Expiry */}
                              <td className="py-3 px-4">
                                <p className="text-slate-800 dark:text-slate-200 font-mono">{new Date(lic.expiresAt).toLocaleDateString()}</p>
                                <p className={`text-[10px] font-semibold font-bangla ${isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {isExpired ? 'মেয়াদ শেষ' : `${daysRemaining} দিন বাকি`}
                                </p>
                              </td>

                              {/* Last Active */}
                              <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                                {lic.lastActiveAt ? new Date(lic.lastActiveAt).toLocaleDateString() : '—'}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap font-bangla">
                                  {lic.status === 'active' && daysRemaining <= 7 && !isExpired && (
                                    <button
                                      type="button"
                                      onClick={() => handleSendRenewal(lic.id)}
                                      className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/90 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-[11px] font-bold cursor-pointer"
                                    >
                                      নবায়ন
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setSelectedTimelineLicense(lic)}
                                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                                  >
                                    টাইমলাইন
                                  </button>

                                  {lic.browserBound && (
                                    <button
                                      type="button"
                                      onClick={() => handleResetBinding(lic.id, lic.keyMasked)}
                                      className="px-2 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/80 hover:bg-teal-200 dark:hover:bg-teal-900 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-[11px] font-semibold cursor-pointer"
                                    >
                                      রিসেট
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setExtendingLicense(lic)}
                                    className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold cursor-pointer"
                                  >
                                    +দিন
                                  </button>

                                  {lic.status !== 'revoked' && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(lic)}
                                      className={`px-2 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                                        lic.status === 'active'
                                          ? 'bg-orange-100 dark:bg-orange-950/60 hover:bg-orange-200 dark:hover:bg-orange-900 border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-300'
                                          : 'bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                                      }`}
                                    >
                                      {lic.status === 'active' ? 'স্থগিত' : 'সক্রিয়'}
                                    </button>
                                  )}

                                  {lic.status !== 'revoked' && (
                                    <button
                                      type="button"
                                      onClick={() => handleRevoke(lic.id, lic.keyMasked)}
                                      className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-[11px] font-semibold cursor-pointer"
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
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xs font-bangla">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>অডিট ও নিরাপত্তা লগ</span>
            </h2>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">এখনো কোনো অডিট রেকর্ড নেই।</p>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 flex items-start justify-between text-xs gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[10px] font-mono">
                          {log.action}
                        </span>
                        {log.licenseId && (
                          <span className="font-mono text-[10px] text-slate-500">
                            {log.licenseId}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BROADCAST & NOTIFICATIONS */}
        {activeTab === 'broadcast' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-bangla">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                <Megaphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>রিয়েল-টাইম নোটিফিকেশন সেন্টার: শিক্ষার্থীদের স্ক্রিনে সরাসরি নোটিশ বা অ্যালার্ট সম্প্রচার করুন।</span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>অনলাইন ক্লায়েন্ট: {connectedClients}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 font-bangla">
              {/* Form */}
              <div className="lg:col-span-7 bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>নতুন নোটিফিকেশন তৈরি করুন</span>
                </h3>

                <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
                  {/* Target Audience */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      প্রাপক (Audience)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBroadcastTargetMode('all');
                          setBroadcastTargetKey('');
                        }}
                        className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          broadcastTargetMode === 'all'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-[#080d1a] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>👥 সকল শিক্ষার্থী</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastTargetMode('specific')}
                        className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          broadcastTargetMode === 'specific'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-[#080d1a] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>🎯 নির্দিষ্ট কি</span>
                      </button>
                    </div>

                    {broadcastTargetMode === 'specific' && (
                      <div className="mt-2 space-y-1">
                        <select
                          value={broadcastTargetKey}
                          onChange={(e) => setBroadcastTargetKey(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">-- একটি লাইসেন্স সিলেক্ট করুন --</option>
                          {licenses
                            .filter((lic) => lic.status === 'active')
                            .map((lic) => (
                              <option key={lic.id} value={lic.plaintextKey || lic.keyMasked}>
                                {lic.customerName ? `[${lic.customerName}] ` : ''}
                                {lic.plaintextKey || lic.keyMasked}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Display Style */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      প্রদর্শন ধরন
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBroadcastDisplayStyle('center_modal')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          broadcastDisplayStyle === 'center_modal'
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-white ring-1 ring-emerald-500'
                            : 'bg-slate-50 dark:bg-[#080d1a] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-0.5">
                          <Bell className="w-3.5 h-3.5 text-amber-500" />
                          <span>সেন্টার পপআপ</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">স্ক্রিনের মাঝে কার্ড আকারে</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBroadcastDisplayStyle('toast')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          broadcastDisplayStyle === 'toast'
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-900 dark:text-white ring-1 ring-emerald-500'
                            : 'bg-slate-50 dark:bg-[#080d1a] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                          <span>মিনি অ্যালার্ট টোস্ট</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">স্ক্রিনের কোণায় সংক্ষিপ্ত অ্যালার্ট</p>
                      </button>
                    </div>
                  </div>

                  {/* Title & Message */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      শিরোনাম (Title)
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. নতুন আপডেট বা নোটিশ"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      বার্তা (Message)
                    </label>
                    <textarea
                      rows={3}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="বার্তা বিস্তারিত লিখুন..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingBroadcast}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/30 text-xs mt-1"
                  >
                    {isSendingBroadcast ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>নোটিফিকেশন পাঠান</span>
                  </button>
                </form>
              </div>

              {/* History */}
              <div className="lg:col-span-5 bg-white dark:bg-[#0f172a] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>পাঠানো নোটিফিকেশন</span>
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">{broadcasts.length} টি</span>
                </h3>

                {broadcasts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">কোনো নোটিফিকেশন হিস্ট্রি নেই।</p>
                ) : (
                  <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
                    {broadcasts.map((b) => (
                      <div key={b.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-start justify-between gap-1.5 mb-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs">{b.title}</h4>
                          <button
                            type="button"
                            onClick={() => handleDeleteBroadcast(b.id, b.title)}
                            title="মুছে ফেলুন"
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed mb-1.5 line-clamp-2">{b.message}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {b.targetKey ? `🎯 ${b.targetKey}` : '👥 All Students'}
                          </span>
                          <span className="font-mono">
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

      {/* MODAL: Extend Duration */}
      {extendingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl font-bangla">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">মেয়াদ বৃদ্ধি করুন</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono">{extendingLicense.keyMasked}</p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">অতিরিক্ত দিন সংখ্যা:</label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExtendDays(d)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      extendDays === d
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white'
                        : 'bg-slate-50 dark:bg-[#080d1a] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
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
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-sans"
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendingLicense(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleExtendSubmit}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  বৃদ্ধি নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT PROGRESS DETAILS */}
      {selectedProgressLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative animate-scaleUp font-bangla max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedProgressLicense(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 pr-6">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 fill-amber-500 dark:fill-amber-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {selectedProgressLicense.customerName || 'বেনামী শিক্ষার্থী'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                  {selectedProgressLicense.plaintextKey || selectedProgressLicense.keyMasked}
                </p>
              </div>
            </div>

            {/* Streak Highlight Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-amber-300 dark:border-amber-800/40 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  ধারাবাহিক স্ট্রিক (Streak)
                </span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5 font-mono">
                  <span>🔥 {selectedProgressLicense.progress?.learningStreak || 0}</span>
                  <span className="text-xs font-normal text-amber-700 dark:text-amber-300 font-bangla">দিন</span>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-mono">
                {selectedProgressLicense.progress?.lastStudyDate ? 'সক্রিয়' : 'নতুন'}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">মোট পঠিত</span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-0.5 block font-mono">
                  📖 {selectedProgressLicense.progress?.wordsStudied || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">অনুশীলন</span>
                <span className="text-base font-bold text-teal-700 dark:text-teal-300 mt-0.5 block font-mono">
                  ⚡ {selectedProgressLicense.progress?.wordsPracticed || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">আয়ত্তকৃত</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5 block font-mono">
                  🏆 {selectedProgressLicense.progress?.wordsMastered || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">রিভিশন প্রয়োজন</span>
                <span className="text-base font-bold text-rose-700 dark:text-rose-300 mt-0.5 block font-mono">
                  🔄 {selectedProgressLicense.progress?.needsRevisionCount || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">পছন্দের শব্দ</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-300 mt-0.5 block font-mono">
                  ⭐ {selectedProgressLicense.progress?.favoritesCount || 0}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">কুইজ টেস্ট</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block font-mono">
                  📝 {selectedProgressLicense.progress?.quizzesTaken || 0}
                </span>
              </div>
            </div>

            {/* Quiz Accuracy Bar */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>কুইজ একুরেসি হার</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                  {selectedProgressLicense.progress?.quizAccuracy ?? 0}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${Math.min(100, Math.max(0, selectedProgressLicense.progress?.quizAccuracy || 0))}%` }}
                />
              </div>
            </div>

            {/* Activity Heatmap */}
            <ActivityHeatmap
              studyHistory={selectedProgressLicense.progress?.studyHistory}
              totalWordsStudied={selectedProgressLicense.progress?.wordsStudied}
              streak={selectedProgressLicense.progress?.learningStreak}
            />

            <button
              type="button"
              onClick={() => setSelectedProgressLicense(null)}
              className="mt-3 w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* MODAL: DEVICE TELEMETRY */}
      {selectedDeviceLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative animate-scaleUp font-bangla max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedDeviceLicense(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4 pr-6">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-300 dark:border-teal-500/30 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">ডিভাইস ও আইপি তথ্য</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                  {selectedDeviceLicense.customerName || 'বেনামী'} • {selectedDeviceLicense.keyMasked}
                </p>
              </div>
            </div>

            {/* IP Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#080d1a] border border-teal-200 dark:border-teal-800/40 mb-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>ক্লায়েন্ট আইপি (Client IP)</span>
                </span>
                <p className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-0.5 select-all">
                  {selectedDeviceLicense.browserMetadata?.ip || selectedDeviceLicense.clientIp || '127.0.0.1'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const ip = selectedDeviceLicense.browserMetadata?.ip || selectedDeviceLicense.clientIp || '';
                  if (ip) {
                    navigator.clipboard.writeText(ip);
                    setActionMessage({ type: 'success', text: `আইপি কপি করা হয়েছে (${ip})` });
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold cursor-pointer"
              >
                কপি
              </button>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">ব্রাউজার</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold mt-0.5 block truncate">
                  {selectedDeviceLicense.browserMetadata?.browserName || selectedDeviceLicense.deviceInfo || 'Chrome'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">অপারেটিং সিস্টেম</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold mt-0.5 block truncate">
                  {selectedDeviceLicense.browserMetadata?.osName || 'Modern OS'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">স্ক্রিন রেজোলিউশন</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">
                  {selectedDeviceLicense.browserMetadata?.screenResolution || 'Responsive'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080d1a] border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">টাচস্ক্রিন সুবিধা</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium mt-0.5 block">
                  {selectedDeviceLicense.browserMetadata?.touchSupport ? '✅ Touch Device' : '🖱️ Non-Touch'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDeviceLicense(null)}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ACTION TIMELINE */}
      {selectedTimelineLicense && (
        <StudentTimelineModal
          license={selectedTimelineLicense}
          onClose={() => setSelectedTimelineLicense(null)}
        />
      )}
    </div>
  );
};

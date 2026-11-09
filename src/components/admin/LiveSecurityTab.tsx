import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Terminal, 
  ShieldAlert, 
  Lock, 
  RefreshCw, 
  Shield, 
  Copy, 
  Check, 
  Cpu, 
  Clock, 
} from 'lucide-react';
import { SecurityTerminalEvent, SystemHealthMetrics } from '../../../server/types';
import { haptics } from '../../utils/haptics';

interface LiveStudent {
  licenseId: string;
  keyMasked: string;
  customerName: string;
  activeFeature: string;
  deviceInfo: string;
  clientIp: string;
  lastActiveAt: number;
  wordsStudied: number;
  quizzesTaken: number;
  streak: number;
}

interface BlacklistedIp {
  ip: string;
  reason: string;
  timestamp: number;
}

export const LiveSecurityTab: React.FC = () => {
  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([]);
  const [terminalEvents, setTerminalEvents] = useState<SecurityTerminalEvent[]>([]);
  const [blacklistedIps, setBlacklistedIps] = useState<BlacklistedIp[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics | null>(null);
  const [rateLimitStats, setRateLimitStats] = useState<any>(null);
  const [antiCopyEnabled, setAntiCopyEnabled] = useState(false);
  
  // IP Add form
  const [newIpInput, setNewIpInput] = useState('');
  const [newIpReason, setNewIpReason] = useState('ম্যানুয়াল অ্যাডমিন ব্লক');
  const [isAddingIp, setIsAddingIp] = useState(false);
  
  // Terminal filter
  const [terminalFilter, setTerminalFilter] = useState<'all' | 'danger' | 'alert' | 'warn' | 'info'>('all');
  const [copiedTerminal, setCopiedTerminal] = useState(false);
  const [isUpdatingAntiCopy, setIsUpdatingAntiCopy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadAllSecurityData = async () => {
    setIsLoading(true);
    try {
      const [liveRes, secRes, blackRes, healthRes, rateRes, antiRes] = await Promise.all([
        fetch('/api/admin/students/live', { credentials: 'include' }),
        fetch('/api/admin/security/terminal-events', { credentials: 'include' }),
        fetch('/api/admin/security/blacklist', { credentials: 'include' }),
        fetch('/api/admin/security/system-health', { credentials: 'include' }),
        fetch('/api/admin/security/rate-limits', { credentials: 'include' }),
        fetch('/api/admin/security/anti-copy', { credentials: 'include' }),
      ]);

      if (liveRes.ok) {
        const d = await liveRes.json();
        setLiveStudents(d.liveStudents || []);
      }
      if (secRes.ok) {
        const d = await secRes.json();
        setTerminalEvents(d.events || []);
      }
      if (blackRes.ok) {
        const d = await blackRes.json();
        setBlacklistedIps(d.blacklist || []);
      }
      if (healthRes.ok) {
        const d = await healthRes.json();
        setHealthMetrics(d.health || null);
      }
      if (rateRes.ok) {
        const d = await rateRes.json();
        setRateLimitStats(d.stats || null);
      }
      if (antiRes.ok) {
        const d = await antiRes.json();
        setAntiCopyEnabled(Boolean(d.antiCopyEnabled));
      }
    } catch (e) {
      console.error('Error loading security dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllSecurityData();
    const interval = setInterval(loadAllSecurityData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAntiCopy = async () => {
    haptics.tap();
    setIsUpdatingAntiCopy(true);
    try {
      const res = await fetch('/api/admin/security/anti-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: !antiCopyEnabled }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAntiCopyEnabled(data.antiCopyEnabled);
        setActionNotice(data.message);
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch {
      // Ignore
    } finally {
      setIsUpdatingAntiCopy(false);
    }
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpInput.trim()) return;
    haptics.tap();
    setIsAddingIp(true);
    try {
      const res = await fetch('/api/admin/security/blacklist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ip: newIpInput.trim(), reason: newIpReason }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setNewIpInput('');
        loadAllSecurityData();
        setActionNotice(data.message);
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch {
      // Ignore
    } finally {
      setIsAddingIp(false);
    }
  };

  const handleRemoveBlacklist = async (ip: string) => {
    haptics.tap();
    try {
      const res = await fetch('/api/admin/security/blacklist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ip }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        loadAllSecurityData();
        setActionNotice(`আইপি ${ip} সফলভাবে আনব্লক করা হয়েছে।`);
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch {
      // Ignore
    }
  };

  const filteredTerminalEvents = terminalEvents.filter((ev) => {
    if (terminalFilter === 'all') return true;
    return ev.level === terminalFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn font-bangla">
      {/* Notice Alert */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <span>{actionNotice}</span>
          <button type="button" onClick={() => setActionNotice(null)} className="text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Top Tickers: System Health, Rate Limits, Honeypot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Live Students Count */}
        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-emerald-900/40">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>অনলাইন শিক্ষার্থী</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white mt-0.5">
            {liveStudents.length} <span className="text-xs font-normal text-emerald-400 font-bangla">জন</span>
          </p>
        </div>

        {/* Server Node.js RAM */}
        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>সার্ভার RAM</span>
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">
            {healthMetrics ? `${healthMetrics.memoryUsageMb.heapUsed} MB` : '38 MB'}
          </p>
        </div>

        {/* Server Uptime */}
        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>সার্ভার আপটাইম</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
            {healthMetrics?.uptimeFormatted || '0h 15m'}
          </p>
        </div>

        {/* Brute-force Shield Meter */}
        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-amber-900/40">
          <div className="flex items-center justify-between text-[11px] text-amber-400">
            <span>ব্রুট-ফোর্স রোধ</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">
            {rateLimitStats?.blockedAttemptsCount ?? 0}
          </p>
        </div>

        {/* Honeypot Canary Traps */}
        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-rose-900/40">
          <div className="flex items-center justify-between text-[11px] text-rose-400">
            <span>হানি-পট ফাঁদ</span>
            <span>🍯</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-rose-300 mt-0.5">
            {healthMetrics?.honeypotTriggeredCount ?? 0}
          </p>
        </div>

        {/* DRM Anti-Copy Switch */}
        <div className="p-3.5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>কপিরাইট DRM</span>
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs font-bold ${antiCopyEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
              {antiCopyEnabled ? 'সক্রিয়' : 'বন্ধ'}
            </span>
            <button
              type="button"
              onClick={handleToggleAntiCopy}
              disabled={isUpdatingAntiCopy}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                antiCopyEnabled 
                  ? 'bg-rose-900/60 text-rose-200 border border-rose-700' 
                  : 'bg-emerald-900/60 text-emerald-200 border border-emerald-700'
              }`}
            >
              {antiCopyEnabled ? 'বন্ধ' : 'চালু'}
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Live Active Students Online Tracker */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>রিয়েল-টাইম একটিভ শিক্ষার্থী ট্র্যাকার</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {liveStudents.length} Online
                </span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAllSecurityData}
            className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        {liveStudents.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs bg-[#080d1a] rounded-2xl border border-slate-800">
            বর্তমানে কোনো শিক্ষার্থী অনলাইনে নেই।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080d1a] border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">শিক্ষার্থী</th>
                  <th className="py-2.5 px-3">বর্তমান সেকশন</th>
                  <th className="py-2.5 px-3">ডিভাইস ও আইপি</th>
                  <th className="py-2.5 px-3">পড়া শব্দ</th>
                  <th className="py-2.5 px-3">সর্বশেষ রেসপন্স</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {liveStudents.map((s) => (
                  <tr key={s.licenseId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                        <div>
                          <strong className="text-white text-xs block">{s.customerName}</strong>
                          <span className="text-[11px] text-slate-400 font-mono">{s.keyMasked}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 inline-flex items-center gap-1">
                        📍 {s.activeFeature}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400">
                      <div>{s.deviceInfo}</div>
                      <div className="font-mono text-slate-500">{s.clientIp}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-300 font-bold">📖 {s.wordsStudied}</span>
                      <span className="text-slate-500 mx-1">•</span>
                      <span className="text-amber-300 font-bold">📝 {s.quizzesTaken}</span>
                      {s.streak > 0 && <span className="text-orange-400 font-bold ml-1">🔥 {s.streak}</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                      {Math.max(1, Math.round((Date.now() - s.lastActiveAt) / 1000))} সে. আগে
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Row 2: Terminal Security Feed */}
      <div className="bg-[#080d1a] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-emerald-400">
                bonolota-terminal@security-feed:~$
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(['all', 'danger', 'alert', 'warn', 'info'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setTerminalFilter(lvl)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  terminalFilter === lvl 
                    ? 'bg-emerald-500 text-slate-950 shadow-xs' 
                    : 'bg-[#0f172a] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {lvl}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                const text = terminalEvents.map(e => `[${new Date(e.timestamp).toISOString()}] [${e.level.toUpperCase()}] [${e.source}] ${e.message}`).join('\n');
                navigator.clipboard.writeText(text);
                setCopiedTerminal(true);
                setTimeout(() => setCopiedTerminal(false), 2000);
              }}
              className="p-1 rounded-lg bg-[#0f172a] text-slate-300 text-xs cursor-pointer border border-slate-800"
              title="লগ কপি করুন"
            >
              {copiedTerminal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Terminal Log Box */}
        <div className="h-56 overflow-y-auto space-y-1 text-xs text-slate-300 bg-[#0f172a]/80 p-3 rounded-2xl border border-slate-800/80 font-mono">
          {filteredTerminalEvents.length === 0 ? (
            <div className="text-slate-500 py-6 text-center text-xs">
              [SYSTEM_IDLE] কোনো সিকিউরিটি থ্রেট নেই।
            </div>
          ) : (
            filteredTerminalEvents.map((ev) => {
              const levelColor = 
                ev.level === 'danger' ? 'text-rose-400 bg-rose-950/60 border-rose-800/80' :
                ev.level === 'alert' ? 'text-amber-400 bg-amber-950/60 border-amber-800/80' :
                ev.level === 'warn' ? 'text-yellow-300 bg-yellow-950/40 border-yellow-800/60' :
                'text-emerald-400 bg-emerald-950/30 border-emerald-900/40';

              return (
                <div key={ev.id} className="flex items-start gap-1.5 hover:bg-slate-800/40 p-1 rounded transition-colors text-[11px] leading-relaxed">
                  <span className="text-slate-500 text-[10px] shrink-0 font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold border uppercase shrink-0 ${levelColor}`}>
                    {ev.level}
                  </span>
                  <span className="text-teal-400 text-[10px] shrink-0 font-bold">
                    [{ev.source}]
                  </span>
                  <span className="text-slate-200 break-all">
                    {ev.message}
                    {ev.ip && <span className="text-slate-400 font-mono ml-1">ip:{ev.ip}</span>}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Row 3: IP Blacklist & Firewall Shield */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ফায়ারওয়াল আইপি ব্লক</h3>
              <p className="text-[11px] text-slate-400">ক্ষতিকর আইপি ব্যান করুন (403)</p>
            </div>
          </div>

          <form onSubmit={handleAddBlacklist} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                আইপি ঠিকানা (IP Address)
              </label>
              <input
                type="text"
                value={newIpInput}
                onChange={(e) => setNewIpInput(e.target.value)}
                placeholder="e.g. 103.145.74.22"
                className="w-full px-3 py-2 rounded-xl bg-[#080d1a] border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ব্লকের কারণ
              </label>
              <input
                type="text"
                value={newIpReason}
                onChange={(e) => setNewIpReason(e.target.value)}
                placeholder="e.g. ব্রুট-ফোর্স অ্যাটাক"
                className="w-full px-3 py-2 rounded-xl bg-[#080d1a] border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={isAddingIp || !newIpInput.trim()}
              className="w-full py-2 px-4 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>আইপি ব্লক করুন</span>
            </button>
          </form>
        </div>

        {/* Blacklisted IPs List */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-rose-400" />
              <span>ব্লক করা আইপির তালিকা ({blacklistedIps.length})</span>
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-64 pr-1">
            {blacklistedIps.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs bg-[#080d1a] rounded-2xl border border-slate-800">
                বর্তমানে কোনো আইপি ব্ল্যাকলিস্ট করা নেই।
              </div>
            ) : (
              blacklistedIps.map((item) => (
                <div
                  key={item.ip}
                  className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-rose-400 block">{item.ip}</span>
                    <span className="text-[11px] text-slate-400">{item.reason}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveBlacklist(item.ip)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer shrink-0"
                  >
                    আনব্লক
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

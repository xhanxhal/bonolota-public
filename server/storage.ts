import { Redis } from '@upstash/redis';
import { 
  LicenseRecord, 
  UserSessionData, 
  AdminSessionData, 
  AuditLogEntry, 
  AdminOverviewStats, 
  BroadcastAnnouncement,
  SupportTicket,
  SupportMessage,
  StudentActionEvent,
  SecurityTerminalEvent,
  SecurityConfig
} from './types';

import { DEFAULT_REDIS_URL, DEFAULT_REDIS_TOKEN } from './env-validator';
import { isLoopbackIp } from './security';

function normalizeTicketMessages(ticket: SupportTicket): SupportTicket {
  if (!Array.isArray(ticket.messages) || ticket.messages.length === 0) {
    const list: SupportMessage[] = [];
    if (ticket.message) {
      list.push({
        id: `msg_init_${ticket.id}`,
        sender: 'customer',
        senderName: ticket.customerName || 'শিক্ষার্থী',
        text: ticket.message,
        timestamp: ticket.createdAt || Date.now(),
      });
    }
    if (ticket.adminReply) {
      list.push({
        id: `msg_reply_${ticket.id}`,
        sender: 'admin',
        senderName: 'Bonolota Support',
        text: ticket.adminReply,
        timestamp: ticket.repliedAt || ticket.updatedAt || Date.now(),
      });
    }
    ticket.messages = list;
  }
  return ticket;
}

// Upstash Redis configuration for bonolota-db
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || DEFAULT_REDIS_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || DEFAULT_REDIS_TOKEN;

const isUpstashConfigured = Boolean(upstashUrl && upstashToken && upstashUrl.startsWith('http'));

// In-memory fallback storage for local development/testing before Upstash credentials are added
class InMemoryStorage {
  private licenses = new Map<string, LicenseRecord>();
  private hashToId = new Map<string, string>();
  private userSessions = new Map<string, { data: UserSessionData; expiresAt: number }>();
  private adminSessions = new Map<string, { data: AdminSessionData; expiresAt: number }>();
  private auditLogs: AuditLogEntry[] = [];
  private rateLimits = new Map<string, { count: number; expiresAt: number }>();
  private announcements = new Map<string, BroadcastAnnouncement>();

  // Security & Feature extensions
  private ipBlacklist = new Set<string>();
  private blacklistMeta = new Map<string, { reason: string; timestamp: number }>();
  private securityEvents: SecurityTerminalEvent[] = [];
  private supportTickets = new Map<string, SupportTicket>();
  private studentActions: StudentActionEvent[] = [];
  private securityConfig: SecurityConfig = {
    antiCopyEnabled: false,
    ipBlacklist: [],
    honeypotCount: 0,
    telegram: {
      enabled: true,
      botToken: '9095057691:AAF0QUtiS1JCtpzETygCbqno-PgMdThPoiE',
      chatId: '6745501942',
    },
  };
  private adminPasswordHash: string | null = null;
  private failedAuthStats = {
    failedActivationsCount: 0,
    failedAdminLoginsCount: 0,
    blockedAttemptsCount: 0,
    lastAttackTimestamp: 0,
  };

  async createLicense(license: LicenseRecord): Promise<void> {
    this.licenses.set(license.id, { ...license });
    this.hashToId.set(license.keyHash, license.id);
  }

  async getLicenseByHash(keyHash: string): Promise<LicenseRecord | null> {
    const id = this.hashToId.get(keyHash);
    if (!id) return null;
    const lic = this.licenses.get(id);
    return lic ? { ...lic } : null;
  }

  async getLicenseById(id: string): Promise<LicenseRecord | null> {
    const lic = this.licenses.get(id);
    return lic ? { ...lic } : null;
  }

  async updateLicense(id: string, updates: Partial<LicenseRecord>): Promise<LicenseRecord | null> {
    const existing = this.licenses.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.licenses.set(id, updated);
    return { ...updated };
  }

  async deleteLicense(id: string): Promise<boolean> {
    const existing = this.licenses.get(id);
    if (!existing) return false;
    this.hashToId.delete(existing.keyHash);
    this.licenses.delete(id);
    return true;
  }

  async listLicenses(): Promise<LicenseRecord[]> {
    return Array.from(this.licenses.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveUserSession(sessionHash: string, data: UserSessionData, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.userSessions.set(sessionHash, { data: { ...data }, expiresAt });
  }

  async getUserSession(sessionHash: string): Promise<UserSessionData | null> {
    const item = this.userSessions.get(sessionHash);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.userSessions.delete(sessionHash);
      return null;
    }
    return { ...item.data };
  }

  async deleteUserSession(sessionHash: string): Promise<void> {
    this.userSessions.delete(sessionHash);
  }

  async saveAdminSession(sessionHash: string, data: AdminSessionData, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.adminSessions.set(sessionHash, { data: { ...data }, expiresAt });
  }

  async getAdminSession(sessionHash: string): Promise<AdminSessionData | null> {
    const item = this.adminSessions.get(sessionHash);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.adminSessions.delete(sessionHash);
      return null;
    }
    return { ...item.data };
  }

  async deleteAdminSession(sessionHash: string): Promise<void> {
    this.adminSessions.delete(sessionHash);
  }

  async addAuditLog(entry: AuditLogEntry): Promise<void> {
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
  }

  async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    return this.auditLogs.slice(0, limit);
  }

  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const item = this.rateLimits.get(key);
    if (!item || now > item.expiresAt) {
      this.rateLimits.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: limit - 1 };
    }
    if (item.count >= limit) {
      return { allowed: false, remaining: 0 };
    }
    item.count++;
    return { allowed: true, remaining: limit - item.count };
  }

  async createAnnouncement(announcement: BroadcastAnnouncement): Promise<void> {
    this.announcements.set(announcement.id, { ...announcement });
  }

  async getAnnouncementById(id: string): Promise<BroadcastAnnouncement | null> {
    const item = this.announcements.get(id);
    return item ? { ...item } : null;
  }

  async listAnnouncements(includeInactive = false): Promise<BroadcastAnnouncement[]> {
    const all = Array.from(this.announcements.values());
    const filtered = includeInactive ? all : all.filter(a => a.active);
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    return this.announcements.delete(id);
  }

  async toggleAnnouncement(id: string, active: boolean): Promise<BroadcastAnnouncement | null> {
    const item = this.announcements.get(id);
    if (!item) return null;
    item.active = active;
    this.announcements.set(id, { ...item });
    return { ...item };
  }

  // Security Config
  async getSecurityConfig(): Promise<SecurityConfig> {
    return {
      ...this.securityConfig,
      ipBlacklist: Array.from(this.ipBlacklist),
    };
  }

  async updateSecurityConfig(partial: Partial<SecurityConfig>): Promise<SecurityConfig> {
    this.securityConfig = {
      ...this.securityConfig,
      ...partial,
      telegram: {
        ...this.securityConfig.telegram,
        ...(partial.telegram || {}),
      },
    };
    if (partial.ipBlacklist) {
      this.ipBlacklist = new Set(partial.ipBlacklist);
    }
    return this.getSecurityConfig();
  }

  // IP Blacklist & Firewall
  async getBlacklistedIps(): Promise<Array<{ ip: string; reason: string; timestamp: number }>> {
    const result: Array<{ ip: string; reason: string; timestamp: number }> = [];
    for (const ip of this.ipBlacklist) {
      const meta = this.blacklistMeta.get(ip) || { reason: 'অ্যাডমিন দ্বারা ব্লক করা', timestamp: Date.now() };
      result.push({ ip, reason: meta.reason, timestamp: meta.timestamp });
    }
    return result;
  }

  async isIpBlacklisted(ip: string): Promise<boolean> {
    if (!ip) return false;
    const cleanIp = ip.trim();
    if (isLoopbackIp(cleanIp)) return false;
    return this.ipBlacklist.has(cleanIp) || this.ipBlacklist.has(cleanIp.replace(/^::ffff:/, ''));
  }

  async addBlacklistedIp(ip: string, reason = 'ম্যানুয়াল ব্লক'): Promise<void> {
    const cleanIp = ip.trim();
    if (isLoopbackIp(cleanIp)) {
      console.warn(`[Security] Block ignored for loopback/internal IP: ${cleanIp}`);
      return;
    }
    this.ipBlacklist.add(cleanIp);
    this.blacklistMeta.set(cleanIp, { reason, timestamp: Date.now() });
    this.securityConfig.ipBlacklist = Array.from(this.ipBlacklist);
  }

  async removeBlacklistedIp(ip: string): Promise<boolean> {
    const cleanIp = ip.trim();
    const removed = this.ipBlacklist.delete(cleanIp);
    this.blacklistMeta.delete(cleanIp);
    this.securityConfig.ipBlacklist = Array.from(this.ipBlacklist);
    return removed;
  }

  // Security Terminal Stream
  async addSecurityEvent(event: Omit<SecurityTerminalEvent, 'id' | 'timestamp'>): Promise<SecurityTerminalEvent> {
    const fullEvent: SecurityTerminalEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.securityEvents.unshift(fullEvent);
    if (this.securityEvents.length > 200) {
      this.securityEvents = this.securityEvents.slice(0, 200);
    }
    return fullEvent;
  }

  async getSecurityEvents(limit = 100): Promise<SecurityTerminalEvent[]> {
    return this.securityEvents.slice(0, limit);
  }

  // Support Tickets & 1:1 Chat
  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<SupportTicket> {
    const id = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = Date.now();
    const initialMessage: SupportMessage = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'customer',
      senderName: ticket.customerName || 'শিক্ষার্থী',
      text: ticket.message,
      timestamp: now,
    };
    const fullTicket: SupportTicket = {
      ...ticket,
      id,
      messages: ticket.messages && ticket.messages.length > 0 ? ticket.messages : [initialMessage],
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    this.supportTickets.set(fullTicket.id, fullTicket);
    return fullTicket;
  }

  async listSupportTickets(): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values())
      .map(t => normalizeTicketMessages(t))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getSupportTicketById(id: string): Promise<SupportTicket | null> {
    const t = this.supportTickets.get(id);
    return t ? normalizeTicketMessages(t) : null;
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | null> {
    const existing = this.supportTickets.get(id);
    if (!existing) return null;
    const normalized = normalizeTicketMessages(existing);
    const updated: SupportTicket = {
      ...normalized,
      ...updates,
      updatedAt: Date.now(),
    };
    this.supportTickets.set(id, updated);
    return updated;
  }

  async deleteSupportTicket(id: string): Promise<boolean> {
    return this.supportTickets.delete(id);
  }

  async deleteSupportMessage(ticketId: string, messageId: string): Promise<SupportTicket | null> {
    const existing = this.supportTickets.get(ticketId);
    if (!existing) return null;
    const normalized = normalizeTicketMessages(existing);
    normalized.messages = normalized.messages.filter(m => m.id !== messageId);
    normalized.updatedAt = Date.now();
    this.supportTickets.set(ticketId, normalized);
    return normalized;
  }

  async listSupportTicketsByLicense(licenseId: string): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values())
      .filter(t => t.licenseId === licenseId)
      .map(t => normalizeTicketMessages(t))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Student Actions Timeline
  async addStudentAction(action: Omit<StudentActionEvent, 'id' | 'timestamp'>): Promise<StudentActionEvent> {
    const fullAction: StudentActionEvent = {
      ...action,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.studentActions.unshift(fullAction);
    if (this.studentActions.length > 1000) {
      this.studentActions = this.studentActions.slice(0, 1000);
    }
    return fullAction;
  }

  async getStudentActions(licenseId?: string, limit = 100): Promise<StudentActionEvent[]> {
    if (!licenseId) {
      return this.studentActions.slice(0, limit);
    }
    return this.studentActions.filter(a => a.licenseId === licenseId).slice(0, limit);
  }

  // Admin Password Management
  async getAdminPasswordHash(): Promise<string | null> {
    return this.adminPasswordHash;
  }

  async setAdminPasswordHash(hash: string): Promise<void> {
    this.adminPasswordHash = hash;
  }

  // Attack Stats / Rate Limit Meter
  async recordFailedActivation(): Promise<void> {
    this.failedAuthStats.failedActivationsCount++;
    this.failedAuthStats.lastAttackTimestamp = Date.now();
  }

  async recordFailedAdminLogin(): Promise<void> {
    this.failedAuthStats.failedAdminLoginsCount++;
    this.failedAuthStats.lastAttackTimestamp = Date.now();
  }

  async recordBlockedFirewallAttempt(): Promise<void> {
    this.failedAuthStats.blockedAttemptsCount++;
    this.failedAuthStats.lastAttackTimestamp = Date.now();
  }

  async getFailedAuthStats() {
    return { ...this.failedAuthStats };
  }

  // Database Backup & Restore
  async getFullBackupData() {
    return {
      version: '1.0',
      exportedAt: Date.now(),
      licenses: Array.from(this.licenses.values()),
      auditLogs: this.auditLogs,
      announcements: Array.from(this.announcements.values()),
      supportTickets: Array.from(this.supportTickets.values()),
      blacklistedIps: await this.getBlacklistedIps(),
      securityEvents: this.securityEvents.slice(0, 100),
      securityConfig: this.securityConfig,
      adminPasswordHash: this.adminPasswordHash,
    };
  }

  async restoreFullBackupData(data: any): Promise<{ restoredLicenses: number; restoredTickets: number }> {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup data format.');
    }

    let restoredLicenses = 0;
    if (Array.isArray(data.licenses)) {
      for (const lic of data.licenses) {
        if (lic?.id && lic?.keyHash) {
          this.licenses.set(lic.id, lic);
          this.hashToId.set(lic.keyHash, lic.id);
          restoredLicenses++;
        }
      }
    }

    if (Array.isArray(data.auditLogs)) {
      this.auditLogs = [...data.auditLogs, ...this.auditLogs].slice(0, 500);
    }

    if (Array.isArray(data.announcements)) {
      for (const anno of data.announcements) {
        if (anno?.id) {
          this.announcements.set(anno.id, anno);
        }
      }
    }

    let restoredTickets = 0;
    if (Array.isArray(data.supportTickets)) {
      for (const tkt of data.supportTickets) {
        if (tkt?.id) {
          this.supportTickets.set(tkt.id, tkt);
          restoredTickets++;
        }
      }
    }

    if (Array.isArray(data.blacklistedIps)) {
      for (const item of data.blacklistedIps) {
        if (item?.ip) {
          this.ipBlacklist.add(item.ip);
          this.blacklistMeta.set(item.ip, { reason: item.reason || 'Restored', timestamp: item.timestamp || Date.now() });
        }
      }
    }

    if (data.securityConfig) {
      this.securityConfig = { ...this.securityConfig, ...data.securityConfig };
    }

    if (data.adminPasswordHash) {
      this.adminPasswordHash = data.adminPasswordHash;
    }

    return { restoredLicenses, restoredTickets };
  }
}

// Upstash Redis storage implementation with persistent support
class UpstashStorage {
  private redis: Redis;

  constructor(url: string, token: string) {
    this.redis = new Redis({
      url,
      token,
    });
  }

  async createLicense(license: LicenseRecord): Promise<void> {
    if (!license.id) {
      license.id = `lic_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    const pipeline = this.redis.pipeline();
    pipeline.set(`lic:${license.id}`, JSON.stringify(license));
    pipeline.set(`lichash:${license.keyHash}`, license.id);
    pipeline.sadd('lic:all_ids', license.id);
    await pipeline.exec();
  }

  async getLicenseByHash(keyHash: string): Promise<LicenseRecord | null> {
    const id = await this.redis.get<string>(`lichash:${keyHash}`);
    if (!id) return null;
    return this.getLicenseById(id);
  }

  async getLicenseById(id: string): Promise<LicenseRecord | null> {
    const raw = await this.redis.get<string | LicenseRecord>(`lic:${id}`);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  async updateLicense(id: string, updates: Partial<LicenseRecord>): Promise<LicenseRecord | null> {
    const existing = await this.getLicenseById(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    const pipeline = this.redis.pipeline();
    pipeline.set(`lic:${id}`, JSON.stringify(updated));
    if (updates.keyHash && updates.keyHash !== existing.keyHash) {
      pipeline.set(`lichash:${updates.keyHash}`, id);
    }
    await pipeline.exec();
    return updated;
  }

  async deleteLicense(id: string): Promise<boolean> {
    const existing = await this.getLicenseById(id);
    if (!existing) return false;
    const pipeline = this.redis.pipeline();
    pipeline.del(`lic:${id}`);
    pipeline.del(`lichash:${existing.keyHash}`);
    pipeline.srem('lic:all_ids', id);
    await pipeline.exec();
    return true;
  }

  async listLicenses(): Promise<LicenseRecord[]> {
    const ids = await this.redis.smembers('lic:all_ids');
    if (!ids || ids.length === 0) return [];
    
    const keys = ids.map(id => `lic:${id}`);
    const results: LicenseRecord[] = [];
    
    if (keys.length > 0) {
      const records = await this.redis.mget<Array<string | LicenseRecord>>(...keys);
      for (const item of records) {
        if (item) {
          try {
            const parsed = typeof item === 'string' ? JSON.parse(item) : item;
            results.push(parsed);
          } catch {
            // ignore malformed
          }
        }
      }
    }
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveUserSession(sessionHash: string, data: UserSessionData, ttlSeconds: number): Promise<void> {
    await this.redis.set(`sess:user:${sessionHash}`, JSON.stringify(data), { ex: ttlSeconds });
  }

  async getUserSession(sessionHash: string): Promise<UserSessionData | null> {
    const raw = await this.redis.get<string | UserSessionData>(`sess:user:${sessionHash}`);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  async deleteUserSession(sessionHash: string): Promise<void> {
    await this.redis.del(`sess:user:${sessionHash}`);
  }

  async saveAdminSession(sessionHash: string, data: AdminSessionData, ttlSeconds: number): Promise<void> {
    await this.redis.set(`sess:admin:${sessionHash}`, JSON.stringify(data), { ex: ttlSeconds });
  }

  async getAdminSession(sessionHash: string): Promise<AdminSessionData | null> {
    const raw = await this.redis.get<string | AdminSessionData>(`sess:admin:${sessionHash}`);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  async deleteAdminSession(sessionHash: string): Promise<void> {
    await this.redis.del(`sess:admin:${sessionHash}`);
  }

  async addAuditLog(entry: AuditLogEntry): Promise<void> {
    await this.redis.lpush('audit:logs', JSON.stringify(entry));
    await this.redis.ltrim('audit:logs', 0, 500);
  }

  async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    const rawList = await this.redis.lrange('audit:logs', 0, limit - 1);
    if (!rawList) return [];
    return rawList.map(item => (typeof item === 'string' ? JSON.parse(item) : item));
  }

  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const rateKey = `ratelimit:${key}`;
    const count = await this.redis.incr(rateKey);
    if (count === 1) {
      await this.redis.expire(rateKey, windowSeconds);
    }
    if (count > limit) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: limit - count };
  }

  async createAnnouncement(announcement: BroadcastAnnouncement): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.set(`anno:${announcement.id}`, JSON.stringify(announcement));
    pipeline.sadd('anno:all_ids', announcement.id);
    await pipeline.exec();
  }

  async getAnnouncementById(id: string): Promise<BroadcastAnnouncement | null> {
    const raw = await this.redis.get<string | BroadcastAnnouncement>(`anno:${id}`);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  async listAnnouncements(includeInactive = false): Promise<BroadcastAnnouncement[]> {
    const ids = await this.redis.smembers('anno:all_ids');
    if (!ids || ids.length === 0) return [];
    const keys = ids.map(id => `anno:${id}`);
    const records = await this.redis.mget<Array<string | BroadcastAnnouncement>>(...keys);
    const results: BroadcastAnnouncement[] = [];
    for (const item of records) {
      if (item) {
        try {
          const parsed = typeof item === 'string' ? JSON.parse(item) : item;
          if (includeInactive || parsed.active) {
            results.push(parsed);
          }
        } catch {
          // ignore malformed
        }
      }
    }
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const pipeline = this.redis.pipeline();
    pipeline.del(`anno:${id}`);
    pipeline.srem('anno:all_ids', id);
    await pipeline.exec();
    return true;
  }

  async toggleAnnouncement(id: string, active: boolean): Promise<BroadcastAnnouncement | null> {
    const item = await this.getAnnouncementById(id);
    if (!item) return null;
    item.active = active;
    await this.redis.set(`anno:${id}`, JSON.stringify(item));
    return item;
  }

  // Security Config
  async getSecurityConfig(): Promise<SecurityConfig> {
    const raw = await this.redis.get<string | SecurityConfig>('sec:config');
    if (!raw) {
      return {
        antiCopyEnabled: false,
        ipBlacklist: [],
        honeypotCount: 0,
        telegram: {
          enabled: true,
          botToken: '9095057691:AAF0QUtiS1JCtpzETygCbqno-PgMdThPoiE',
          chatId: '6745501942',
        },
      };
    }
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  }

  async updateSecurityConfig(partial: Partial<SecurityConfig>): Promise<SecurityConfig> {
    const current = await this.getSecurityConfig();
    const updated: SecurityConfig = {
      ...current,
      ...partial,
      telegram: {
        ...current.telegram,
        ...(partial.telegram || {}),
      },
    };
    await this.redis.set('sec:config', JSON.stringify(updated));
    return updated;
  }

  // Blacklist
  async getBlacklistedIps(): Promise<Array<{ ip: string; reason: string; timestamp: number }>> {
    const ips = await this.redis.smembers('ip:blacklist');
    if (!ips || ips.length === 0) return [];
    const keys = ips.map(ip => `ip:meta:${ip}`);
    const metas = await this.redis.mget<Array<string | { reason: string; timestamp: number }>>(...keys);
    const results: Array<{ ip: string; reason: string; timestamp: number }> = [];
    for (let i = 0; i < ips.length; i++) {
      const ip = ips[i];
      const m = metas[i];
      const parsed = m ? (typeof m === 'string' ? JSON.parse(m) : m) : { reason: 'ব্লক করা আইপি', timestamp: Date.now() };
      results.push({ ip, reason: parsed.reason, timestamp: parsed.timestamp });
    }
    return results;
  }

  async isIpBlacklisted(ip: string): Promise<boolean> {
    if (!ip) return false;
    const clean = ip.trim().replace(/^::ffff:/, '');
    if (isLoopbackIp(clean)) return false;
    const isMember = await this.redis.sismember('ip:blacklist', clean);
    return Boolean(isMember);
  }

  async addBlacklistedIp(ip: string, reason = 'ম্যানুয়াল ব্লক'): Promise<void> {
    const clean = ip.trim().replace(/^::ffff:/, '');
    if (isLoopbackIp(clean)) {
      console.warn(`[Security] Block ignored for loopback/internal IP: ${clean}`);
      return;
    }
    const pipeline = this.redis.pipeline();
    pipeline.sadd('ip:blacklist', clean);
    pipeline.set(`ip:meta:${clean}`, JSON.stringify({ reason, timestamp: Date.now() }));
    await pipeline.exec();
  }

  async removeBlacklistedIp(ip: string): Promise<boolean> {
    const clean = ip.trim().replace(/^::ffff:/, '');
    const pipeline = this.redis.pipeline();
    pipeline.srem('ip:blacklist', clean);
    pipeline.del(`ip:meta:${clean}`);
    await pipeline.exec();
    return true;
  }

  // Security Events Stream
  async addSecurityEvent(event: Omit<SecurityTerminalEvent, 'id' | 'timestamp'>): Promise<SecurityTerminalEvent> {
    const fullEvent: SecurityTerminalEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    await this.redis.lpush('sec:events', JSON.stringify(fullEvent));
    await this.redis.ltrim('sec:events', 0, 200);
    return fullEvent;
  }

  async getSecurityEvents(limit = 100): Promise<SecurityTerminalEvent[]> {
    const raw = await this.redis.lrange('sec:events', 0, limit - 1);
    if (!raw) return [];
    return raw.map(item => (typeof item === 'string' ? JSON.parse(item) : item));
  }

  // Support Tickets & 1:1 Chat
  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<SupportTicket> {
    const id = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = Date.now();
    const initialMessage: SupportMessage = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'customer',
      senderName: ticket.customerName || 'শিক্ষার্থী',
      text: ticket.message,
      timestamp: now,
    };
    const fullTicket: SupportTicket = {
      ...ticket,
      id,
      messages: ticket.messages && ticket.messages.length > 0 ? ticket.messages : [initialMessage],
      status: 'open',
      createdAt: now,
      updatedAt: now,
    };
    const pipeline = this.redis.pipeline();
    pipeline.set(`support:tkt:${id}`, JSON.stringify(fullTicket));
    pipeline.sadd('support:all_ids', id);
    pipeline.sadd(`support:lic:${ticket.licenseId}`, id);
    await pipeline.exec();
    return fullTicket;
  }

  async listSupportTickets(): Promise<SupportTicket[]> {
    const ids = await this.redis.smembers('support:all_ids');
    if (!ids || ids.length === 0) return [];
    const keys = ids.map(id => `support:tkt:${id}`);
    const records = await this.redis.mget<Array<string | SupportTicket>>(...keys);
    const results: SupportTicket[] = [];
    for (const r of records) {
      if (r) {
        try {
          const parsed = typeof r === 'string' ? JSON.parse(r) : r;
          results.push(normalizeTicketMessages(parsed));
        } catch {}
      }
    }
    return results.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async getSupportTicketById(id: string): Promise<SupportTicket | null> {
    const raw = await this.redis.get<string | SupportTicket>(`support:tkt:${id}`);
    if (!raw) return null;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return normalizeTicketMessages(parsed);
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | null> {
    const existing = await this.getSupportTicketById(id);
    if (!existing) return null;
    const normalized = normalizeTicketMessages(existing);
    const updated: SupportTicket = {
      ...normalized,
      ...updates,
      updatedAt: Date.now(),
    };
    await this.redis.set(`support:tkt:${id}`, JSON.stringify(updated));
    return updated;
  }

  async deleteSupportTicket(id: string): Promise<boolean> {
    const ticket = await this.getSupportTicketById(id);
    if (!ticket) return false;
    const pipeline = this.redis.pipeline();
    pipeline.del(`support:tkt:${id}`);
    pipeline.srem('support:all_ids', id);
    pipeline.srem(`support:lic:${ticket.licenseId}`, id);
    await pipeline.exec();
    return true;
  }

  async deleteSupportMessage(ticketId: string, messageId: string): Promise<SupportTicket | null> {
    const ticket = await this.getSupportTicketById(ticketId);
    if (!ticket) return null;
    const normalized = normalizeTicketMessages(ticket);
    normalized.messages = normalized.messages.filter(m => m.id !== messageId);
    normalized.updatedAt = Date.now();
    await this.redis.set(`support:tkt:${ticketId}`, JSON.stringify(normalized));
    return normalized;
  }

  async listSupportTicketsByLicense(licenseId: string): Promise<SupportTicket[]> {
    const ids = await this.redis.smembers(`support:lic:${licenseId}`);
    if (!ids || ids.length === 0) return [];
    const keys = ids.map(id => `support:tkt:${id}`);
    const records = await this.redis.mget<Array<string | SupportTicket>>(...keys);
    const results: SupportTicket[] = [];
    for (const r of records) {
      if (r) {
        try {
          const parsed = typeof r === 'string' ? JSON.parse(r) : r;
          results.push(normalizeTicketMessages(parsed));
        } catch {}
      }
    }
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Student Actions
  async addStudentAction(action: Omit<StudentActionEvent, 'id' | 'timestamp'>): Promise<StudentActionEvent> {
    const fullAction: StudentActionEvent = {
      ...action,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    await this.redis.lpush('student:actions', JSON.stringify(fullAction));
    await this.redis.ltrim('student:actions', 0, 1000);
    return fullAction;
  }

  async getStudentActions(licenseId?: string, limit = 100): Promise<StudentActionEvent[]> {
    const raw = await this.redis.lrange('student:actions', 0, 499);
    if (!raw) return [];
    const list: StudentActionEvent[] = raw.map(item => (typeof item === 'string' ? JSON.parse(item) : item));
    if (!licenseId) {
      return list.slice(0, limit);
    }
    return list.filter(a => a.licenseId === licenseId).slice(0, limit);
  }

  // Admin Password Management
  async getAdminPasswordHash(): Promise<string | null> {
    return await this.redis.get<string>('admin:password_hash');
  }

  async setAdminPasswordHash(hash: string): Promise<void> {
    await this.redis.set('admin:password_hash', hash);
  }

  // Failed Auth Stats
  async recordFailedActivation(): Promise<void> {
    await this.redis.incr('stats:failed_activations');
    await this.redis.set('stats:last_attack_time', Date.now().toString());
  }

  async recordFailedAdminLogin(): Promise<void> {
    await this.redis.incr('stats:failed_admin_logins');
    await this.redis.set('stats:last_attack_time', Date.now().toString());
  }

  async recordBlockedFirewallAttempt(): Promise<void> {
    await this.redis.incr('stats:blocked_attempts');
    await this.redis.set('stats:last_attack_time', Date.now().toString());
  }

  async getFailedAuthStats() {
    const [fa, fal, ba, lat] = await Promise.all([
      this.redis.get<number | string>('stats:failed_activations'),
      this.redis.get<number | string>('stats:failed_admin_logins'),
      this.redis.get<number | string>('stats:blocked_attempts'),
      this.redis.get<number | string>('stats:last_attack_time'),
    ]);
    return {
      failedActivationsCount: Number(fa || 0),
      failedAdminLoginsCount: Number(fal || 0),
      blockedAttemptsCount: Number(ba || 0),
      lastAttackTimestamp: Number(lat || 0),
    };
  }

  // Ping Redis to test connection latency
  async ping(): Promise<number> {
    const start = Date.now();
    await this.redis.ping();
    return Date.now() - start;
  }
}

// Storage Singleton Dispatcher
const inMemoryInstance = new InMemoryStorage();
let upstashInstance: UpstashStorage | null = null;

if (isUpstashConfigured) {
  try {
    upstashInstance = new UpstashStorage(upstashUrl!, upstashToken!);
    console.log('[Storage] Connected to Upstash Redis persistent database.');
  } catch (err) {
    console.error('[Storage] Failed to initialize Upstash Redis, using memory fallback:', err);
  }
} else {
  console.warn('[Storage] UPSTASH_REDIS_REST_URL not configured. Operating in local in-memory mode.');
}

export const storage = {
  isPersistent: () => Boolean(upstashInstance),

  async pingRedis(): Promise<number> {
    if (upstashInstance) {
      try {
        return await upstashInstance.ping();
      } catch {
        return -1;
      }
    }
    return 1;
  },

  async createLicense(license: LicenseRecord): Promise<void> {
    try {
      if (upstashInstance) return await upstashInstance.createLicense(license);
    } catch (err) {
      console.error('[Storage Error] Upstash createLicense failed, using fallback:', err);
    }
    return inMemoryInstance.createLicense(license);
  },

  async getLicenseByHash(keyHash: string): Promise<LicenseRecord | null> {
    try {
      if (upstashInstance) return await upstashInstance.getLicenseByHash(keyHash);
    } catch (err) {
      console.error('[Storage Error] Upstash getLicenseByHash failed, using fallback:', err);
    }
    return inMemoryInstance.getLicenseByHash(keyHash);
  },

  async getLicenseById(id: string): Promise<LicenseRecord | null> {
    try {
      if (upstashInstance) return await upstashInstance.getLicenseById(id);
    } catch (err) {
      console.error('[Storage Error] Upstash getLicenseById failed, using fallback:', err);
    }
    return inMemoryInstance.getLicenseById(id);
  },

  async updateLicense(id: string, updates: Partial<LicenseRecord>): Promise<LicenseRecord | null> {
    try {
      if (upstashInstance) return await upstashInstance.updateLicense(id, updates);
    } catch (err) {
      console.error('[Storage Error] Upstash updateLicense failed, using fallback:', err);
    }
    return inMemoryInstance.updateLicense(id, updates);
  },

  async deleteLicense(id: string): Promise<boolean> {
    try {
      if (upstashInstance) return await upstashInstance.deleteLicense(id);
    } catch (err) {
      console.error('[Storage Error] Upstash deleteLicense failed, using fallback:', err);
    }
    return inMemoryInstance.deleteLicense(id);
  },

  async listLicenses(): Promise<LicenseRecord[]> {
    try {
      if (upstashInstance) return await upstashInstance.listLicenses();
    } catch (err) {
      console.error('[Storage Error] Upstash listLicenses failed, using fallback:', err);
    }
    return inMemoryInstance.listLicenses();
  },

  async saveUserSession(sessionHash: string, data: UserSessionData, ttlSeconds: number): Promise<void> {
    try {
      if (upstashInstance) return await upstashInstance.saveUserSession(sessionHash, data, ttlSeconds);
    } catch (err) {
      console.error('[Storage Error] Upstash saveUserSession failed, using fallback:', err);
    }
    return inMemoryInstance.saveUserSession(sessionHash, data, ttlSeconds);
  },

  async getUserSession(sessionHash: string): Promise<UserSessionData | null> {
    try {
      if (upstashInstance) return await upstashInstance.getUserSession(sessionHash);
    } catch (err) {
      console.error('[Storage Error] Upstash getUserSession failed, using fallback:', err);
    }
    return inMemoryInstance.getUserSession(sessionHash);
  },

  async deleteUserSession(sessionHash: string): Promise<void> {
    try {
      if (upstashInstance) return await upstashInstance.deleteUserSession(sessionHash);
    } catch (err) {
      console.error('[Storage Error] Upstash deleteUserSession failed, using fallback:', err);
    }
    return inMemoryInstance.deleteUserSession(sessionHash);
  },

  async saveAdminSession(sessionHash: string, data: AdminSessionData, ttlSeconds: number): Promise<void> {
    try {
      if (upstashInstance) return await upstashInstance.saveAdminSession(sessionHash, data, ttlSeconds);
    } catch (err) {
      console.error('[Storage Error] Upstash saveAdminSession failed, using fallback:', err);
    }
    return inMemoryInstance.saveAdminSession(sessionHash, data, ttlSeconds);
  },

  async getAdminSession(sessionHash: string): Promise<AdminSessionData | null> {
    try {
      if (upstashInstance) return await upstashInstance.getAdminSession(sessionHash);
    } catch (err) {
      console.error('[Storage Error] Upstash getAdminSession failed, using fallback:', err);
    }
    return inMemoryInstance.getAdminSession(sessionHash);
  },

  async deleteAdminSession(sessionHash: string): Promise<void> {
    try {
      if (upstashInstance) return await upstashInstance.deleteAdminSession(sessionHash);
    } catch (err) {
      console.error('[Storage Error] Upstash deleteAdminSession failed, using fallback:', err);
    }
    return inMemoryInstance.deleteAdminSession(sessionHash);
  },

  async addAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      if (upstashInstance) return await upstashInstance.addAuditLog(entry);
    } catch (err) {
      console.error('[Storage Error] Upstash addAuditLog failed, using fallback:', err);
    }
    return inMemoryInstance.addAuditLog(entry);
  },

  async getAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
    try {
      if (upstashInstance) return await upstashInstance.getAuditLogs(limit);
    } catch (err) {
      console.error('[Storage Error] Upstash getAuditLogs failed, using fallback:', err);
    }
    return inMemoryInstance.getAuditLogs(limit);
  },

  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    try {
      if (upstashInstance) return await upstashInstance.checkRateLimit(key, limit, windowSeconds);
    } catch (err) {
      console.error('[Storage Error] Upstash checkRateLimit failed, using fallback:', err);
    }
    return inMemoryInstance.checkRateLimit(key, limit, windowSeconds);
  },

  async getOverviewStats(): Promise<AdminOverviewStats> {
    const licenses = await this.listLicenses();
    const now = Date.now();

    let active = 0;
    let activated = 0;
    let unactivated = 0;
    let expired = 0;
    let suspended = 0;
    let revoked = 0;

    for (const lic of licenses) {
      if (lic.status === 'revoked') {
        revoked++;
      } else if (lic.status === 'suspended') {
        suspended++;
      } else if (now > lic.expiresAt) {
        expired++;
      } else {
        active++;
        if (lic.browserBound) {
          activated++;
        } else {
          unactivated++;
        }
      }
    }

    const recentlyActivated = licenses
      .filter(l => l.activatedAt)
      .sort((a, b) => (b.activatedAt || 0) - (a.activatedAt || 0))
      .slice(0, 10);

    return {
      total: licenses.length,
      active,
      activated,
      unactivated,
      expired,
      suspended,
      revoked,
      recentlyActivated,
      isUsingFallbackStore: !upstashInstance,
    };
  },

  async createAnnouncement(announcement: BroadcastAnnouncement): Promise<void> {
    try {
      if (upstashInstance) return await upstashInstance.createAnnouncement(announcement);
    } catch (err) {
      console.error('[Storage Error] Upstash createAnnouncement failed, using fallback:', err);
    }
    return inMemoryInstance.createAnnouncement(announcement);
  },

  async getAnnouncementById(id: string): Promise<BroadcastAnnouncement | null> {
    try {
      if (upstashInstance) return await upstashInstance.getAnnouncementById(id);
    } catch (err) {
      console.error('[Storage Error] Upstash getAnnouncementById failed, using fallback:', err);
    }
    return inMemoryInstance.getAnnouncementById(id);
  },

  async listAnnouncements(includeInactive = false): Promise<BroadcastAnnouncement[]> {
    try {
      if (upstashInstance) return await upstashInstance.listAnnouncements(includeInactive);
    } catch (err) {
      console.error('[Storage Error] Upstash listAnnouncements failed, using fallback:', err);
    }
    return inMemoryInstance.listAnnouncements(includeInactive);
  },

  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      if (upstashInstance) return await upstashInstance.deleteAnnouncement(id);
    } catch (err) {
      console.error('[Storage Error] Upstash deleteAnnouncement failed, using fallback:', err);
    }
    return inMemoryInstance.deleteAnnouncement(id);
  },

  async toggleAnnouncement(id: string, active: boolean): Promise<BroadcastAnnouncement | null> {
    try {
      if (upstashInstance) return await upstashInstance.toggleAnnouncement(id, active);
    } catch (err) {
      console.error('[Storage Error] Upstash toggleAnnouncement failed, using fallback:', err);
    }
    return inMemoryInstance.toggleAnnouncement(id, active);
  },

  // Security Config
  async getSecurityConfig(): Promise<SecurityConfig> {
    try {
      if (upstashInstance) return await upstashInstance.getSecurityConfig();
    } catch (err) {
      console.error('[Storage Error] Upstash getSecurityConfig failed:', err);
    }
    return inMemoryInstance.getSecurityConfig();
  },

  async updateSecurityConfig(partial: Partial<SecurityConfig>): Promise<SecurityConfig> {
    try {
      if (upstashInstance) return await upstashInstance.updateSecurityConfig(partial);
    } catch (err) {
      console.error('[Storage Error] Upstash updateSecurityConfig failed:', err);
    }
    return inMemoryInstance.updateSecurityConfig(partial);
  },

  // Blacklist
  async getBlacklistedIps(): Promise<Array<{ ip: string; reason: string; timestamp: number }>> {
    try {
      if (upstashInstance) return await upstashInstance.getBlacklistedIps();
    } catch (err) {
      console.error('[Storage Error] Upstash getBlacklistedIps failed:', err);
    }
    return inMemoryInstance.getBlacklistedIps();
  },

  async isIpBlacklisted(ip: string): Promise<boolean> {
    try {
      if (upstashInstance) {
        const bl = await upstashInstance.isIpBlacklisted(ip);
        if (bl) return true;
      }
    } catch (err) {
      console.error('[Storage Error] Upstash isIpBlacklisted failed:', err);
    }
    return inMemoryInstance.isIpBlacklisted(ip);
  },

  async addBlacklistedIp(ip: string, reason?: string): Promise<void> {
    try {
      if (upstashInstance) await upstashInstance.addBlacklistedIp(ip, reason);
    } catch (err) {
      console.error('[Storage Error] Upstash addBlacklistedIp failed:', err);
    }
    await inMemoryInstance.addBlacklistedIp(ip, reason);
  },

  async removeBlacklistedIp(ip: string): Promise<boolean> {
    try {
      if (upstashInstance) await upstashInstance.removeBlacklistedIp(ip);
    } catch (err) {
      console.error('[Storage Error] Upstash removeBlacklistedIp failed:', err);
    }
    return inMemoryInstance.removeBlacklistedIp(ip);
  },

  // Security Events Stream
  async addSecurityEvent(event: Omit<SecurityTerminalEvent, 'id' | 'timestamp'>): Promise<SecurityTerminalEvent> {
    try {
      if (upstashInstance) await upstashInstance.addSecurityEvent(event);
    } catch (err) {
      console.error('[Storage Error] Upstash addSecurityEvent failed:', err);
    }
    return inMemoryInstance.addSecurityEvent(event);
  },

  async getSecurityEvents(limit = 100): Promise<SecurityTerminalEvent[]> {
    try {
      if (upstashInstance) return await upstashInstance.getSecurityEvents(limit);
    } catch (err) {
      console.error('[Storage Error] Upstash getSecurityEvents failed:', err);
    }
    return inMemoryInstance.getSecurityEvents(limit);
  },

  // Support Tickets
  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<SupportTicket> {
    try {
      if (upstashInstance) return await upstashInstance.createSupportTicket(ticket);
    } catch (err) {
      console.error('[Storage Error] Upstash createSupportTicket failed:', err);
    }
    return inMemoryInstance.createSupportTicket(ticket);
  },

  async listSupportTickets(): Promise<SupportTicket[]> {
    try {
      if (upstashInstance) return await upstashInstance.listSupportTickets();
    } catch (err) {
      console.error('[Storage Error] Upstash listSupportTickets failed:', err);
    }
    return inMemoryInstance.listSupportTickets();
  },

  async getSupportTicketById(id: string): Promise<SupportTicket | null> {
    try {
      if (upstashInstance) return await upstashInstance.getSupportTicketById(id);
    } catch (err) {
      console.error('[Storage Error] Upstash getSupportTicketById failed:', err);
    }
    return inMemoryInstance.getSupportTicketById(id);
  },

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | null> {
    try {
      if (upstashInstance) return await upstashInstance.updateSupportTicket(id, updates);
    } catch (err) {
      console.error('[Storage Error] Upstash updateSupportTicket failed:', err);
    }
    return inMemoryInstance.updateSupportTicket(id, updates);
  },

  async listSupportTicketsByLicense(licenseId: string): Promise<SupportTicket[]> {
    try {
      if (upstashInstance) return await upstashInstance.listSupportTicketsByLicense(licenseId);
    } catch (err) {
      console.error('[Storage Error] Upstash listSupportTicketsByLicense failed:', err);
    }
    return inMemoryInstance.listSupportTicketsByLicense(licenseId);
  },

  async deleteSupportTicket(id: string): Promise<boolean> {
    try {
      if (upstashInstance) await upstashInstance.deleteSupportTicket(id);
    } catch (err) {
      console.error('[Storage Error] Upstash deleteSupportTicket failed:', err);
    }
    return inMemoryInstance.deleteSupportTicket(id);
  },

  async deleteSupportMessage(ticketId: string, messageId: string): Promise<SupportTicket | null> {
    try {
      if (upstashInstance) await upstashInstance.deleteSupportMessage(ticketId, messageId);
    } catch (err) {
      console.error('[Storage Error] Upstash deleteSupportMessage failed:', err);
    }
    return inMemoryInstance.deleteSupportMessage(ticketId, messageId);
  },

  // Student Actions
  async addStudentAction(action: Omit<StudentActionEvent, 'id' | 'timestamp'>): Promise<StudentActionEvent> {
    try {
      if (upstashInstance) await upstashInstance.addStudentAction(action);
    } catch (err) {
      console.error('[Storage Error] Upstash addStudentAction failed:', err);
    }
    return inMemoryInstance.addStudentAction(action);
  },

  async getStudentActions(licenseId?: string, limit = 100): Promise<StudentActionEvent[]> {
    try {
      if (upstashInstance) return await upstashInstance.getStudentActions(licenseId, limit);
    } catch (err) {
      console.error('[Storage Error] Upstash getStudentActions failed:', err);
    }
    return inMemoryInstance.getStudentActions(licenseId, limit);
  },

  // Admin Password Management
  async getAdminPasswordHash(): Promise<string | null> {
    try {
      if (upstashInstance) {
        const hash = await upstashInstance.getAdminPasswordHash();
        if (hash) return hash;
      }
    } catch (err) {
      console.error('[Storage Error] Upstash getAdminPasswordHash failed:', err);
    }
    return inMemoryInstance.getAdminPasswordHash();
  },

  async setAdminPasswordHash(hash: string): Promise<void> {
    try {
      if (upstashInstance) await upstashInstance.setAdminPasswordHash(hash);
    } catch (err) {
      console.error('[Storage Error] Upstash setAdminPasswordHash failed:', err);
    }
    await inMemoryInstance.setAdminPasswordHash(hash);
  },

  // Attack Stats / Rate Limits
  async recordFailedActivation(): Promise<void> {
    try {
      if (upstashInstance) await upstashInstance.recordFailedActivation();
    } catch {}
    await inMemoryInstance.recordFailedActivation();
  },

  async recordFailedAdminLogin(): Promise<void> {
    try {
      if (upstashInstance) await upstashInstance.recordFailedAdminLogin();
    } catch {}
    await inMemoryInstance.recordFailedAdminLogin();
  },

  async recordBlockedFirewallAttempt(): Promise<void> {
    try {
      if (upstashInstance) await upstashInstance.recordBlockedFirewallAttempt();
    } catch {}
    await inMemoryInstance.recordBlockedFirewallAttempt();
  },

  async getFailedAuthStats() {
    try {
      if (upstashInstance) return await upstashInstance.getFailedAuthStats();
    } catch {}
    return inMemoryInstance.getFailedAuthStats();
  },

  // Full Database Backup & Restore
  async getFullBackupData() {
    const licenses = await this.listLicenses();
    const auditLogs = await this.getAuditLogs(500);
    const announcements = await this.listAnnouncements(true);
    const supportTickets = await this.listSupportTickets();
    const blacklistedIps = await this.getBlacklistedIps();
    const securityEvents = await this.getSecurityEvents(100);
    const securityConfig = await this.getSecurityConfig();

    return {
      version: '1.0',
      exportedAt: Date.now(),
      licenses,
      auditLogs,
      announcements,
      supportTickets,
      blacklistedIps,
      securityEvents,
      securityConfig,
    };
  },

  async restoreFullBackupData(data: any): Promise<{ restoredLicenses: number; restoredTickets: number }> {
    return inMemoryInstance.restoreFullBackupData(data);
  },
};

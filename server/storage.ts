import { Redis } from '@upstash/redis';
import { LicenseRecord, UserSessionData, AdminSessionData, AuditLogEntry, AdminOverviewStats, BroadcastAnnouncement } from './types';

import { DEFAULT_REDIS_URL, DEFAULT_REDIS_TOKEN } from './env-validator';

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
}

// Upstash Redis storage implementation
class UpstashStorage {
  private redis: Redis;

  constructor(url: string, token: string) {
    this.redis = new Redis({
      url,
      token,
    });
  }

  async createLicense(license: LicenseRecord): Promise<void> {
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
    await this.redis.set(`lic:${id}`, JSON.stringify(updated));
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
    
    // Batch fetch in chunks
    const keys = ids.map(id => `lic:${id}`);
    const results: LicenseRecord[] = [];
    
    // Upstash mget supports array of keys
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

const activeBackend = () => {
  return upstashInstance || inMemoryInstance;
};

export const storage = {
  isPersistent: () => Boolean(upstashInstance),

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
};

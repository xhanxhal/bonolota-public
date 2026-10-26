export interface LicenseRecord {
  id: string; // e.g. "lic_1792430000_a1b2c3"
  keyMasked: string; // e.g. "BONOLOTA-7K9A-****-****"
  keyHash: string; // SHA-256 HMAC of the plaintext key
  status: 'active' | 'suspended' | 'revoked';
  createdAt: number; // Server UTC ms
  expiresAt: number; // Server UTC ms (fixed at creation time)
  durationDays: number;
  activatedAt?: number; // When first activated
  browserBound: boolean;
  currentSessionHash?: string;
  lastActiveAt?: number;
  customerNote?: string; // Optional note: buyer name, WhatsApp number, transaction ID
  deviceInfo?: string; // e.g. "Chrome (Windows)" or "Safari (iOS)"
  clientIp?: string;
}

export interface UserSessionData {
  licenseId: string;
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
  userAgent?: string;
}

export interface AdminSessionData {
  adminId: string;
  createdAt: number;
  expiresAt: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: 'create_license' | 'activate_license' | 'reset_binding' | 'suspend_license' | 'reactivate_license' | 'revoke_license' | 'extend_license' | 'admin_login' | 'admin_failed_login';
  licenseId?: string;
  details: string;
  ip?: string;
}

export interface AdminOverviewStats {
  total: number;
  active: number;
  activated: number;
  unactivated: number;
  expired: number;
  suspended: number;
  revoked: number;
  recentlyActivated: LicenseRecord[];
  isUsingFallbackStore?: boolean;
}

export interface LicenseRecord {
  id: string; // e.g. "lic_1792430000_a1b2c3"
  keyMasked: string; // e.g. "BONOLOTA-7K9A-****-****"
  plaintextKey?: string; // Full unmasked key for admin panel display & copy e.g. "BONOLOTA-7K9A-M4W2-X8P1"
  keyHash: string; // SHA-256 HMAC of the plaintext key
  status: 'active' | 'suspended' | 'revoked';
  createdAt: number; // Server UTC ms
  expiresAt: number; // Server UTC ms (fixed at creation time)
  durationDays: number;
  isLifetime?: boolean;
  activatedAt?: number; // When first activated
  browserBound: boolean;
  currentSessionHash?: string;
  lastActiveAt?: number;
  customerName?: string; // Buyer/Student name e.g. "Arifa" or "Chanchal"
  customerNote?: string; // Optional note: buyer name, WhatsApp number, transaction ID
  deviceInfo?: string; // e.g. "Chrome (Windows)" or "Safari (iOS)"
  clientIp?: string;
  boundDeviceId?: string; // Persistent client device identifier
  boundUserAgent?: string;
  progress?: UserProgressSummary; // User learning progress, streak, quizzes, and vocabulary mastery
}

export interface UserProgressSummary {
  learningStreak: number;
  lastStudyDate?: string | null;
  wordsStudied: number;
  wordsPracticed: number;
  wordsMastered: number;
  needsRevisionCount?: number;
  favoritesCount?: number;
  quizzesTaken: number;
  quizAccuracy: number;
  lastSyncAt: number;
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

export interface BroadcastAnnouncement {
  id: string; // e.g. "anno_1792430000_a1b2c"
  title: string;
  message: string;
  type: 'info' | 'urgent' | 'update' | 'promotion';
  priority: 'normal' | 'high'; // high shows immediate modal popup to active users
  displayStyle?: 'toast' | 'center_modal'; // 'toast' = mini alert pill (Image 1), 'center_modal' = centered popup (Image 2)
  targetKey?: string; // If set, only users with this key (or plaintext / masked) receive it
  autoDismissSeconds?: number; // e.g. 5 for temporary auto-dismissing notification
  actionUrl?: string; // internal tab (e.g. 'quiz', 'learn', 'stories') or external link
  actionText?: string; // e.g. 'এখনই দেখুন'
  createdAt: number;
  expiresAt?: number;
  active: boolean;
  author?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: 'create_license' | 'activate_license' | 'reset_binding' | 'suspend_license' | 'reactivate_license' | 'revoke_license' | 'extend_license' | 'delete_license' | 'make_lifetime' | 'create_broadcast' | 'delete_broadcast' | 'update_customer_name' | 'admin_login' | 'admin_failed_login';
  licenseId?: string;
  details: string;
  ip?: string;
}

export interface AdminOverviewStats {
  total: number;
  totalLicenses?: number;
  active: number;
  activated: number;
  unactivated: number;
  expired: number;
  suspended: number;
  revoked: number;
  recentlyActivated: LicenseRecord[];
  isUsingFallbackStore?: boolean;
}

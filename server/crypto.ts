import crypto from 'crypto';

// Unified Cryptographic Pepper fallback matching production environment
const DEFAULT_PEPPER = 'bonolota_sec_vault_pepper_prod_salt_2026';

export function getLicensePepper(): string {
  return process.env.LICENSE_PEPPER || DEFAULT_PEPPER;
}

/**
 * Generate a cryptographically strong, user-friendly license key
 * Format: BONOLOTA-XXXX-XXXX-XXXX
 * Uses unambiguous characters (excluding 0, O, 1, I, L)
 */
export function generateAccessKey(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 30 unambiguous uppercase chars
  const getRandomBlock = (length: number): string => {
    const bytes = crypto.randomBytes(length * 2);
    let result = '';
    for (let i = 0; i < bytes.length && result.length < length; i++) {
      const idx = bytes[i] % chars.length;
      result += chars[idx];
    }
    return result;
  };

  const block1 = getRandomBlock(4);
  const block2 = getRandomBlock(4);
  const block3 = getRandomBlock(4);

  return `BONOLOTA-${block1}-${block2}-${block3}`;
}

/**
 * Mask a license key for safe display in table / admin logs
 * Example: BONOLOTA-7K9A-M4W2-X8P1 -> BONOLOTA-7K9A-****-****
 */
export function maskKey(key: string): string {
  const parts = key.trim().toUpperCase().split('-');
  if (parts.length >= 4) {
    return `${parts[0]}-${parts[1]}-****-****`;
  }
  return key.slice(0, 8) + '****';
}

/**
 * Normalize access key (uppercase, remove extra spaces, smart formatting)
 * Handles:
 * - BONOLOTA-XXXX-XXXX-XXXX
 * - bonolota-xxxx-xxxx-xxxx
 * - XXXX-XXXX-XXXX (auto adds BONOLOTA-)
 * - BONOLOTAXXXXXXXXXXXX (auto formats with dashes)
 * - XXXXXXXXXXXX (auto adds prefix and dashes)
 * - Quotes, zero-width chars, spaces
 */
export function normalizeKey(key: string): string {
  if (!key || typeof key !== 'string') return '';
  
  // Remove quotes, zero-width characters, invisible symbols, and whitespace
  let cleaned = key.trim().toUpperCase()
    .replace(/["'“”‘’`]/g, '')
    .replace(/[\s\u200B-\u200D\uFEFF]+/g, '');

  // If already standard format: BONOLOTA-XXXX-XXXX-XXXX
  if (/^BONOLOTA-[A-Z0-9*]{4}-[A-Z0-9*]{4}-[A-Z0-9*]{4}$/.test(cleaned)) {
    return cleaned;
  }

  // Handle case where user entered without BONOLOTA- prefix e.g. 4ZS7-8X2M-9K7P
  if (/^[A-Z0-9*]{4}-[A-Z0-9*]{4}-[A-Z0-9*]{4}$/.test(cleaned)) {
    return `BONOLOTA-${cleaned}`;
  }

  // Handle underscore/dot separators e.g. BONOLOTA_4ZS7_8X2M_9K7P
  const dashReplaced = cleaned.replace(/[_.]/g, '-');
  if (/^BONOLOTA-[A-Z0-9*]{4}-[A-Z0-9*]{4}-[A-Z0-9*]{4}$/.test(dashReplaced)) {
    return dashReplaced;
  }

  // Handle stripped dashes: BONOLOTAXXXXXXXXXXXX (20 characters)
  const noDash = cleaned.replace(/[-_.]/g, '');
  if (noDash.startsWith('BONOLOTA') && noDash.length === 20) {
    return `BONOLOTA-${noDash.slice(8, 12)}-${noDash.slice(12, 16)}-${noDash.slice(16, 20)}`;
  }

  // Handle raw 12 characters without prefix or dashes: XXXXXXXXXXXX
  if (noDash.length === 12 && !noDash.startsWith('BONOLOTA')) {
    return `BONOLOTA-${noDash.slice(0, 4)}-${noDash.slice(4, 8)}-${noDash.slice(8, 12)}`;
  }

  return cleaned;
}

/**
 * Hash a license key using HMAC-SHA256 with pepper
 */
export function hashLicenseKey(key: string, customPepper?: string): string {
  const normalized = normalizeKey(key);
  const pepper = customPepper || getLicensePepper();
  return crypto.createHmac('sha256', pepper).update(normalized).digest('hex');
}

/**
 * Secure PBKDF2 Password Hashing
 * Format: pbkdf2:100000:<saltHex>:<hashHex>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

/**
 * Timing-safe Password Verification
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!storedHash || !storedHash.startsWith('pbkdf2:')) {
      return false;
    }

    const parts = storedHash.split(':');
    if (parts.length !== 4) return false;

    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];

    const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');

    const origBuffer = Buffer.from(originalHash, 'hex');
    const compBuffer = Buffer.from(computedHash, 'hex');

    if (origBuffer.length !== compBuffer.length) return false;
    return crypto.timingSafeEqual(origBuffer, compBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically random session token (32 bytes hex)
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a session token before storing in Redis.
 * Strictly validates string type and limits token length to avoid crashes or DoS.
 */
export function hashSessionToken(token: string): string {
  if (!token || typeof token !== 'string') return '';
  const sanitized = token.trim().slice(0, 512);
  if (sanitized.length < 16) return '';
  return crypto.createHash('sha256').update(sanitized).digest('hex');
}

/**
 * Parses user-agent header into a concise, readable browser and device string
 */
export function parseUserAgent(ua?: string): string {
  const details = parseUserAgentDetailed(ua);
  return `${details.browserName} ${details.browserVersion ? details.browserVersion.split('.')[0] : ''} (${details.osName})`.replace(/\s+/g, ' ').trim();
}

export interface DetailedUserAgentInfo {
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown';
}

export function parseUserAgentDetailed(ua?: string): DetailedUserAgentInfo {
  if (!ua) {
    return {
      browserName: 'Unknown Browser',
      browserVersion: '',
      osName: 'Unknown OS',
      osVersion: '',
      deviceType: 'Unknown',
    };
  }

  let browserName = 'Browser';
  let browserVersion = '';
  let osName = 'Device';
  let osVersion = '';
  let deviceType: 'Mobile' | 'Tablet' | 'Desktop' | 'Unknown' = 'Desktop';

  // Device type detection
  if (/tablet|ipad|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'Mobile';
  } else {
    deviceType = 'Desktop';
  }

  // OS detection
  if (/iphone/i.test(ua)) {
    osName = 'iOS (iPhone)';
    const match = ua.match(/OS (\d+[._]\d+([._]\d+)?)/i);
    if (match) osVersion = match[1].replace(/_/g, '.');
  } else if (/ipad/i.test(ua)) {
    osName = 'iPadOS (iPad)';
    const match = ua.match(/OS (\d+[._]\d+([._]\d+)?)/i);
    if (match) osVersion = match[1].replace(/_/g, '.');
  } else if (/android/i.test(ua)) {
    osName = 'Android';
    const match = ua.match(/Android (\d+(\.\d+)?)/i);
    if (match) osVersion = match[1];
  } else if (/windows nt 10\.0/i.test(ua)) {
    osName = 'Windows';
    osVersion = '10 / 11';
  } else if (/windows nt 6\.3/i.test(ua)) {
    osName = 'Windows';
    osVersion = '8.1';
  } else if (/windows nt 6\.1/i.test(ua)) {
    osName = 'Windows';
    osVersion = '7';
  } else if (/windows/i.test(ua)) {
    osName = 'Windows PC';
  } else if (/macintosh|mac os x/i.test(ua)) {
    osName = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+([._]\d+)?)/i);
    if (match) osVersion = match[1].replace(/_/g, '.');
  } else if (/linux/i.test(ua)) {
    osName = 'Linux';
  }

  // Browser detection
  if (/edg\/(\d+(\.\d+)?)/i.test(ua)) {
    browserName = 'Edge';
    browserVersion = ua.match(/edg\/(\d+(\.\d+)?)/i)?.[1] || '';
  } else if (/samsungbrowser\/(\d+(\.\d+)?)/i.test(ua)) {
    browserName = 'Samsung Internet';
    browserVersion = ua.match(/samsungbrowser\/(\d+(\.\d+)?)/i)?.[1] || '';
  } else if (/opr\/(\d+(\.\d+)?)/i.test(ua) || /opera\/(\d+(\.\d+)?)/i.test(ua)) {
    browserName = 'Opera';
    browserVersion = ua.match(/(?:opr|opera)\/(\d+(\.\d+)?)/i)?.[1] || '';
  } else if (/chrome\/(\d+(\.\d+)?)/i.test(ua) || /crios\/(\d+(\.\d+)?)/i.test(ua)) {
    browserName = 'Chrome';
    browserVersion = ua.match(/(?:chrome|crios)\/(\d+(\.\d+)?)/i)?.[1] || '';
  } else if (/firefox\/(\d+(\.\d+)?)/i.test(ua) || /fxios\/(\d+(\.\d+)?)/i.test(ua)) {
    browserName = 'Firefox';
    browserVersion = ua.match(/(?:firefox|fxios)\/(\d+(\.\d+)?)/i)?.[1] || '';
  } else if (/version\/(\d+(\.\d+)?).*safari/i.test(ua)) {
    browserName = 'Safari';
    browserVersion = ua.match(/version\/(\d+(\.\d+)?)/i)?.[1] || '';
  } else if (/safari/i.test(ua)) {
    browserName = 'Safari';
  }

  return {
    browserName,
    browserVersion,
    osName,
    osVersion,
    deviceType,
  };
}

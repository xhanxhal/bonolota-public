import crypto from 'crypto';

// Pepper fallback for local development if not yet set in environment
const DEFAULT_PEPPER = 'shobdosetu_default_local_dev_pepper_do_not_use_in_prod';

export function getLicensePepper(): string {
  return process.env.LICENSE_PEPPER || DEFAULT_PEPPER;
}

/**
 * Generate a cryptographically strong, user-friendly license key
 * Format: SHOBDO-XXXX-XXXX-XXXX
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

  return `SHOBDO-${block1}-${block2}-${block3}`;
}

/**
 * Mask a license key for safe display in table / admin logs
 * Example: SHOBDO-7K9A-M4W2-X8P1 -> SHOBDO-7K9A-****-****
 */
export function maskKey(key: string): string {
  const parts = key.trim().toUpperCase().split('-');
  if (parts.length >= 4) {
    return `${parts[0]}-${parts[1]}-****-****`;
  }
  return key.slice(0, 8) + '****';
}

/**
 * Normalize access key (uppercase, remove extra spaces)
 */
export function normalizeKey(key: string): string {
  return key.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Hash a license key using HMAC-SHA256 with pepper
 */
export function hashLicenseKey(key: string): string {
  const normalized = normalizeKey(key);
  const pepper = getLicensePepper();
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
 * Hash a session token before storing in Redis
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Client Device Fingerprint & Identifier Utility
 * 
 * Generates a stable, anonymous client device identifier to allow seamless
 * same-device re-activation (even if cookies expire or are cleared) while
 * strictly enforcing the single-device license policy across different hardware.
 */

const DEVICE_ID_KEY = 'bonolota_device_id';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function getClientDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'ssr_device';
  }

  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.startsWith('dev_') && existing.length >= 16) {
      return existing;
    }
  } catch {
    // LocalStorage might be restricted; continue with generated fingerprint
  }

  try {
    const ua = navigator.userAgent || 'unknown_ua';
    const lang = navigator.language || 'en';
    const screenRes = typeof screen !== 'undefined' ? `${screen.width}x${screen.height}x${screen.colorDepth}` : '0x0';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown_tz';
    const entropy = Math.random().toString(36).substring(2, 12);
    
    const fingerprint = simpleHash(`${ua}|${lang}|${screenRes}|${tz}`);
    const newDeviceId = `dev_${fingerprint}_${Date.now().toString(36)}_${entropy}`;

    try {
      localStorage.setItem(DEVICE_ID_KEY, newDeviceId);
    } catch {
      // Ignore
    }

    return newDeviceId;
  } catch {
    return `dev_fallback_${Date.now().toString(36)}`;
  }
}

/**
 * Bonolota Security & Network Defense Module
 * 
 * 1. Internal & Loopback IP Protection:
 *    - Guarantees 127.0.0.1, localhost, ::1, and internal loopback addresses are NEVER blocked by firewall,
 *      honeypots, or admin actions.
 * 2. SSRF (Server-Side Request Forgery) Shield:
 *    - Validates all outbound network requests (e.g. Telegram API, Webhooks).
 *    - Enforces protocol whitelisting (strictly HTTPS for external APIs).
 *    - Prohibits targeting internal addresses (127.0.0.1, 169.254.169.254 cloud metadata, 10.x, 192.168.x).
 *    - Strictly validates Telegram Bot Token and Chat ID formats to avoid URL parameter injection or SSRF.
 */

import { URL } from 'url';

/**
 * Checks if an IP is a loopback or localhost address.
 * Covers IPv4 127.0.0.0/8, IPv6 ::1, IPv4-mapped IPv6 ::ffff:127.x.x.x, 0.0.0.0, and 'localhost'.
 */
export function isLoopbackIp(rawIp: string | null | undefined): boolean {
  if (!rawIp) return false;
  const clean = rawIp.trim().toLowerCase().replace(/^\[|\]$/g, '');
  const unmapped = clean.replace(/^::ffff:/, '');

  if (
    clean === 'localhost' ||
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === '0.0.0.0' ||
    clean === '::'
  ) {
    return true;
  }

  // IPv4 Loopback block (127.0.0.0/8)
  if (unmapped.startsWith('127.')) {
    return true;
  }

  return false;
}

/**
 * Checks if an IP is in an RFC-1918 private network or Cloud Metadata (169.254.169.254).
 */
export function isPrivateOrMetadataIp(rawIp: string | null | undefined): boolean {
  if (!rawIp) return false;
  if (isLoopbackIp(rawIp)) return true;

  const clean = rawIp.trim().toLowerCase().replace(/^::ffff:/, '');

  // AWS/GCP/Azure link-local cloud metadata
  if (clean.startsWith('169.254.')) {
    return true;
  }

  // RFC 1918: 10.0.0.0/8
  if (clean.startsWith('10.')) {
    return true;
  }

  // RFC 1918: 192.168.0.0/16
  if (clean.startsWith('192.168.')) {
    return true;
  }

  // RFC 1918: 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) {
    return true;
  }

  // IPv6 Link-Local and Unique-Local
  if (clean.startsWith('fe80:') || clean.startsWith('fc') || clean.startsWith('fd')) {
    return true;
  }

  return false;
}

/**
 * Validates whether an IP address is eligible to be added to the Firewall Blacklist.
 * Prevents admins or automated scripts from accidentally blacklisting 127.0.0.1 or localhost.
 */
export function canBlockIp(ip: string | null | undefined): { allowed: boolean; reason?: string } {
  if (!ip || typeof ip !== 'string' || ip.trim().length === 0) {
    return { allowed: false, reason: 'অবৈধ বা ফাঁকা আইপি ঠিকানা।' };
  }

  const clean = ip.trim();

  if (isLoopbackIp(clean)) {
    return {
      allowed: false,
      reason: 'লুপব্যাক বা লোকালহোস্ট (127.0.0.1 / localhost) আইপি কখনোই ব্লক করা যাবে না।',
    };
  }

  // Basic IP regex check (IPv4 or IPv6)
  const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:)+[0-9a-fA-F]{1,4}$/;

  const stripped = clean.replace(/^::ffff:/, '');
  if (!ipv4Regex.test(stripped) && !ipv6Regex.test(stripped)) {
    return { allowed: false, reason: 'আইপি ঠিকানার ফরম্যাট সঠিক নয়।' };
  }

  return { allowed: true };
}

/**
 * Strict validation for Telegram Bot Tokens to eliminate SSRF and injection risks.
 * Official token format: <bot_id>:<alphanumeric_secret> (e.g. 9095057691:AAF0QUtiS1JCtpzETygCbqno-PgMdThPoiE)
 */
export const TELEGRAM_BOT_TOKEN_REGEX = /^[0-9]{8,14}:[a-zA-Z0-9_-]{30,60}$/;

export function validateTelegramBotToken(token: string | null | undefined): { valid: boolean; reason?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'বট টোকেন ফাঁকা রাখা যাবে না।' };
  }

  const clean = token.trim();

  // Guard against path traversal, URL manipulation or whitespace
  if (/[\/\s\\@\?#%:]/.test(clean.split(':')[1] || '')) {
    return { valid: false, reason: 'বট টোকেনে অবৈধ ক্যারেক্টার বা পাথ ট্রাভার্সাল পাওয়া গেছে।' };
  }

  if (!TELEGRAM_BOT_TOKEN_REGEX.test(clean)) {
    return {
      valid: false,
      reason: 'টেলিগ্রাম বট টোকেন সঠিক ফরম্যাটে নেই (উদাহরণ: 9095057691:AAF0QUtiS1JCtpzETygCbqno-PgMdThPoiE)',
    };
  }

  return { valid: true };
}

/**
 * Strict validation for Telegram Chat ID.
 * Standard chat IDs are either positive/negative numbers or alphanumeric @channel names.
 */
export const TELEGRAM_CHAT_ID_REGEX = /^-?[0-9]{5,20}$/;

export function validateTelegramChatId(chatId: string | null | undefined): { valid: boolean; reason?: string } {
  if (!chatId || typeof chatId !== 'string') {
    return { valid: false, reason: 'চ্যাট আইডি ফাঁকা রাখা যাবে না।' };
  }

  const clean = chatId.trim();

  if (!TELEGRAM_CHAT_ID_REGEX.test(clean) && !/^@[a-zA-Z0-9_]{4,32}$/.test(clean)) {
    return {
      valid: false,
      reason: 'টেলিগ্রাম চ্যাট আইডি সংখ্যাসূচক হতে হবে (যেমন: 6745501942)',
    };
  }

  return { valid: true };
}

/**
 * SSRF Protection Validator for Outbound HTTP(S) Requests.
 * Ensures the target URL cannot target local services, AWS/GCP metadata, or private RFC-1918 subnets.
 */
export function validateSafeOutboundUrl(
  urlStr: string,
  options?: { allowedHosts?: string[]; allowedProtocols?: string[] }
): { safe: boolean; reason?: string; parsedUrl?: URL } {
  try {
    const parsed = new URL(urlStr);

    const allowedProtocols = options?.allowedProtocols || ['https:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return {
        safe: false,
        reason: `অসুরক্ষিত প্রোটোকল: ${parsed.protocol}। শুধুমাত্র ${allowedProtocols.join(', ')} অনুমোদিত।`,
      };
    }

    const host = parsed.hostname.toLowerCase();

    // Block loopback & localhost
    if (isLoopbackIp(host) || host === 'localhost') {
      return { safe: false, reason: 'লোকালহোস্ট বা লুপব্যাক আইপিতে বহির্গামী রিকোয়েস্ট নিষিদ্ধ (SSRF Protection)।' };
    }

    // Block cloud metadata endpoints
    if (
      host === '169.254.169.254' ||
      host === 'metadata.google.internal' ||
      host === 'instance-data' ||
      host.endsWith('.metadata.google.internal')
    ) {
      return { safe: false, reason: 'ক্লাউড মেটাডাটা সার্ভিস অ্যাক্সেস নিষিদ্ধ (SSRF Protection)।' };
    }

    // Block private/internal subnets
    if (isPrivateOrMetadataIp(host)) {
      return { safe: false, reason: 'অভ্যন্তরীণ বা প্রাইভেট আইপিতে বহির্গামী রিকোয়েস্ট নিষিদ্ধ (SSRF Protection)।' };
    }

    // Optional allowedHosts whitelist
    if (options?.allowedHosts && options.allowedHosts.length > 0) {
      const isAllowed = options.allowedHosts.some(allowed => {
        if (allowed.startsWith('*.')) {
          return host.endsWith(allowed.slice(1)) || host === allowed.slice(2);
        }
        return host === allowed;
      });

      if (!isAllowed) {
        return { safe: false, reason: `হোস্ট '${host}' অনুমোদিত বহির্গামী সার্ভারের তালিকায় নেই।` };
      }
    }

    return { safe: true, parsedUrl: parsed };
  } catch (e: any) {
    return { safe: false, reason: `অবৈধ URL: ${e?.message || 'Parse error'}` };
  }
}

/**
 * Sanitizes URLs provided in user-facing broadcasts to prevent client-side injection or SSRF links.
 */
export function sanitizeActionUrl(rawUrl: string | null | undefined): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const clean = rawUrl.trim();
  if (clean.length === 0) return undefined;

  // Allow relative in-app paths
  if (clean.startsWith('/') && !clean.startsWith('//')) {
    return clean;
  }

  // Reject dangerous schemes
  const lower = clean.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return undefined;
  }

  // Validate standard external URLs
  const check = validateSafeOutboundUrl(clean, { allowedProtocols: ['https:', 'http:'] });
  if (!check.safe) {
    return undefined;
  }

  return clean;
}

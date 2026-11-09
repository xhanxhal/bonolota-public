import { storage } from './storage';
import { 
  validateTelegramBotToken, 
  validateTelegramChatId, 
  validateSafeOutboundUrl 
} from './security';

// Default configuration provided by user
export const DEFAULT_TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9095057691:AAF0QUtiS1JCtpzETygCbqno-PgMdThPoiE';
export const DEFAULT_TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6745501942';

/**
 * Send an alert message to Telegram with SSRF Shield & strict host validation
 */
export async function sendTelegramAlert(
  text: string,
  options?: { parseMode?: 'HTML' | 'Markdown' }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch live config from storage if available
    let botToken = DEFAULT_TELEGRAM_BOT_TOKEN;
    let chatId = DEFAULT_TELEGRAM_CHAT_ID;
    let enabled = true;

    try {
      const config = await storage.getSecurityConfig();
      if (config?.telegram) {
        if (config.telegram.botToken) botToken = config.telegram.botToken;
        if (config.telegram.chatId) chatId = config.telegram.chatId;
        if (typeof config.telegram.enabled === 'boolean') enabled = config.telegram.enabled;
      }
    } catch {
      // Storage might not be initialized yet; fallback to default
    }

    if (!enabled || !botToken || !chatId) {
      return { success: false, error: 'Telegram alert is disabled or missing credentials' };
    }

    // SSRF & Parameter Validation
    const tokenCheck = validateTelegramBotToken(botToken);
    if (!tokenCheck.valid) {
      console.warn('[SSRF Shield] Invalid Telegram token format detected:', tokenCheck.reason);
      return { success: false, error: tokenCheck.reason };
    }

    const chatCheck = validateTelegramChatId(chatId);
    if (!chatCheck.valid) {
      console.warn('[SSRF Shield] Invalid Telegram chat ID format detected:', chatCheck.reason);
      return { success: false, error: chatCheck.reason };
    }

    const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;

    // Strict URL validation: protocol must be https, host must strictly be api.telegram.org
    const urlCheck = validateSafeOutboundUrl(url, { allowedHosts: ['api.telegram.org'], allowedProtocols: ['https:'] });
    if (!urlCheck.safe) {
      console.error('[SSRF Shield] Outbound request blocked to non-whitelisted destination:', urlCheck.reason);
      return { success: false, error: urlCheck.reason };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text,
        parse_mode: options?.parseMode || 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000), // 8s timeout to prevent hanging connections
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      const errMsg = data?.description || `HTTP ${response.status}`;
      console.error('[Telegram] Failed to send alert:', errMsg);
      
      // Log to security terminal
      storage.addSecurityEvent({
        level: 'warn',
        source: 'TELEGRAM',
        message: `টেলিগ্রাম নোটিফিকেশন পাঠাতে ব্যর্থ: ${errMsg}`,
      }).catch(() => {});

      return { success: false, error: errMsg };
    }

    // Log success in security terminal
    storage.addSecurityEvent({
      level: 'info',
      source: 'TELEGRAM',
      message: 'টেলিগ্রাম নোটিফিকেশন সফলভাবে পাঠানো হয়েছে।',
    }).catch(() => {});

    return { success: true };
  } catch (error: any) {
    console.error('[Telegram] Network exception:', error);
    return { success: false, error: error?.message || 'Network error' };
  }
}

/**
 * Test Telegram bot connection and chat ID with SSRF validation
 */
export async function testTelegramConnection(
  botToken: string,
  chatId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cleanToken = (botToken || '').trim();
    const cleanChatId = (chatId || '').trim();

    if (!cleanToken || !cleanChatId) {
      return { success: false, message: 'বট টোকেন এবং চ্যাট আইডি উভয়ই পূরণ করতে হবে।' };
    }

    // SSRF & Parameter Validation
    const tokenCheck = validateTelegramBotToken(cleanToken);
    if (!tokenCheck.valid) {
      return { success: false, message: tokenCheck.reason || 'অবৈধ বট টোকেন।' };
    }

    const chatCheck = validateTelegramChatId(cleanChatId);
    if (!chatCheck.valid) {
      return { success: false, message: chatCheck.reason || 'অবৈধ চ্যাট আইডি।' };
    }

    const testMessage = `🛡️ <b>বনলতা সিকিউরিটি নোটিফিকেশন টেস্ট</b>\n\n` +
      `✅ <b>সংযোগ সফল হয়েছে!</b>\n` +
      `⏰ সময়: ${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}\n` +
      `📌 আপনার অ্যাডমিন প্যানেল থেকে পাঠানো টেস্ট মেসেজ। সমস্ত সিকিউরিটি ইভেন্ট, ফ্রড অ্যালার্ট এবং হানি-পট নোটিফিকেশন এই চ্যাটে পাওয়া যাবে।`;

    const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

    // Strict URL validation: protocol must be https, host must strictly be api.telegram.org
    const urlCheck = validateSafeOutboundUrl(url, { allowedHosts: ['api.telegram.org'], allowedProtocols: ['https:'] });
    if (!urlCheck.safe) {
      return { success: false, message: `SSRF Shield: ${urlCheck.reason}` };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: testMessage,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      return { 
        success: false, 
        message: data?.description || `টেলিগ্রাম এপিআই এরর (HTTP ${response.status})` 
      };
    }

    return { success: true, message: 'টেলিগ্রাম নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!' };
  } catch (error: any) {
    return { success: false, message: `নেটওয়ার্ক ত্রুটি: ${error?.message || 'Unknown'}` };
  }
}

import { storage } from './storage';
import { 
  DEFAULT_TELEGRAM_BOT_TOKEN, 
  DEFAULT_TELEGRAM_CHAT_ID 
} from './telegram';
import { 
  generateAccessKey, 
  maskKey, 
  hashLicenseKey, 
  normalizeKey 
} from './crypto';
import { LicenseRecord, SupportMessage } from './types';
import { validateSafeOutboundUrl } from './security';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      title?: string;
      username?: string;
    };
    text?: string;
    reply_to_message?: {
      message_id: number;
      text?: string;
      caption?: string;
    };
    date: number;
  };
}

let isBotRunning = false;
let lastUpdateOffset = 0;

/**
 * Get active bot token and authorized chat ID from storage or environment
 */
async function getBotCredentials(): Promise<{ botToken: string; chatId: string; enabled: boolean }> {
  let botToken = DEFAULT_TELEGRAM_BOT_TOKEN;
  let chatId = DEFAULT_TELEGRAM_CHAT_ID;
  let enabled = true;

  try {
    const config = await storage.getSecurityConfig();
    if (config?.telegram) {
      if (config.telegram.botToken) botToken = config.telegram.botToken.trim();
      if (config.telegram.chatId) chatId = config.telegram.chatId.trim();
      if (typeof config.telegram.enabled === 'boolean') enabled = config.telegram.enabled;
    }
  } catch {}

  return { botToken, chatId, enabled };
}

/**
 * Send a message back to the authorized Telegram chat
 */
export async function sendTelegramBotReply(
  text: string, 
  replyToMessageId?: number
): Promise<boolean> {
  try {
    const { botToken, chatId, enabled } = await getBotCredentials();
    if (!enabled || !botToken || !chatId) return false;

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const check = validateSafeOutboundUrl(url, { allowedHosts: ['api.telegram.org'], allowedProtocols: ['https:'] });
    if (!check.safe) return false;

    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };
    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    return res.ok;
  } catch (err) {
    console.error('[TelegramBot] Failed to send reply:', err);
    return false;
  }
}

/**
 * Handle incoming Telegram command or reply from Admin
 */
export async function handleTelegramMessage(message: NonNullable<TelegramUpdate['message']>): Promise<void> {
  const { chatId: authorizedChatId } = await getBotCredentials();
  const incomingChatId = message.chat?.id?.toString() || '';
  const text = (message.text || '').trim();
  const messageId = message.message_id;

  // Strict Security: Accept commands only from authorized admin chat ID
  if (incomingChatId !== authorizedChatId) {
    console.warn(`[TelegramBot] Unauthorized message attempt from chat ID: ${incomingChatId}`);
    return;
  }

  if (!text) return;

  // Case 1: Admin used Telegram's built-in "Reply" to answer a student's support alert
  if (message.reply_to_message && message.reply_to_message.text) {
    const quotedText = message.reply_to_message.text;
    // Extract Ticket ID: matches ticket_173111... or #ticket_...
    const ticketMatch = quotedText.match(/(ticket_[a-zA-Z0-9_\-]+)/i);
    if (ticketMatch && ticketMatch[1]) {
      const ticketId = ticketMatch[1];
      await executeTicketReply(ticketId, text, messageId);
      return;
    }
  }

  // Case 2: Explicit commands starting with /
  const parts = text.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case '/start':
    case '/help': {
      const helpMsg = 
        `🤖 <b>বনলতা অ্যাডমিন টেলিগ্রাম বট</b>\n\n` +
        `আপনি সরাসরি এখান থেকেই সম্পূর্ণ সিস্টেম নিয়ন্ত্রণ করতে পারবেন:\n\n` +
        `🔑 <b>কি ম্যানেজমেন্ট:</b>\n` +
        `• <code>/newkey [নাম] [দিন]</code> — নতুন কি তৈরি\n` +
        `  <i>উদাহরণ:</i> <code>/newkey Rahat 30</code>\n` +
        `  <i>লাইফটাইম:</i> <code>/newkey Rahat lifetime</code>\n` +
        `• <code>/deletekey [কী]</code> — ডাটাবেজ থেকে কি স্থায়ী ডিলিট\n` +
        `• <code>/revokekey [কী]</code> — কি বাতিল/সাসপেন্ড করা\n` +
        `• <code>/activekey [কী]</code> — বাতিল কি পুনরায় সক্রিয় করা\n` +
        `• <code>/extend [কী] [দিন]</code> — মেয়াদ বাড়ানো\n` +
        `• <code>/keys</code> — সাম্প্রতিক অ্যাক্সেস কি তালিকা\n\n` +
        `💬 <b>১:১ স্টুডেন্ট সাপোর্ট চ্যাট:</b>\n` +
        `• মেসেজ নোটিফিকেশনে সরাসরি <b>Telegram Reply</b> দিয়ে উত্তর পাঠাতে পারবেন।\n` +
        `• <code>/reply [TicketID] [উত্তর]</code> — নির্দিষ্ট টিকেটে উত্তর পাঠান\n` +
        `• <code>/tickets</code> — অপেক্ষমাণ (Unread) চ্যাটের তালিকা\n\n` +
        `📊 <b>সিস্টেম ও স্ট্যাটাস:</b>\n` +
        `• <code>/stats</code> বা <code>/online</code> — সক্রিয় শিক্ষার্থী ও সিস্টেম রিপোর্ট`;
      await sendTelegramBotReply(helpMsg, messageId);
      break;
    }

    case '/newkey':
    case '/generate': {
      await handleGenerateKey(args, messageId);
      break;
    }

    case '/deletekey':
    case '/delkey': {
      await handleDeleteKey(args[0], messageId);
      break;
    }

    case '/revokekey':
    case '/revoke': {
      await handleRevokeKey(args[0], messageId);
      break;
    }

    case '/activekey':
    case '/activate': {
      await handleActivateKey(args[0], messageId);
      break;
    }

    case '/extend': {
      await handleExtendKey(args[0], args[1], messageId);
      break;
    }

    case '/reply': {
      if (args.length < 2) {
        await sendTelegramBotReply(
          `⚠️ <b>ফরম্যাট সঠিক নয়!</b>\nব্যবহারবিধি: <code>/reply [TicketID] [আপনার উত্তর বার্তা]</code>\n<i>উদাহরণ:</i> <code>/reply ticket_123 ভাইয়া সমস্যার সমাধান করা হয়েছে।</code>`,
          messageId
        );
        return;
      }
      const ticketId = args[0];
      const replyBody = args.slice(1).join(' ');
      await executeTicketReply(ticketId, replyBody, messageId);
      break;
    }

    case '/tickets': {
      await handleListPendingTickets(messageId);
      break;
    }

    case '/cleartickets':
    case '/deletealltickets': {
      await handleDeleteAllTickets(messageId);
      break;
    }

    case '/keys': {
      await handleListRecentKeys(messageId);
      break;
    }

    case '/stats':
    case '/online': {
      await handleShowSystemStats(messageId);
      break;
    }

    default: {
      if (command.startsWith('/')) {
        await sendTelegramBotReply(
          `❓ অপরিচিত কমান্ড: <code>${command}</code>\nসকল কমান্ড দেখতে <code>/help</code> লিখুন।`,
          messageId
        );
      }
      break;
    }
  }
}

/**
 * Action: Reply to a student support ticket directly from Telegram
 */
async function executeTicketReply(ticketId: string, replyText: string, messageId?: number): Promise<void> {
  try {
    const cleanId = ticketId.trim();
    const cleanText = replyText.trim();

    if (!cleanText) {
      await sendTelegramBotReply(`⚠️ উত্তরের বার্তা ফাঁকা রাখা যাবে না।`, messageId);
      return;
    }

    const ticket = await storage.getSupportTicketById(cleanId);
    if (!ticket) {
      await sendTelegramBotReply(`❌ টিকেট আইডি <code>${cleanId}</code> পাওয়া যায়নি।`, messageId);
      return;
    }

    const now = Date.now();
    const adminMsg: SupportMessage = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'admin',
      senderName: 'Bonolota Support',
      text: cleanText,
      timestamp: now,
    };

    const existingMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const updatedMessages = [...existingMessages, adminMsg];

    await storage.updateSupportTicket(ticket.id, {
      adminReply: cleanText,
      repliedAt: now,
      status: 'replied',
      messages: updatedMessages,
      updatedAt: now,
    });

    await storage.addAuditLog({
      id: `audit_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      action: 'reply_support_chat',
      licenseId: ticket.licenseId,
      details: `Replied to ticket ${ticket.id} via Telegram Bot.`,
    });

    await sendTelegramBotReply(
      `✅ <b>Reply Sent Successfully!</b>\n\n` +
      `User: <b>${ticket.customerName || 'Student'}</b>\n` +
      `Ticket ID: <code>${ticket.id}</code>\n` +
      `Key: <code>${ticket.keyMasked}</code>\n` +
      `Message: <i>${cleanText}</i>\n` +
      `📌 শিক্ষার্থী তার অ্যাপের চ্যাট বক্সে তাৎক্ষণিক উত্তর দেখতে পাবেন।`,
      messageId
    );
  } catch (error: any) {
    console.error('[TelegramBot] executeTicketReply error:', error);
    await sendTelegramBotReply(`❌ উত্তর পাঠাতে ত্রুটি হয়েছে: ${error?.message || 'Unknown error'}`, messageId);
  }
}

/**
 * Action: Generate a new key from Telegram
 * /newkey [Name] [Days]
 */
async function handleGenerateKey(args: string[], messageId?: number): Promise<void> {
  try {
    let customerName = 'নতুন শিক্ষার্থী';
    let durationDays = 30;
    let isLifetime = false;

    if (args.length === 1) {
      const arg = args[0].toLowerCase();
      if (arg === 'lifetime' || arg === 'lt' || arg === '36500') {
        isLifetime = true;
        durationDays = 36500;
      } else if (!isNaN(parseInt(arg, 10))) {
        durationDays = parseInt(arg, 10);
      } else {
        customerName = args[0];
      }
    } else if (args.length >= 2) {
      const lastArg = args[args.length - 1].toLowerCase();
      if (lastArg === 'lifetime' || lastArg === 'lt' || lastArg === '36500') {
        isLifetime = true;
        durationDays = 36500;
        customerName = args.slice(0, -1).join(' ');
      } else if (!isNaN(parseInt(lastArg, 10))) {
        durationDays = Math.max(1, Math.min(36500, parseInt(lastArg, 10)));
        customerName = args.slice(0, -1).join(' ');
      } else {
        customerName = args.join(' ');
      }
    }

    const plaintextKey = generateAccessKey();
    const masked = maskKey(plaintextKey);
    const keyHash = hashLicenseKey(plaintextKey);

    const now = Date.now();
    const expiresAt = isLifetime ? now + 36500 * 24 * 60 * 60 * 1000 : now + durationDays * 24 * 60 * 60 * 1000;
    const licenseId = `lic_${now}_${Math.random().toString(36).substring(2, 8)}`;

    const newLicense: LicenseRecord = {
      id: licenseId,
      keyMasked: masked,
      plaintextKey,
      keyHash,
      status: 'active',
      createdAt: now,
      expiresAt,
      durationDays: isLifetime ? 36500 : durationDays,
      isLifetime,
      browserBound: false,
      customerName,
      customerNote: 'Created via Telegram Bot',
    };

    await storage.createLicense(newLicense);

    await storage.addAuditLog({
      id: `audit_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      action: 'create_license',
      licenseId,
      details: `Generated ${isLifetime ? 'Lifetime' : `${durationDays}d`} key (${masked}) for ${customerName} via Telegram.`,
    });

    const expDateStr = isLifetime ? 'আজীবন (Lifetime)' : new Date(expiresAt).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    await sendTelegramBotReply(
      `🎉 <b>নতুন অ্যাক্সেস কি সফলভাবে তৈরি হয়েছে!</b>\n\n` +
      `🔑 <b>অ্যাক্সেস কী:</b>\n<code>${plaintextKey}</code>\n<i>(ক্লিক করলেই কপি হবে)</i>\n\n` +
      `👤 শিক্ষার্থী: <b>${customerName}</b>\n` +
      `⏱️ মেয়াদ: <b>${isLifetime ? 'আজীবন (Lifetime)' : `${durationDays} দিন`}</b>\n` +
      `📅 মেয়াদ শেষ: <b>${expDateStr}</b>\n\n` +
      `💡 <i>এই কী-টি শিক্ষার্থীকে কপি করে পাঠিয়ে দিন। শিক্ষার্থী প্রথমবার ব্রাউজারে বসালেই এটি লক হয়ে যাবে।</i>`,
      messageId
    );
  } catch (error: any) {
    console.error('[TelegramBot] handleGenerateKey error:', error);
    await sendTelegramBotReply(`❌ কি তৈরি করতে সমস্যা হয়েছে: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Delete a key permanently from Telegram
 * /deletekey [KEY]
 */
async function handleDeleteKey(rawKey: string, messageId?: number): Promise<void> {
  if (!rawKey) {
    await sendTelegramBotReply(`⚠️ কী প্রদান করুন।\nব্যবহারবিধি: <code>/deletekey BONO-XXXX-YYYY</code>`, messageId);
    return;
  }

  try {
    const clean = normalizeKey(rawKey) || rawKey.trim().toUpperCase();
    const licenses = await storage.listLicenses();
    const target = licenses.find(l => 
      (l.plaintextKey && l.plaintextKey.toUpperCase() === clean) ||
      (l.keyMasked && l.keyMasked.toUpperCase() === clean) ||
      l.id === rawKey.trim()
    );

    if (!target) {
      await sendTelegramBotReply(`❌ কী <code>${rawKey}</code> খুঁজে পাওয়া যায়নি।`, messageId);
      return;
    }

    if (target.currentSessionHash) {
      await storage.deleteUserSession(target.currentSessionHash);
    }

    await storage.deleteLicense(target.id);

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'delete_license',
      licenseId: target.id,
      details: `Deleted license ${target.keyMasked} via Telegram Bot.`,
    });

    await sendTelegramBotReply(
      `🗑️ <b>কি সফলভাবে মুছে ফেলা হয়েছে!</b>\n\n` +
      `🔑 কী: <code>${target.keyMasked}</code>\n` +
      `👤 শিক্ষার্থী: <b>${target.customerName || 'বেনামী'}</b>\n` +
      `✅ ডাটাবেজ থেকে স্থায়ীভাবে রিমুভ করা হয়েছে এবং সক্রিয় সেশন বন্ধ করা হয়েছে।`,
      messageId
    );
  } catch (error: any) {
    await sendTelegramBotReply(`❌ ডিলিট ব্যর্থ হয়েছে: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Revoke key
 */
async function handleRevokeKey(rawKey: string, messageId?: number): Promise<void> {
  if (!rawKey) {
    await sendTelegramBotReply(`⚠️ কী প্রদান করুন।\nব্যবহারবিধি: <code>/revokekey BONO-XXXX-YYYY</code>`, messageId);
    return;
  }

  try {
    const clean = normalizeKey(rawKey) || rawKey.trim().toUpperCase();
    const licenses = await storage.listLicenses();
    const target = licenses.find(l => 
      (l.plaintextKey && l.plaintextKey.toUpperCase() === clean) ||
      (l.keyMasked && l.keyMasked.toUpperCase() === clean) ||
      l.id === rawKey.trim()
    );

    if (!target) {
      await sendTelegramBotReply(`❌ কী <code>${rawKey}</code> খুঁজে পাওয়া যায়নি।`, messageId);
      return;
    }

    if (target.currentSessionHash) {
      await storage.deleteUserSession(target.currentSessionHash);
    }

    await storage.updateLicense(target.id, {
      status: 'revoked',
      browserBound: false,
      currentSessionHash: undefined,
    });

    await sendTelegramBotReply(
      `🚫 <b>কি বাতিল (Revoked) করা হয়েছে!</b>\n\n` +
      `🔑 কী: <code>${target.keyMasked}</code>\n` +
      `👤 শিক্ষার্থী: <b>${target.customerName || 'বেনামী'}</b>\n` +
      `স্ট্যাটাস: অ্যাক্সেস চিরতরে বন্ধ। সেশন ধ্বংস করা হয়েছে।`,
      messageId
    );
  } catch (error: any) {
    await sendTelegramBotReply(`❌ বাতিল করতে সমস্যা হয়েছে: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Activate key
 */
async function handleActivateKey(rawKey: string, messageId?: number): Promise<void> {
  if (!rawKey) {
    await sendTelegramBotReply(`⚠️ কী প্রদান করুন।\nব্যবহারবিধি: <code>/activekey BONO-XXXX-YYYY</code>`, messageId);
    return;
  }

  try {
    const clean = normalizeKey(rawKey) || rawKey.trim().toUpperCase();
    const licenses = await storage.listLicenses();
    const target = licenses.find(l => 
      (l.plaintextKey && l.plaintextKey.toUpperCase() === clean) ||
      (l.keyMasked && l.keyMasked.toUpperCase() === clean) ||
      l.id === rawKey.trim()
    );

    if (!target) {
      await sendTelegramBotReply(`❌ কী <code>${rawKey}</code> খুঁজে পাওয়া যায়নি।`, messageId);
      return;
    }

    await storage.updateLicense(target.id, { status: 'active' });

    await sendTelegramBotReply(
      `✅ <b>কি সক্রিয় (Activated) করা হয়েছে!</b>\n\n` +
      `🔑 কী: <code>${target.keyMasked}</code>\n` +
      `👤 শিক্ষার্থী: <b>${target.customerName || 'বেনামী'}</b>`,
      messageId
    );
  } catch (error: any) {
    await sendTelegramBotReply(`❌ সক্রিয় করতে সমস্যা হয়েছে: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Extend key duration
 */
async function handleExtendKey(rawKey: string, rawDays: string, messageId?: number): Promise<void> {
  const days = parseInt(rawDays, 10);
  if (!rawKey || isNaN(days) || days <= 0) {
    await sendTelegramBotReply(`⚠️ সঠিক ফরম্যাট লিখুন।\nব্যবহারবিধি: <code>/extend BONO-XXXX-YYYY 30</code>`, messageId);
    return;
  }

  try {
    const clean = normalizeKey(rawKey) || rawKey.trim().toUpperCase();
    const licenses = await storage.listLicenses();
    const target = licenses.find(l => 
      (l.plaintextKey && l.plaintextKey.toUpperCase() === clean) ||
      (l.keyMasked && l.keyMasked.toUpperCase() === clean) ||
      l.id === rawKey.trim()
    );

    if (!target) {
      await sendTelegramBotReply(`❌ কী <code>${rawKey}</code> খুঁজে পাওয়া যায়নি।`, messageId);
      return;
    }

    const now = Date.now();
    const base = target.expiresAt > now ? target.expiresAt : now;
    const newExpiresAt = base + days * 24 * 60 * 60 * 1000;

    await storage.updateLicense(target.id, {
      expiresAt: newExpiresAt,
      durationDays: target.durationDays + days,
      status: target.status === 'revoked' ? 'revoked' : 'active',
    });

    await sendTelegramBotReply(
      `⏳ <b>মেয়াদ বৃদ্ধি সম্পন্ন!</b>\n\n` +
      `🔑 কী: <code>${target.keyMasked}</code>\n` +
      `👤 শিক্ষার্থী: <b>${target.customerName || 'বেনামী'}</b>\n` +
      `➕ বৃদ্ধি: <b>+${days} দিন</b>\n` +
      `📅 নতুন মেয়াদ শেষ: <b>${new Date(newExpiresAt).toLocaleDateString('bn-BD')}</b>`,
      messageId
    );
  } catch (error: any) {
    await sendTelegramBotReply(`❌ মেয়াদ বাড়াতে সমস্যা হয়েছে: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: List recent licenses
 */
async function handleListRecentKeys(messageId?: number): Promise<void> {
  try {
    const licenses = await storage.listLicenses();
    const sorted = [...licenses].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
    const now = Date.now();

    if (sorted.length === 0) {
      await sendTelegramBotReply(`ডাটাবেজে বর্তমানে কোনো অ্যাক্সেস কি নেই।`, messageId);
      return;
    }

    let text = `📋 <b>সাম্প্রতিক অ্যাক্সেস কী তালিকা (${sorted.length}টি):</b>\n\n`;
    for (const l of sorted) {
      const isExpired = now > l.expiresAt && !l.isLifetime;
      const statusIcon = l.status === 'revoked' ? '🚫' : isExpired ? '⏳' : l.browserBound ? '🔒' : '🟢';
      const daysLeft = l.isLifetime ? 'আজীবন' : Math.max(0, Math.ceil((l.expiresAt - now) / (1000 * 60 * 60 * 24))) + ' দিন';

      text += `${statusIcon} <code>${l.keyMasked}</code>\n`;
      text += `   👤 <b>${l.customerName || 'বেনামী'}</b> | বাকি: ${daysLeft}\n`;
      text += `   ডিভাইস: ${l.browserBound ? 'লকড' : 'অব্যবহৃত'}\n\n`;
    }

    text += `💡 <i>নতুন কি বানাতে লিখুন:</i> <code>/newkey [নাম] [দিন]</code>`;
    await sendTelegramBotReply(text, messageId);
  } catch (error: any) {
    await sendTelegramBotReply(`❌ তালিকা পেতে ব্যর্থ: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: List pending support tickets
 */
async function handleListPendingTickets(messageId?: number): Promise<void> {
  try {
    const tickets = await storage.listSupportTickets();
    const openTickets = tickets.filter(t => t.status === 'open');

    if (openTickets.length === 0) {
      await sendTelegramBotReply(`✨ <b>সব ক্লিয়ার!</b> কোনো অপেক্ষমাণ (Pending) সাপোর্ট মেসেজ নেই।`, messageId);
      return;
    }

    let text = `📬 <b>Pending Support Tickets (${openTickets.length}):</b>\n\n`;
    for (const t of openTickets.slice(0, 8)) {
      const lastMsg = t.messages?.[t.messages.length - 1]?.text || t.message || 'No text';
      text += `💬 <b>User:</b> <b>${t.customerName || 'Student'}</b>\n`;
      text += `   <b>Ticket ID:</b> <code>${t.id}</code>\n`;
      text += `   <b>Key:</b> <code>${t.keyMasked}</code>\n`;
      text += `   <b>Message:</b> <i>${lastMsg.slice(0, 100)}</i>\n`;
      text += `   <b>Reply:</b> <code>/reply ${t.id} your answer</code>\n\n`;
    }

    text += `💡 <i>সব টিকেট একসাথে মুছতে লিখুন:</i> <code>/cleartickets</code>`;
    await sendTelegramBotReply(text, messageId);
  } catch (error: any) {
    await sendTelegramBotReply(`❌ টিকেট তালিকা পেতে ত্রুটি: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Delete all tickets at once from Telegram
 */
async function handleDeleteAllTickets(messageId?: number): Promise<void> {
  try {
    const tickets = await storage.listSupportTickets();
    if (tickets.length === 0) {
      await sendTelegramBotReply(`কোনো টিকেট পাওয়া যায়নি। ইনবক্স ইতিমধ্যে খালি।`, messageId);
      return;
    }
    let count = 0;
    for (const t of tickets) {
      const ok = await storage.deleteSupportTicket(t.id);
      if (ok) count++;
    }
    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'delete_support_chat',
      details: `Deleted all ${count} support ticket(s) via Telegram Bot.`,
    });
    await sendTelegramBotReply(
      `🗑️ <b>All Tickets Deleted!</b>\n` +
      `মোট ${count}টি টিকেট উভয়পাশ থেকেই স্থায়ীভাবে সম্পূর্ণ মুছে ফেলা হয়েছে।`,
      messageId
    );
  } catch (err: any) {
    await sendTelegramBotReply(`❌ টিকেট ডিলিট করতে ব্যর্থ: ${err?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Show system health & online active students
 */
async function handleShowSystemStats(messageId?: number): Promise<void> {
  try {
    const licenses = await storage.listLicenses();
    const tickets = await storage.listSupportTickets();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const onlineStudents = licenses.filter(l => l.lastActiveAt && l.lastActiveAt >= fiveMinutesAgo && l.status === 'active');
    const totalActive = licenses.filter(l => l.status === 'active' && Date.now() <= l.expiresAt).length;
    const uptimeHours = Math.floor(process.uptime() / 3600);
    const uptimeMins = Math.floor((process.uptime() % 3600) / 60);

    let text = 
      `📊 <b>বনলতা লাইভ সিস্টেম রিপোর্ট</b>\n\n` +
      `🟢 <b>বর্তমানে অনলাইন শিক্ষার্থী:</b> <b>${onlineStudents.length} জন</b>\n` +
      `🔑 মোট সক্রিয় কি: <b>${totalActive}টি</b> (সর্বমোট: ${licenses.length}টি)\n` +
      `📩 মোট সাপোর্ট টিকিট: <b>${tickets.length}টি</b>\n` +
      `⏱️ সার্ভার আপটাইম: <b>${uptimeHours}h ${uptimeMins}m</b>\n\n`;

    if (onlineStudents.length > 0) {
      text += `👥 <b>অনলাইন শিক্ষার্থীদের তালিকা:</b>\n`;
      for (const s of onlineStudents.slice(0, 5)) {
        text += `• <b>${s.customerName || 'শিক্ষার্থী'}</b> (${s.keyMasked})\n  সেকশন: <i>${s.progress?.activeFeature || 'ড্যাশবোর্ড'}</i>\n`;
      }
    }

    await sendTelegramBotReply(text, messageId);
  } catch (error: any) {
    await sendTelegramBotReply(`❌ রিপোর্ট তৈরি করতে ব্যর্থ: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Long-polling worker loop: listens to Telegram updates in background
 */
export async function startTelegramBotListener(): Promise<void> {
  if (isBotRunning) return;
  isBotRunning = true;

  console.log('[TelegramBot] Background interactive listener starting...');

  const pollLoop = async () => {
    while (isBotRunning) {
      try {
        const { botToken, enabled } = await getBotCredentials();
        if (!enabled || !botToken) {
          // If bot disabled or token missing, wait 15 seconds before checking again
          await new Promise(r => setTimeout(r, 15000));
          continue;
        }

        const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateOffset}&timeout=20`;
        const check = validateSafeOutboundUrl(url, { allowedHosts: ['api.telegram.org'], allowedProtocols: ['https:'] });
        if (!check.safe) {
          await new Promise(r => setTimeout(r, 10000));
          continue;
        }

        const response = await fetch(url, {
          signal: AbortSignal.timeout(30000), // 30s timeout for 20s long-poll
        });

        if (response.ok) {
          const data: any = await response.json().catch(() => null);
          if (data && data.ok && Array.isArray(data.result)) {
            for (const update of data.result as TelegramUpdate[]) {
              lastUpdateOffset = Math.max(lastUpdateOffset, update.update_id + 1);
              if (update.message) {
                // Process update in background without blocking loop
                handleTelegramMessage(update.message).catch(err => {
                  console.error('[TelegramBot] Error handling message:', err);
                });
              }
            }
          }
        } else {
          // Non-200 from Telegram (e.g. 401 or 409 conflict if another instance is running), back off
          await new Promise(r => setTimeout(r, 8000));
        }
      } catch (err: any) {
        // Network timeout / drop, wait 5 seconds before retrying
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  };

  // Start detached background loop
  pollLoop().catch(err => {
    console.error('[TelegramBot] Poll loop crashed:', err);
    isBotRunning = false;
  });
}

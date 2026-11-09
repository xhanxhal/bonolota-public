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
        `🤖 <b>Bonolota Admin Telegram Bot</b>\n\n` +
        `Manage access keys and student support directly from Telegram:\n\n` +
        `🔑 <b>Key Management:</b>\n` +
        `• <code>/newkey [Name] [Days]</code> — Generate new access key\n` +
        `  <i>Example:</i> <code>/newkey Rahat 30</code>\n` +
        `  <i>Lifetime:</i> <code>/newkey Rahat lifetime</code>\n` +
        `• <code>/deletekey [KEY]</code> — Permanently delete key from database\n` +
        `• <code>/revokekey [KEY]</code> — Suspend / revoke key access\n` +
        `• <code>/activekey [KEY]</code> — Reactivate suspended key\n` +
        `• <code>/extend [KEY] [Days]</code> — Extend key duration\n` +
        `• <code>/keys</code> — View recent access keys list\n\n` +
        `💬 <b>1:1 Student Support:</b>\n` +
        `• Reply directly to any support notification using Telegram's <b>Reply</b> feature.\n` +
        `• <code>/reply [TicketID] [Answer]</code> — Reply to a specific ticket\n` +
        `• <code>/tickets</code> — View all pending support tickets\n` +
        `• <code>/cleartickets</code> — Delete all support tickets permanently\n\n` +
        `📊 <b>System & Metrics:</b>\n` +
        `• <code>/stats</code> or <code>/online</code> — Live online students & server status`;
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
          `⚠️ <b>Invalid Format!</b>\nUsage: <code>/reply [TicketID] [Your Answer]</code>\n<i>Example:</i> <code>/reply ticket_123 Issue resolved, please check your app.</code>`,
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
          `❓ Unknown command: <code>${command}</code>\nType <code>/help</code> for available commands.`,
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
      await sendTelegramBotReply(`⚠️ Reply text cannot be empty.`, messageId);
      return;
    }

    const ticket = await storage.getSupportTicketById(cleanId);
    if (!ticket) {
      await sendTelegramBotReply(`❌ Ticket ID <code>${cleanId}</code> not found.`, messageId);
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
      `📌 The student will immediately see this reply in their chat.`,
      messageId
    );
  } catch (error: any) {
    console.error('[TelegramBot] executeTicketReply error:', error);
    await sendTelegramBotReply(`❌ Failed to send reply: ${error?.message || 'Unknown error'}`, messageId);
  }
}

/**
 * Action: Generate a new key from Telegram
 * /newkey [Name] [Days]
 */
async function handleGenerateKey(args: string[], messageId?: number): Promise<void> {
  try {
    let customerName = 'Student';
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

    const expDateStr = isLifetime ? 'Lifetime' : new Date(expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    await sendTelegramBotReply(
      `🎉 <b>New Access Key Generated Successfully!</b>\n\n` +
      `🔑 <b>Access Key:</b>\n<code>${plaintextKey}</code>\n<i>(Tap to copy)</i>\n\n` +
      `👤 User: <b>${customerName}</b>\n` +
      `⏱️ Duration: <b>${isLifetime ? 'Lifetime' : `${durationDays} Days`}</b>\n` +
      `📅 Expires: <b>${expDateStr}</b>\n\n` +
      `💡 <i>Send this key to the student. It will automatically bind on first browser activation.</i>`,
      messageId
    );
  } catch (error: any) {
    console.error('[TelegramBot] handleGenerateKey error:', error);
    await sendTelegramBotReply(`❌ Failed to generate key: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Delete a key permanently from Telegram
 * /deletekey [KEY]
 */
async function handleDeleteKey(rawKey: string, messageId?: number): Promise<void> {
  if (!rawKey) {
    await sendTelegramBotReply(`⚠️ Please provide key.\nUsage: <code>/deletekey BONOLOTA-XXXX-XXXX-XXXX</code>`, messageId);
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
      await sendTelegramBotReply(`❌ Key <code>${rawKey}</code> not found.`, messageId);
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
      `🗑️ <b>Key Deleted Successfully!</b>\n\n` +
      `Key: <code>${target.keyMasked}</code>\n` +
      `User: <b>${target.customerName || 'None'}</b>\n` +
      `Status: Permanently deleted from database. Active session terminated.`,
      messageId
    );
  } catch (error: any) {
    await sendTelegramBotReply(`❌ Failed to delete key: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Revoke key
 */
async function handleRevokeKey(rawKey: string, messageId?: number): Promise<void> {
  if (!rawKey) {
    await sendTelegramBotReply(`⚠️ Please provide key.\nUsage: <code>/revokekey BONOLOTA-XXXX-XXXX-XXXX</code>`, messageId);
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
      await sendTelegramBotReply(`❌ Key <code>${rawKey}</code> not found.`, messageId);
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
      `🚫 <b>Key Revoked Successfully!</b>\n\n` +
      `Key: <code>${target.keyMasked}</code>\n` +
      `User: <b>${target.customerName || 'None'}</b>\n` +
      `Status: Access suspended. Session destroyed.`,
      messageId
    );
  } catch (error: any) {
    await sendTelegramBotReply(`❌ Failed to revoke key: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Activate key
 */
async function handleActivateKey(rawKey: string, messageId?: number): Promise<void> {
  if (!rawKey) {
    await sendTelegramBotReply(`⚠️ Please provide key.\nUsage: <code>/activekey BONOLOTA-XXXX-XXXX-XXXX</code>`, messageId);
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
      await sendTelegramBotReply(`❌ Key <code>${rawKey}</code> not found.`, messageId);
      return;
    }

    await storage.updateLicense(target.id, { status: 'active' });

    await sendTelegramBotReply(
      `✅ <b>Key Activated Successfully!</b>\n\n` +
      `Key: <code>${target.keyMasked}</code>\n` +
      `User: <b>${target.customerName || 'None'}</b>\n` +
      `Status: Active and ready for use.`,
      messageId
    );
  } catch (error: any) {
    await sendTelegramBotReply(`❌ Failed to activate key: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Extend key duration
 */
async function handleExtendKey(rawKey: string, rawDays: string, messageId?: number): Promise<void> {
  const days = parseInt(rawDays, 10);
  if (!rawKey || isNaN(days) || days <= 0) {
    await sendTelegramBotReply(`⚠️ Invalid format.\nUsage: <code>/extend BONOLOTA-XXXX-XXXX-XXXX 30</code>`, messageId);
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
      await sendTelegramBotReply(`❌ Key <code>${rawKey}</code> not found.`, messageId);
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
      `⏳ <b>Key Extended Successfully!</b>\n\n` +
      `Key: <code>${target.keyMasked}</code>\n` +
      `User: <b>${target.customerName || 'None'}</b>\n` +
      `Extended by: <b>+${days} Days</b>\n` +
      `New Expiry: <b>${new Date(newExpiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</b>`,
      messageId
    );
  } catch (error: any) {
    await sendTelegramBotReply(`❌ Failed to extend key: ${error?.message || 'Unknown'}`, messageId);
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
      await sendTelegramBotReply(`No access keys found in database.`, messageId);
      return;
    }

    let text = `📋 <b>Recent Access Keys (${sorted.length} keys):</b>\n\n`;
    for (const l of sorted) {
      const isExpired = now > l.expiresAt && !l.isLifetime;
      const statusIcon = l.status === 'revoked' ? '🚫' : isExpired ? '⏳' : l.browserBound ? '🔒' : '🟢';
      const daysLeft = l.isLifetime ? 'Lifetime' : Math.max(0, Math.ceil((l.expiresAt - now) / (1000 * 60 * 60 * 24))) + ' days';

      text += `${statusIcon} <code>${l.keyMasked}</code>\n`;
      text += `   User: <b>${l.customerName || 'None'}</b> | Remaining: ${daysLeft}\n`;
      text += `   Device: ${l.browserBound ? 'Bound' : 'Unbound'}\n\n`;
    }

    text += `💡 <i>To create a new key:</i> <code>/newkey [Name] [Days]</code>`;
    await sendTelegramBotReply(text, messageId);
  } catch (error: any) {
    await sendTelegramBotReply(`❌ Failed to retrieve keys list: ${error?.message || 'Unknown'}`, messageId);
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
      await sendTelegramBotReply(`✨ <b>All Clear!</b> No pending support tickets.`, messageId);
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

    text += `💡 <i>To clear all tickets:</i> <code>/cleartickets</code>`;
    await sendTelegramBotReply(text, messageId);
  } catch (error: any) {
    await sendTelegramBotReply(`❌ Failed to retrieve tickets list: ${error?.message || 'Unknown'}`, messageId);
  }
}

/**
 * Action: Delete all tickets at once from Telegram
 */
async function handleDeleteAllTickets(messageId?: number): Promise<void> {
  try {
    const tickets = await storage.listSupportTickets();
    if (tickets.length === 0) {
      await sendTelegramBotReply(`No support tickets found. Inbox is already empty.`, messageId);
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
      `Total ${count} ticket(s) permanently deleted from both sides.`,
      messageId
    );
  } catch (err: any) {
    await sendTelegramBotReply(`❌ Failed to delete tickets: ${err?.message || 'Unknown'}`, messageId);
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
      `📊 <b>Bonolota Live System Status</b>\n\n` +
      `🟢 <b>Online Students (last 5 min):</b> <b>${onlineStudents.length}</b>\n` +
      `🔑 <b>Total Active Keys:</b> <b>${totalActive}</b> (Total generated: ${licenses.length})\n` +
      `📩 <b>Total Support Tickets:</b> <b>${tickets.length}</b>\n` +
      `⏱️ <b>Server Uptime:</b> <b>${uptimeHours}h ${uptimeMins}m</b>\n\n`;

    if (onlineStudents.length > 0) {
      text += `👥 <b>Active Online Students:</b>\n`;
      for (const s of onlineStudents.slice(0, 5)) {
        text += `• <b>${s.customerName || 'Student'}</b> (${s.keyMasked})\n  Section: <i>${s.progress?.activeFeature || 'Dashboard'}</i>\n`;
      }
    }

    await sendTelegramBotReply(text, messageId);
  } catch (error: any) {
    await sendTelegramBotReply(`❌ Failed to generate report: ${error?.message || 'Unknown'}`, messageId);
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
          signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
          const data: any = await response.json().catch(() => null);
          if (data && data.ok && Array.isArray(data.result)) {
            for (const update of data.result as TelegramUpdate[]) {
              lastUpdateOffset = Math.max(lastUpdateOffset, update.update_id + 1);
              if (update.message) {
                handleTelegramMessage(update.message).catch(err => {
                  console.error('[TelegramBot] Error handling message:', err);
                });
              }
            }
          }
        } else {
          await new Promise(r => setTimeout(r, 8000));
        }
      } catch (err: any) {
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  };

  pollLoop().catch(err => {
    console.error('[TelegramBot] Poll loop crashed:', err);
    isBotRunning = false;
  });
}

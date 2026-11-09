import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { UserProgressSummary, ClientBrowserMetadata, SupportMessage } from '../types';
import { 
  hashLicenseKey, 
  generateSessionToken, 
  hashSessionToken,
  normalizeKey,
  parseUserAgent,
  parseUserAgentDetailed
} from '../crypto';
import { 
  USER_COOKIE_NAME, 
  getCookieOptions, 
  requireCustomerAuth, 
  requireSupportUserSession,
  AuthenticatedUserRequest 
} from '../auth';
import { sendTelegramAlert } from '../telegram';

export const authRouter = Router();

/**
 * Customer: Activate an Access Key
 * POST /api/auth/activate
 */
authRouter.post('/activate', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || req.ip || 'unknown';
    
    // Rate limit: 10 activation attempts per 15 minutes per IP
    const rateCheck = await storage.checkRateLimit(`activate:${clientIp}`, 10, 15 * 60);
    if (!rateCheck.allowed) {
      res.status(429).json({
        ok: false,
        error: 'RATE_LIMITED',
        message: 'খুব বেশি চেষ্টা করা হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর আবার চেষ্টা করুন। (Too many attempts. Please try again in 15 minutes.)',
      });
      return;
    }

    const rawKey = req.body?.key || req.body?.accessKey || '';
    if (!rawKey || typeof rawKey !== 'string') {
      res.status(400).json({
        ok: false,
        error: 'MISSING_KEY',
        message: 'অনুগ্রহ করে অ্যাক্সেস কি লিখুন। (Please provide a valid access key.)',
      });
      return;
    }

    const normalized = normalizeKey(rawKey);
    // Basic format validation
    if (normalized.length < 10) {
      res.status(400).json({
        ok: false,
        error: 'INVALID_FORMAT',
        message: 'অ্যাক্সেস কি-এর ফরম্যাট সঠিক নয়। (Invalid access key format.)',
      });
      return;
    }

    const keyHash = hashLicenseKey(normalized);
    let license = await storage.getLicenseByHash(keyHash);

    // If not found, try legacy dev pepper hash
    if (!license) {
      const legacyHash = hashLicenseKey(normalized, 'bonolota_default_local_dev_pepper_do_not_use_in_prod');
      license = await storage.getLicenseByHash(legacyHash);
      if (license) {
        // Auto-heal Redis index to current production hash
        storage.updateLicense(license.id, { keyHash }).catch(() => {});
      }
    }

    // Comprehensive Fallback: Search all licenses by plaintextKey or keyMasked
    if (!license) {
      const all = await storage.listLicenses();
      license = all.find(l => {
        if (l.plaintextKey && normalizeKey(l.plaintextKey) === normalized) return true;
        if (l.keyMasked && (normalizeKey(l.keyMasked) === normalized || l.keyMasked.toUpperCase() === rawKey.trim().toUpperCase())) return true;
        const cleanRaw = rawKey.trim().toUpperCase();
        if (cleanRaw.includes('*') && l.keyMasked && l.keyMasked.slice(0, 13) === cleanRaw.slice(0, 13)) return true;
        return false;
      }) || null;

      if (license) {
        // Auto-heal Redis index so subsequent queries are O(1)
        storage.updateLicense(license.id, { keyHash }).catch(() => {});
      }
    }

    if (!license) {
      res.status(404).json({
        ok: false,
        error: 'KEY_NOT_FOUND',
        message: 'প্রদত্ত অ্যাক্সেস কি-টি খুঁজে পাওয়া যায়নি। অনুগ্রহ করে যাচাই করে পুনরায় চেষ্টা করুন।',
      });
      return;
    }

    // Check status
    if (license.status === 'revoked') {
      res.status(403).json({
        ok: false,
        error: 'KEY_REVOKED',
        message: 'এই অ্যাক্সেস কি-টি বাতিল করা হয়েছে। নতুন সাবস্ক্রিপশনের জন্য আমাদের সাথে যোগাযোগ করুন।',
      });
      return;
    }

    if (license.status === 'suspended') {
      res.status(403).json({
        ok: false,
        error: 'KEY_SUSPENDED',
        message: 'এই অ্যাক্সেস কি-টি সাময়িকভাবে স্থগিত রয়েছে। সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।',
      });
      return;
    }

    // Check expiration (Fixed from creation time)
    const now = Date.now();
    if (now > license.expiresAt) {
      res.status(403).json({
        ok: false,
        error: 'KEY_EXPIRED',
        message: 'এই অ্যাক্সেস কি-টির সাবস্ক্রিপশন মেয়াদ শেষ হয়ে গেছে।',
      });
      return;
    }

    // Check single browser / device binding
    const incomingDeviceId = typeof req.body?.deviceId === 'string' && req.body.deviceId.trim().length >= 8
      ? req.body.deviceId.trim().slice(0, 128)
      : undefined;

    const existingCookieToken = req.cookies?.[USER_COOKIE_NAME];
    const existingCookieHash = (typeof existingCookieToken === 'string' && existingCookieToken.length >= 16)
      ? hashSessionToken(existingCookieToken)
      : null;

    const authHeader = req.headers['authorization'];
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7).trim()
      : null;
    const existingBearerHash = (bearerToken && bearerToken.length >= 16)
      ? hashSessionToken(bearerToken)
      : null;

    const incomingName = (typeof req.body?.name === 'string' && req.body.name.trim().length > 0)
      ? req.body.name.trim().slice(0, 100)
      : (typeof req.body?.customerName === 'string' && req.body.customerName.trim().length > 0 ? req.body.customerName.trim().slice(0, 100) : undefined);

    if (license.browserBound) {
      // If the current browser already holds the active valid session for this license, re-authenticate smoothly
      const isCurrentActiveSession = Boolean(
        (existingCookieHash && license.currentSessionHash === existingCookieHash) ||
        (existingBearerHash && license.currentSessionHash === existingBearerHash)
      );

      if (isCurrentActiveSession) {
        if (incomingName && incomingName !== license.customerName) {
          await storage.updateLicense(license.id, { customerName: incomingName });
        }
        const isLifetime = Boolean(license.isLifetime || license.durationDays >= 36500);
        const daysLeft = isLifetime ? 99999 : Math.max(0, Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24)));
        const activeToken = bearerToken || existingCookieToken || req.headers['x-session-token'] as string || '';
        
        if (activeToken) {
          res.cookie(USER_COOKIE_NAME, activeToken, {
            ...getCookieOptions(req),
            maxAge: Math.max(0, license.expiresAt - now),
          });
        }

        res.json({
          ok: true,
          token: activeToken,
          sessionToken: activeToken,
          expiresAt: license.expiresAt,
          daysLeft,
          isLifetime,
          maskedKey: license.keyMasked,
          keyPlaintext: license.plaintextKey,
          customerName: incomingName || license.customerName,
          message: 'সেশন সক্রিয় রয়েছে।',
        });
        return;
      }

      // STRICT 1-BROWSER LOCK & FEATURE 15: Multi-Device Fraud Alert
      // The key is already bound to another browser/hardware.
      const currentUa = (req.headers['user-agent'] as string) || '';
      const currDetails = parseUserAgentDetailed(currentUa);
      const incomingDevice = `${currDetails.browserName} (${currDetails.osName})`.trim();
      const fraudText = `অননুমোদিত ডিভাইস থেকে অ্যাক্সেস চেষ্টা: ${incomingDevice} (IP: ${clientIp})`;

      await storage.updateLicense(license.id, {
        fraudAlert: fraudText,
      });

      await storage.recordFailedActivation();

      await storage.addSecurityEvent({
        level: 'danger',
        source: 'AUTH',
        message: `ফ্রড অ্যালার্ট: বাইন্ড করা কি-তে অননুমোদিত অ্যাক্সেস চেষ্টা (${license.keyMasked}, IP: ${clientIp})`,
        ip: clientIp,
        keyMasked: license.keyMasked,
      });

      sendTelegramAlert(
        `🚨 <b>মাল্টি-ডিভাইস ফ্রড অ্যালার্ট!</b>\nকী: <code>${license.keyMasked}</code>\nছাত্র: <b>${license.customerName || 'Unknown'}</b>\nআক্রমণকারী আইপি: <code>${clientIp}</code>\nডিভাইস: ${incomingDevice}\nস্ট্যাটাস: ইতিমধ্যে অন্য ব্রাউজারে লক করা কি-তে অননুমোদিত প্রবেশের চেষ্টা!`
      ).catch(() => {});

      res.status(409).json({
        ok: false,
        error: 'ALREADY_BOUND',
        message: 'এই অ্যাক্সেস কি-টি ইতিমধ্যে একটি ব্রাউজারে সংযুক্ত (Bound) রয়েছে। একটি কি শুধুমাত্র একটি ব্রাউজারে ব্যবহারযোগ্য। ব্রাউজার রিসেট বা ফোন পরিবর্তন করে থাকলে পূর্বের পেমেন্ট স্লিপ দেখিয়ে অ্যাডমিনের সাথে যোগাযোগ করে বাইন্ডিং রিসেট করে নিন।',
      });
      return;
    }

    // Generate new secure session token
    const sessionToken = generateSessionToken();
    const sessionHash = hashSessionToken(sessionToken);
    const ttlSeconds = Math.max(60, Math.floor((license.expiresAt - now) / 1000));

    const rawUserAgent = (req.headers['user-agent'] as string) || '';
    const uaDetails = parseUserAgentDetailed(rawUserAgent);
    const deviceInfo = `${uaDetails.browserName} ${uaDetails.browserVersion ? uaDetails.browserVersion.split('.')[0] : ''} (${uaDetails.osName})`.trim();

    const incomingClientMeta = req.body?.clientMetadata || {};
    const browserMetadata: ClientBrowserMetadata = {
      ip: clientIp,
      userAgent: rawUserAgent,
      browserName: uaDetails.browserName,
      browserVersion: uaDetails.browserVersion,
      osName: uaDetails.osName,
      osVersion: uaDetails.osVersion,
      deviceType: uaDetails.deviceType,
      screenResolution: typeof incomingClientMeta.screenResolution === 'string' ? incomingClientMeta.screenResolution : undefined,
      windowSize: typeof incomingClientMeta.windowSize === 'string' ? incomingClientMeta.windowSize : undefined,
      pixelRatio: typeof incomingClientMeta.pixelRatio === 'number' ? incomingClientMeta.pixelRatio : undefined,
      colorDepth: typeof incomingClientMeta.colorDepth === 'number' ? incomingClientMeta.colorDepth : undefined,
      language: typeof incomingClientMeta.language === 'string' ? incomingClientMeta.language : (req.headers['accept-language']?.split(',')[0] || undefined),
      timezone: typeof incomingClientMeta.timezone === 'string' ? incomingClientMeta.timezone : undefined,
      timezoneOffset: typeof incomingClientMeta.timezoneOffset === 'string' ? incomingClientMeta.timezoneOffset : undefined,
      touchSupport: typeof incomingClientMeta.touchSupport === 'boolean' ? incomingClientMeta.touchSupport : undefined,
      cpuCores: typeof incomingClientMeta.cpuCores === 'number' ? incomingClientMeta.cpuCores : undefined,
      deviceMemoryGb: typeof incomingClientMeta.deviceMemoryGb === 'number' ? incomingClientMeta.deviceMemoryGb : undefined,
      networkType: typeof incomingClientMeta.networkType === 'string' ? incomingClientMeta.networkType : undefined,
      platform: typeof incomingClientMeta.platform === 'string' ? incomingClientMeta.platform : undefined,
      onlineStatus: typeof incomingClientMeta.onlineStatus === 'boolean' ? incomingClientMeta.onlineStatus : undefined,
      capturedAt: now,
    };

    // Atomically claim the license binding for this browser with full metadata
    const updated = await storage.updateLicense(license.id, {
      browserBound: true,
      currentSessionHash: sessionHash,
      boundUserAgent: rawUserAgent,
      activatedAt: license.activatedAt || now,
      lastActiveAt: now,
      deviceInfo,
      clientIp,
      browserMetadata,
      ...(incomingName ? { customerName: incomingName } : {}),
    });

    if (!updated) {
      res.status(500).json({ ok: false, error: 'UPDATE_FAILED', message: 'Failed to bind license.' });
      return;
    }

    // Save session in storage
    await storage.saveUserSession(
      sessionHash,
      {
        licenseId: license.id,
        createdAt: now,
        expiresAt: license.expiresAt,
        lastSeenAt: now,
        userAgent: req.headers['user-agent']?.slice(0, 150),
      },
      ttlSeconds
    );

    // Audit log
    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      action: 'activate_license',
      licenseId: license.id,
      details: `License activated by customer. Browser bound. IP: ${clientIp}`,
      ip: clientIp,
    });

    // Telegram Notification & Student Action Timeline
    sendTelegramAlert(
      `🎉 <b>নতুন লাইসেন্স সক্রিয়করণ!</b>\nছাত্র: <b>${updated.customerName || 'নতুন শিক্ষার্থী'}</b>\nকী: <code>${updated.keyMasked}</code>\nডিভাইস: ${deviceInfo}\nআইপি: <code>${clientIp}</code>\nমেয়াদ: ${updated.durationDays} দিন`
    ).catch(() => {});

    await storage.addStudentAction({
      licenseId: license.id,
      keyMasked: license.keyMasked,
      customerName: updated.customerName,
      actionType: 'login',
      details: 'প্রথমবার ব্রাউজারে সফলভাবে সক্রিয়করণ সম্পন্ন',
      activeSection: 'ড্যাশবোর্ড',
      clientIp,
      deviceInfo,
    });

    // Set HttpOnly Secure Cookie
    const cookieOptions = {
      ...getCookieOptions(req),
      maxAge: Math.max(0, license.expiresAt - now),
    };
    res.cookie(USER_COOKIE_NAME, sessionToken, cookieOptions);

    const isLifetime = Boolean(license.isLifetime || license.durationDays >= 36500);
    const daysLeft = isLifetime ? 99999 : Math.max(0, Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24)));

    res.json({
      ok: true,
      token: sessionToken,
      sessionToken,
      expiresAt: license.expiresAt,
      daysLeft,
      isLifetime,
      maskedKey: license.keyMasked,
      message: isLifetime 
        ? 'অভিনন্দন! আপনার লাইফটাইম (আজীবন) অ্যাক্সেস কি সফলভাবে অ্যাক্টিভেট হয়েছে।' 
        : 'অভিনন্দন! আপনার অ্যাক্সেস কি সফলভাবে অ্যাক্টিভেট হয়েছে।',
    });
  } catch (error) {
    console.error('[auth/activate] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'সার্ভার প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' });
  }
});

/**
 * Customer: Check Current Session Status
 * GET /api/auth/session & GET /api/auth/me
 * Supports both HttpOnly cookie and Bearer header for mobile/webview reliability
 */
const handleCustomerSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const cookieToken = req.cookies?.[USER_COOKIE_NAME];
    const headerToken = req.headers['x-session-token'];
    const rawToken = (typeof cookieToken === 'string' && cookieToken.length >= 16)
      ? cookieToken
      : (bearerToken && bearerToken.length >= 16)
        ? bearerToken
        : (typeof headerToken === 'string' && headerToken.length >= 16)
          ? headerToken
          : null;

    if (!rawToken || typeof rawToken !== 'string') {
      res.json({ authenticated: false });
      return;
    }

    const sessionHash = hashSessionToken(rawToken);
    if (!sessionHash) {
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.json({ authenticated: false });
      return;
    }

    const sessionData = await storage.getUserSession(sessionHash);

    if (!sessionData) {
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.json({ authenticated: false });
      return;
    }

    const now = Date.now();
    if (now > sessionData.expiresAt) {
      await storage.deleteUserSession(sessionHash);
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.json({ authenticated: false, reason: 'EXPIRED' });
      return;
    }

    const license = await storage.getLicenseById(sessionData.licenseId);
    if (!license || license.status !== 'active' || now > license.expiresAt || !license.browserBound || license.currentSessionHash !== sessionHash) {
      await storage.deleteUserSession(sessionHash);
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
      res.json({ authenticated: false, reason: 'INVALID_OR_REVOKED' });
      return;
    }

    const isLifetime = Boolean(license.isLifetime || license.durationDays >= 36500);
    const daysLeft = isLifetime ? 99999 : Math.max(0, Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24)));

    // Update lastActiveAt, clientIp and browser metadata if available
    const rawUserAgent = (req.headers['user-agent'] as string) || '';
    const currentClientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
      (req.headers['cf-connecting-ip'] as string) || 
      (req.headers['x-real-ip'] as string) || 
      req.socket?.remoteAddress || 
      req.ip || 
      license.clientIp;

    if (!license.clientIp || !license.browserMetadata || currentClientIp !== license.clientIp) {
      const uaDetails = parseUserAgentDetailed(rawUserAgent);
      storage.updateLicense(license.id, {
        clientIp: currentClientIp,
        lastActiveAt: now,
        browserMetadata: {
          ...(license.browserMetadata || {}),
          ip: currentClientIp,
          userAgent: rawUserAgent || license.browserMetadata?.userAgent,
          browserName: uaDetails.browserName,
          browserVersion: uaDetails.browserVersion,
          osName: uaDetails.osName,
          osVersion: uaDetails.osVersion,
          deviceType: uaDetails.deviceType,
          capturedAt: now,
        }
      }).catch(() => {});
    }

    res.json({
      authenticated: true,
      expiresAt: license.expiresAt,
      daysLeft,
      isLifetime,
      keyMasked: license.keyMasked,
      keyPlaintext: license.plaintextKey,
      customerName: license.customerName,
      durationDays: license.durationDays,
    });
  } catch (error) {
    console.error('[auth/session] Error:', error);
    res.json({ authenticated: false });
  }
};

authRouter.get('/session', handleCustomerSession);
authRouter.get('/me', handleCustomerSession);

/**
 * Customer: Logout
 * POST /api/auth/logout
 */
authRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const cookieToken = req.cookies?.[USER_COOKIE_NAME];
    const rawToken = (typeof cookieToken === 'string' && cookieToken.length >= 16) ? cookieToken : bearerToken;

    if (rawToken && typeof rawToken === 'string') {
      const sessionHash = hashSessionToken(rawToken);
      if (sessionHash) {
        await storage.deleteUserSession(sessionHash);
      }
    }
    res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
    res.json({ ok: true });
  } catch (error) {
    console.error('[auth/logout] Error:', error);
    res.clearCookie(USER_COOKIE_NAME, getCookieOptions(req));
    res.json({ ok: true });
  }
});

/**
 * Customer: Sync Learning Progress & Streak
 * POST /api/auth/sync-progress
 */
authRouter.post('/sync-progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    const cookieToken = req.cookies?.[USER_COOKIE_NAME];
    const headerToken = req.headers['x-session-token'];
    const rawToken = (typeof cookieToken === 'string' && cookieToken.length >= 16)
      ? cookieToken
      : (bearerToken && bearerToken.length >= 16)
        ? bearerToken
        : (typeof headerToken === 'string' && headerToken.length >= 16)
          ? headerToken
          : null;

    if (!rawToken || typeof rawToken !== 'string') {
      res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
      return;
    }

    const sessionHash = hashSessionToken(rawToken);
    if (!sessionHash) {
      res.status(401).json({ ok: false, error: 'INVALID_SESSION' });
      return;
    }

    const sessionData = await storage.getUserSession(sessionHash);
    if (!sessionData) {
      res.status(401).json({ ok: false, error: 'SESSION_NOT_FOUND' });
      return;
    }

    const license = await storage.getLicenseById(sessionData.licenseId);
    if (!license || license.status !== 'active' || Date.now() > license.expiresAt) {
      res.status(403).json({ ok: false, error: 'LICENSE_INACTIVE' });
      return;
    }

    const { 
      learningStreak = 0, 
      lastStudyDate, 
      wordsStudied = 0, 
      wordsPracticed = 0, 
      wordsMastered = 0, 
      needsRevisionCount = 0,
      favoritesCount = 0,
      quizzesTaken = 0, 
      quizAccuracy = 0,
      studyHistory,
      activeFeature,
      tamperDetected
    } = req.body || {};

    const wordsStudiedNum = Math.max(0, parseInt(wordsStudied, 10) || 0);
    const streakNum = Math.max(0, parseInt(learningStreak, 10) || 0);

    // Feature 32: Anti-Tamper Check
    let isTampered = Boolean(tamperDetected);
    if (wordsStudiedNum > 50000 || streakNum > 10000) {
      isTampered = true;
    }

    const progress: UserProgressSummary = {
      learningStreak: streakNum,
      lastStudyDate: typeof lastStudyDate === 'string' ? lastStudyDate : null,
      wordsStudied: wordsStudiedNum,
      wordsPracticed: Math.max(0, parseInt(wordsPracticed, 10) || 0),
      wordsMastered: Math.max(0, parseInt(wordsMastered, 10) || 0),
      needsRevisionCount: Math.max(0, parseInt(needsRevisionCount, 10) || 0),
      favoritesCount: Math.max(0, parseInt(favoritesCount, 10) || 0),
      quizzesTaken: Math.max(0, parseInt(quizzesTaken, 10) || 0),
      quizAccuracy: Math.min(100, Math.max(0, parseInt(quizAccuracy, 10) || 0)),
      lastSyncAt: Date.now(),
      studyHistory: typeof studyHistory === 'object' && studyHistory !== null ? studyHistory : license.progress?.studyHistory,
      activeFeature: typeof activeFeature === 'string' ? activeFeature.slice(0, 80) : license.progress?.activeFeature,
      tamperFlag: isTampered,
    };

    const incomingClientMeta = req.body?.clientMetadata || {};
    const currentClientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
      (req.headers['cf-connecting-ip'] as string) || 
      (req.headers['x-real-ip'] as string) || 
      req.socket?.remoteAddress || 
      req.ip || 
      license.clientIp;

    const rawUserAgent = (req.headers['user-agent'] as string) || license.boundUserAgent || '';
    const uaDetails = parseUserAgentDetailed(rawUserAgent);

    const mergedBrowserMetadata: ClientBrowserMetadata = {
      ...(license.browserMetadata || {}),
      ip: currentClientIp,
      userAgent: rawUserAgent || license.browserMetadata?.userAgent,
      browserName: uaDetails.browserName,
      browserVersion: uaDetails.browserVersion,
      osName: uaDetails.osName,
      osVersion: uaDetails.osVersion,
      deviceType: uaDetails.deviceType,
      screenResolution: incomingClientMeta.screenResolution || license.browserMetadata?.screenResolution,
      windowSize: incomingClientMeta.windowSize || license.browserMetadata?.windowSize,
      pixelRatio: incomingClientMeta.pixelRatio || license.browserMetadata?.pixelRatio,
      colorDepth: incomingClientMeta.colorDepth || license.browserMetadata?.colorDepth,
      language: incomingClientMeta.language || license.browserMetadata?.language || req.headers['accept-language']?.split(',')[0],
      timezone: incomingClientMeta.timezone || license.browserMetadata?.timezone,
      timezoneOffset: incomingClientMeta.timezoneOffset || license.browserMetadata?.timezoneOffset,
      touchSupport: typeof incomingClientMeta.touchSupport === 'boolean' ? incomingClientMeta.touchSupport : license.browserMetadata?.touchSupport,
      cpuCores: incomingClientMeta.cpuCores || license.browserMetadata?.cpuCores,
      deviceMemoryGb: incomingClientMeta.deviceMemoryGb || license.browserMetadata?.deviceMemoryGb,
      networkType: incomingClientMeta.networkType || license.browserMetadata?.networkType,
      platform: incomingClientMeta.platform || license.browserMetadata?.platform,
      onlineStatus: typeof incomingClientMeta.onlineStatus === 'boolean' ? incomingClientMeta.onlineStatus : true,
      canvasFingerprintHash: incomingClientMeta.canvasFingerprintHash || license.browserMetadata?.canvasFingerprintHash,
      capturedAt: Date.now(),
    };

    if (isTampered) {
      await storage.addSecurityEvent({
        level: 'alert',
        source: 'TAMPER',
        message: `ট্যাম্পার সনাক্ত: ক্লায়েন্ট ডেটা ম্যানিপুলেশন (${license.keyMasked}, IP: ${currentClientIp})`,
        ip: currentClientIp,
        keyMasked: license.keyMasked,
      });

      sendTelegramAlert(
        `⚠️ <b>অ্যান্টি-ট্যাম্পার অ্যালার্ট!</b>\nকী: <code>${license.keyMasked}</code>\nছাত্র: <b>${license.customerName || 'Unknown'}</b>\nআইপি: <code>${currentClientIp}</code>\nস্ট্যাটাস: ব্রাউজারের লোকালস্টোরেজ বা স্টাডি কাউন্টারে অস্বাভাবিক পরিবর্তন সনাক্ত হয়েছে।`
      ).catch(() => {});
    }

    await storage.updateLicense(license.id, {
      progress,
      lastActiveAt: Date.now(),
      clientIp: currentClientIp,
      browserMetadata: mergedBrowserMetadata,
      ...(isTampered ? { tamperAlert: '⚠️ ক্লায়েন্ট ডেটা ম্যানিপুলেশন সনাক্ত করা হয়েছে' } : {}),
      canvasFingerprintHash: incomingClientMeta.canvasFingerprintHash || license.canvasFingerprintHash,
    });

    res.json({ ok: true, progress });
  } catch (error) {
    console.error('[auth/sync-progress] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

/**
 * Feature 51 & 25: Real-Time Action Ping & Timeline Logger
 * POST /api/auth/action-ping
 */
authRouter.post('/action-ping', requireCustomerAuth, async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
  try {
    const license = req.license!;
    const { actionType, details, activeSection } = req.body || {};

    if (!actionType || !details) {
      res.status(400).json({ ok: false, message: 'Invalid action ping' });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || license.clientIp;
    const now = Date.now();

    // Record action event
    const action = await storage.addStudentAction({
      licenseId: license.id,
      keyMasked: license.keyMasked,
      customerName: license.customerName,
      actionType,
      details,
      activeSection,
      clientIp,
      deviceInfo: license.deviceInfo,
    });

    // Update active feature & lastActiveAt on license
    if (activeSection) {
      const currentProgress = license.progress || {
        learningStreak: 0,
        wordsStudied: 0,
        wordsPracticed: 0,
        wordsMastered: 0,
        quizzesTaken: 0,
        quizAccuracy: 0,
        lastSyncAt: now,
      };
      await storage.updateLicense(license.id, {
        lastActiveAt: now,
        progress: {
          ...currentProgress,
          activeFeature: activeSection,
        },
      });
    }

    res.json({ ok: true, actionId: action.id });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

/**
 * Feature 7: Student Support Tickets Submission & Status
 * POST /api/support/ticket
 * GET /api/support/my-tickets
 */
// Helper to sanitize message input
function sanitizeText(str: any, maxLen: number): string {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .slice(0, maxLen)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

authRouter.post('/support/ticket', requireSupportUserSession, async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  try {
    const license = req.license;
    const isGuest = Boolean(req.isGuest);
    const supportId = req.supportIdentifier || (license ? license.id : `guest_${req.guestId}`);

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || (license ? license.clientIp : 'Unknown');

    // Anti-leak & Anti-flood Rate Limiting (max 20 messages per minute)
    const rate = await storage.checkRateLimit(`support_rate:${clientIp}`, 20, 60);
    if (!rate.allowed) {
      res.status(429).json({ ok: false, message: 'অতিরিক্ত মেসেজ পাঠানো হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।' });
      return;
    }

    const { message, customerName: bodyName } = req.body || {};
    const cleanMessage = sanitizeText(message, 3000);

    if (!cleanMessage || cleanMessage.length < 1) {
      res.status(400).json({ ok: false, message: 'বার্তা বা প্রশ্নের বিবরণ ফাঁকা রাখা যাবে না।' });
      return;
    }

    const senderDisplayName = (license ? license.customerName : null) || 
      (typeof bodyName === 'string' && bodyName.trim().length > 0 ? bodyName.trim().slice(0, 80) : null) || 
      (isGuest ? 'ভিজিটর / শিক্ষার্থী' : 'শিক্ষার্থী');

    const keyLabel = license ? license.keyMasked : 'অনিবন্ধিত';

    const now = Date.now();
    const initialMessage: SupportMessage = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'customer',
      senderName: senderDisplayName,
      text: cleanMessage,
      timestamp: now,
    };

    const ticket = await storage.createSupportTicket({
      licenseId: supportId,
      keyMasked: keyLabel,
      customerName: senderDisplayName,
      subject: '১:১ সরাসরি চ্যাট',
      message: cleanMessage,
      messages: [initialMessage],
      clientIp,
      clientDevice: license ? license.deviceInfo : (req.headers['user-agent']?.slice(0, 100) || 'Web Browser'),
    });

    // Telegram Alert with direct Reply capability (English Labels)
    sendTelegramAlert(
      `📩 <b>New Support Message</b>\n` +
      `User: <b>${senderDisplayName}</b>\n` +
      `Key: <code>${keyLabel}</code>\n` +
      `Ticket ID: <code>${ticket.id}</code>\n` +
      `Message: <i>${cleanMessage.slice(0, 300)}</i>\n` +
      `IP: <code>${clientIp}</code>\n\n` +
      `💡 <i>Reply to this message directly in Telegram, or send:</i>\n` +
      `<code>/reply ${ticket.id} your answer</code>`
    ).catch(() => {});

    await storage.addSecurityEvent({
      level: 'info',
      source: 'AUTH',
      message: `নতুন সরাসরি মেসেজ: ${senderDisplayName} (${keyLabel})`,
      ip: clientIp,
      keyMasked: keyLabel,
    });

    res.json({ ok: true, ticket, message: 'আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে।' });
  } catch (error) {
    console.error('[support/ticket] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Student 1:1 Chat Reply into existing ticket thread
authRouter.post('/support/ticket/:id/message', requireSupportUserSession, async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  try {
    const license = req.license;
    const isGuest = Boolean(req.isGuest);
    const supportId = req.supportIdentifier || (license ? license.id : `guest_${req.guestId}`);
    const ticketId = req.params.id;

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || (license ? license.clientIp : 'Unknown');

    // Anti-leak & Anti-flood Rate Limiting
    const rate = await storage.checkRateLimit(`support_rate:${clientIp}`, 20, 60);
    if (!rate.allowed) {
      res.status(429).json({ ok: false, message: 'অতিরিক্ত মেসেজ পাঠানো হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।' });
      return;
    }

    const { message, customerName: bodyName } = req.body || {};
    const cleanMessage = sanitizeText(message, 3000);
    if (!cleanMessage || cleanMessage.length < 1) {
      res.status(400).json({ ok: false, message: 'বার্তা ফাঁকা রাখা যাবে না।' });
      return;
    }

    // STRICT 1:1 VERIFICATION (IDOR Shield): Ticket MUST belong to the user's support identifier
    const ticket = await storage.getSupportTicketById(ticketId);
    if (!ticket || ticket.licenseId !== supportId) {
      res.status(404).json({ ok: false, message: 'চ্যাট থ্রেড পাওয়া যায়নি।' });
      return;
    }

    const senderDisplayName = (license ? license.customerName : null) || 
      (typeof bodyName === 'string' && bodyName.trim().length > 0 ? bodyName.trim().slice(0, 80) : null) || 
      ticket.customerName ||
      (isGuest ? 'ভিজিটর' : 'শিক্ষার্থী');

    const now = Date.now();
    const newMsg: SupportMessage = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'customer',
      senderName: senderDisplayName,
      text: cleanMessage,
      timestamp: now,
    };

    const existingMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const updatedMessages = [...existingMessages, newMsg];

    const updated = await storage.updateSupportTicket(ticket.id, {
      messages: updatedMessages,
      status: 'open', // Mark open so admin sees unread message
      updatedAt: now,
    });

    sendTelegramAlert(
      `💬 <b>New Support Reply</b>\n` +
      `User: <b>${senderDisplayName}</b>\n` +
      `Ticket ID: <code>${ticket.id}</code>\n` +
      `Message: <i>${cleanMessage.slice(0, 300)}</i>\n\n` +
      `💡 <i>Reply to this message directly in Telegram, or send:</i>\n` +
      `<code>/reply ${ticket.id} your answer</code>`
    ).catch(() => {});

    res.json({ ok: true, ticket: updated, message: 'মেসেজ পাঠানো হয়েছে।' });
  } catch (error) {
    console.error('[support/ticket/:id/message] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Student fetch their own tickets (Strict 1:1 filter + Anti-leak headers)
authRouter.get('/support/my-tickets', requireSupportUserSession, async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  try {
    const supportId = req.supportIdentifier || (req.license ? req.license.id : `guest_${req.guestId}`);
    const tickets = await storage.listSupportTicketsByLicense(supportId);
    res.json({ ok: true, tickets });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Lightweight unread reply counter for student header icon badge
authRouter.get('/support/unread-count', requireSupportUserSession, async (req: AuthenticatedUserRequest, res: Response): Promise<void> => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  try {
    const supportId = req.supportIdentifier || (req.license ? req.license.id : `guest_${req.guestId}`);
    const since = parseInt((req.query.since as string) || '0', 10) || 0;
    const tickets = await storage.listSupportTicketsByLicense(supportId);
    let unreadCount = 0;
    let latestAdminReplyAt = 0;

    for (const t of tickets) {
      const messages = t.messages || [];
      for (const m of messages) {
        if (m.sender === 'admin') {
          if (m.timestamp > latestAdminReplyAt) {
            latestAdminReplyAt = m.timestamp;
          }
          if (m.timestamp > since) {
            unreadCount++;
          }
        }
      }
    }

    res.json({ ok: true, unreadCount, latestAdminReplyAt });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});



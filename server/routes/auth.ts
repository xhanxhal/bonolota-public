import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { UserProgressSummary } from '../types';
import { 
  hashLicenseKey, 
  generateSessionToken, 
  hashSessionToken,
  normalizeKey,
  parseUserAgent
} from '../crypto';
import { 
  USER_COOKIE_NAME, 
  getCookieOptions, 
  requireCustomerAuth, 
  AuthenticatedUserRequest 
} from '../auth';

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
        res.json({
          ok: true,
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

      // STRICT 1-BROWSER LOCK:
      // The key is already bound to a browser.
      // If the user reset their browser or changed phones, they must contact admin with their payment slip to reset binding.
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

    const rawUserAgent = req.headers['user-agent'] as string | undefined;
    const deviceInfo = parseUserAgent(rawUserAgent);

    // Atomically claim the license binding for this browser
    const updated = await storage.updateLicense(license.id, {
      browserBound: true,
      currentSessionHash: sessionHash,
      boundUserAgent: rawUserAgent,
      activatedAt: license.activatedAt || now,
      lastActiveAt: now,
      deviceInfo,
      clientIp,
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
      quizAccuracy = 0 
    } = req.body || {};

    const progress: UserProgressSummary = {
      learningStreak: Math.max(0, parseInt(learningStreak, 10) || 0),
      lastStudyDate: typeof lastStudyDate === 'string' ? lastStudyDate : null,
      wordsStudied: Math.max(0, parseInt(wordsStudied, 10) || 0),
      wordsPracticed: Math.max(0, parseInt(wordsPracticed, 10) || 0),
      wordsMastered: Math.max(0, parseInt(wordsMastered, 10) || 0),
      needsRevisionCount: Math.max(0, parseInt(needsRevisionCount, 10) || 0),
      favoritesCount: Math.max(0, parseInt(favoritesCount, 10) || 0),
      quizzesTaken: Math.max(0, parseInt(quizzesTaken, 10) || 0),
      quizAccuracy: Math.min(100, Math.max(0, parseInt(quizAccuracy, 10) || 0)),
      lastSyncAt: Date.now(),
    };

    await storage.updateLicense(license.id, {
      progress,
      lastActiveAt: Date.now(),
    });

    res.json({ ok: true, progress });
  } catch (error) {
    console.error('[auth/sync-progress] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});


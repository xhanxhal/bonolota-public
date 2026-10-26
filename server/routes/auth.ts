import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { 
  hashLicenseKey, 
  generateSessionToken, 
  hashSessionToken,
  normalizeKey 
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
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';
    
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

    const { key } = req.body || {};
    if (!key || typeof key !== 'string') {
      res.status(400).json({
        ok: false,
        error: 'MISSING_KEY',
        message: 'অনুগ্রহ করে অ্যাক্সেস কি লিখুন। (Please provide a valid access key.)',
      });
      return;
    }

    const normalized = normalizeKey(key);
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
    const license = await storage.getLicenseByHash(keyHash);

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

    // Check single browser binding
    const existingCookieToken = req.cookies?.[USER_COOKIE_NAME];
    const existingCookieHash = existingCookieToken ? hashSessionToken(existingCookieToken) : null;

    if (license.browserBound) {
      // If the current browser already holds the active session for this license, re-authenticate smoothly
      if (existingCookieHash && license.currentSessionHash === existingCookieHash) {
        const daysLeft = Math.max(0, Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24)));
        res.json({
          ok: true,
          expiresAt: license.expiresAt,
          daysLeft,
          message: 'সেশন পুনরায় সক্রিয় করা হয়েছে।',
        });
        return;
      }

      // Otherwise, another browser is already bound to this license!
      res.status(409).json({
        ok: false,
        error: 'ALREADY_BOUND',
        message: 'এই অ্যাক্সেস কি-টি ইতিমধ্যে অন্য একটি ব্রাউজারে সংযুক্ত (Bound) রয়েছে। আপনি যদি ব্রাউজার বা ডিভাইস পরিবর্তন করে থাকেন, তবে অ্যাডমিনকে রিকোয়েস্ট করে ব্রাউজার বাইন্ডিং রিসেট করুন।',
      });
      return;
    }

    // Generate new secure session token
    const sessionToken = generateSessionToken();
    const sessionHash = hashSessionToken(sessionToken);
    const ttlSeconds = Math.max(60, Math.floor((license.expiresAt - now) / 1000));

    // Atomically claim the license binding
    const updated = await storage.updateLicense(license.id, {
      browserBound: true,
      currentSessionHash: sessionHash,
      activatedAt: license.activatedAt || now,
      lastActiveAt: now,
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
      ...getCookieOptions(),
      maxAge: Math.max(0, license.expiresAt - now),
    };
    res.cookie(USER_COOKIE_NAME, sessionToken, cookieOptions);

    const daysLeft = Math.max(0, Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24)));

    res.json({
      ok: true,
      expiresAt: license.expiresAt,
      daysLeft,
      message: 'অভিনন্দন! আপনার অ্যাক্সেস কি সফলভাবে অ্যাক্টিভেট হয়েছে।',
    });
  } catch (error) {
    console.error('[auth/activate] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'সার্ভার প্রক্রিয়াকরণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' });
  }
});

/**
 * Customer: Check Current Session Status
 * GET /api/auth/session
 */
authRouter.get('/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.[USER_COOKIE_NAME];
    if (!rawToken || typeof rawToken !== 'string') {
      res.json({ authenticated: false });
      return;
    }

    const sessionHash = hashSessionToken(rawToken);
    const sessionData = await storage.getUserSession(sessionHash);

    if (!sessionData) {
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions());
      res.json({ authenticated: false });
      return;
    }

    const now = Date.now();
    if (now > sessionData.expiresAt) {
      await storage.deleteUserSession(sessionHash);
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions());
      res.json({ authenticated: false, reason: 'EXPIRED' });
      return;
    }

    const license = await storage.getLicenseById(sessionData.licenseId);
    if (!license || license.status !== 'active' || now > license.expiresAt || !license.browserBound || license.currentSessionHash !== sessionHash) {
      await storage.deleteUserSession(sessionHash);
      res.clearCookie(USER_COOKIE_NAME, getCookieOptions());
      res.json({ authenticated: false, reason: 'INVALID_OR_REVOKED' });
      return;
    }

    const daysLeft = Math.max(0, Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24)));

    res.json({
      authenticated: true,
      expiresAt: license.expiresAt,
      daysLeft,
      keyMasked: license.keyMasked,
      durationDays: license.durationDays,
    });
  } catch (error) {
    console.error('[auth/session] Error:', error);
    res.json({ authenticated: false });
  }
});

/**
 * Customer: Logout
 * POST /api/auth/logout
 */
authRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.[USER_COOKIE_NAME];
    if (rawToken && typeof rawToken === 'string') {
      const sessionHash = hashSessionToken(rawToken);
      await storage.deleteUserSession(sessionHash);
    }
    res.clearCookie(USER_COOKIE_NAME, getCookieOptions());
    res.json({ ok: true });
  } catch (error) {
    console.error('[auth/logout] Error:', error);
    res.clearCookie(USER_COOKIE_NAME, getCookieOptions());
    res.json({ ok: true });
  }
});

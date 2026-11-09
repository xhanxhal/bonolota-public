import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { 
  generateAccessKey, 
  maskKey, 
  hashLicenseKey, 
  hashPassword, 
  verifyPassword, 
  generateSessionToken, 
  hashSessionToken 
} from '../crypto';
import { 
  ADMIN_COOKIE_NAME, 
  getCookieOptions, 
  requireAdminAuth, 
  AuthenticatedAdminRequest 
} from '../auth';
import { LicenseRecord, SystemHealthMetrics, SupportMessage } from '../types';
import { sendTelegramAlert, testTelegramConnection } from '../telegram';
import { 
  canBlockIp, 
  isLoopbackIp, 
  validateTelegramBotToken, 
  validateTelegramChatId 
} from '../security';

export const adminRouter = Router();

// Admin Password & Secret Route Configuration
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || 'Chanchal11@@';

export function getAdminRouteSecret(): string {
  return process.env.ADMIN_ROUTE_SECRET || 'x-admin-arifa';
}

/**
 * Admin: Check Route & Session Status
 * GET /api/admin/session
 */
adminRouter.get('/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.[ADMIN_COOKIE_NAME];
    if (!rawToken || typeof rawToken !== 'string') {
      res.json({ authenticated: false, isInitialPasswordActive: !process.env.ADMIN_PASSWORD_HASH });
      return;
    }

    const sessionHash = hashSessionToken(rawToken);
    if (!sessionHash) {
      res.clearCookie(ADMIN_COOKIE_NAME, getCookieOptions(req));
      res.json({ authenticated: false, isInitialPasswordActive: !process.env.ADMIN_PASSWORD_HASH });
      return;
    }

    const sessionData = await storage.getAdminSession(sessionHash);

    if (!sessionData || Date.now() > sessionData.expiresAt) {
      res.clearCookie(ADMIN_COOKIE_NAME, getCookieOptions(req));
      res.json({ authenticated: false, isInitialPasswordActive: !process.env.ADMIN_PASSWORD_HASH });
      return;
    }

    res.json({
      authenticated: true,
      adminId: sessionData.adminId,
      expiresAt: sessionData.expiresAt,
      isInitialPasswordActive: !process.env.ADMIN_PASSWORD_HASH,
      isUsingFallbackStore: !storage.isPersistent(),
    });
  } catch (error) {
    console.error('[admin/session] Error:', error);
    res.json({ authenticated: false });
  }
});

/**
 * Admin: Login
 * POST /api/admin/login
 */
adminRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || req.ip || 'unknown';
    const isLoopback = isLoopbackIp(clientIp);

    // Rate limit: 5 attempts per 15 minutes per IP (50 for loopback/local dev so localhost is never locked out)
    const maxAttempts = isLoopback ? 50 : 5;
    const rateCheck = await storage.checkRateLimit(`adminlogin:${clientIp}`, maxAttempts, 15 * 60);
    if (!rateCheck.allowed) {
      await storage.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        action: 'admin_failed_login',
        details: `Brute force rate limit exceeded from IP: ${clientIp}`,
        ip: clientIp,
      });

      res.status(429).json({
        ok: false,
        error: 'RATE_LIMITED',
        message: 'Too many failed login attempts. Account temporarily locked for 15 minutes.',
      });
      return;
    }

    const { password } = req.body || {};
    if (!password || typeof password !== 'string') {
      res.status(400).json({ ok: false, error: 'MISSING_PASSWORD', message: 'Password is required.' });
      return;
    }

    let isValid = false;
    const customHash = await storage.getAdminPasswordHash();
    if (customHash && verifyPassword(password, customHash)) {
      isValid = true;
    } else if (!customHash && password === DEFAULT_ADMIN_PASS) {
      isValid = true;
    } else if (process.env.ADMIN_PASSWORD_HASH && verifyPassword(password, process.env.ADMIN_PASSWORD_HASH)) {
      isValid = true;
    }

    if (!isValid) {
      await storage.recordFailedAdminLogin();
      await storage.addSecurityEvent({
        level: 'warn',
        source: 'AUTH',
        message: `অ্যাডমিন লগইনে ব্যর্থ চেষ্টা (IP: ${clientIp})`,
        ip: clientIp,
      });

      await storage.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        action: 'admin_failed_login',
        details: `Failed admin login attempt from IP: ${clientIp}`,
        ip: clientIp,
      });

      sendTelegramAlert(
        `⚠️ <b>Admin Login Warning!</b>\n` +
        `IP: <code>${clientIp}</code>\n` +
        `Status: Failed login attempt with incorrect admin password.`
      ).catch(() => {});

      res.status(401).json({
        ok: false,
        error: 'INVALID_CREDENTIALS',
        message: 'ভুল অ্যাডমিন পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
      });
      return;
    }

    // Success: Create Admin Session (Valid for 12 hours)
    const sessionToken = generateSessionToken();
    const sessionHash = hashSessionToken(sessionToken);
    const ttlSeconds = 12 * 60 * 60; // 12 hours
    const expiresAt = Date.now() + ttlSeconds * 1000;

    await storage.saveAdminSession(
      sessionHash,
      {
        adminId: 'super-admin',
        createdAt: Date.now(),
        expiresAt,
      },
      ttlSeconds
    );

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'admin_login',
      details: `Successful admin login from IP: ${clientIp}`,
      ip: clientIp,
    });

    // Set HttpOnly Admin Cookie
    res.cookie(ADMIN_COOKIE_NAME, sessionToken, {
      ...getCookieOptions(req),
      maxAge: ttlSeconds * 1000,
    });

    res.json({
      ok: true,
      token: sessionToken,
      expiresAt,
      isInitialPasswordActive: !process.env.ADMIN_PASSWORD_HASH,
      isUsingFallbackStore: !storage.isPersistent(),
      message: 'Admin authentication successful.',
    });
  } catch (error) {
    console.error('[admin/login] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Admin login processing error.' });
  }
});

/**
 * Admin: Logout
 * POST /api/admin/logout
 */
adminRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.[ADMIN_COOKIE_NAME];
    if (rawToken && typeof rawToken === 'string') {
      const sessionHash = hashSessionToken(rawToken);
      if (sessionHash) {
        await storage.deleteAdminSession(sessionHash);
      }
    }
    res.clearCookie(ADMIN_COOKIE_NAME, getCookieOptions(req));
    res.json({ ok: true, message: 'Admin logged out.' });
  } catch (error) {
    console.error('[admin/logout] Error:', error);
    res.clearCookie(ADMIN_COOKIE_NAME, getCookieOptions(req));
    res.json({ ok: true });
  }
});

/**
 * Admin: Overview Stats
 * GET /api/admin/overview
 * GET /api/admin/stats
 */
const handleOverviewStats = async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await storage.getOverviewStats();
    res.json({
      ok: true,
      stats,
      total: stats.total,
      totalLicenses: stats.total,
      active: stats.active,
      activated: stats.activated,
      unactivated: stats.unactivated,
      expired: stats.expired,
      suspended: stats.suspended,
      revoked: stats.revoked,
      boundCount: stats.activated,
      unboundCount: stats.unactivated,
      recentlyActivated: stats.recentlyActivated || [],
    });
  } catch (error) {
    console.error('[admin/overview] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to fetch overview stats.' });
  }
};

adminRouter.get('/overview', requireAdminAuth, handleOverviewStats);
adminRouter.get('/stats', requireAdminAuth, handleOverviewStats);

/**
 * Admin: Create New Access Key License
 * POST /api/admin/licenses/create
 */
adminRouter.post('/licenses/create', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { durationDays, customerNote, customerName, isLifetime } = req.body || {};
    const isLife = isLifetime === true || durationDays === 'lifetime' || durationDays === 36500;
    let days = isLife ? 36500 : parseInt(durationDays, 10);

    if (!isLife && (isNaN(days) || days <= 0 || days > 36500)) {
      res.status(400).json({ ok: false, error: 'INVALID_DURATION', message: 'Duration must be between 1 and 36500 days, or lifetime.' });
      return;
    }

    // Generate secure random access key
    const plaintextKey = generateAccessKey();
    const masked = maskKey(plaintextKey);
    const keyHash = hashLicenseKey(plaintextKey);

    // Subscription period starts at generation time (Server UTC ms)
    const now = Date.now();
    const expiresAt = now + days * 24 * 60 * 60 * 1000;
    const licenseId = `lic_${now}_${Math.random().toString(36).substring(2, 8)}`;

    const newLicense: LicenseRecord = {
      id: licenseId,
      keyMasked: masked,
      plaintextKey, // Store plaintext key so admin can view, copy, and send anytime
      keyHash,
      status: 'active',
      createdAt: now,
      expiresAt,
      durationDays: days,
      isLifetime: isLife,
      browserBound: false,
      customerName: typeof customerName === 'string' ? customerName.trim().slice(0, 100) : undefined,
      customerNote: typeof customerNote === 'string' ? customerNote.trim().slice(0, 200) : undefined,
    };

    // Store in Redis
    await storage.createLicense(newLicense);

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      action: 'create_license',
      licenseId,
      details: isLife 
        ? `Created Lifetime (আজীবন) license (${masked}). Note: ${customerNote || 'None'}`
        : `Created ${days}-day license (${masked}). Note: ${customerNote || 'None'}`,
    });

    // Return the plaintextKey ONE-TIME ONLY so admin can copy and send to customer
    res.json({
      ok: true,
      key: plaintextKey,
      plaintextKey,
      isLifetime: isLife,
      license: newLicense,
      warning: 'Save this key now. Plaintext keys are not stored and cannot be recovered once you leave this screen.',
    });
  } catch (error) {
    console.error('[admin/licenses/create] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to create license.' });
  }
});

/**
 * Admin: List Licenses with Search & Filter
 * GET /api/admin/licenses
 */
adminRouter.get('/licenses', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query as { status?: string; search?: string };
    const all = await storage.listLicenses();
    const now = Date.now();

    let filtered = all;

    if (status && status !== 'all') {
      if (status === 'active') {
        filtered = filtered.filter(l => l.status === 'active' && now <= l.expiresAt);
      } else if (status === 'expired') {
        filtered = filtered.filter(l => now > l.expiresAt && l.status !== 'revoked');
      } else if (status === 'suspended') {
        filtered = filtered.filter(l => l.status === 'suspended');
      } else if (status === 'revoked') {
        filtered = filtered.filter(l => l.status === 'revoked');
      } else if (status === 'bound') {
        filtered = filtered.filter(l => l.browserBound && l.status === 'active' && now <= l.expiresAt);
      } else if (status === 'unbound') {
        filtered = filtered.filter(l => !l.browserBound && l.status === 'active' && now <= l.expiresAt);
      }
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(l => 
        l.id.toLowerCase().includes(q) ||
        l.keyMasked.toLowerCase().includes(q) ||
        (l.plaintextKey && l.plaintextKey.toLowerCase().includes(q)) ||
        (l.customerNote && l.customerNote.toLowerCase().includes(q))
      );
    }

    res.json({ ok: true, licenses: filtered });
  } catch (error) {
    console.error('[admin/licenses] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to retrieve licenses.' });
  }
});

/**
 * Admin: Extend Subscription Duration
 * POST /api/admin/licenses/:id/extend
 */
adminRouter.post('/licenses/:id/extend', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { additionalDays, days: altDays, isLifetime } = req.body || {};
    const isLife = isLifetime === true || additionalDays === 'lifetime' || altDays === 'lifetime';
    const days = isLife ? 36500 : parseInt(additionalDays || altDays, 10);

    if (!isLife && (isNaN(days) || days <= 0 || days > 36500)) {
      res.status(400).json({ ok: false, error: 'INVALID_DAYS', message: 'Invalid extension days.' });
      return;
    }

    const license = await storage.getLicenseById(id);
    if (!license) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'License not found.' });
      return;
    }

    const now = Date.now();
    // If already expired, extend from now; if still active, extend from current expiresAt
    const baseTimestamp = license.expiresAt > now ? license.expiresAt : now;
    const newExpiresAt = isLife ? now + 36500 * 24 * 60 * 60 * 1000 : baseTimestamp + days * 24 * 60 * 60 * 1000;

    const updated = await storage.updateLicense(id, {
      expiresAt: newExpiresAt,
      durationDays: isLife ? 36500 : license.durationDays + days,
      isLifetime: isLife || license.isLifetime,
      // If was expired and now extended, restore active status if not explicitly revoked
      status: license.status === 'revoked' ? 'revoked' : 'active',
    });

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      action: isLife ? 'make_lifetime' : 'extend_license',
      licenseId: id,
      details: isLife
        ? `Converted license ${license.keyMasked} to Lifetime (আজীবন).`
        : `Extended license ${license.keyMasked} by ${days} days. New expiry: ${new Date(newExpiresAt).toISOString()}`,
    });

    res.json({ ok: true, license: updated, message: isLife ? 'লাইসেন্স সফলভাবে আজীবন (Lifetime) করা হয়েছে!' : `মেয়াদ সফলভাবে +${days} দিন বাড়ানো হয়েছে!` });
  } catch (error) {
    console.error('[admin/licenses/extend] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to extend license.' });
  }
});

/**
 * Admin: Upgrade license directly to Lifetime
 * POST /api/admin/licenses/:id/make-lifetime
 */
adminRouter.post('/licenses/:id/make-lifetime', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const license = await storage.getLicenseById(id);
    if (!license) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'License not found.' });
      return;
    }

    const now = Date.now();
    const newExpiresAt = now + 36500 * 24 * 60 * 60 * 1000;

    const updated = await storage.updateLicense(id, {
      expiresAt: newExpiresAt,
      durationDays: 36500,
      isLifetime: true,
      status: license.status === 'revoked' ? 'revoked' : 'active',
    });

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      action: 'make_lifetime',
      licenseId: id,
      details: `Upgraded license ${license.keyMasked} to Lifetime (আজীবন).`,
    });

    res.json({ ok: true, license: updated, message: 'লাইসেন্স সফলভাবে আজীবন (Lifetime) করা হয়েছে!' });
  } catch (error) {
    console.error('[admin/licenses/make-lifetime] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to upgrade to lifetime.' });
  }
});

/**
 * Admin: Reset Browser Binding
 * POST /api/admin/licenses/:id/reset-binding
 */
adminRouter.post('/licenses/:id/reset-binding', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const license = await storage.getLicenseById(id);
    if (!license) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'License not found.' });
      return;
    }

    // Invalidate existing user session in storage
    if (license.currentSessionHash) {
      await storage.deleteUserSession(license.currentSessionHash);
    }

    const updated = await storage.updateLicense(id, {
      browserBound: false,
      boundDeviceId: undefined,
      boundUserAgent: undefined,
      currentSessionHash: undefined,
      deviceInfo: undefined,
      clientIp: undefined,
    });

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'reset_binding',
      licenseId: id,
      details: `Reset browser binding for ${license.keyMasked}. Previous session invalidated.`,
    });

    res.json({ ok: true, license: updated, message: 'Browser binding successfully reset. The customer may now bind a new browser.' });
  } catch (error) {
    console.error('[admin/licenses/reset-binding] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to reset browser binding.' });
  }
});

/**
 * Admin: Suspend License
 * POST /api/admin/licenses/:id/suspend
 */
adminRouter.post('/licenses/:id/suspend', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const license = await storage.getLicenseById(id);
    if (!license) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'License not found.' });
      return;
    }

    const updated = await storage.updateLicense(id, { status: 'suspended' });

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'suspend_license',
      licenseId: id,
      details: `Suspended license ${license.keyMasked}.`,
    });

    res.json({ ok: true, license: updated });
  } catch (error) {
    console.error('[admin/licenses/suspend] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to suspend license.' });
  }
});

/**
 * Admin: Reactivate Suspended License
 * POST /api/admin/licenses/:id/reactivate
 */
adminRouter.post('/licenses/:id/reactivate', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const license = await storage.getLicenseById(id);
    if (!license) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'License not found.' });
      return;
    }

    if (license.status === 'revoked') {
      res.status(400).json({ ok: false, error: 'CANNOT_REACTIVATE_REVOKED', message: 'Revoked licenses cannot be reactivated.' });
      return;
    }

    const now = Date.now();
    if (now > license.expiresAt) {
      res.status(400).json({ ok: false, error: 'LICENSE_EXPIRED', message: 'License has expired. Please extend duration before reactivating.' });
      return;
    }

    const updated = await storage.updateLicense(id, { status: 'active' });

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'reactivate_license',
      licenseId: id,
      details: `Reactivated license ${license.keyMasked}.`,
    });

    res.json({ ok: true, license: updated });
  } catch (error) {
    console.error('[admin/licenses/reactivate] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to reactivate license.' });
  }
});

/**
 * Admin: Permanently Revoke License
 * POST /api/admin/licenses/:id/revoke
 */
adminRouter.post('/licenses/:id/revoke', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const license = await storage.getLicenseById(id);
    if (!license) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'License not found.' });
      return;
    }

    // Immediately kill active session
    if (license.currentSessionHash) {
      await storage.deleteUserSession(license.currentSessionHash);
    }

    const updated = await storage.updateLicense(id, {
      status: 'revoked',
      browserBound: false,
      currentSessionHash: undefined,
    });

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'revoke_license',
      licenseId: id,
      details: `Permanently revoked license ${license.keyMasked}. Active session destroyed.`,
    });

    res.json({ ok: true, license: updated, message: 'License permanently revoked.' });
  } catch (error) {
    console.error('[admin/licenses/revoke] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to revoke license.' });
  }
});
/**
 * Admin: Permanently Delete License
 * DELETE /api/admin/licenses/:id
 * POST /api/admin/licenses/:id/delete
 */
const handleDeleteLicense = async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const license = await storage.getLicenseById(id);
    if (!license) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'License not found.' });
      return;
    }

    if (license.currentSessionHash) {
      await storage.deleteUserSession(license.currentSessionHash);
    }

    const deleted = await storage.deleteLicense(id);

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'delete_license',
      licenseId: id,
      details: `Permanently deleted license ${license.keyMasked} from database.`,
    });

    res.json({ ok: true, deleted, message: 'License permanently deleted from database.' });
  } catch (error) {
    console.error('[admin/licenses/delete] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to delete license.' });
  }
};

adminRouter.delete('/licenses/:id', requireAdminAuth, handleDeleteLicense);
adminRouter.post('/licenses/:id/delete', requireAdminAuth, handleDeleteLicense);

/**
 * Admin: Update Customer Name on License
 * PATCH /api/admin/licenses/:id/name
 * POST /api/admin/licenses/:id/name
 */
const handleUpdateCustomerName = async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, customerName } = req.body || {};
    const newName = typeof customerName === 'string' ? customerName.trim() : (typeof name === 'string' ? name.trim() : '');

    const license = await storage.getLicenseById(id);
    if (!license) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND', message: 'License not found.' });
      return;
    }

    const updated = await storage.updateLicense(id, { customerName: newName });

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'update_customer_name',
      licenseId: id,
      details: `Updated customer name for ${license.keyMasked} to "${newName}".`,
    });

    res.json({ ok: true, license: updated, message: 'গ্রাহকের নাম সফলভাবে আপডেট করা হয়েছে।' });
  } catch (error) {
    console.error('[admin/licenses/name] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to update customer name.' });
  }
};

adminRouter.patch('/licenses/:id/name', requireAdminAuth, handleUpdateCustomerName);
adminRouter.post('/licenses/:id/name', requireAdminAuth, handleUpdateCustomerName);

/**
 * Admin: Audit Logs
 * GET /api/admin/audit
 */
adminRouter.get('/audit', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const logs = await storage.getAuditLogs(150);
    res.json({ ok: true, logs });
  } catch (error) {
    console.error('[admin/audit] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to fetch audit logs.' });
  }
});

/**
 * Feature 8: Change Admin Password
 * POST /api/admin/change-password
 */
adminRouter.post('/change-password', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || req.ip || 'unknown';
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      res.status(400).json({ ok: false, error: 'MISSING_FIELDS', message: 'বর্তমান পাসওয়ার্ড এবং নতুন পাসওয়ার্ড উভয়ই আবশ্যক।' });
      return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({ ok: false, error: 'WEAK_PASSWORD', message: 'নতুন পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে।' });
      return;
    }

    // Verify current password
    let isCurrentValid = false;
    const customHash = await storage.getAdminPasswordHash();
    if (customHash && verifyPassword(currentPassword, customHash)) {
      isCurrentValid = true;
    } else if (!customHash && currentPassword === DEFAULT_ADMIN_PASS) {
      isCurrentValid = true;
    } else if (process.env.ADMIN_PASSWORD_HASH && verifyPassword(currentPassword, process.env.ADMIN_PASSWORD_HASH)) {
      isCurrentValid = true;
    }

    if (!isCurrentValid) {
      res.status(401).json({ ok: false, error: 'INVALID_CURRENT_PASSWORD', message: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' });
      return;
    }

    // Hash and store new password
    const newHash = hashPassword(newPassword);
    await storage.setAdminPasswordHash(newHash);

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'admin_login',
      details: `Administrator password changed successfully from IP: ${clientIp}`,
      ip: clientIp,
    });

    await storage.addSecurityEvent({
      level: 'alert',
      source: 'AUTH',
      message: `অ্যাডমিনিস্ট্রেটর পাসওয়ার্ড পরিবর্তিত হয়েছে (IP: ${clientIp})`,
      ip: clientIp,
    });

    sendTelegramAlert(
      `🔐 <b>Admin Password Changed!</b>\n` +
      `IP: <code>${clientIp}</code>\n` +
      `Time: ${new Date().toISOString()}\n` +
      `Status: Administrator password updated successfully.`
    ).catch(() => {});

    res.json({ ok: true, message: 'অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।' });
  } catch (error) {
    console.error('[admin/change-password] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।' });
  }
});

/**
 * Feature 57: Telegram Bot Settings & Webhook
 * GET /api/admin/telegram/config
 * POST /api/admin/telegram/config
 * POST /api/admin/telegram/test
 */
adminRouter.get('/telegram/config', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const config = await storage.getSecurityConfig();
    res.json({
      ok: true,
      telegram: {
        enabled: config.telegram?.enabled ?? true,
        botToken: config.telegram?.botToken || '',
        chatId: config.telegram?.chatId || '',
      },
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

adminRouter.post('/telegram/config', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { botToken, chatId, enabled } = req.body || {};
    const cleanToken = typeof botToken === 'string' ? botToken.trim() : '';
    const cleanChatId = typeof chatId === 'string' ? chatId.trim() : '';

    if (cleanToken) {
      const tokenCheck = validateTelegramBotToken(cleanToken);
      if (!tokenCheck.valid) {
        res.status(400).json({ ok: false, message: tokenCheck.reason });
        return;
      }
    }

    if (cleanChatId) {
      const chatCheck = validateTelegramChatId(cleanChatId);
      if (!chatCheck.valid) {
        res.status(400).json({ ok: false, message: chatCheck.reason });
        return;
      }
    }

    const updated = await storage.updateSecurityConfig({
      telegram: {
        enabled: typeof enabled === 'boolean' ? enabled : true,
        botToken: cleanToken,
        chatId: cleanChatId,
      },
    });

    await storage.addSecurityEvent({
      level: 'info',
      source: 'TELEGRAM',
      message: `টেলিগ্রাম কনফিগারেশন আপডেট করা হয়েছে (Chat ID: ${cleanChatId || 'not set'})`,
    });

    res.json({ ok: true, telegram: updated.telegram, message: 'টেলিগ্রাম সেটিংস সফলভাবে সংরক্ষিত হয়েছে।' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

adminRouter.post('/telegram/test', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { botToken, chatId } = req.body || {};
    const config = await storage.getSecurityConfig();
    const cleanToken = (botToken || config.telegram?.botToken || '').trim();
    const cleanChat = (chatId || config.telegram?.chatId || '').trim();

    if (!cleanToken || !cleanChat) {
      res.status(400).json({ ok: false, message: 'বট টোকেন এবং চ্যাট আইডি উভয়ই পূরণ করতে হবে।' });
      return;
    }

    const tokenCheck = validateTelegramBotToken(cleanToken);
    if (!tokenCheck.valid) {
      res.status(400).json({ ok: false, message: tokenCheck.reason });
      return;
    }

    const chatCheck = validateTelegramChatId(cleanChat);
    if (!chatCheck.valid) {
      res.status(400).json({ ok: false, message: chatCheck.reason });
      return;
    }

    const result = await testTelegramConnection(cleanToken, cleanChat);
    res.json({ ok: result.success, message: result.message });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: error?.message || 'টেস্ট মেসেজ পাঠাতে ব্যর্থ হয়েছে।' });
  }
});

/**
 * Feature 12: Full Database Backup & Restore
 * GET /api/admin/backup
 * POST /api/admin/restore
 */
adminRouter.get('/backup', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const backup = await storage.getFullBackupData();
    const filename = `bonolota_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(backup);
  } catch (error) {
    console.error('[admin/backup] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to generate backup.' });
  }
});

adminRouter.post('/restore', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const backupData = req.body;
    if (!backupData || typeof backupData !== 'object') {
      res.status(400).json({ ok: false, error: 'INVALID_BACKUP', message: 'অবৈধ ব্যাকআপ ফাইল ফরম্যাট।' });
      return;
    }

    const result = await storage.restoreFullBackupData(backupData);

    await storage.addSecurityEvent({
      level: 'alert',
      source: 'SYSTEM',
      message: `ডাটাবেজ ব্যাকআপ রিস্টোর সম্পন্ন (${result.restoredLicenses} লাইসেন্স, ${result.restoredTickets} টিকেট)`,
    });

    sendTelegramAlert(
      `📥 <b>Database Restored Successfully!</b>\n` +
      `Restored Licenses: ${result.restoredLicenses}\n` +
      `Restored Tickets: ${result.restoredTickets}\n` +
      `Time: ${new Date().toISOString()}`
    ).catch(() => {});

    res.json({
      ok: true,
      message: `ডাটাবেজ সফলভাবে রিস্টোর হয়েছে (${result.restoredLicenses} লাইসেন্স আপডেট করা হয়েছে)।`,
      ...result,
    });
  } catch (error: any) {
    console.error('[admin/restore] Error:', error);
    res.status(500).json({ ok: false, error: 'RESTORE_FAILED', message: error?.message || 'রিস্টোর করতে সমস্যা হয়েছে।' });
  }
});

/**
 * Feature 35: 1-Click IP Blacklist & Firewall Shield
 * GET /api/admin/security/blacklist
 * POST /api/admin/security/blacklist/add
 * POST /api/admin/security/blacklist/remove
 */
adminRouter.get('/security/blacklist', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const blacklist = await storage.getBlacklistedIps();
    res.json({ ok: true, blacklist });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

adminRouter.post('/security/blacklist/add', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { ip, reason } = req.body || {};
    if (!ip || typeof ip !== 'string') {
      res.status(400).json({ ok: false, message: 'আইপি ঠিকানা প্রদান করুন।' });
      return;
    }

    const blockCheck = canBlockIp(ip);
    if (!blockCheck.allowed) {
      res.status(400).json({ ok: false, message: blockCheck.reason });
      return;
    }

    await storage.addBlacklistedIp(ip, reason || 'অ্যাডমিন ম্যানুয়াল ব্লক');

    await storage.addSecurityEvent({
      level: 'danger',
      source: 'FIREWALL',
      message: `আইপি ব্ল্যাকলিস্টে যুক্ত করা হয়েছে: ${ip} (${reason || 'অ্যাডমিন ম্যানুয়াল ব্লক'})`,
      ip,
    });

    sendTelegramAlert(
      `🛡️ <b>Firewall IP Block!</b>\n` +
      `IP: <code>${ip}</code>\n` +
      `Reason: ${reason || 'Manual Admin Block'}\n` +
      `Status: All inbound traffic prohibited by firewall shield.`
    ).catch(() => {});

    res.json({ ok: true, message: `আইপি ${ip} সফলভাবে ব্লক করা হয়েছে।` });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

adminRouter.post('/security/blacklist/remove', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { ip } = req.body || {};
    if (!ip || typeof ip !== 'string') {
      res.status(400).json({ ok: false, message: 'আইপি ঠিকানা প্রদান করুন।' });
      return;
    }
    const removed = await storage.removeBlacklistedIp(ip);

    await storage.addSecurityEvent({
      level: 'info',
      source: 'FIREWALL',
      message: `আইপি আনব্লক করা হয়েছে: ${ip}`,
      ip,
    });

    res.json({ ok: true, removed, message: `আইপি ${ip} আনব্লক করা হয়েছে।` });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

/**
 * Feature 34: Terminal Security Event Stream
 * GET /api/admin/security/terminal-events
 */
adminRouter.get('/security/terminal-events', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const events = await storage.getSecurityEvents(100);
    res.json({ ok: true, events });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

/**
 * Feature 36: Server System Health & Resource Monitor
 * GET /api/admin/security/system-health
 */
adminRouter.get('/security/system-health', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

    const mem = process.memoryUsage();
    const memoryUsageMb = {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      external: Math.round(mem.external / 1024 / 1024),
    };

    const redisPingMs = await storage.pingRedis();
    const licenses = await storage.listLicenses();
    const blacklist = await storage.getBlacklistedIps();
    const secConfig = await storage.getSecurityConfig();

    const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
    const activeOnlineStudents = licenses.filter(l => l.lastActiveAt && l.lastActiveAt > fiveMinsAgo).length;

    const health: SystemHealthMetrics = {
      uptimeSeconds: Math.floor(uptime),
      uptimeFormatted,
      nodeVersion: process.version,
      pid: process.pid,
      memoryUsageMb,
      redisConnected: redisPingMs >= 0,
      redisPingMs: redisPingMs >= 0 ? redisPingMs : 0,
      totalKeys: licenses.length,
      blacklistedIpsCount: blacklist.length,
      activeOnlineStudents,
      antiCopyEnabled: Boolean(secConfig.antiCopyEnabled),
      honeypotTriggeredCount: secConfig.honeypotCount || 0,
    };

    res.json({ ok: true, health });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

/**
 * Feature 40: Brute-Force Rate-Limit Meter & Shield
 * GET /api/admin/security/rate-limits
 */
adminRouter.get('/security/rate-limits', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await storage.getFailedAuthStats();
    res.json({ ok: true, stats });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

/**
 * Feature 42: DRM & Anti-Copy Protection Switch
 * GET /api/admin/security/anti-copy
 * POST /api/admin/security/anti-copy
 */
adminRouter.get('/security/anti-copy', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const config = await storage.getSecurityConfig();
    res.json({ ok: true, antiCopyEnabled: Boolean(config.antiCopyEnabled) });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

adminRouter.post('/security/anti-copy', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { enabled } = req.body || {};
    const updated = await storage.updateSecurityConfig({ antiCopyEnabled: Boolean(enabled) });

    await storage.addSecurityEvent({
      level: 'info',
      source: 'SYSTEM',
      message: `অ্যান্টি-কপি DRM সুরক্ষা ${updated.antiCopyEnabled ? 'চালু (Enabled)' : 'বন্ধ (Disabled)'} করা হয়েছে।`,
    });

    res.json({
      ok: true,
      antiCopyEnabled: updated.antiCopyEnabled,
      message: `কন্টেন্ট অ্যান্টি-কপি সুরক্ষা ${updated.antiCopyEnabled ? 'চালু' : 'বন্ধ'} করা হয়েছে।`,
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

/**
 * Feature 7: Student Support Tickets (Admin Inbox)
 * GET /api/admin/support/tickets
 * POST /api/admin/support/reply
 */
adminRouter.get('/support/tickets', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const tickets = await storage.listSupportTickets();
    res.json({ ok: true, tickets });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

adminRouter.post('/support/reply', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { ticketId, replyMessage, markResolved } = req.body || {};
    if (!ticketId || typeof replyMessage !== 'string' || !replyMessage.trim()) {
      res.status(400).json({ ok: false, message: 'টিকেট আইডি এবং উত্তর বার্তা আবশ্যক।' });
      return;
    }

    const cleanReply = replyMessage.trim().slice(0, 3000).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!cleanReply) {
      res.status(400).json({ ok: false, message: 'উত্তর বার্তা ফাঁকা রাখা যাবে না।' });
      return;
    }

    const ticket = await storage.getSupportTicketById(ticketId);
    if (!ticket) {
      res.status(404).json({ ok: false, message: 'টিকেট পাওয়া যায়নি।' });
      return;
    }

    const now = Date.now();
    const adminMsg: SupportMessage = {
      id: `msg_${now}_${Math.random().toString(36).substring(2, 6)}`,
      sender: 'admin',
      senderName: 'Bonolota Support',
      text: cleanReply,
      timestamp: now,
    };

    const existingMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const updatedMessages = [...existingMessages, adminMsg];

    const updated = await storage.updateSupportTicket(ticketId, {
      adminReply: cleanReply,
      repliedAt: now,
      status: markResolved ? 'resolved' : 'replied',
      messages: updatedMessages,
    });

    res.json({ ok: true, ticket: updated, message: 'উত্তর সফলভাবে পাঠানো হয়েছে।' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Admin: Delete entire support chat conversation from both sides
const handleDeleteSupportTicket = async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ticket = await storage.getSupportTicketById(id);
    if (!ticket) {
      res.status(404).json({ ok: false, message: 'টিকেট পাওয়া যায়নি।' });
      return;
    }

    await storage.deleteSupportTicket(id);

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'delete_support_chat',
      details: `Deleted support chat with ${ticket.customerName || 'student'} (${ticket.keyMasked}) from both sides.`,
    });

    res.json({ ok: true, message: 'চ্যাটটি উভয়পাশ থেকেই স্থায়ীভাবে মুছে ফেলা হয়েছে।' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
};

adminRouter.delete('/support/ticket/:id', requireAdminAuth, handleDeleteSupportTicket);
adminRouter.post('/support/ticket/:id/delete', requireAdminAuth, handleDeleteSupportTicket);

// Admin: Delete multiple tickets or ALL tickets at once
adminRouter.post('/support/tickets/batch-delete', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { ticketIds, all } = req.body || {};
    let targets: string[] = [];

    if (all === true) {
      const allTickets = await storage.listSupportTickets();
      targets = allTickets.map(t => t.id);
    } else if (Array.isArray(ticketIds)) {
      targets = ticketIds.filter((id): id is string => typeof id === 'string' && id.length > 0);
    }

    if (targets.length === 0) {
      res.status(400).json({ ok: false, message: 'মুছে ফেলার জন্য কোনো টিকেট সিলেক্ট করা হয়নি।' });
      return;
    }

    let deletedCount = 0;
    for (const id of targets) {
      const ok = await storage.deleteSupportTicket(id);
      if (ok) deletedCount++;
    }

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'delete_support_chat',
      details: `Batch deleted ${deletedCount} support ticket(s) from both sides.`,
    });

    res.json({ 
      ok: true, 
      deletedCount, 
      message: `সফলভাবে ${deletedCount}টি চ্যাট উভয়পাশ থেকেই মুছে ফেলা হয়েছে।` 
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

// Admin: Delete a specific message from both sides
const handleDeleteSupportMessage = async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id, messageId } = req.params;
    const updated = await storage.deleteSupportMessage(id, messageId);
    if (!updated) {
      res.status(404).json({ ok: false, message: 'টিকেট পাওয়া যায়নি।' });
      return;
    }

    res.json({ ok: true, ticket: updated, message: 'মেসেজটি উভয়পাশ থেকেই মুছে ফেলা হয়েছে।' });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
};

adminRouter.delete('/support/ticket/:id/message/:messageId', requireAdminAuth, handleDeleteSupportMessage);
adminRouter.post('/support/ticket/:id/message/:messageId/delete', requireAdminAuth, handleDeleteSupportMessage);

/**
 * Feature 25: Real-Time Live Active Students Online Tracker
 * GET /api/admin/students/live
 */
adminRouter.get('/students/live', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const licenses = await storage.listLicenses();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const liveStudents = licenses
      .filter(l => l.lastActiveAt && l.lastActiveAt >= fiveMinutesAgo && l.status === 'active')
      .map(l => ({
        licenseId: l.id,
        keyMasked: l.keyMasked,
        customerName: l.customerName || 'বেনামী শিক্ষার্থী',
        activeFeature: l.progress?.activeFeature || 'প্রধান ড্যাশবোর্ড',
        deviceInfo: l.deviceInfo || 'Unknown Device',
        clientIp: l.clientIp || 'Unknown IP',
        lastActiveAt: l.lastActiveAt,
        wordsStudied: l.progress?.wordsStudied || 0,
        quizzesTaken: l.progress?.quizzesTaken || 0,
        streak: l.progress?.learningStreak || 0,
      }))
      .sort((a, b) => (b.lastActiveAt || 0) - (a.lastActiveAt || 0));

    res.json({ ok: true, liveStudents, count: liveStudents.length });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

/**
 * Feature 51: Granular Student Step-by-Step Action Timeline
 * GET /api/admin/students/timeline/:licenseId
 */
adminRouter.get('/students/timeline/:licenseId', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { licenseId } = req.params;
    const actions = await storage.getStudentActions(licenseId, 150);
    res.json({ ok: true, actions });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});

/**
 * Feature 2: 1-Click Renewal Notification Broadcast
 * POST /api/admin/licenses/:id/send-renewal
 */
adminRouter.post('/licenses/:id/send-renewal', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const license = await storage.getLicenseById(id);
    if (!license) {
      res.status(404).json({ ok: false, message: 'লাইসেন্স পাওয়া যায়নি।' });
      return;
    }

    const now = Date.now();
    const daysLeft = Math.max(0, Math.ceil((license.expiresAt - now) / (1000 * 60 * 60 * 24)));

    // Create targeted high-priority renewal announcement
    const announcement = {
      id: `anno_renewal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: '⏳ সাবস্ক্রিপশন মেয়াদ শেষ হতে চলেছে',
      message: `প্রিয় ${license.customerName || 'শিক্ষার্থী'}, আপনার বনলতা ভোকাবুলারির সাবস্ক্রিপশনের মেয়াদ আর মাত্র ${daysLeft} দিন বাকি রয়েছে। নিরবচ্ছিন্ন শিক্ষার জন্য এখনই অ্যাডমিনের সাথে যোগাযোগ করে মেয়াদ নবায়ন করে নিন।`,
      type: 'urgent' as const,
      priority: 'high' as const,
      displayStyle: 'center_modal' as const,
      targetKey: license.keyMasked,
      createdAt: now,
      active: true,
      author: 'Bonolota Team',
    };

    await storage.createAnnouncement(announcement);

    // Send Telegram Notification
    sendTelegramAlert(
      `⏳ <b>Subscription Renewal Alert Sent!</b>\n` +
      `User: <b>${license.customerName || 'Unknown'}</b>\n` +
      `Key: <code>${license.keyMasked}</code>\n` +
      `Days Left: ${daysLeft} days`
    ).catch(() => {});

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      action: 'create_broadcast',
      licenseId: id,
      details: `Sent 1-click renewal alert to ${license.keyMasked} (${daysLeft} days remaining).`,
    });

    res.json({ ok: true, message: `নবায়ন নোটিফিকেশন সফলভাবে ${license.customerName || license.keyMasked} এর ডিভাইসে পাঠানো হয়েছে!` });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'SERVER_ERROR' });
  }
});


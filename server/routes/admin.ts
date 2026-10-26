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
import { LicenseRecord } from '../types';

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
    const sessionData = await storage.getAdminSession(sessionHash);

    if (!sessionData || Date.now() > sessionData.expiresAt) {
      res.clearCookie(ADMIN_COOKIE_NAME, getCookieOptions());
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
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || 'unknown';

    // Rate limit: 5 login attempts per 15 minutes per IP to resist brute force
    const rateCheck = await storage.checkRateLimit(`adminlogin:${clientIp}`, 5, 15 * 60);
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
    if (password === DEFAULT_ADMIN_PASS) {
      isValid = true;
    } else if (process.env.ADMIN_PASSWORD_HASH && verifyPassword(password, process.env.ADMIN_PASSWORD_HASH)) {
      isValid = true;
    }

    if (!isValid) {
      await storage.addAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: Date.now(),
        action: 'admin_failed_login',
        details: `Failed admin login attempt from IP: ${clientIp}`,
        ip: clientIp,
      });

      res.status(401).json({
        ok: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid administrator password.',
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
      ...getCookieOptions(),
      maxAge: ttlSeconds * 1000,
    });

    res.json({
      ok: true,
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
      await storage.deleteAdminSession(sessionHash);
    }
    res.clearCookie(ADMIN_COOKIE_NAME, getCookieOptions());
    res.json({ ok: true, message: 'Admin logged out.' });
  } catch (error) {
    console.error('[admin/logout] Error:', error);
    res.clearCookie(ADMIN_COOKIE_NAME, getCookieOptions());
    res.json({ ok: true });
  }
});

/**
 * Admin: Overview Stats
 * GET /api/admin/overview
 */
adminRouter.get('/overview', requireAdminAuth, async (_req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const stats = await storage.getOverviewStats();
    res.json({ ok: true, stats });
  } catch (error) {
    console.error('[admin/overview] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to fetch overview stats.' });
  }
});

/**
 * Admin: Create New Access Key License
 * POST /api/admin/licenses/create
 */
adminRouter.post('/licenses/create', requireAdminAuth, async (req: AuthenticatedAdminRequest, res: Response): Promise<void> => {
  try {
    const { durationDays, customerNote } = req.body || {};
    const days = parseInt(durationDays, 10);

    if (isNaN(days) || days <= 0 || days > 3650) {
      res.status(400).json({ ok: false, error: 'INVALID_DURATION', message: 'Duration must be between 1 and 3650 days.' });
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
      keyHash,
      status: 'active',
      createdAt: now,
      expiresAt,
      durationDays: days,
      browserBound: false,
      customerNote: typeof customerNote === 'string' ? customerNote.trim().slice(0, 200) : undefined,
    };

    // Store in Redis (Stores hash, NEVER plaintext key)
    await storage.createLicense(newLicense);

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      action: 'create_license',
      licenseId,
      details: `Created ${days}-day license (${masked}). Note: ${customerNote || 'None'}`,
    });

    // Return the plaintextKey ONE-TIME ONLY so admin can copy and send to customer
    res.json({
      ok: true,
      plaintextKey,
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
    const { additionalDays } = req.body || {};
    const days = parseInt(additionalDays, 10);

    if (isNaN(days) || days <= 0 || days > 3650) {
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
    const newExpiresAt = baseTimestamp + days * 24 * 60 * 60 * 1000;

    const updated = await storage.updateLicense(id, {
      expiresAt: newExpiresAt,
      durationDays: license.durationDays + days,
      // If was expired and now extended, restore active status if not explicitly revoked
      status: license.status === 'revoked' ? 'revoked' : 'active',
    });

    await storage.addAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      action: 'extend_license',
      licenseId: id,
      details: `Extended license ${license.keyMasked} by ${days} days. New expiry: ${new Date(newExpiresAt).toISOString()}`,
    });

    res.json({ ok: true, license: updated });
  } catch (error) {
    console.error('[admin/licenses/extend] Error:', error);
    res.status(500).json({ ok: false, error: 'SERVER_ERROR', message: 'Failed to extend license.' });
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

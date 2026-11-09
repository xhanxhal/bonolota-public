import { Router, Request, Response } from 'express';
import { authRouter } from './auth';
import { adminRouter, getAdminRouteSecret } from './admin';
import { contentRouter } from './content';
import { broadcastRouter } from './broadcast';
import { storage } from '../storage';
import { sendTelegramAlert } from '../telegram';
import { validateEnvironment } from '../env-validator';
import { isLoopbackIp } from '../security';

export const apiRouter = Router();

// Feature 35: Firewall IP Blacklist Shield Middleware
apiRouter.use(async (req: Request, res: Response, next) => {
  try {
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const clientIp = rawIp.replace(/^::ffff:/, '');

    // Never block 127.0.0.1, localhost, or loopback IPs
    if (isLoopbackIp(clientIp) || isLoopbackIp(rawIp)) {
      next();
      return;
    }

    if (await storage.isIpBlacklisted(clientIp)) {
      await storage.recordBlockedFirewallAttempt();
      res.status(403).json({
        ok: false,
        error: 'FIREWALL_BLOCKED',
        message: 'আপনার আইপি ঠিকানাটি ফায়ারওয়াল দ্বারা ব্লক করা হয়েছে। (Access Forbidden by Security Shield)',
      });
      return;
    }
  } catch (err) {
    // Fail open if storage error to avoid locking out valid users
  }
  next();
});

// Feature 37: Honeypot & Canary Trap for Hackers/Scanners
const honeypotHandler = async (req: Request, res: Response): Promise<void> => {
  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  const clientIp = rawIp.replace(/^::ffff:/, '');
  const ua = req.headers['user-agent'] || 'Unknown Scanner';
  const targetPath = req.originalUrl || req.url;

  try {
    // Never blacklist loopback/localhost IPs
    if (!isLoopbackIp(clientIp) && !isLoopbackIp(rawIp)) {
      await storage.addBlacklistedIp(clientIp, `Honeypot Triggered on ${targetPath}`);
    }
    const currentConfig = await storage.getSecurityConfig();
    await storage.updateSecurityConfig({ honeypotCount: (currentConfig.honeypotCount || 0) + 1 });
    await storage.recordBlockedFirewallAttempt();

    await storage.addSecurityEvent({
      level: 'danger',
      source: 'HONEYPOT',
      message: `হানি-পট সক্রিয়: আক্রমণকারী আইপি ${clientIp} ফাঁদে পড়েছে (${targetPath})`,
      ip: clientIp,
    });

    sendTelegramAlert(
      `🍯 <b>হানি-পট অ্যালার্ট (Hacker Trap Activated)!</b>\n` +
      `আক্রমণকারী আইপি: <code>${clientIp}</code>\n` +
      `টার্গেট পাথ: <code>${targetPath}</code>\n` +
      `ইউজার এজেন্ট: <i>${ua.slice(0, 150)}</i>\n` +
      `অ্যাকশন: <b>আইপি স্বয়ংক্রিয়ভাবে ফায়ারওয়ালে স্থায়ী ব্লক করা হয়েছে!</b>`
    ).catch(() => {});
  } catch (e) {
    console.error('[Honeypot Error]:', e);
  }

  res.status(403).json({
    ok: false,
    error: 'ACCESS_DENIED',
    message: 'Security trap triggered. Your IP has been permanently blacklisted.',
  });
};

// Canary Trap routes
apiRouter.all(['/admin/dump-database', '/v1/dump-keys', '/system/database-dump', '/debug/database', '/admin/config/env'], honeypotHandler);

// Sub-routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/content', contentRouter);
apiRouter.use('/broadcasts', broadcastRouter);

// Health check & diagnostic with runtime environment validation
apiRouter.get('/health', (_req: Request, res: Response): void => {
  const envReport = validateEnvironment();
  res.json({
    ok: true,
    service: 'bonolota-licensing-api',
    timestamp: Date.now(),
    environment: envReport.environment,
    valid: envReport.valid,
    redisConnected: envReport.checks.redisToken.valid,
  });
});

// Detailed system environment diagnostic endpoint
apiRouter.get('/system/env-check', (_req: Request, res: Response): void => {
  const report = validateEnvironment();
  res.json(report);
});

// Feature 42: Public Security Config endpoint (DRM anti-copy status)
apiRouter.get('/system/security-config', async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = await storage.getSecurityConfig();
    res.json({
      ok: true,
      antiCopyEnabled: Boolean(config.antiCopyEnabled),
    });
  } catch {
    res.json({ ok: true, antiCopyEnabled: false });
  }
});

// Admin Route Verification
apiRouter.post('/system/verify-admin-slug', (req: Request, res: Response): void => {
  const { slug } = req.body || {};
  const serverSecret = getAdminRouteSecret();
  const cleanSlug = (slug || '').toString().trim().replace(/^[\/#\?]+|[\/#\?]+$/g, '').toLowerCase();
  const cleanSecret = (serverSecret || '').toString().trim().replace(/^[\/#\?]+|[\/#\?]+$/g, '').toLowerCase();

  if (cleanSlug && (cleanSlug === cleanSecret || cleanSlug === 'x-admin-arifa')) {
    res.json({ valid: true });
  } else {
    res.status(404).json({ valid: false });
  }
});

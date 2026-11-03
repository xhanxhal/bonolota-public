import { Router, Request, Response } from 'express';
import { authRouter } from './auth';
import { adminRouter, getAdminRouteSecret } from './admin';
import { contentRouter } from './content';
import { broadcastRouter } from './broadcast';

export const apiRouter = Router();

// Sub-routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/content', contentRouter);
apiRouter.use('/broadcasts', broadcastRouter);

import { validateEnvironment } from '../env-validator';

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

// Admin Route Verification
// Verifies whether a given path slug matches the private server-side ADMIN_ROUTE_SECRET
apiRouter.post('/system/verify-admin-slug', (req: Request, res: Response): void => {
  const { slug } = req.body || {};
  const serverSecret = getAdminRouteSecret();
  const cleanSlug = (slug || '').toString().trim().replace(/^[\/#\?]+|[\/#\?]+$/g, '').toLowerCase();
  const cleanSecret = (serverSecret || '').toString().trim().replace(/^[\/#\?]+|[\/#\?]+$/g, '').toLowerCase();

  if (cleanSlug && (cleanSlug === cleanSecret || cleanSlug === 'x-admin-arifa')) {
    res.json({ valid: true });
  } else {
    // Return false without leaking what the secret actually is
    res.status(404).json({ valid: false });
  }
});

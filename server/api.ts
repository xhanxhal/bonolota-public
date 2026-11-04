import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes';

const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Allow framing in Google AI Studio previews and production domain
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.run.app https://*.google.com https://*.aistudio.google.com https://bonolota-public.vercel.app;"
  );

  // Dynamic CORS for cross-domain API calls
  const origin = req.headers.origin;
  if (origin) {
    const isAllowed = 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      origin.endsWith('.run.app') || 
      origin.endsWith('.vercel.app') ||
      origin.includes('google.com') ||
      origin.includes('bonolota');
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-token, x-admin-token, x-device-id');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Mount on both '/api' and '/' so Vercel routes are always matched
app.use('/api', apiRouter);
app.use('/', apiRouter);

import { assertEnvironment } from './env-validator';

// Assert and validate environment safely
try {
  assertEnvironment();
} catch (e) {
  console.warn('[Serverless] Warning during environment assertion:', e);
}

// Global Error Handler to guarantee no uncaught exception ever causes a 500 FUNCTION_INVOCATION_FAILED crash
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Server Error]', err);
  if (!res.headersSent) {
    res.status(500).json({
      ok: false,
      error: 'SERVER_ERROR',
      message: err?.message || 'An unexpected server error occurred.',
    });
  }
});

export default app;

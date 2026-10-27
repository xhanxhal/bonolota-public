import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './routes';

const app = express();

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Mount on both '/api' and '/' so Vercel routes are always matched
app.use('/api', apiRouter);
app.use('/', apiRouter);

import { assertEnvironment } from './env-validator';

// Assert and validate environment on module load
assertEnvironment();

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

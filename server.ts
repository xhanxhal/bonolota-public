import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';

// Load environment variables if available
dotenv.config();

export async function createExpressApp() {
  const app = express();

  // Trust first proxy hop for reverse proxies (Vercel, Cloud Run, Cloudflare)
  app.set('trust proxy', 1);

  // Security and iframe compatibility headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Allow embedding in Google AI Studio preview iframes and production domain
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

  // Secret admin portal route mapping with no-cache headers
  app.get(['/x-admin-arifa', '/x-admin-arifa.html'], (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve('public/x-admin-arifa.html'));
  });

  // Block old /admin or /admin.html access to prevent unauthorized discovery
  app.all(['/admin', '/admin.html'], (_req, res) => {
    res.status(404).send('Not Found');
  });

  // Mount backend API routes
  app.use('/api', apiRouter);

  // Fallback API error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server App Error]:', err);
    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        error: 'SERVER_ERROR',
        message: 'Internal server error occurred.',
      });
    }
  });

  return app;
}

async function startServer() {
  const app = await createExpressApp();
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = parseInt(process.env.PORT || '3000', 10);

  if (!isProd) {
    // In dev: attach Vite dev server middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted for development.');
  } else {
    // In production: serve static build output
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Server] Serving production static files from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Bonolota Server listening on http://0.0.0.0:${PORT}`);
  });
}

// Only start when executed directly (not when imported as a module in tests/serverless)
const isMainModule = process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));
if (isMainModule && process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  });
}

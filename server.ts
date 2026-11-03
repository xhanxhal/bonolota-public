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

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Secret admin portal route mapping
  app.get('/x-admin-arifa', (_req, res) => {
    res.sendFile(path.resolve('public/x-admin-arifa.html'));
  });

  // Block old /admin or /admin.html access to prevent unauthorized discovery
  app.all(['/admin', '/admin.html'], (_req, res) => {
    res.status(404).send('Not Found');
  });

  // Mount backend API routes
  app.use('/api', apiRouter);

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

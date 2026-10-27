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

export default app;

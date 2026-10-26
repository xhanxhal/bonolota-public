import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../server/routes';

const app = express();

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Mount the API router
app.use('/api', apiRouter);

// Export for Vercel Serverless Function
export default app;

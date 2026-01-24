/**
 * Vercel Serverless Function Entry Point
 * 
 * This is a thin wrapper that imports the pre-built server bundle.
 * Vercel will detect this file and create a serverless function.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

// Import server modules directly
import { registerRoutes } from '../server/routes';

let cachedApp: express.Express | null = null;

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'AI request limit reached. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

async function getApp(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const app = express();
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  
  // CORS configuration
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://www.ideafoundry.app',
        'https://plan.ideafoundry.app',
        'https://ideafoundry.app',
      ]
    : true;

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Apply rate limiters
  app.use('/api/', generalLimiter);
  app.use('/api/conversations/:id/messages', aiLimiter);
  app.use('/api/projects/:id/research', aiLimiter);
  app.use('/api/projects/:id/prd', aiLimiter);
  app.use('/api/projects/:id/synergy', aiLimiter);
  app.use('/api/auth/', authLimiter);

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
      }
    });

    next();
  });

  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);

  // Error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Vercel Error]', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    if (res.headersSent) return next(err);
    res.status(status).json({ error: message });
  });

  cachedApp = app;
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('[Vercel Handler Error]', error);
    res.status(500).json({ 
      error: 'Server initialization failed'
    });
  }
}

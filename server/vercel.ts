/**
 * Vercel Serverless Function Entry Point
 * 
 * This module exports the Express app for Vercel's serverless environment.
 * The app is cached between invocations to reduce cold-start latency.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { registerRoutes } from './routes';
import { createServer } from 'http';

let cachedApp: express.Express | null = null;

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 AI requests per window (more restrictive)
  message: { error: 'AI request limit reached. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 auth attempts per hour
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
    contentSecurityPolicy: false, // Disable CSP for SPA compatibility
    crossOriginEmbedderPolicy: false,
  }));
  
  // CORS configuration - stricter in production
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://www.ideafoundry.app',
        'https://plan.ideafoundry.app',
        'https://ideafoundry.app',
      ]
    : true; // Allow all in development

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

  // Create a minimal HTTP server for route registration (not used in Vercel)
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
    // Don't leak error details in production
    res.status(500).json({ 
      error: 'Server initialization failed'
    });
  }
}

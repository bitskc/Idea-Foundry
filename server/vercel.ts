/**
 * Vercel Serverless Function Entry Point
 * 
 * This module exports the Express app for Vercel's serverless environment.
 * The app is cached between invocations to reduce cold-start latency.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { registerRoutes } from './routes';
import { createServer } from 'http';

let cachedApp: express.Express | null = null;

async function getApp(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const app = express();
  
  // CORS configuration for subdomain communication
  app.use(cors({
    origin: [
      'https://www.ideafoundry.app',
      'https://plan.ideafoundry.app',
      'https://ideafoundry.app',
      /\.vercel\.app$/,
    ],
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

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
    res.status(500).json({ 
      error: 'Server initialization failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

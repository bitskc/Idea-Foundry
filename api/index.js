// Vercel serverless function entry point
import { setupApp } from '../server/app.ts';

let cachedApp = null;

export default async function handler(req, res) {
  if (!cachedApp) {
    const { app } = await setupApp();
    cachedApp = app;
  }
  return cachedApp(req, res);
}



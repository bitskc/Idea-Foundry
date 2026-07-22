import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth";

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

// Mock user for dev mode (when no DATABASE_URL or JWT_SECRET)
const DEV_USER = {
  id: "dev-user-00000000-0000-0000-0000-000000000001",
  email: "dev@example.com",
};

export const isDevMode = !(process.env.DATABASE_URL || process.env.ideas_DATABASE_URL || process.env.POSTGRES_URL);

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Dev mode: bypass auth entirely
  if (isDevMode) {
    (req as AuthenticatedRequest).user = DEV_USER;
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  (req as AuthenticatedRequest).user = {
    id: payload.id,
    email: payload.email,
  };

  next();
}

import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../supabase";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Ensure user exists in our database (fallback sync)
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, data.user.id));

    if (existingUser.length === 0) {
      await db
        .insert(users)
        .values({
          id: data.user.id,
          email: data.user.email!,
          subscriptionStatus: "free",
        })
        .onConflictDoNothing();
    }

    (req as AuthenticatedRequest).user = {
      id: data.user.id,
      email: data.user.email!,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
}

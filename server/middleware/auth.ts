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
    console.error("Missing auth header:", authHeader);
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }

  const token = authHeader.substring(7);
  console.log("Auth token received, validating...", token.substring(0, 20) + "...");

  try {
    console.log("Validating token with Supabase...");
    console.log("SUPABASE_URL set:", !!process.env.SUPABASE_URL);
    console.log("SUPABASE_SERVICE_KEY set:", !!process.env.SUPABASE_SERVICE_KEY);
    
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      console.error("Token validation failed:", error?.message || "No user returned");
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    console.log("Auth successful for user:", data.user.id);

    // Ensure user exists in our database (fallback sync)
    console.log("Checking user in database...");
    console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);
    
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, data.user.id));

    console.log("Existing user found:", existingUser.length > 0);

    if (existingUser.length === 0) {
      console.log("Creating new user in database...");
      await db
        .insert(users)
        .values({
          id: data.user.id,
          email: data.user.email!,
          subscriptionStatus: "free",
        })
        .onConflictDoNothing();
      console.log("User created successfully");
    }

    (req as AuthenticatedRequest).user = {
      id: data.user.id,
      email: data.user.email!,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    console.error("Error name:", (err as Error).name);
    console.error("Error message:", (err as Error).message);
    console.error("Error stack:", (err as Error).stack);
    res.status(500).json({ error: "Authentication failed", details: (err as Error).message });
  }
}

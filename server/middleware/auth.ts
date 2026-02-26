import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin, isDevMode } from "../supabase";

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

// Mock user for dev mode
const DEV_USER = {
  id: "dev-user-00000000-0000-0000-0000-000000000001",
  email: "dev@example.com",
};

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
    
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from("users")
      .select()
      .eq("id", data.user.id)
      .single();

    console.log("Existing user found:", !!existingUser);

    if (!existingUser) {
      console.log("Creating new user in database...");
      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email!,
          subscription_status: "free",
        });
      
      if (insertError) {
        console.error("Failed to create user:", insertError);
      } else {
        console.log("User created successfully");
      }
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
    console.error("Supabase Admin client state:", {
      hasClient: !!supabaseAdmin,
      hasAuth: !!supabaseAdmin?.auth,
    });
    res.status(500).json({ 
      error: "Authentication failed", 
      details: (err as Error).message,
      name: (err as Error).name 
    });
  }
}

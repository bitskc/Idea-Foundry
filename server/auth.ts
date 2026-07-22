import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production"
  ? (() => { throw new Error("JWT_SECRET must be set in production"); })()
  : "dev-secret-change-in-production");
const JWT_EXPIRES_IN = "30d";

export interface AuthToken {
  id: string;
  email: string;
}

export function signToken(payload: AuthToken): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
    return decoded;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Register a new user with email + password.
 * Returns { token, user } on success.
 * Throws if email already exists.
 */
export async function registerUser(email: string, password: string) {
  // Check if user already exists
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const hashedPassword = await hashPassword(password);
  const id = crypto.randomUUID();

  const [newUser] = await db
    .insert(users)
    .values({
      id,
      email,
      password: hashedPassword,
      subscriptionStatus: "free",
    })
    .returning();

  const token = signToken({ id: newUser.id, email: newUser.email });
  return { token, user: { id: newUser.id, email: newUser.email } };
}

/**
 * Login with email + password.
 * Returns { token, user } on success.
 * Throws if credentials are invalid.
 */
export async function loginUser(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // If no password set (legacy Supabase user), reject
  if (!user.password) {
    throw new Error("Please reset your password to continue");
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  const token = signToken({ id: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}

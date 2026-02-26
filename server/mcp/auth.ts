import { isDevMode } from "../supabase";
import { mockStorage } from "../storage-mock";
import type { IStorage } from "../storage";
import crypto from "crypto";

// Conditionally load storage
let storage: IStorage;
if (isDevMode) {
  storage = mockStorage;
} else {
  const { storage: supabaseStorage } = await import("../storage-supabase");
  storage = supabaseStorage;
}

// Dev mode user ID
const DEV_USER_ID = "dev-user-00000000-0000-0000-0000-000000000001";

/**
 * Validates API token and returns user ID if valid
 * Token format: "Bearer if_sk_..."
 */
export async function validateApiToken(authHeader?: string): Promise<string | null> {
  if (!authHeader) return null;

  try {
    const match = authHeader.match(/^Bearer\s+(.+)$/);
    if (!match) return null;

    const token = match[1];
    
    // In dev mode, accept any token starting with "dev_" or "if_sk_dev"
    if (isDevMode && (token.startsWith("dev_") || token.startsWith("if_sk_dev"))) {
      return DEV_USER_ID;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const apiToken = await storage.getApiTokenByHash(tokenHash);
    if (!apiToken) return null;

    // Check expiration
    if (apiToken.expiresAt && new Date(apiToken.expiresAt) < new Date()) {
      return null;
    }

    // Update last used timestamp
    await storage.updateApiTokenLastUsed(apiToken.id);

    return apiToken.userId;
  } catch (error) {
    console.error("Error validating API token:", error);
    return null;
  }
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/);
  return match ? match[1] : null;
}

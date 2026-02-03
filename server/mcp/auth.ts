import { storage } from "../storage-supabase";
import crypto from "crypto";

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

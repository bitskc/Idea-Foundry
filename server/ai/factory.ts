import { GeminiAdapter } from "./gemini";
import { AnthropicAdapter } from "./anthropic";
import type { AIService } from "./service";
import type { IStorage } from "../storage";

/**
 * Get an AI service for a specific user.
 * If the user has a BYOK key for the provider, use it.
 * Otherwise, fall back to the server default key.
 *
 * No caching — per-request instantiation is cheap and avoids stale-key issues.
 */
export async function getAIServiceForUser(
  userId: string,
  storage: IStorage,
  preferredProvider: "gemini" | "anthropic" = "gemini"
): Promise<AIService> {
  // Check if user has a BYOK key for the preferred provider
  const byokKey = await storage.getUserApiKey(userId, preferredProvider);

  if (byokKey) {
    if (preferredProvider === "gemini") {
      return new GeminiAdapter(byokKey);
    }
    if (preferredProvider === "anthropic") {
      return new AnthropicAdapter(byokKey);
    }
  }

  // No BYOK key for preferred provider — check the other provider
  // (user might have only an Anthropic key when Gemini is preferred, or vice versa)
  const otherProvider = preferredProvider === "gemini" ? "anthropic" : "gemini";
  const otherKey = await storage.getUserApiKey(userId, otherProvider);
  if (otherKey) {
    if (otherProvider === "gemini") {
      return new GeminiAdapter(otherKey);
    }
    if (otherProvider === "anthropic") {
      return new AnthropicAdapter(otherKey);
    }
  }

  // Fall back to server defaults
  if (preferredProvider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicAdapter();
  }
  return new GeminiAdapter();
}

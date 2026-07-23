import { GeminiAdapter } from "./gemini";
import { AnthropicAdapter } from "./anthropic";
import type { AIService } from "./service";
import type { IStorage } from "../storage";
import { getTaskDefault } from "../../shared/ai-tasks";

/**
 * Get an AI service for a specific user and task.
 *
 * Resolution order:
 * 1. User's per-task model preference (if set AND that provider has a key)
 * 2. Task's default provider (if it has a key — BYOK or server)
 * 3. The other provider (if it has a key — BYOK or server)
 * 4. Throw a clear error if no provider has any key
 *
 * "Has a key" means either a BYOK key from the user OR a server env var.
 * We never create an adapter for a provider with no key — that's what was
 * causing the "Failed to generate" errors.
 *
 * No caching — per-request instantiation is cheap and avoids stale-key issues.
 */
export async function getAIServiceForUser(
  userId: string,
  storage: IStorage,
  task: string = "brainstorming"
): Promise<AIService> {
  const taskDef = getTaskDefault(task);
  const defaultProvider = taskDef?.defaultProvider || "gemini";
  const defaultModel = taskDef?.defaultModel;

  // Gather all available keys (BYOK + server env) for both providers
  const geminiByok = await storage.getUserApiKey(userId, "gemini");
  const anthropicByok = await storage.getUserApiKey(userId, "anthropic");

  const hasGeminiKey = !!geminiByok || !!process.env.GEMINI_API_KEY;
  const hasAnthropicKey = !!anthropicByok || !!process.env.ANTHROPIC_API_KEY;

  if (!hasGeminiKey && !hasAnthropicKey) {
    throw new Error(
      "No AI provider API key available. Add your own key in Settings → API Keys, or contact the administrator."
    );
  }

  // Helper: create an adapter for a provider, using BYOK key if available
  // (falling back to server env var), with optional model override
  function makeAdapter(
    provider: "gemini" | "anthropic",
    modelOverride?: string
  ): AIService {
    if (provider === "gemini") {
      const byok = geminiByok;
      if (byok) return new GeminiAdapter(byok.key, modelOverride || byok.model || undefined);
      return new GeminiAdapter(undefined, modelOverride);
    } else {
      const byok = anthropicByok;
      if (byok) return new AnthropicAdapter(byok.key, modelOverride || byok.model || undefined);
      return new AnthropicAdapter(undefined, modelOverride);
    }
  }

  // 1. Check if user has a per-task model preference
  const prefs = await storage.getUserModelPreferences(userId);
  const taskPref = prefs.find(p => p.task === task);

  if (taskPref) {
    const provider = taskPref.provider as "gemini" | "anthropic";
    const hasKey = provider === "gemini" ? hasGeminiKey : hasAnthropicKey;
    if (hasKey) {
      return makeAdapter(provider, taskPref.model || undefined);
    }
    // User's preferred provider has no key — fall through to defaults
  }

  // 2. Try the task's default provider (if it has a key)
  const defaultHasKey = defaultProvider === "gemini" ? hasGeminiKey : hasAnthropicKey;
  if (defaultHasKey) {
    return makeAdapter(defaultProvider, defaultModel);
  }

  // 3. Fall back to the other provider (whichever has a key)
  const otherProvider: "gemini" | "anthropic" = defaultProvider === "gemini" ? "anthropic" : "gemini";
  const otherHasKey = otherProvider === "gemini" ? hasGeminiKey : hasAnthropicKey;
  if (otherHasKey) {
    // Use the other provider's default model from its task definition, or just the adapter default
    return makeAdapter(otherProvider);
  }

  // Should never reach here since we checked at least one has a key above
  throw new Error("No AI provider API key available.");
}

import { GeminiAdapter } from "./gemini";
import { AnthropicAdapter } from "./anthropic";
import type { AIService } from "./service";
import type { IStorage } from "../storage";
import { getTaskDefault } from "../../shared/ai-tasks";

/**
 * Get an AI service for a specific user and task.
 *
 * Resolution order:
 * 1. User's per-task model preference (if set) → use that provider + model
 *    with the user's BYOK key for that provider (or server default if no BYOK)
 * 2. User's BYOK key for the task's default provider → use with BYOK model
 * 3. User's BYOK key for the other provider → use with BYOK model
 * 4. Server default for the task's default provider
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

  // 1. Check if user has a per-task model preference
  const prefs = await storage.getUserModelPreferences(userId);
  const taskPref = prefs.find(p => p.task === task);

  if (taskPref) {
    const provider = taskPref.provider as "gemini" | "anthropic";
    const model = taskPref.model || undefined;
    const byokEntry = await storage.getUserApiKey(userId, provider);
    if (byokEntry) {
      if (provider === "gemini") return new GeminiAdapter(byokEntry.key, model);
      if (provider === "anthropic") return new AnthropicAdapter(byokEntry.key, model);
    }
    // No BYOK for preferred provider — use server key with user's model choice
    if (provider === "gemini" && process.env.GEMINI_API_KEY) return new GeminiAdapter(undefined, model);
    if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) return new AnthropicAdapter(undefined, model);
  }

  // 2. Check BYOK key for the task's default provider
  const byokEntry = await storage.getUserApiKey(userId, defaultProvider);
  if (byokEntry) {
    if (defaultProvider === "gemini") return new GeminiAdapter(byokEntry.key, byokEntry.model || undefined);
    if (defaultProvider === "anthropic") return new AnthropicAdapter(byokEntry.key, byokEntry.model || undefined);
  }

  // 3. Check BYOK key for the other provider
  const otherProvider = defaultProvider === "gemini" ? "anthropic" : "gemini";
  const otherEntry = await storage.getUserApiKey(userId, otherProvider);
  if (otherEntry) {
    if (otherProvider === "gemini") return new GeminiAdapter(otherEntry.key, otherEntry.model || undefined);
    if (otherProvider === "anthropic") return new AnthropicAdapter(otherEntry.key, otherEntry.model || undefined);
  }

  // 4. Fall back to server defaults
  if (defaultProvider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return new AnthropicAdapter(undefined, defaultModel);
  }
  return new GeminiAdapter(undefined, defaultModel);
}

/**
 * AI task definitions — each distinct AI call site in the app has a task key,
 * a human-readable label, and a sensible default (provider + model).
 *
 * Users can override these per-task in Settings → Model Preferences.
 */

export interface AITaskDefinition {
  key: string;
  label: string;
  description: string;
  defaultProvider: "gemini" | "anthropic";
  defaultModel: string;
}

export const AI_TASKS: AITaskDefinition[] = [
  {
    key: "name-generation",
    label: "Name Generation",
    description: "Generate app name suggestions from an idea",
    defaultProvider: "gemini",
    defaultModel: "gemini-flash-lite-latest",
  },
  {
    key: "idea-analysis",
    label: "Idea Analysis",
    description: "Initial idea breakdown and project creation",
    defaultProvider: "gemini",
    defaultModel: "gemini-flash-lite-latest",
  },
  {
    key: "brainstorming",
    label: "Brainstorming Conversation",
    description: "Interactive conversation to explore and develop ideas",
    defaultProvider: "gemini",
    defaultModel: "gemini-flash-lite-latest",
  },
  {
    key: "research",
    label: "Competitor Research",
    description: "Market research and viability scoring",
    defaultProvider: "anthropic",
    defaultModel: "claude-sonnet-5",
  },
  {
    key: "tech-stack",
    label: "Tech Stack Recommendation",
    description: "Architecture and technology recommendations",
    defaultProvider: "anthropic",
    defaultModel: "claude-sonnet-5",
  },
  {
    key: "prd-generation",
    label: "PRD Generation",
    description: "Full product requirements document generation",
    defaultProvider: "anthropic",
    defaultModel: "claude-sonnet-5",
  },
  {
    key: "synergy-analysis",
    label: "Synergy Analysis",
    description: "Cross-project synergy analysis",
    defaultProvider: "anthropic",
    defaultModel: "claude-sonnet-5",
  },
  {
    key: "idea-classification",
    label: "Idea Classification",
    description: "Classify idea type and subtype for specialist routing",
    defaultProvider: "gemini",
    defaultModel: "gemini-flash-lite-latest",
  },
  {
    key: "specialist-marketing",
    label: "Marketing Specialist",
    description: "GTM, positioning, and channel-fit assessment",
    defaultProvider: "anthropic",
    defaultModel: "claude-sonnet-5",
  },
  {
    key: "specialist-developer",
    label: "Developer Specialist",
    description: "Dev difficulty and engineering risk assessment",
    defaultProvider: "anthropic",
    defaultModel: "claude-sonnet-5",
  },
  {
    key: "logo-generation",
    label: "Logo Generation",
    description: "Generate a brand logo from idea context",
    defaultProvider: "gemini",
    defaultModel: "gemini-2.5-flash-image",
  },
  {
    key: "pitch-generation",
    label: "Pitch Deck Generation",
    description: "Generate a 10-slide investor pitch deck from idea data",
    defaultProvider: "anthropic",
    defaultModel: "claude-sonnet-5",
  },
  {
    key: "competitor-radar",
    label: "Competitor Radar",
    description: "Weekly competitor monitoring and change detection",
    defaultProvider: "anthropic",
    defaultModel: "claude-sonnet-5",
  },
  {
    key: "domain-search",
    label: "Domain Name Search",
    description: "Generate domain name suggestions from idea context",
    defaultProvider: "gemini",
    defaultModel: "gemini-flash-lite-latest",
  },
];

export const AI_TASK_KEYS = AI_TASKS.map(t => t.key);

export function getTaskDefault(task: string): AITaskDefinition | undefined {
  return AI_TASKS.find(t => t.key === task);
}

/**
 * Extract a human-readable error message from an AI provider error.
 * Handles Gemini and Anthropic error formats.
 */
export function extractAIError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    // Anthropic: "400 {"type":"error","error":{"type":"...","message":"actual message"}}"
    const anthropicMatch = msg.match(/\d+\s+\{[\s\S]*"message":\s*"([^"]+)"/);
    if (anthropicMatch) return anthropicMatch[1];
    // Gemini: "[GoogleGenerativeAI Error]: ... [400 Bad Request] API key not valid..."
    const geminiMatch = msg.match(/\[GoogleGenerativeAI Error\]:\s*(.+)/);
    if (geminiMatch) return geminiMatch[1].trim();
    // Generic: just return the message, truncated
    return msg.length > 200 ? msg.substring(0, 200) + "..." : msg;
  }
  return String(error);
}

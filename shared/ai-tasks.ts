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
];

export const AI_TASK_KEYS = AI_TASKS.map(t => t.key);

export function getTaskDefault(task: string): AITaskDefinition | undefined {
  return AI_TASKS.find(t => t.key === task);
}

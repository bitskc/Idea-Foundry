import { z } from "zod";

/**
 * Centralized model selection so every route stays consistent and models can
 * be swapped in one place.
 */
export const AI_MODELS = {
  // Primary model for conversations, research synthesis, and structured tools.
  primary: "gpt-5.1",
  // Faster/cheaper model for lighter structured tasks.
  fast: "gpt-4o-mini",
  // Long-form document generation (PRDs).
  document: "gpt-4o",
} as const;

/**
 * Thrown when an AI response cannot be parsed/validated. Routes catch this and
 * respond with a friendly 502 instead of crashing or returning a generic 500.
 */
export class AiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiResponseError";
  }
}

/**
 * Strip markdown code fences and surrounding prose from an AI response,
 * returning the most likely JSON substring.
 */
export function extractJsonString(raw: string): string {
  let s = (raw ?? "").trim();

  // Prefer the contents of a fenced code block if one is present.
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    s = fenceMatch[1].trim();
  }

  // Already clean JSON.
  if (
    (s.startsWith("{") && s.endsWith("}")) ||
    (s.startsWith("[") && s.endsWith("]"))
  ) {
    return s;
  }

  // Otherwise slice from the first opening token to the matching last one.
  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  if (firstObj === -1 && firstArr === -1) return s;

  let start: number;
  let endChar: string;
  if (firstArr === -1 || (firstObj !== -1 && firstObj < firstArr)) {
    start = firstObj;
    endChar = "}";
  } else {
    start = firstArr;
    endChar = "]";
  }

  const end = s.lastIndexOf(endChar);
  if (start !== -1 && end > start) {
    return s.slice(start, end + 1);
  }
  return s;
}

/**
 * Robustly parse JSON from an AI response. Strips fences, extracts the JSON
 * substring, parses it, and optionally validates against a zod schema.
 * Throws {@link AiResponseError} on failure so callers can respond gracefully.
 */
export function parseAiJson<T = unknown>(
  raw: string | null | undefined,
  options: { label: string; schema?: z.ZodType<T> },
): T {
  const { label, schema } = options;
  const candidate = extractJsonString(raw ?? "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new AiResponseError(`The AI returned an unreadable ${label}. Please try again.`);
  }

  if (schema) {
    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new AiResponseError(`The AI returned an incomplete ${label}. Please try again.`);
    }
    return result.data;
  }

  return parsed as T;
}

/** Strip markdown code fences from a non-JSON text response (e.g. HTML). */
export function stripCodeFences(raw: string): string {
  return (raw ?? "")
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

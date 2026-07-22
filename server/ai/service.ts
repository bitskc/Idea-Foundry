import { z } from "zod";

export type AIRole = "system" | "user" | "assistant";

export interface AIMessage {
    role: AIRole;
    content: string;
}

export type AIProvider = "gemini" | "anthropic" | "openai";

export interface GenerateTextOptions {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    model?: string;
}

export interface GenerateJSONOptions<T> extends GenerateTextOptions {
    schema: z.ZodType<T>;
    schemaName?: string;
}

export interface AIService {
    provider: AIProvider;

    generateText(
        prompt: string,
        history?: AIMessage[],
        options?: GenerateTextOptions
    ): Promise<string>;

    generateTextStream(
        prompt: string,
        history: AIMessage[],
        options: GenerateTextOptions
    ): AsyncGenerator<string, void, unknown>;

    generateJSON<T>(
        prompt: string,
        history: AIMessage[] | undefined,
        options: GenerateJSONOptions<T>
    ): Promise<T>;
}

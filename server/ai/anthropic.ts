import Anthropic from "@anthropic-ai/sdk";
import { AIService, AIMessage, GenerateTextOptions, GenerateJSONOptions } from "./service";

export class AnthropicAdapter implements AIService {
    provider = "anthropic" as const;
    private client: Anthropic;
    private defaultModel: string;

    constructor(apiKey?: string, model?: string) {
        const key = apiKey || process.env.ANTHROPIC_API_KEY;
        this.defaultModel = model || process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
        if (!key) {
            console.warn("ANTHROPIC_API_KEY is missing. Anthropic adapter will fail if used.");
        }
        this.client = new Anthropic({ apiKey: key });
    }

    async generateText(
        prompt: string,
        history: AIMessage[] = [],
        options: GenerateTextOptions = {}
    ): Promise<string> {
        try {
            const messages = history.map(msg => ({
                role: msg.role === "user" ? "user" as const : "assistant" as const,
                content: msg.content
            }));

            messages.push({ role: "user", content: prompt });

            const response = await this.client.messages.create({
                model: options.model || this.defaultModel,
                system: options.systemPrompt,
                max_tokens: options.maxTokens || 1024,
                temperature: options.temperature,
                messages: messages,
            });

            const content = response.content[0];
            if (content.type === "text") {
                return content.text;
            }
            return "";
        } catch (error) {
            console.error("Anthropic Text Generation Error:", error);
            throw error;
        }
    }

    async *generateTextStream(
        prompt: string,
        history: AIMessage[] = [],
        options: GenerateTextOptions
    ): AsyncGenerator<string, void, unknown> {
        const messages = history.map(msg => ({
            role: msg.role === "user" ? "user" as const : "assistant" as const,
            content: msg.content
        }));
        messages.push({ role: "user", content: prompt });

        const stream = await this.client.messages.stream({
            model: options.model || this.defaultModel,
            system: options.systemPrompt,
            max_tokens: options.maxTokens || 1024,
            temperature: options.temperature,
            messages: messages,
        });

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                yield event.delta.text;
            }
        }
    }

    async generateJSON<T>(
        prompt: string,
        history: AIMessage[] = [],
        options: GenerateJSONOptions<T>
    ): Promise<T> {
        try {
            // Append instruction to ensure JSON
            const jsonPrompt = `${prompt}\n\nRespond with valid JSON only.`;

            const text = await this.generateText(jsonPrompt, history, options);

            // Attempt to clean markdown code blocks if present
            const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();

            const json = JSON.parse(cleanText);
            if (options.schema) {
                return options.schema.parse(json);
            }
            return json as T;
        } catch (error) {
            console.error("Anthropic JSON Generation Error:", error);
            throw error;
        }
    }
}

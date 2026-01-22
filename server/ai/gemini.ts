import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { AIService, AIMessage, GenerateTextOptions, GenerateJSONOptions, AIRole } from "./service";

export class GeminiAdapter implements AIService {
    provider = "gemini" as const;
    private client: GoogleGenerativeAI;
    private apiKey: string;
    private defaultModel = "gemini-1.5-flash";

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
        if (!this.apiKey) {
            console.warn("GEMINI_API_KEY is missing. Gemini adapter will fail if used.");
        }
        this.client = new GoogleGenerativeAI(this.apiKey);
    }

    private mapRole(role: AIRole): string {
        if (role === "user") return "user";
        if (role === "assistant") return "model";
        return "user"; // System prompts are handled separately in Gemini
    }

    async generateText(
        prompt: string,
        history: AIMessage[] = [],
        options: GenerateTextOptions = {}
    ): Promise<string> {
        try {
            const modelName = options.model || this.defaultModel;
            const model = this.client.getGenerativeModel({
                model: modelName,
                systemInstruction: options.systemPrompt
            });

            const chat = model.startChat({
                history: history.map(msg => ({
                    role: this.mapRole(msg.role),
                    parts: [{ text: msg.content }]
                })),
                generationConfig: {
                    maxOutputTokens: options.maxTokens,
                    temperature: options.temperature,
                }
            });

            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini Text Generation Error:", error);
            throw error;
        }
    }

    async generateJSON<T>(
        prompt: string,
        history: AIMessage[] = [],
        options: GenerateJSONOptions<T>
    ): Promise<T> {
        try {
            const modelName = options.model || this.defaultModel;
            const model = this.client.getGenerativeModel({
                model: modelName,
                systemInstruction: options.systemPrompt ? options.systemPrompt + "\n\nOutput strictly valid JSON." : "Output strictly valid JSON."
            });

            const chat = model.startChat({
                history: history.map(msg => ({
                    role: this.mapRole(msg.role),
                    parts: [{ text: msg.content }]
                })),
                generationConfig: {
                    maxOutputTokens: options.maxTokens,
                    temperature: options.temperature,
                    responseMimeType: "application/json",
                }
            });

            const result = await chat.sendMessage(prompt);
            const output = result.response.text();

            try {
                const json = JSON.parse(output);
                // Validate with Zod if schema provided
                if (options.schema) {
                    return options.schema.parse(json);
                }
                return json as T;
            } catch (parseError) {
                console.error("Gemini JSON Parse Error:", parseError, "Output:", output);
                throw new Error("Failed to parse Gemini JSON response");
            }
        } catch (error) {
            console.error("Gemini JSON Generation Error:", error);
            throw error;
        }
    }
}

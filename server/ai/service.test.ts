import { describe, it, expect, vi } from "vitest";
import { GeminiAdapter } from "./gemini";
import { AIMessage } from "./service";

// Mock the Google Generative AI SDK
// Mock the Google Generative AI SDK
vi.mock("@google/generative-ai", () => {
    return {
        GoogleGenerativeAI: class MockGoogleGenerativeAI {
            constructor(apiKey: string) { }
            getGenerativeModel() {
                return {
                    startChat: () => ({
                        sendMessage: async () => ({
                            response: {
                                text: () => "Mock AI Response",
                            },
                        }),
                    }),
                };
            }
        },
    };
});

describe("AIService - Gemini Adapter", () => {
    it("should initialize without error", () => {
        const adapter = new GeminiAdapter("fake-key");
        expect(adapter).toBeDefined();
        expect(adapter.provider).toBe("gemini");
    });

    it("should generate text", async () => {
        const adapter = new GeminiAdapter("fake-key");
        const response = await adapter.generateText("Hello");
        expect(response).toBe("Mock AI Response");
    });

    it("should handle history correctly", async () => {
        const adapter = new GeminiAdapter("fake-key");
        const history: AIMessage[] = [
            { role: "user", content: "Hi" },
            { role: "assistant", content: "Hello" }
        ];
        const response = await adapter.generateText("How vary?", history);
        expect(response).toBe("Mock AI Response");
    });
});

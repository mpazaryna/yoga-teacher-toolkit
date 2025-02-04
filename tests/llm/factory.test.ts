import { assertEquals, assertThrows } from "@std/assert";
import { createProvider } from "@/llm/factory.ts";
import type { LLMProvider } from "@/llm/types.ts";

Deno.test("LLM Factory - Provider Creation", async (t) => {
  await t.step("should create Claude provider", () => {
    const provider = createProvider("claude");
    assertEquals(typeof provider.generateContent, "function");
  });

  await t.step("should create OpenAI provider", () => {
    const provider = createProvider("openai");
    assertEquals(typeof provider.generateContent, "function");
  });

  await t.step("should create Groq provider", () => {
    const provider = createProvider("groq");
    assertEquals(typeof provider.generateContent, "function");
  });

  await t.step("should create Gemini provider", () => {
    const provider = createProvider("gemini");
    assertEquals(typeof provider.generateContent, "function");
  });

  await t.step("should throw error for unsupported provider", () => {
    assertThrows(
      () => createProvider("unsupported" as any),
      Error,
      "Provider unsupported not supported"
    );
  });

  await t.step("should accept configuration options", () => {
    const config = { temperature: 0.7, maxTokens: 1000 };
    const provider = createProvider("claude", config);
    assertEquals(typeof provider.generateContent, "function");
  });

  await t.step("provider should return LLMResponse", async () => {
    const provider = createProvider("claude");
    const response = await provider.generateContent("test prompt");
    assertEquals(typeof response.content, "string");
  });
}); 
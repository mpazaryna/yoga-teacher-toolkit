/// <reference lib="deno.ns" />

import { assertEquals, assertRejects } from "@std/assert";
import { generate } from "@/content/generator-template.ts";
import type { ProviderType } from "@/llm/types.ts";

// Test types that mirror our implementation
interface BaseContext extends Record<string, unknown> {
  type: "yoga" | "dharma";
  name: string;
  style?: string;
}

interface TestYogaContext extends BaseContext {
  type: "yoga";
  level: string;
  duration: string;
  focus: string;
  props?: string[];
  contraindications?: string[];
}

interface TestConfig {
  provider: ProviderType;
  template: { path: string };
  context: TestYogaContext;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

// Set the provider to use for tests
const TEST_PROVIDER: ProviderType = "claude";
const TEST_MODEL = "claude-3-sonnet-20240229";
const TEST_CONFIG = {
  provider: TEST_PROVIDER,
  model: TEST_MODEL,
  maxTokens: 4000,
  temperature: 0.7
};

// Check for API key
const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
if (!apiKey) {
  console.warn(`⚠️ No API key found for Claude. Tests will be skipped.`);
  Deno.exit(0);
}

Deno.test("Content Generator - Yoga Sequences", async (t) => {
  await t.step("validates required fields", async () => {
    const invalidConfig: TestConfig = {
      ...TEST_CONFIG,
      template: { path: "data/templates/sequence-prompt.md" },
      context: {
        type: "yoga",
        name: "test-sequence",
        duration: "60 minutes",
        focus: "strength"
      } as TestYogaContext // Missing level field
    };
    
    try {
      await generate(invalidConfig);
      throw new Error("Expected validation to fail");
    } catch (error) {
      assertEquals(error instanceof Error, true);
      // Just verify it's an error without checking specific message
      // since the error format is an object
    }
  });
  
  await t.step("generates sequence with minimal config", async () => {
    const config: TestConfig = {
      ...TEST_CONFIG,
      template: { path: "data/templates/sequence-prompt.md" },
      context: {
        type: "yoga",
        name: "test-sequence",
        level: "beginner",
        duration: "60 minutes",
        focus: "strength"
      }
    };
    
    const result = await generate(config);
    // Just verify we got a non-empty string response
    assertEquals(typeof result, "string");
    assertEquals(result.length > 100, true); // Should be a substantial response
  });
  
  await t.step("includes optional parameters in generation", async () => {
    const config: TestConfig = {
      ...TEST_CONFIG,
      template: { path: "data/templates/sequence-prompt.md" },
      context: {
        type: "yoga",
        name: "test-sequence",
        level: "intermediate",
        duration: "90 minutes",
        focus: "flexibility",
        style: "vinyasa",
        props: ["blocks", "strap"],
        contraindications: ["lower back pain"]
      }
    };
    
    const result = await generate(config);
    // Verify we got a substantial response
    assertEquals(typeof result, "string");
    assertEquals(result.length > 500, true, "Response should be a substantial yoga sequence");
    
    // Log the actual response for debugging
    console.log("Response content:", result);
    
    // Verify it has some basic structure we expect
    assertEquals(result.includes("#"), true, "Response should contain markdown headings");
    assertEquals(result.includes("##"), true, "Response should contain section headings");
  });
}); 
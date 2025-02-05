import { assertEquals, assertRejects } from "https://deno.land/std@0.219.0/assert/mod.ts";
import { generateYogaSequence } from "../../src/generators/yoga.ts";
import type { YogaConfig } from "../../src/generators/yoga.ts";  // Import from yoga.ts directly
import type { ProviderType } from "../../src/llm/types.ts";

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

Deno.test("Yoga Sequence Generator", async (t) => {
  await t.step("validates required fields", async () => {
    const invalidConfig: YogaConfig = {
      ...TEST_CONFIG,
      template: "data/templates/sequence-prompt.md",
      level: "",  // Invalid: empty level
      duration: "60 minutes",
      focus: "strength"
    };
    
    await assertRejects(
      () => generateYogaSequence(invalidConfig),
      Error,
      "Level is required"
    );
  });
  
  await t.step("generates sequence with minimal config", async () => {
    const config: YogaConfig = {
      ...TEST_CONFIG,
      template: "data/templates/sequence-prompt.md",
      level: "beginner",
      duration: "60 minutes",
      focus: "strength"
    };
    
    const result = await generateYogaSequence(config);
    // Just verify we got a non-empty string response
    assertEquals(typeof result, "string");
    assertEquals(result.length > 100, true); // Should be a substantial response
  });
  
  await t.step("includes optional parameters in generation", async () => {
    const config: YogaConfig = {
      ...TEST_CONFIG,
      template: "data/templates/sequence-prompt.md",
      level: "intermediate",
      duration: "90 minutes",
      focus: "flexibility",
      style: "vinyasa",
      props: ["blocks", "strap"],
      contraindications: ["lower back pain"]
    };
    
    const result = await generateYogaSequence(config);
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
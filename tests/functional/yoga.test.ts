import { assertEquals, assertRejects } from "https://deno.land/std@0.219.0/assert/mod.ts";
import { generateYogaSequence } from "../../src/generators/yoga.ts";
import type { YogaConfig } from "../../src/generators/types.ts";
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

const mockTemplate = `
# {concept}

## Parameters
- Level: {level}
- Duration: {duration}
- Focus: {focus}
- Style: {style}
- Props: {props}
- Contraindications: {contraindications}

## Sequence
{sequence}
`;

Deno.test("Yoga Sequence Generator", async (t) => {
  await t.step("validates required fields", async () => {
    const invalidConfig: YogaConfig = {
      ...TEST_CONFIG,
      template: mockTemplate,
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
      template: mockTemplate,
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
      template: mockTemplate,
      level: "intermediate",
      duration: "90 minutes",
      focus: "flexibility",
      style: "vinyasa",
      props: ["blocks", "strap"],
      contraindications: ["lower back pain"]
    };
    
    const result = await generateYogaSequence(config);
    // Just verify we got a non-empty string response
    assertEquals(typeof result, "string");
    assertEquals(result.length > 100, true); // Should be a substantial response
    
    // Very lenient content checks - just make sure some of our input was considered
    const lowerResult = result.toLowerCase();
    const hasAnyKeyword = [
      "intermediate",
      "flexibility",
      "vinyasa",
      "block",
      "strap",
      "back"
    ].some(keyword => lowerResult.includes(keyword.toLowerCase()));
    
    assertEquals(hasAnyKeyword, true, "Response should include at least one of the input keywords");
  });
}); 
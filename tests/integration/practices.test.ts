import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";
import { generateTestSequence } from "../../src/practices.ts";
import { join, dirname, fromFileUrl } from "https://deno.land/std/path/mod.ts";
import type { YogaContext } from "../../src/content/ContentHandler.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";

// Get project root directory
const PROJECT_ROOT = new URL("../../", import.meta.url).pathname;

const TEST_CONFIG = {
  provider: "test-provider",
  template: "test-template.txt",
  sequences: [{
    name: "Test Sequence",
    type: "yoga" as const,
    duration: "60min",
    level: "beginner",
    style: "vinyasa",
    focus: "core",
    concept: "test flow",
    props: ["mat"],
    asanas: ["mountain pose", "child's pose"],
    transitions: ["flow", "hold"],
    breathwork: ["ujjayi"],
    peak: ["warrior III"],
    modifications: ["use blocks for balance"]
  } satisfies YogaContext]
};

Deno.test({
  name: "generateTestSequence integration test",
  async fn() {
    // Create test directories
    const tempDir = await Deno.makeTempDir();
    const configPath = join(tempDir, "test-config.json");
    const templateDir = join(PROJECT_ROOT, "data", "templates");
    const outputDir = join(PROJECT_ROOT, "data", "output");
    
    try {
      // Ensure directories exist
      await ensureDir(templateDir);
      await ensureDir(outputDir);
      
      // Create test template
      const templatePath = join(templateDir, "test-template.txt");
      await Deno.writeTextFile(templatePath, "Test template for {name} - {concept}");
      
      // Write test config
      await Deno.writeTextFile(configPath, JSON.stringify(TEST_CONFIG));
      
      // Run generation
      await generateTestSequence(TEST_CONFIG);
      
      // Verify output directory contains generated file
      const files = Array.from(Deno.readDirSync(outputDir));
      
      // Should find at least one file matching our test sequence
      const generatedFile = files.find(f => 
        f.name.includes("test-sequence") && f.name.includes("yoga")
      );
      
      assertExists(generatedFile, "Generated file should exist");
    } finally {
      // Cleanup
      await Deno.remove(tempDir, { recursive: true });
      // Optionally cleanup test template
      try {
        await Deno.remove(join(templateDir, "test-template.txt"));
      } catch {
        // Ignore errors if file doesn't exist
      }
    }
  },
  sanitizeOps: false,
  sanitizeResources: false
}); 
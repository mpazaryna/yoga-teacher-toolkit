import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";
import { generateTestSequence } from "../../src/app/practices.ts";
import { join, dirname, fromFileUrl } from "https://deno.land/std/path/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import type { YogaContext } from "../../src/app/content/ContentHandler.ts";

// Get project root directory
const PROJECT_ROOT = new URL("../../", import.meta.url).pathname;

Deno.test({
  name: "Full content generation E2E test",
  async fn() {
    const testConfig = {
      provider: "test-provider",
      template: "yoga-template.txt",
      sequences: [{
        name: "Morning Flow",
        type: "yoga" as const,
        duration: "30min",
        level: "beginner",
        style: "gentle",
        focus: "warmup",
        concept: "morning warmup",
        props: ["mat", "blocks"],
        asanas: ["mountain pose", "cat-cow", "downward dog"],
        transitions: ["flow", "hold"],
        breathwork: ["ujjayi"],
        peak: ["sun salutation A"],
        modifications: ["use blocks for support"]
      } satisfies YogaContext]
    };

    // Setup test environment
    const tempDir = await Deno.makeTempDir();
    const configPath = join(tempDir, "test-config.json");
    const templateDir = join(PROJECT_ROOT, "data", "templates");
    const outputDir = join(PROJECT_ROOT, "data", "output");

    try {
      // Ensure directories exist
      await ensureDir(templateDir);
      await ensureDir(outputDir);
      
      // Create test template
      const templatePath = join(templateDir, "yoga-template.txt");
      await Deno.writeTextFile(templatePath, "Test template for {name} - {concept}");

      // Write test config
      await Deno.writeTextFile(configPath, JSON.stringify(testConfig));

      // Run generation
      await generateTestSequence(testConfig);

      // Verify output
      const files = Array.from(Deno.readDirSync(outputDir));
      const generatedFile = files.find(f => 
        f.name.toLowerCase().includes("morning-flow") && 
        f.name.includes("yoga")
      );

      assertExists(generatedFile, "Generated file should exist");

      if (generatedFile) {  // TypeScript guard
        const content = await Deno.readTextFile(
          join(outputDir, generatedFile.name)
        );
        
        // Verify content
        assertEquals(content.includes("Morning Flow"), true);
        assertEquals(content.includes("30min"), true);
        assertEquals(content.includes("morning warmup"), true);
      }
      
    } finally {
      // Cleanup
      await Deno.remove(tempDir, { recursive: true });
      try {
        await Deno.remove(join(templateDir, "yoga-template.txt"));
      } catch {
        // Ignore errors if file doesn't exist
      }
    }
  },
  sanitizeOps: false,
  sanitizeResources: false
}); 
import { join, dirname, fromFileUrl } from "https://deno.land/std/path/mod.ts";
import { parse } from "https://deno.land/std/flags/mod.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
//import { createGenerator } from "../module-template-generator/generator.ts";
import { createGenerator } from "@forge/generator";
import type { GeneratorContext } from "../module-template-generator/types.ts";
import { getLLMClient } from './config/llm.ts';
import { ContentHandler, GenerationContext, YogaContext, DharmaTalkContext } from './content/ContentHandler.ts';
import { YogaContentHandler } from './content/YogaContentHandler.ts';
import { DharmaContentHandler } from './content/DharmaContentHandler.ts';

// Content type discriminator
type ContentType = 'yoga' | 'dharma';

interface TestConfig {
  provider: string;
  template: string;
  sequences?: YogaContext[];
  talks?: DharmaTalkContext[];
}

// Replace contentHandlers object with a factory
const contentHandlers: Record<ContentType, ContentHandler> = {
  yoga: new YogaContentHandler(),
  dharma: new DharmaContentHandler()
};

export async function loadConfig(configPath: string): Promise<TestConfig> {
  try {
    const content = await Deno.readTextFile(configPath);
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error);
    throw error;
  }
}

// Function to generate a 5 character alphanumeric ID
function generateShortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 5 },
    () => chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

async function generateContent(
  item: GenerationContext & GeneratorContext,
  config: TestConfig,
): Promise<string> {
  const handler = contentHandlers[item.type];
  handler.validateContext(item);

  const templatePath = join(
    dirname(fromFileUrl(import.meta.url)),
    "../../data/templates",
    config.template
  );

  const llm = getLLMClient();

  const generator = createGenerator({
    llm,
    retryOptions: {
      maxAttempts: 3,
      delayMs: 1000,
      onError: (error: Error, attempt: number) => {
        console.error(`❌ Generation attempt ${attempt} failed:`, error.message);
      },
      onRetry: (attempt: number, delay: number) => {
        console.log(`🔄 Retrying in ${delay/1000} seconds... (attempt ${attempt})`);
      }
    }
  });

  // Break down the steps for debugging
  console.log("Loading template...");
  const withTemplate = await generator.loadTemplate(templatePath);
  console.log("Adding context...");
  const withContext = withTemplate.withContext(item);
  console.log("Generating content...");
  const result = await withContext.generate();

  return handler.formatOutput(result.content, item);
}

export async function generateTestSequence(
  config: TestConfig,
  itemName?: string
): Promise<void> {
  const items = config.sequences 
    ? config.sequences.map(s => ({ ...s, type: 'yoga' as const }))
    : config.talks 
      ? config.talks.map(t => ({ ...t, type: 'dharma' as const }))
      : [];
      
  const selectedItems = itemName
    ? items.filter(s => s.name === itemName)
    : items;

  if (itemName && selectedItems.length === 0) {
    console.error(`No content found with name: ${itemName}`);
    return;
  }

  const outputDir = join(dirname(fromFileUrl(import.meta.url)), "../../data/output");
  await ensureDir(outputDir);

  for (const item of selectedItems) {
    console.log(`\nGenerating ${item.type} content: ${item.name}`);
    console.log("----------------------------------------");

    try {
      const content = await generateContent(item, config);
      const uniqueId = generateShortId();
      
      const outputPath = join(
        outputDir,
        `${uniqueId}-${item.name.toLowerCase().replace(/\s+/g, '-')}-${item.type}-prompt.md`
      );
      
      await Deno.writeTextFile(outputPath, content);
      console.log(`✅ Content saved to: ${outputPath}`);
      console.log(`\nContent ID: ${uniqueId}`);
    } catch (error) {
      console.error(`❌ Error generating ${item.type} content ${item.name}:`, error);
    }
  }
}

// Export for testing
export { generateShortId };

if (import.meta.main) {
  const flags = parse(Deno.args, {
    string: ["config", "sequence"],
    default: {
      config: "data/config/dharma-config.json"
    },
  });

  const configPath = join(dirname(fromFileUrl(import.meta.url)), 
                         `../../${flags.config}`);
  
  try {
    const config = await loadConfig(configPath);
    await generateTestSequence(config, flags.sequence);
  } catch (error) {
    console.error("Failed to run test generation:", error);
    console.error("\nUsage:");
    console.error("  deno run --allow-read --allow-write content-strategy.ts [options]");
    console.error("\nOptions:");
    console.error("  --config=<string>    Path to test configuration file (default: data/config/dharma-config.json)");
    console.error("  --sequence=<string>  Name of specific sequence to generate (optional)");
    Deno.exit(1);
  }
} 
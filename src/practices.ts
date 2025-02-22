import { join, dirname, fromFileUrl } from "@std/path";
import { parse } from "@std/flags";
import { ensureDir } from "@std/fs";
import { createGenerator } from "@forge/generator";
import type { GeneratorContext } from "@forge/generator";
import { getLLMClient } from './llm.ts';
import { ContentHandler, GenerationContext, YogaContext, DharmaTalkContext } from './content/ContentHandler.ts';
import { YogaContentHandler } from './content/YogaContentHandler.ts';
import { DharmaContentHandler } from './content/DharmaContentHandler.ts';
import { getConfigPath, ensureDirectories, PATHS } from "./config.ts";

// Content type discriminator
type ContentType = 'yoga' | 'dharma';

// Export the interface and function for testing
export interface TestConfig {
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

// Change from async function to export async function
export async function loadConfig(configPath: string): Promise<TestConfig> {
  try {
    const fullPath = getConfigPath(configPath);
    const configText = await Deno.readTextFile(fullPath);
    return JSON.parse(configText) as TestConfig;
  } catch (error) {
    throw new Error(`Error loading config from ${configPath}: ${error}`);
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

  const templatePath = join(PATHS.data.templates, config.template);

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

  await ensureDir(PATHS.data.output);

  for (const item of selectedItems) {
    console.log(`\nGenerating ${item.type} content: ${item.name}`);
    console.log("----------------------------------------");

    try {
      const content = await generateContent(item, config);
      const uniqueId = generateShortId();
      
      const outputPath = join(
        PATHS.data.output,
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

async function main() {
  await ensureDirectories();
  
  const flags = parse(Deno.args, {
    string: ["config", "sequence"],
    default: {
      config: "dharma-config.json"
    },
  });

  try {
    const config = await loadConfig(flags.config);
    await generateTestSequence(config, flags.sequence);
  } catch (error) {
    console.error("Failed to run test generation:", error);
    console.error("\nUsage:");
    console.error("  deno run --allow-read --allow-write content-strategy.ts [options]");
    console.error("\nOptions:");
    console.error("  --config=<string>    Name of config file in data/config directory (default: dharma-config.json)");
    console.error("  --sequence=<string>  Name of specific sequence to generate (optional)");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
} 
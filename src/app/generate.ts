import { join, dirname, fromFileUrl } from "https://deno.land/std@0.219.0/path/mod.ts";
import { generateYogaSequence } from "../generators/yoga.ts";
import { parse } from "https://deno.land/std@0.219.0/flags/mod.ts";
import { ensureDir } from "https://deno.land/std@0.219.0/fs/mod.ts";
import type { YogaConfig } from "../generators/types.ts";
import type { ProviderType } from "../llm/types.ts";
import { usageTracker } from "../llm/tracker.ts";

interface SequenceConfig {
  name: string;
  level: string;
  duration: string;
  focus: string;
  style?: string;
  props?: string[];
  contraindications?: string[];
  concept: string;
}

interface DharmaTalkConfig {
  name: string;
  focus: string;
  style?: string;
  duration?: string;
  scriptureReference?: string;
  targetAudience?: string;
  concept: string;
}

interface TestConfig {
  provider: string;
  template: string;
  sequences?: SequenceConfig[];
  talks?: DharmaTalkConfig[];
}

interface ProviderConfig {
  model: string;
  maxTokens: number;
}

type ProviderConfigs = Record<string, ProviderConfig>;

// Function to load provider configurations
export async function loadProviderConfigs(): Promise<ProviderConfigs> {
  try {
    const configPath = join(dirname(fromFileUrl(import.meta.url)), 
                          "../../data/config/providers.json");
    const content = await Deno.readTextFile(configPath);
    return JSON.parse(content);
  } catch (error) {
    console.error("Error loading provider configurations:", error);
    throw new Error("Failed to load provider configurations. Please ensure data/config/providers.json exists and is valid.");
  }
}

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

export async function generateTestSequence(
  config: TestConfig,
  providerConfigs: ProviderConfigs,
  itemName?: string
): Promise<void> {
  // Handle both sequences and talks
  const items = config.sequences 
    ? config.sequences 
    : config.talks 
      ? config.talks 
      : [];
      
  const type = config.sequences ? 'sequence' : 'talk';
  
  const selectedItems = itemName
    ? items.filter(s => s.name === itemName)
    : items;

  if (itemName && selectedItems.length === 0) {
    console.error(`No ${type} found with name: ${itemName}`);
    return;
  }

  const providerConfig = providerConfigs[config.provider];
  if (!providerConfig) {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  for (const item of selectedItems) {
    console.log(`\nGenerating ${type}: ${item.name}`);
    console.log("----------------------------------------");

    try {
      const templatePath = join(dirname(fromFileUrl(import.meta.url)), 
                         `../../data/templates/${config.template}`);
      const template = await Deno.readTextFile(templatePath);

      const baseConfig = {
        provider: config.provider as ProviderType,
        temperature: 0.7,
        ...providerConfig,
        template: {
          path: templatePath,
          context: {
            concept: item.concept
          }
        },
        focus: item.focus,
        style: item.style,
      };

      const result = await generateYogaSequence(
        'level' in item 
          ? {
              ...baseConfig,
              level: item.level,
              duration: item.duration,
              props: item.props,
              contraindications: item.contraindications,
            } as YogaConfig
          : {
              ...baseConfig,
              concept: item.concept,
              duration: item.duration,
              scriptureReference: item.scriptureReference,
              targetAudience: item.targetAudience,
            } as DharmaTalkConfig
      );

      // Generate unique ID
      const uniqueId = generateShortId();

      // Create output directory
      const outputDir = join(dirname(fromFileUrl(import.meta.url)), "../../data/output");
      await ensureDir(outputDir);

      // Prepare metadata header
      const metadata = [
        "---",
        `id: ${uniqueId}`,
        `date: ${new Date().toISOString()}`,
        `provider: ${config.provider}`,
        `model: ${providerConfig.model}`,
        `template: ${config.template}`,
        ...('level' in item 
          ? [
              `level: ${item.level}`,
              `duration: ${item.duration}`,
              `focus: ${item.focus}`,
              item.style ? `style: ${item.style}` : null,
              item.props ? `props: ${JSON.stringify(item.props)}` : null,
              item.contraindications ? `contraindications: ${JSON.stringify(item.contraindications)}` : null,
            ]
          : [
              `focus: ${item.focus}`,
              item.style ? `style: ${item.style}` : null,
              item.duration ? `duration: ${item.duration}` : null,
              item.scriptureReference ? `scriptureReference: ${item.scriptureReference}` : null,
              item.targetAudience ? `targetAudience: ${item.targetAudience}` : null,
            ]
        ).filter(Boolean),
        "status: draft",
        "---",
        "",
        result
      ].filter(Boolean).join("\n");

      // Save the result with unique ID
      const outputPath = join(outputDir, `${uniqueId}-${item.name}-${config.template}`);
      await Deno.writeTextFile(outputPath, metadata);
      console.log(`✅ ${type} saved to: ${outputPath}`);

      // Display usage statistics
      const stats = usageTracker.getUsageStats();
      console.log("\nUsage Statistics:");
      console.log(`Total API calls: ${stats.totalCalls}`);
      console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
      console.log(`Average latency: ${stats.averageLatency.toFixed(0)}ms`);
      console.log(`Total tokens used: ${stats.totalTokens}`);
      console.log(`Estimated cost: $${stats.totalCost.toFixed(4)}`);
      
      if (stats.usageByProvider[config.provider]) {
        console.log(`Tokens used by ${config.provider}: ${stats.usageByProvider[config.provider]}`);
      }

      console.log(`\n${type} ID: ${uniqueId}`);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.error(`Template '${config.template}' not found`);
        console.error("\nAvailable templates:");
        for await (const dirEntry of Deno.readDir(join(dirname(fromFileUrl(import.meta.url)), "../../data/templates"))) {
          if (dirEntry.isFile) {
            console.error(`  - ${dirEntry.name}`);
          }
        }
        continue;
      }
      console.error(`❌ Error generating ${type} ${item.name}:`, error);
    }
  }
}

if (import.meta.main) {
  const flags = parse(Deno.args, {
    string: ["config", "sequence"],
    default: {
      config: "data/config/test-sequence.json"
    },
  });

  const configPath = join(dirname(fromFileUrl(import.meta.url)), 
                         `../../${flags.config}`);
  
  try {
    const [config, providerConfigs] = await Promise.all([
      loadConfig(configPath),
      loadProviderConfigs()
    ]);
    await generateTestSequence(config, providerConfigs, flags.sequence);
  } catch (error) {
    console.error("Failed to run test generation:", error);
    console.error("\nUsage:");
    console.error("  deno run --allow-read --allow-write generate.ts [options]");
    console.error("\nOptions:");
    console.error("  --config=<string>    Path to test configuration file (default: data/config/test-sequence.json)");
    console.error("  --sequence=<string>  Name of specific sequence to generate (optional)");
    Deno.exit(1);
  }
} 
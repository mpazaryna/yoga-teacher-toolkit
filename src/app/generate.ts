import { join, dirname, fromFileUrl } from "@std/path";
import { generateYogaSequence, usageTracker, type ProviderType } from "../mod.ts";
import { parse } from "@std/flags";
import { ensureDir } from "@std/fs";

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

interface TestConfig {
  provider: string;
  template: string;
  sequences: SequenceConfig[];
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
  sequenceName?: string
): Promise<void> {
  const sequences = sequenceName
    ? config.sequences.filter(s => s.name === sequenceName)
    : config.sequences;

  if (sequenceName && sequences.length === 0) {
    console.error(`No sequence found with name: ${sequenceName}`);
    return;
  }

  const providerConfig = providerConfigs[config.provider];
  if (!providerConfig) {
    throw new Error(`Unsupported provider: ${config.provider}. Available providers: ${Object.keys(providerConfigs).join(", ")}`);
  }

  for (const sequence of sequences) {
    console.log(`\nGenerating sequence: ${sequence.name}`);
    console.log("----------------------------------------");

    try {
      // Read template content
      const templatePath = join(dirname(fromFileUrl(import.meta.url)), 
                         `../../data/templates/${config.template}`);
      const template = await Deno.readTextFile(templatePath);

      const result = await generateYogaSequence({
        provider: config.provider as ProviderType,
        temperature: 0.7,
        ...providerConfig,
        template,
        level: sequence.level,
        duration: sequence.duration,
        focus: sequence.focus,
        style: sequence.style,
        props: sequence.props,
        contraindications: sequence.contraindications,
        concept: sequence.concept
      });

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
        `level: ${sequence.level}`,
        `duration: ${sequence.duration}`,
        `focus: ${sequence.focus}`,
        sequence.style ? `style: ${sequence.style}` : null,
        sequence.props ? `props: ${JSON.stringify(sequence.props)}` : null,
        sequence.contraindications ? `contraindications: ${JSON.stringify(sequence.contraindications)}` : null,
        sequence.concept ? `concept: ${JSON.stringify(sequence.concept)}` : null,
        "status: draft",
        "---",
        "",
        result
      ].filter(Boolean).join("\n");

      // Save the result with unique ID
      const outputPath = join(outputDir, `${uniqueId}-${sequence.name}-${config.template}`);
      await Deno.writeTextFile(outputPath, metadata);
      console.log(`✅ Sequence saved to: ${outputPath}`);

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

      console.log(`\nSequence ID: ${uniqueId}`);
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
      console.error(`❌ Error generating sequence ${sequence.name}:`, error);
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
    console.error("  deno run --allow-read --allow-write test.ts [options]");
    console.error("\nOptions:");
    console.error("  --config=<string>    Path to test configuration file (default: data/config/test-sequence.json)");
    console.error("  --sequence=<string>  Name of specific sequence to generate (optional)");
    Deno.exit(1);
  }
} 
import { join, dirname, fromFileUrl } from "@std/path";
import { parse } from "@std/flags";
import { ensureDir } from "@std/fs";
import {
  generateYogaSequence, usageTracker
} from "@paz/lexikon";

// Function to generate a 5 character alphanumeric ID
function generateShortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 5 },
    () => chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

// Ensure output directory exists
async function ensureOutputDir(dirPath: string) {
  try {
    await Deno.stat(dirPath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await Deno.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

type Provider = "openai" | "claude" | "gemini" | "groq";

interface ProviderConfig {
  model: string;
  maxTokens: number;
}

const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  openai: {
    model: "gpt-4",
    maxTokens: 4000,
  },
  claude: {
    model: "claude-3-sonnet-20240229",
    maxTokens: 4000,
  },
  gemini: {
    model: "gemini-pro",
    maxTokens: 4000,
  },
  groq: {
    model: "mixtral-8x7b-32768",
    maxTokens: 4000,
  },
};

// Parse command line arguments
const flags = parse(Deno.args, {
  string: ["provider", "level", "duration", "focus", "template"],
  default: {
    level: "intermediate",
    duration: "60 minutes",
    focus: "strength and flexibility",
    template: "aileen"
  },
});

const provider = flags.provider as Provider;
if (!provider || !PROVIDER_CONFIGS[provider]) {
  console.error("Please specify a valid provider: openai, claude, gemini, or groq");
  console.error("\nUsage:");
  console.error("  deno run --allow-read --allow-write generate.ts --provider=claude [options]");
  console.error("\nOptions:");
  console.error("  --level=<string>         Difficulty level (default: intermediate)");
  console.error("  --duration=<string>      Session duration (default: 60 minutes)");
  console.error("  --focus=<string>         Practice focus (default: strength and flexibility)");
  console.error("  --template=<string>      Template to use (default: aileen)");
  Deno.exit(1);
}

async function generateYogaFromTemplate(provider: Provider, level: string, duration: string, focus: string, templateName: string) {
  console.log(`Generating yoga sequence using ${provider.toUpperCase()}...`);
  const templatePath = join(dirname(fromFileUrl(import.meta.url)), "../../data/templates", `${templateName}.txt`);

  try {
    const template = await Deno.readTextFile(templatePath);
    
    const result = await generateYogaSequence({
      provider,
      temperature: 0.7,
      ...PROVIDER_CONFIGS[provider],
      template,
      level,
      duration,
      focus
    });

    // Create unique ID
    const uniqueId = generateShortId();

    // Ensure output directory exists
    const outputDir = join(dirname(fromFileUrl(import.meta.url)), "../../data/output");
    await ensureDir(outputDir);

    // Save the generated sequence with unique ID prefix
    const outputPath = join(outputDir, `${uniqueId}-${templateName}.md`);
    
    // Add metadata header to the output
    const outputContent = [
      "---",
      `id: ${uniqueId}`,
      `date: ${new Date().toISOString()}`,
      `provider: ${provider}`,
      `template: ${templateName}`,
      `level: ${level}`,
      `duration: ${duration}`,
      `focus: ${focus}`,
      "status: draft",
      "---",
      "",
      result
    ].join("\n");

    await Deno.writeTextFile(outputPath, outputContent);
    console.log(`\nSequence saved to: ${outputPath}`);

    // Display usage statistics
    const stats = usageTracker.getUsageStats();
    console.log("\nUsage Statistics:");
    console.log(`Total API calls: ${stats.totalCalls}`);
    console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
    console.log(`Average latency: ${stats.averageLatency.toFixed(0)}ms`);
    console.log(`Total tokens used: ${stats.totalTokens}`);
    console.log(`Estimated cost: $${stats.totalCost.toFixed(4)}`);
    
    if (stats.usageByProvider[provider]) {
      console.log(`Tokens used by ${provider}: ${stats.usageByProvider[provider]}`);
    }

    // Print the unique ID for reference
    console.log(`\nSequence ID: ${uniqueId}`);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`Template '${templateName}' not found at ${templatePath}`);
      console.error("\nAvailable templates:");
      for await (const dirEntry of Deno.readDir(join(dirname(fromFileUrl(import.meta.url)), "../../data/templates"))) {
        if (dirEntry.isFile && dirEntry.name.endsWith(".txt")) {
          console.error(`  - ${dirEntry.name.replace(".txt", "")}`);
        }
      }
      Deno.exit(1);
    }
    throw error;
  }
}

// If this module is run directly, generate sequences for all providers
if (import.meta.main) {
  await generateYogaFromTemplate(provider, flags.level, flags.duration, flags.focus, flags.template);
} 
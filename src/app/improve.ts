import { join, dirname, fromFileUrl } from "@std/path";
import { parse } from "@std/flags";

import {
  type YogaGeneratorOptions,
  generateYogaSequence
} from "@paz/lexikon";

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
  string: ["provider", "level", "duration", "focus"],
  default: {
    level: "intermediate",
    duration: "60 minutes",
    focus: "strength and flexibility",
  },
});

const provider = flags.provider as Provider;
if (!provider || !PROVIDER_CONFIGS[provider]) {
  console.error("Please specify a valid provider: openai, claude, gemini, or groq");
  console.error("\nUsage:");
  console.error("  deno run --allow-read --allow-write improve.ts --provider=claude [options]");
  console.error("\nOptions:");
  console.error("  --level=<string>         Difficulty level (default: intermediate)");
  console.error("  --duration=<string>      Session duration (default: 60 minutes)");
  console.error("  --focus=<string>         Practice focus (default: strength and flexibility)");
  Deno.exit(1);
}

const __dirname = dirname(fromFileUrl(import.meta.url));

// Read the template file
const templatePath = join(__dirname, "../../templates", "hatha.txt");
const template = await Deno.readTextFile(templatePath);

// Create config
const config: YogaGeneratorOptions = {
  provider,
  model: PROVIDER_CONFIGS[provider].model,
  maxTokens: PROVIDER_CONFIGS[provider].maxTokens,
  temperature: 0.7,
  template,
  level: flags.level,
  duration: flags.duration,
  focus: flags.focus
};

// Generate the sequence
const result = await generateYogaSequence(config);

// Save the sequence
const outputPath = join(__dirname, "../../output", `yoga-sequence-${provider}.md`);
await Deno.writeTextFile(outputPath, result);
console.log(`\nSequence saved to: ${outputPath}`); 
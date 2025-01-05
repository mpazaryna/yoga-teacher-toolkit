import { join, dirname, fromFileUrl } from "@std/path";
import { parse } from "@std/flags";

import {
  YogaConfig, YogaImprover, type YogaResult
} from "@paz/lexikon";

// Add Deno types
declare global {
  const Deno: {
    readTextFile(path: string): Promise<string>;
    writeTextFile(path: string, data: string): Promise<void>;
    args: string[];
    exit(code: number): never;
  };
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
  string: ["provider", "focus"],
  number: ["iterations", "min-score"],
  default: {
    iterations: 1,
    "min-score": 0,
  },
});

const provider = flags.provider as Provider;
if (!provider || !PROVIDER_CONFIGS[provider]) {
  console.error("Please specify a valid provider: openai, claude, gemini, or groq");
  console.error("\nUsage:");
  console.error("  deno run --allow-read --allow-write improve-yoga.ts --provider=claude [options]");
  console.error("\nOptions:");
  console.error("  --iterations=<number>     Number of improvement iterations (default: 1)");
  console.error("  --min-score=<number>      Stop when this score is reached (default: 0)");
  console.error("  --focus=<criteria>        Comma-separated list of criteria to focus on");
  Deno.exit(1);
}

const __dirname = dirname(fromFileUrl(import.meta.url));

// Read the template file
const templatePath = join(__dirname, "templates", "hatha.txt");
const template = await Deno.readTextFile(templatePath);

// Create config
const config: YogaConfig = {
  provider,
  model: PROVIDER_CONFIGS[provider].model,
  maxTokens: PROVIDER_CONFIGS[provider].maxTokens,
  temperature: 0.7,
  template,
  level: "intermediate",
  duration: "60 minutes",
  focus: "strength and flexibility",
  outputPath: join(__dirname, "..", "..", "output", `yoga-improved-${provider}.md`),
  evaluationPath: join(__dirname, "..", "..", "output", `yoga-evaluation-${provider}.md`)
};

// Run improvement process
async function improveSequence(
  config: YogaConfig, 
  iterations: number, 
  minScore: number, 
  focusCriteria?: string[]
): Promise<YogaResult> {
  let result: YogaResult;
  let currentConfig = config;

  for (let i = 0; i < iterations; i++) {
    console.log(`\nIteration ${i + 1}/${iterations}`);
    
    if (i === 0) {
      // First iteration: generate initial sequence
      const improver = new YogaImprover(currentConfig, {
        overallScore: 0,
        recommendations: [],
        criteriaScores: {},
        domainSpecificMetrics: {}
      });
      result = await improver.improve();
    } else {
      // Subsequent iterations: improve based on previous evaluation
      const improver = new YogaImprover(currentConfig, result.evaluation);
      result = await improver.improve();
    }

    // Check if we've reached the minimum score
    if (result.evaluation.overallScore >= minScore) {
      console.log(`\nReached minimum score of ${minScore}`);
      break;
    }
  }

  return result!;
}

// Run the improvement process
await improveSequence(
  config, 
  flags.iterations, 
  flags["min-score"], 
  flags.focus?.split(",").map(c => c.trim())
); 
import { join, dirname, fromFileUrl } from "@std/path";
import { generateYogaSequence } from "@paz/lexikon";
import { parse } from "@std/flags";

interface SequenceConfig {
  name: string;
  level: string;
  duration: string;
  focus: string;
  style?: string;
  props?: string[];
  contraindications?: string[];
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

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
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

async function loadConfig(configPath: string): Promise<TestConfig> {
  try {
    const content = await Deno.readTextFile(configPath);
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error);
    throw error;
  }
}

async function generateTestSequence(
  config: TestConfig,
  sequenceName?: string
): Promise<void> {
  const sequences = sequenceName
    ? config.sequences.filter(s => s.name === sequenceName)
    : config.sequences;

  if (sequenceName && sequences.length === 0) {
    console.error(`No sequence found with name: ${sequenceName}`);
    return;
  }

  const providerConfig = PROVIDER_CONFIGS[config.provider];
  if (!providerConfig) {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  for (const sequence of sequences) {
    console.log(`\nGenerating sequence: ${sequence.name}`);
    console.log("----------------------------------------");

    try {
      const result = await generateYogaSequence({
        provider: config.provider,
        temperature: 0.7,
        ...providerConfig,
        templatePath: join(dirname(fromFileUrl(import.meta.url)), 
                         `../../data/templates/${config.template}.txt`),
        ...sequence
      });

      // Create output directory if it doesn't exist
      const outputDir = join(dirname(fromFileUrl(import.meta.url)), 
                           "../../data/output");
      try {
        await Deno.mkdir(outputDir, { recursive: true });
      } catch (error) {
        if (!(error instanceof Deno.errors.AlreadyExists)) {
          throw error;
        }
      }

      // Save the result
      const outputPath = join(outputDir, `${sequence.name}-${config.template}.md`);
      await Deno.writeTextFile(outputPath, result);
      console.log(`✅ Sequence saved to: ${outputPath}`);
    } catch (error) {
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
    const config = await loadConfig(configPath);
    await generateTestSequence(config, flags.sequence);
  } catch (error) {
    console.error("Failed to run test generation:", error);
    Deno.exit(1);
  }
} 
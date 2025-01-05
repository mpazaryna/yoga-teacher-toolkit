import { join, dirname, fromFileUrl } from "@std/path";
import {
  generateYogaSequence, usageTracker
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

async function generateYogaFromTemplate(provider: Provider) {
  console.log(`Generating yoga sequence using ${provider.toUpperCase()}...`);
  const templatePath = join(dirname(fromFileUrl(import.meta.url)), "templates", "hatha.txt");

  const template = await Deno.readTextFile(templatePath);
  
  const result = await generateYogaSequence({
    provider,
    temperature: 0.7,
    ...PROVIDER_CONFIGS[provider],
    template,
    level: "intermediate",
    duration: "60 minutes",
    focus: "strength and flexibility"
  });

  // Save the generated sequence
  const outputPath = join(dirname(fromFileUrl(import.meta.url)), "..", "..", "output", `yoga-${provider}.md`);
  await Deno.writeTextFile(outputPath, result.content);
  console.log(`\nSequence saved to: ${outputPath}`);

  // Save evaluation results
  const evaluationPath = join(dirname(fromFileUrl(import.meta.url)), "..", "..", "output", `yoga-evaluation-${provider}.md`);
  const evaluationContent = [
    `# Yoga Sequence Evaluation Results - ${provider.toUpperCase()}`,
    "",
    `## Overall Score: ${(result.evaluation.overallScore * 100).toFixed(1)}%`,
    "",
    "## Detailed Scores",
    ...Object.entries(result.evaluation.criteriaScores).map(([criterion, score]) => [
      `### ${criterion}: ${(score.score * 100).toFixed(1)}%`,
      ...score.details.map(detail => `- ${detail}`),
      ""
    ]).flat(),
    "## Domain-Specific Metrics",
    ...Object.entries(result.evaluation.domainSpecificMetrics).map(([metric, value]) => 
      `- ${metric}: ${value}`
    ),
    "",
    "## Recommendations",
    ...result.evaluation.recommendations.map(rec => `- ${rec}`),
    "",
    "## Generation Details",
    `- Model: ${PROVIDER_CONFIGS[provider].model}`,
    `- Level: intermediate`,
    `- Duration: 60 minutes`,
    `- Focus: strength and flexibility`,
    `- Temperature: 0.7`,
    `- Timestamp: ${new Date().toISOString()}`
  ].join("\n");

  await Deno.writeTextFile(evaluationPath, evaluationContent);
  console.log(`Evaluation results saved to: ${evaluationPath}`);

  // Display evaluation results
  console.log("\nEvaluation Details:");
  Object.entries(result.evaluation.criteriaScores).forEach(([criterion, score]) => {
    console.log(`${criterion}: ${(score.score * 100).toFixed(1)}%`);
    score.details.forEach(detail => console.log(`  - ${detail}`));
  });

  if (result.evaluation.recommendations.length > 0) {
    console.log("\nRecommendations for Improvement:");
    result.evaluation.recommendations.forEach(rec => console.log(`- ${rec}`));
  }

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
}

// If this module is run directly, generate sequences for all providers
if (import.meta.main) {
  const provider = Deno.args[0] as Provider;
  if (!provider || !PROVIDER_CONFIGS[provider]) {
    console.error("Please specify a valid provider: openai, claude, gemini, or groq");
    Deno.exit(1);
  }
  
  await generateYogaFromTemplate(provider);
} 
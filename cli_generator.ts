import { join, dirname, fromFileUrl } from "@std/path";
import {
  generateYogaSequence, usageTracker
} from "jsr:@paz/lexikon";

async function example1() {
  console.log("Running Example 1: Using template file with level, duration, and focus");
  const templatePath = join(dirname(fromFileUrl(import.meta.url)), "templates", "hatha.txt");
  await generateYogaSequence({
    provider: "openai",
    temperature: 0.7,
    maxTokens: 4000,
    model: "gpt-4",
    level: "intermediate",
    duration: "60 minutes",
    focus: "strength and flexibility",
    templatePath
  });
  // Display usage statistics
  const stats = usageTracker.getUsageStats();
  console.log("\n Usage Statistics:");
  console.log(`Total API calls: ${stats.totalCalls}`);
  console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
  console.log(`Average latency: ${stats.averageLatency.toFixed(0)}ms`);
  console.log(`Total tokens used: ${stats.totalTokens}`);
  console.log(`Estimated cost: $${stats.totalCost.toFixed(4)}`);
  
  if (stats.usageByProvider.openai) {
    console.log(`Tokens used by OpenAI: ${stats.usageByProvider.openai}`);
  }
}

async function example2() {
  console.log("Running Example 2: Using dynamic template with specific practice focus");
  const dynamicTemplate = `
Design a yoga sequence that emphasizes:

1. Breath Work (10 minutes)
   - Pranayama techniques
   - Breath awareness exercises
   - Energy activation

2. Dynamic Movement (20 minutes)
   - Flowing sequences
   - Creative transitions
   - Building internal heat

3. Peak Poses (20 minutes)
   - Progressive preparation
   - Advanced variations
   - Safe approach to challenges

4. Integration (10 minutes)
   - Counter poses
   - Balancing the practice
   - Cooling down

Include for each section:
- Clear timing
- Detailed instructions
- Breath coordination
- Energetic effects
- Safety considerations
`;

  await generateYogaSequence({
    provider: "openai",
    temperature: 0.7,
    maxTokens: 4000,
    model: "gpt-4",
    level: "advanced",
    duration: "60 minutes",
    focus: "inversions and arm balances",
    template: dynamicTemplate
  });
  // Display usage statistics
  const stats = usageTracker.getUsageStats();
  console.log("\n Usage Statistics:");
  console.log(`Total API calls: ${stats.totalCalls}`);
  console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
  console.log(`Average latency: ${stats.averageLatency.toFixed(0)}ms`);
  console.log(`Total tokens used: ${stats.totalTokens}`);
  console.log(`Estimated cost: $${stats.totalCost.toFixed(4)}`);
  
  if (stats.usageByProvider.openai) {
    console.log(`Tokens used by OpenAI: ${stats.usageByProvider.openai}`);
  }
}

// Main execution
if (import.meta.main) {
  const example = Deno.args[0];
  
  switch (example) {
    case "1":
      await example1();
      break;
    case "2":
      await example2();
      break;
    default:
      console.log("Please specify which example to run:");
      console.log("  deno run --allow-net --allow-env --allow-read --allow-write cli_generator.ts 1");
      console.log("  deno run --allow-net --allow-env --allow-read --allow-write cli_generator.ts 2");
  }
}
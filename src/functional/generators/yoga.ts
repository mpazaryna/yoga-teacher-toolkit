/**
 * @module yoga
 * @description Functional implementation of yoga sequence generation
 */

import { createProvider } from "../../llm/factory.ts";
import { loadTemplate, injectContext } from "../utils/template.ts";
import { withRetry } from "../utils/retry.ts";
import type { YogaConfig } from "../types.ts";

/**
 * Builds a concept description from yoga configuration
 */
const buildConcept = (config: YogaConfig): string => {
  return `${config.duration} ${config.level}-level yoga sequence focusing on ${config.focus}`;
};

/**
 * Creates the context object for template injection
 */
const buildContext = (config: YogaConfig) => {
  return {
    level: config.level,
    duration: config.duration,
    focus: config.focus,
    style: config.style,
    props: config.props,
    contraindications: config.contraindications,
    concept: buildConcept(config)
  };
};

/**
 * Validates the yoga configuration
 * @throws Error if configuration is invalid
 */
const validateConfig = (config: YogaConfig): void => {
  if (!config.level) throw new Error('Level is required');
  if (!config.duration) throw new Error('Duration is required');
  if (!config.focus) throw new Error('Focus is required');
};

/**
 * Generates a yoga sequence based on the provided configuration
 * @param config Yoga sequence configuration
 * @returns Promise resolving to the generated sequence
 */
export const generateYogaSequence = async (config: YogaConfig): Promise<string> => {
  console.log("🚀 Starting yoga sequence generation...");
  
  // Validate configuration
  validateConfig(config);
  
  // Load and process template
  const template = await loadTemplate(config.template);
  const context = buildContext(config);
  const prompt = injectContext(template, context);
  
  // Create LLM provider
  const llm = createProvider(config.provider, {
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    model: config.model
  });
  
  // Generate sequence with retry logic
  return withRetry(
    async () => {
      console.log(`🤖 Generating with provider: ${config.provider}`);
      const response = await llm.generateContent(prompt);
      
      if (!response?.content) {
        throw new Error("No content received from LLM provider");
      }
      
      return response.content;
    },
    {
      onError: (error, attempt) => {
        console.error(`❌ Generation attempt ${attempt} failed:`, error.message);
      },
      onRetry: (attempt, delay) => {
        console.log(`🔄 Retrying in ${delay/1000} seconds... (attempt ${attempt})`);
      }
    }
  );
}; 
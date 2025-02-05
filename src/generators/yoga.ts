/**
 * @module yoga
 * @description Content generation module for yoga sequences and dharma talks
 * 
 * This module provides a unified content generation system that can produce both yoga sequences
 * and dharma talks using Large Language Models (LLMs). The design follows these key principles:
 * 
 * 1. Unified Generation: Both yoga sequences and dharma talks use the same underlying generation
 *    infrastructure, differing only in their configuration and templates.
 * 
 * 2. Type Safety: The module uses TypeScript discriminated unions to safely handle different
 *    content types while sharing common functionality.
 * 
 * 3. Template-Based: Content generation is driven by templates that can be customized for
 *    different types of content while maintaining consistent structure.
 * 
 * 4. Extensible: The design allows for easy addition of new content types by extending the
 *    base configuration and implementing type-specific context building.
 * 
 * The generation process follows these steps:
 * 1. Configuration validation
 * 2. Template loading
 * 3. Context building (type-specific)
 * 4. Template injection
 * 5. LLM-based content generation
 * 6. Error handling and retries
 * 
 * @example
 * // Generate a yoga sequence
 * const yogaConfig: YogaConfig = {
 *   level: "intermediate",
 *   duration: "60 minutes",
 *   focus: "hip opening",
 *   template: "sequence-prompt.md",
 *   provider: "gemini"
 * };
 * const sequence = await generateYogaSequence(yogaConfig);
 * 
 * @example
 * // Generate a dharma talk
 * const dharmaConfig: DharmaTalkConfig = {
 *   focus: "mindfulness",
 *   concept: "Understanding present moment awareness",
 *   template: "dharma-prompt.md",
 *   provider: "gemini"
 * };
 * const talk = await generateDharmaTalk(dharmaConfig);
 */

import { createProvider } from "../llm/factory.ts";
import { loadTemplate, injectContext } from "./template.ts";
import { withRetry } from "./retry.ts";
import type { ProviderType } from "../llm/types.ts";

/**
 * Template configuration type
 */
type TemplateConfig = {
  path: string;
  context?: Record<string, unknown>;
} | string;  // Allow direct string paths for backward compatibility

/**
 * Base configuration interface for all content generation
 * Contains common properties needed across different content types
 * 
 * @property focus - The main topic or area of focus
 * @property style - Optional style or approach (e.g., "vinyasa", "secular")
 * @property template - Template configuration
 * @property provider - LLM provider to use
 * @property temperature - Optional temperature for generation (0-1)
 * @property maxTokens - Optional maximum tokens for generation
 * @property model - Optional specific model to use
 */
type BaseConfig = {
  focus: string;
  style?: string;
  template: TemplateConfig;
  provider: ProviderType;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Configuration for generating yoga sequences
 * Extends BaseConfig with yoga-specific properties
 * 
 * @extends BaseConfig
 * @property level - Difficulty level of the sequence
 * @property duration - Length of the practice
 * @property props - Optional props needed for the sequence
 * @property contraindications - Optional health conditions to be aware of
 * @property concept - Optional overall concept/theme of the sequence
 */
export type YogaConfig = BaseConfig & {
  level: string;
  duration: string;
  props?: string[];
  contraindications?: string[];
  concept?: string;
}

/**
 * Configuration for generating dharma talks
 * Extends BaseConfig with dharma-specific properties
 * 
 * @extends BaseConfig
 * @property duration - Optional length of the talk
 * @property scriptureReference - Optional reference to relevant scriptures
 * @property targetAudience - Optional intended audience
 * @property concept - Main concept or teaching of the talk
 */
export type DharmaTalkConfig = BaseConfig & {
  duration?: string;
  scriptureReference?: string;
  targetAudience?: string;
  concept: string;
}

/**
 * Builds a concept description from yoga configuration
 * Combines key attributes into a descriptive string
 * 
 * @param config - Yoga sequence configuration
 * @returns Formatted concept string
 */
const buildConcept = (config: YogaConfig): string => {
  return `${config.duration} ${config.level}-level yoga sequence focusing on ${config.focus}`;
};

/**
 * Creates the context object for template injection
 * Uses type discrimination to handle different content types
 * 
 * @param config - Either yoga or dharma talk configuration
 * @returns Context object for template injection
 */
const buildContext = (config: YogaConfig | DharmaTalkConfig) => {
  const baseContext = {
    focus: config.focus,
    style: config.style,
  };

  if ('level' in config) {
    // This is a YogaConfig
    return {
      ...baseContext,
      level: config.level,
      duration: config.duration,
      props: config.props,
      contraindications: config.contraindications,
      concept: buildConcept(config)
    };
  } else {
    // This is a DharmaTalkConfig
    return {
      ...baseContext,
      concept: config.concept,
      duration: config.duration,
      scriptureReference: config.scriptureReference,
      targetAudience: config.targetAudience
    };
  }
};

/**
 * Validates the configuration for both content types
 * Ensures all required fields are present
 * Uses type discrimination for type-specific validation
 * 
 * @param config - Either yoga or dharma talk configuration
 * @throws Error if configuration is invalid
 */
const validateConfig = (config: YogaConfig | DharmaTalkConfig): void => {
  if (!config.focus) throw new Error('Focus is required');
  if (!config.template) throw new Error('Template is required');
  if (!config.provider) throw new Error('Provider is required');

  if ('level' in config) {
    if (!config.level) throw new Error('Level is required');
    if (!config.duration) throw new Error('Duration is required');
  }
};

/**
 * Core generation function that handles both content types
 * Implements the complete generation workflow:
 * 1. Configuration validation
 * 2. Template loading and processing
 * 3. LLM provider setup
 * 4. Content generation with retry logic
 * 
 * @param config - Either yoga or dharma talk configuration
 * @returns Promise resolving to the generated content
 * @throws Error if generation fails
 */
export const generate = async (config: YogaConfig | DharmaTalkConfig): Promise<string> => {
  const type = 'level' in config ? 'yoga sequence' : 'dharma talk';
  console.log(`🚀 Starting ${type} generation...`);
  
  // Validate configuration
  validateConfig(config);
  
  // Load and process template
  const templatePath = typeof config.template === 'string' ? config.template : config.template.path;
  const template = await loadTemplate(templatePath);
  const context = buildContext(config);
  const prompt = injectContext(template, context);
  
  // Create LLM provider
  const llm = createProvider(config.provider, {
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    model: config.model
  });
  
  // Generate with retry logic
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

/**
 * Convenience function for generating yoga sequences
 * Provides backward compatibility and type safety
 * 
 * @param config - Yoga sequence configuration
 * @returns Promise resolving to the generated sequence
 */
export const generateYogaSequence = (config: YogaConfig): Promise<string> => generate(config);

/**
 * Convenience function for generating dharma talks
 * Provides type safety and clear API
 * 
 * @param config - Dharma talk configuration
 * @returns Promise resolving to the generated talk
 */
export const generateDharmaTalk = (config: DharmaTalkConfig): Promise<string> => generate(config); 
/**
 * @module template-generator
 * @description Generic content generation module using templates and LLMs
 * 
 * This module provides a unified content generation system that can produce any type of
 * content using Large Language Models (LLMs). The design follows these key principles:
 * 
 * 1. Template-Driven: Content generation is driven by customizable templates that maintain
 *    consistent structure while allowing for different content types.
 * 
 * 2. Type Safety: Uses TypeScript generics and discriminated unions to safely handle
 *    different content types while sharing common functionality.
 * 
 * 3. Context-Based: Generates content based on structured context objects that can be
 *    customized for different content types.
 * 
 * 4. Extensible: The design allows for easy addition of new content types by extending
 *    the base configuration and implementing type-specific contexts.
 * 
 * The generation process follows these steps:
 * 1. Configuration validation
 * 2. Template loading
 * 3. Context building
 * 4. Template injection
 * 5. LLM-based content generation
 * 6. Error handling and retries
 * 
 * @example
 * // Define a content type configuration
 * type BlogPostContext = {
 *   title: string;
 *   topic: string;
 *   targetAudience: string;
 *   tone: string;
 * }
 * 
 * const config: ContentConfig<BlogPostContext> = {
 *   provider: "gemini",
 *   template: "blog-post-template.md",
 *   context: {
 *     title: "Understanding TypeScript Generics",
 *     topic: "typescript programming",
 *     targetAudience: "intermediate developers",
 *     tone: "technical but approachable"
 *   }
 * };
 * 
 * const content = await generate(config);
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
 * @property provider - LLM provider to use
 * @property template - Template configuration
 * @property context - Type-specific context for content generation
 * @property temperature - Optional temperature for generation (0-1)
 * @property maxTokens - Optional maximum tokens for generation
 * @property model - Optional specific model to use
 */
export type ContentConfig<T extends Record<string, unknown>> = {
  provider: ProviderType;
  template: TemplateConfig;
  context: T;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Validates the configuration for content generation
 * Ensures all required fields are present
 * 
 * @param config - Content generation configuration
 * @throws Error if configuration is invalid
 */
const validateConfig = <T extends Record<string, unknown>>(config: ContentConfig<T>): void => {
  if (!config.template) throw new Error('Template is required');
  if (!config.provider) throw new Error('Provider is required');
  if (!config.context) throw new Error('Context is required');
};

/**
 * Core generation function that handles all content types
 * Implements the complete generation workflow:
 * 1. Configuration validation
 * 2. Template loading and processing
 * 3. LLM provider setup
 * 4. Content generation with retry logic
 * 
 * @param config - Content generation configuration with type-specific context
 * @returns Promise resolving to the generated content
 * @throws Error if generation fails
 */
export const generate = async <T extends Record<string, unknown>>(config: ContentConfig<T>): Promise<string> => {
  console.log('🚀 Starting content generation...');
  
  // Validate configuration
  validateConfig(config);
  
  // Load and process template
  const templatePath = typeof config.template === 'string' ? config.template : config.template.path;
  const template = await loadTemplate(templatePath);
  const prompt = injectContext(template, config.context);
  
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
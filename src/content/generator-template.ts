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

import { loadTemplate, injectContext } from "./template.ts";
import { withRetry } from "./retry.ts";
import type { LLMClient } from "@lexikon/module-llm";

/**
 * Template configuration type
 */
type TemplateConfig = {
  path: string;
  context?: Record<string, unknown>;
} | string;

/**
 * Base configuration interface for all content generation
 */
export type ContentConfig<T extends Record<string, unknown>> = {
  llm: LLMClient;  // Accept LLM client directly
  template: TemplateConfig;
  context: T;
}

const validateConfig = <T extends Record<string, unknown>>(config: ContentConfig<T>): void => {
  if (!config.template) throw new Error('Template is required');
  if (!config.llm) throw new Error('LLM client is required');
  if (!config.context) throw new Error('Context is required');
};

export const generate = async <T extends Record<string, unknown>>(config: ContentConfig<T>): Promise<string> => {
  console.log('🚀 Starting content generation...');
  
  validateConfig(config);
  
  const templatePath = typeof config.template === 'string' ? config.template : config.template.path;
  const template = await loadTemplate(templatePath);
  
  console.log('\n📋 Context being injected:');
  console.log(JSON.stringify(config.context, null, 2));
  
  // Use the original injectContext function
  const prompt = injectContext(template, config.context);
  
  console.log('\n📝 Final prompt after replacements:');
  console.log('----------------------------------------');
  console.log(prompt);
  console.log('----------------------------------------\n');
  
  return withRetry(
    async () => {
      // Format messages as expected by Claude
      const messages: Message[] = [{
        role: "user",
        content: prompt
      }];
      
      const response = await config.llm.complete(messages);
      
      if (!response?.message?.content) {
        throw new Error("No content received from LLM provider");
      }
      
      return response.message.content;
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
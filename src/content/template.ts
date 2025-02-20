/**
 * @module template
 * @description Utility functions for template loading and processing
 */

import type { TemplateConfig, ContextData } from "./types.ts";

/**
 * Loads a template from various sources based on the template configuration
 * @param template Template path or configuration
 * @returns Promise resolving to the template content
 */
export const loadTemplate = async (template: string): Promise<string> => {
  console.log(`📂 Loading template from: ${template}`);
  try {
    const content = await Deno.readTextFile(template);
    console.log("✅ Template loaded successfully");
    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load template: ${message}`);
  }
};

/**
 * Injects context data into a template string
 * @param template Template string with placeholders
 * @param context Context data to inject
 * @returns Template with injected context
 */
export const injectContext = (template: string, context: ContextData): string => {
  console.log('\n🔍 Debug - Context keys and values:');
  Object.entries(context).forEach(([key, value]) => {
    console.log(`Key: ${key}`);
    console.log(`Value: ${value}`);
    console.log('---');
  });

  return Object.entries(context).reduce(
    (result, [key, value]) => {
      const lowerPlaceholder = `{${key.toLowerCase()}}`;
      const upperPlaceholder = `{${key.toUpperCase()}}`;
      
      console.log(`Looking for placeholders: ${lowerPlaceholder} or ${upperPlaceholder}`);
      
      const lowerResult = result.replace(
        new RegExp(lowerPlaceholder, 'g'),
        Array.isArray(value) ? value.join(', ') : String(value ?? '')
      );
      return lowerResult.replace(
        new RegExp(upperPlaceholder, 'g'),
        Array.isArray(value) ? value.join(', ') : String(value ?? '')
      );
    },
    template
  );
}; 
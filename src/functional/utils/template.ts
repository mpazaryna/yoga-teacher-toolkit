/**
 * @module template
 * @description Utility functions for template loading and processing
 */

import { loadFile } from "../../context/handler.ts";
import type { TemplateConfig, ContextData } from "../types.ts";

/**
 * Loads a template from various sources based on the template configuration
 * @param template Template configuration
 * @returns Promise resolving to the template content
 */
export const loadTemplate = async (template: TemplateConfig): Promise<string> => {
  if (typeof template === 'string') {
    console.log("📝 Using provided template string");
    return template;
  }
  
  if ('path' in template) {
    console.log(`📂 Loading template from: ${template.path}`);
    const content = await loadFile(template.path);
    console.log("✅ Template loaded successfully");
    return content;
  }
  
  if ('name' in template) {
    console.log(`📂 Loading template: ${template.name}`);
    // TODO: Implement template loading by name
    throw new Error('Template loading by name not yet implemented');
  }
  
  throw new Error('Invalid template configuration');
};

/**
 * Injects context data into a template string
 * @param template Template string with placeholders
 * @param context Context data to inject
 * @returns Template with injected context
 */
export const injectContext = (template: string, context: ContextData): string => {
  return Object.entries(context).reduce(
    (result, [key, value]) => result.replace(
      new RegExp(`{${key}}`, 'g'),
      Array.isArray(value) ? value.join(', ') : String(value ?? '')
    ),
    template
  );
}; 
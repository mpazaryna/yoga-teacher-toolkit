/**
 * @module TemplateManager
 * @description Handles loading and validation of templates for content generation.
 */

import { join } from "@std/path";
import { loadFile } from "./handler.ts";

export interface TemplateInfo {
  name: string;
  path: string;
  content: string;
}

/**
 * @class TemplateManager
 * @description Manages template loading and caching for content generation
 */
export class TemplateManager {
  private templateDir: string;
  private templateCache: Map<string, TemplateInfo>;

  constructor(templateDir: string) {
    this.templateDir = templateDir;
    this.templateCache = new Map();
  }

  /**
   * @method loadTemplate
   * @param {string} filename - Name of the template file including extension
   * @returns {Promise<TemplateInfo>} Template information including content
   * @throws {Error} When template file cannot be found
   */
  async loadTemplate(filename: string): Promise<TemplateInfo> {
    if (this.templateCache.has(filename)) {
      console.log(`📝 Using cached template: ${filename}`);
      return this.templateCache.get(filename)!;
    }

    try {
      const path = join(this.templateDir, filename);
      console.log(`📂 Loading template: ${path}`);
      
      const content = await loadFile(path);
      console.log(`✅ Successfully loaded template: ${filename}`);
      
      const info: TemplateInfo = {
        name: filename,
        path,
        content
      };

      this.templateCache.set(filename, info);
      return info;
    } catch (error) {
      const errorMessage = `Failed to load template '${filename}': ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * @method clearCache
   * @description Clears the template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }
} 
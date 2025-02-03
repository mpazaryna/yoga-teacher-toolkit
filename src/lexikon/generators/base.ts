/**
 * @module BaseGenerator
 * @description Foundation module for all content generators in the system.
 * Provides core functionality for template loading, prompt building, and content generation
 * using various LLM providers. This abstract class defines the common interface and
 * shared functionality that all specific generators must implement.
 */

import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import { createProvider } from "../llm/factory.ts";
import { loadFile } from "../context/handler.ts";
import type { BaseGeneratorOptions, ProviderType } from "../../types.ts";

/**
 * @abstract
 * @class BaseGenerator
 * @description Abstract base class for all content generators. Handles common operations like
 * template loading, LLM initialization, content generation, and file output. Specific generators
 * must extend this class and implement the buildPrompt method.
 */
export abstract class BaseGenerator {
  protected options: BaseGeneratorOptions;

  /**
   * @constructor
   * @param {BaseGeneratorOptions} options - Base configuration for the generator
   * @param {number} [options.temperature=0.7] - Controls randomness in LLM output
   * @param {number} [options.maxTokens=4000] - Maximum tokens for LLM response
   * @param {string} options.provider - The LLM provider to use
   * @param {string} [options.template] - Direct template string to use
   * @param {string} [options.templatePath] - Path to template file
   * @param {string} options.outputFile - Output file name for generated content
   */
  constructor(options: BaseGeneratorOptions) {
    this.options = {
      temperature: 0.7,
      maxTokens: 4000,
      ...options,
    };
  }

  /**
   * @protected
   * @async
   * @method loadTemplate
   * @returns {Promise<string>} The loaded template content
   * @throws {Error} If neither template string nor templatePath is provided
   * @description Loads the template content either from a provided string or file path.
   * Prioritizes direct template string over template file path.
   */
  protected async loadTemplate(): Promise<string> {
    const { template, templatePath } = this.options;
    
    if (template) {
      console.log("📝 Using provided template string");
      return template;
    } 
    
    if (templatePath) {
      console.log(`📂 Loading template from: ${templatePath}`);
      const content = await loadFile(templatePath);
      console.log("✅ Template loaded successfully");
      return content;
    }
    
    throw new Error("Either template or templatePath must be provided");
  }

  /**
   * @protected
   * @abstract
   * @method buildPrompt
   * @param {string} template - The template content to build upon
   * @returns {string | Promise<string>} The final prompt for the LLM
   * @description Abstract method that must be implemented by child classes to construct
   * the final prompt by combining the template with generator-specific parameters.
   */
  protected abstract buildPrompt(template: string): string | Promise<string>;

  /**
   * @public
   * @async
   * @method generate
   * @returns {Promise<string>} The generated content
   * @description Main generation pipeline that coordinates the entire content generation process:
   * 1. Loads the template
   * 2. Initializes the LLM provider
   * 3. Builds and sends the prompt
   * 4. Saves the generated content to a file
   */
  async generate(): Promise<string> {
    console.log("🚀 Starting generation...");
    
    // Get template content
    const templateContent = await this.loadTemplate();

    // Initialize LLM
    const { provider, temperature, maxTokens, model } = this.options;
    console.log(`🤖 Initializing ${provider.toUpperCase()}...`);
    const llm = createProvider(provider as ProviderType, { 
      temperature, 
      maxTokens,
      ...(model ? { model } : {})
    });

    // Generate content
    console.log("📝 Generating content...");
    const prompt = await this.buildPrompt(templateContent);
    const response = await llm.generateContent(prompt);
    console.log("✅ Content generated successfully");

    // Save response
    console.log(`💾 Saving response to output/${this.options.outputFile}...`);
    await ensureDir("output");
    await Deno.writeTextFile(join("output", this.options.outputFile), response.content);
    console.log(`✨ Process completed! Saved to output/${this.options.outputFile}`);

    return response.content;
  }
} 
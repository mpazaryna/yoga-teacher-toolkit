/**
 * @module BaseGenerator
 * @description Foundation module for all content generators in the system.
 * Provides core functionality for template loading, context management, and LLM interaction.
 */

import { createProvider } from "../llm/factory.ts";
import { loadFile } from "../context/handler.ts";
import { getProviderConfig } from "../llm/config.ts";
import { TemplateManager } from "../context/templates.ts";
import type { BaseGeneratorOptions, ProviderType } from "../types.ts";

interface GenerationOptions {
  validateResponse?: boolean;
  maxRetries?: number;
  temperature?: number;
}

interface ContextData {
  [key: string]: unknown;
}

/**
 * @abstract
 * @class BaseGenerator
 * @description Abstract base class for all content generators. Handles common operations like
 * template loading, context management, and LLM interaction patterns.
 */
export abstract class BaseGenerator {
  protected options: BaseGeneratorOptions;
  protected baseContext: ContextData = {};
  protected templateManager?: TemplateManager;

  /**
   * @constructor
   * @param {BaseGeneratorOptions} options - Base configuration for the generator
   */
  constructor(options: BaseGeneratorOptions) {
    const providerConfig = getProviderConfig(options.provider as ProviderType);
    this.options = {
      temperature: 0.7,
      maxTokens: providerConfig.maxTokens,
      model: providerConfig.model,
      ...options,
    };
  }

  /**
   * @protected
   * @method setTemplateManager
   * @param {TemplateManager} manager - Template manager instance
   */
  protected setTemplateManager(manager: TemplateManager): void {
    this.templateManager = manager;
  }

  /**
   * @protected
   * @method setBaseContext
   * @param {ContextData} context - Base context to be used in all generations
   */
  protected setBaseContext(context: ContextData): void {
    this.baseContext = context;
  }

  /**
   * @protected
   * @method getBaseContext
   * @returns {ContextData} The current base context
   */
  protected getBaseContext(): ContextData {
    return { ...this.baseContext };
  }

  /**
   * @protected
   * @async
   * @method loadTemplate
   * @returns {Promise<string>} The loaded template content
   */
  protected async loadTemplate(): Promise<string> {
    const { template, templatePath, templateName } = this.options;
    
    if (template) {
      console.log("📝 Using provided template string");
      return template;
    } 

    if (this.templateManager && templateName) {
      console.log(`📂 Loading template: ${templateName}`);
      const templateInfo = await this.templateManager.loadTemplate(templateName);
      console.log("✅ Template loaded successfully");
      return templateInfo.content;
    }
    
    if (templatePath) {
      console.log(`📂 Loading template from: ${templatePath}`);
      const content = await loadFile(templatePath);
      console.log("✅ Template loaded successfully");
      return content;
    }
    
    throw new Error("Either template, templateName, or templatePath must be provided");
  }

  /**
   * @protected
   * @method injectContext
   * @param {string} template - The template to inject context into
   * @param {ContextData} context - The context data to inject
   * @returns {string} Template with injected context
   */
  protected injectContext(template: string, context: ContextData): string {
    let result = template;
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{${key}}`;
      const replacement = Array.isArray(value) 
        ? value.join(", ")
        : String(value ?? '');
      result = result.replace(new RegExp(placeholder, 'g'), replacement);
    }
    return result;
  }

  /**
   * @protected
   * @async
   * @method generateWithRetry
   * @param {string} prompt - The prompt to send to the LLM
   * @param {GenerationOptions} options - Generation options
   * @returns {Promise<string>} The generated content
   */
  protected async generateWithRetry(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<string> {
    const maxRetries = options.maxRetries ?? 3;
    const temperature = options.temperature ?? this.options.temperature;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { provider, maxTokens, model } = this.options;
        console.log(`Attempt ${attempt}/${maxRetries} with provider: ${provider}`);
        
        const llm = createProvider(provider as ProviderType, { 
          temperature, 
          maxTokens,
          ...(model ? { model } : {})
        });

        const response = await llm.generateContent(prompt);
        if (!response?.content) {
          throw new Error("No content received from LLM provider");
        }
        return response.content;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(
          typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : String(error)
        );
        
        console.error(`Generation attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
          console.log(`Retrying in ${delay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * @protected
   * @async
   * @method generateWithContext
   * @param {ContextData} context - The context to use for generation
   * @param {GenerationOptions} options - Generation options
   * @returns {Promise<string>} The generated content
   */
  protected async generateWithContext(
    context: ContextData,
    options: GenerationOptions = {}
  ): Promise<string> {
    const template = await this.loadTemplate();
    const mergedContext = {
      ...this.getBaseContext(),
      ...context
    };
    
    const prompt = this.buildPrompt(
      this.injectContext(template, mergedContext)
    );
    
    return this.generateWithRetry(prompt, options);
  }

  /**
   * @protected
   * @abstract
   * @method buildPrompt
   * @param {string} template - The template content to build upon
   * @returns {string} The final prompt for the LLM
   */
  protected abstract buildPrompt(template: string): string;

  /**
   * @protected
   * @method validateResponse
   * @param {string} response - The response to validate
   * @returns {boolean} Whether the response is valid
   */
  protected validateResponse(response: string): boolean {
    return response.trim().length > 0;
  }

  /**
   * @public
   * @async
   * @method generate
   * @returns {Promise<string>} The generated content
   */
  async generate(): Promise<string> {
    console.log("🚀 Starting generation...");
    return this.generateWithContext({});
  }
} 
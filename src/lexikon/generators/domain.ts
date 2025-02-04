/**
 * @module DomainGenerator
 * @description Abstract base class for domain-specific generators.
 * Provides common functionality for handling domain contexts, validation,
 * and template processing.
 */

import { BaseGenerator } from "./base.ts";

export interface DomainContext {
  [key: string]: unknown;
}

export interface DomainConfig {
  name: string;
  version: string;
  description?: string;
  validationRules?: ValidationRule[];
}

export interface ValidationRule {
  name: string;
  pattern: RegExp | ((content: string) => boolean);
  message: string;
}

/**
 * @abstract
 * @class DomainGenerator
 * @extends BaseGenerator
 * @description Provides domain-specific generation capabilities with
 * standardized validation, context handling, and template processing.
 */
export abstract class DomainGenerator<T extends DomainContext> extends BaseGenerator {
  protected domain: DomainConfig;
  protected validationRules: ValidationRule[] = [];

  constructor(options: any, domain: DomainConfig) {
    super(options);
    this.domain = domain;
    this.validationRules = domain.validationRules || [];
  }

  /**
   * @protected
   * @method validateDomainContent
   * @param {string} content - The generated content to validate
   * @returns {boolean} Whether the content is valid for this domain
   * @description Runs domain-specific validation rules on generated content
   */
  protected validateDomainContent(content: string): boolean {
    if (!content.trim()) return false;

    for (const rule of this.validationRules) {
      const isValid = typeof rule.pattern === 'function'
        ? rule.pattern(content)
        : rule.pattern.test(content);

      if (!isValid) {
        console.warn(`Domain validation failed: ${rule.message}`);
        return false;
      }
    }

    return true;
  }

  /**
   * @protected
   * @method enrichContext
   * @param {T} context - The domain-specific context
   * @returns {T} Enriched context with computed or derived values
   * @description Hook for domains to add computed values to the context
   */
  protected abstract enrichContext(context: Partial<T>): T;

  /**
   * @protected
   * @method validateContext
   * @param {T} context - The domain-specific context to validate
   * @returns {boolean} Whether the context is valid for this domain
   * @description Hook for domains to validate their specific context
   */
  protected abstract validateContext(context: T): boolean;

  /**
   * @public
   * @async
   * @method generate
   * @param {Partial<T>} context - Domain-specific context for generation
   * @returns {Promise<string>} The generated content
   * @description Main generation method that handles context enrichment,
   * validation, and content generation
   */
  async generate(context: Partial<T> = {}): Promise<string> {
    // Enrich the context with computed values
    const enrichedContext = this.enrichContext(context);

    // Validate the enriched context
    if (!this.validateContext(enrichedContext)) {
      throw new Error(`Invalid context for ${this.domain.name} domain`);
    }

    // Generate content with validation
    return this.generateWithContext(enrichedContext, {
      validateResponse: true,
      maxRetries: 3,
      temperature: 0.7,
      validate: (content) => this.validateDomainContent(content)
    });
  }
} 
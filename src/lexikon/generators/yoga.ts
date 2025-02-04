/// <reference types="https://deno.land/x/deno@v1.40.5/mod.ts" />

/**
 * @module YogaGenerator
 * @description A specialized generator module for creating yoga sequences using various LLM providers.
 * This module extends the base generator functionality to create customized yoga routines
 * based on specified difficulty levels, durations, and focus areas.
 */

import type { YogaGeneratorOptions } from "../types.ts";
import { BaseGenerator } from "./base.ts";

interface YogaContext {
  level: string;
  duration: string;
  focus: string;
  style?: string;
  props?: string[];
  contraindications?: string[];
  concept?: string;
}

/**
 * @class YogaGenerator
 * @extends BaseGenerator
 * @description Handles the generation of yoga sequences using specified LLM providers.
 * The generator creates personalized yoga routines based on skill level,
 * time duration, and specific focus areas for practice.
 */
export class YogaGenerator extends BaseGenerator {
  protected override options: YogaGeneratorOptions;

  /**
   * @constructor
   * @param {YogaGeneratorOptions} options - Configuration options for yoga sequence generation
   * @param {string} options.provider - The LLM provider to use (e.g., 'openai', 'gemini', 'claude')
   * @param {string} [options.level="beginner"] - Difficulty level of the yoga sequence
   * @param {string} [options.duration="60 minutes"] - Length of the yoga session
   * @param {string} [options.focus="strength and flexibility"] - Specific focus area for the practice
   */
  constructor(options: YogaGeneratorOptions) {
    const baseOptions = {
      level: "beginner",
      duration: "60 minutes",
      focus: "strength and flexibility",
      ...options,
    };
    super(baseOptions);
    this.options = baseOptions;

    // Set up base context for yoga generation
    this.setBaseContext({
      level: this.options.level,
      duration: this.options.duration,
      focus: this.options.focus,
      style: this.options.style,
      props: this.options.props,
      contraindications: this.options.contraindications,
    });
  }

  /**
   * @protected
   * @method buildConcept
   * @returns {string} A concept description based on teaching parameters
   * @description Builds a standardized concept description from the level, duration,
   * and focus parameters that guides the sequence generation
   */
  protected buildConcept(): string {
    const { level, duration, focus } = this.options;
    return `${duration} ${level}-level yoga sequence focusing on ${focus}`;
  }

  /**
   * @protected
   * @method buildPrompt
   * @param {string} template - The template content to build upon
   * @returns {string} The final prompt for the LLM
   * @description Combines the template with both injected context values and a
   * standardized concept description for the sequence.
   */
  protected override buildPrompt(template: string): string {
    // The template already has context values injected by the base class
    // Now we'll add our concept description if the template has the placeholder
    const concept = this.buildConcept();
    return template.replace("{CONCEPT}", concept);
  }

  /**
   * @protected
   * @method validateYogaSequence
   * @param {string} sequence - The generated sequence to validate
   * @returns {boolean} Whether the sequence is valid
   */
  protected validateYogaSequence(sequence: string): boolean {
    // Basic validation - can be enhanced with more specific rules
    if (!sequence.trim()) return false;
    
    // Check for basic structure (warmup, main sequence, cooldown)
    const hasWarmup = /warm[- ]?up|preparation|beginning/i.test(sequence);
    const hasCooldown = /cool[- ]?down|closing|savasana|relaxation/i.test(sequence);
    
    return hasWarmup && hasCooldown;
  }

  /**
   * @public
   * @async
   * @method generateSequence
   * @param {Partial<YogaContext>} context - Additional context for sequence generation
   * @returns {Promise<string>} The generated yoga sequence
   */
  async generateSequence(context: Partial<YogaContext> = {}): Promise<string> {
    return this.generateWithContext(context, {
      validateResponse: true,
      maxRetries: 3,
      temperature: 0.7
    });
  }
}

/**
 * @async
 * @function generateYogaSequence
 * @param {YogaGeneratorOptions} options - Configuration options for yoga sequence generation
 * @returns {Promise<string>} The generated yoga sequence content
 * @description A convenience function that instantiates a YogaGenerator and generates
 * a customized yoga sequence based on the provided options.
 */
export async function generateYogaSequence(options: YogaGeneratorOptions): Promise<string> {
  const generator = new YogaGenerator(options);
  return await generator.generateSequence();
} 
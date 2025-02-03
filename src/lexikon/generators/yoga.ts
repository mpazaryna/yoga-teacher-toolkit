/**
 * @module YogaGenerator
 * @description A specialized generator module for creating yoga sequences using various LLM providers.
 * This module extends the base generator functionality to create customized yoga routines
 * based on specified difficulty levels, durations, and focus areas.
 */

import type { YogaGeneratorOptions } from "../../types.ts";
import { BaseGenerator } from "./base.ts";

/**
 * @class YogaGenerator
 * @extends BaseGenerator
 * @description Handles the generation of yoga sequences using specified LLM providers.
 * The generator creates personalized yoga routines based on skill level,
 * time duration, and specific focus areas for practice.
 */
export class YogaGenerator extends BaseGenerator {
  protected override options: YogaGeneratorOptions & { outputFile: string };

  /**
   * @constructor
   * @param {YogaGeneratorOptions} options - Configuration options for yoga sequence generation
   * @param {string} options.provider - The LLM provider to use (e.g., 'openai', 'gemini', 'claude')
   * @param {string} [options.level="beginner"] - Difficulty level of the yoga sequence
   * @param {string} [options.duration="60 minutes"] - Length of the yoga session
   * @param {string} [options.focus="strength and flexibility"] - Specific focus area for the practice
   * @param {Object} options.rest - Additional configuration options inherited from BaseGenerator
   */
  constructor(options: YogaGeneratorOptions) {
    const { provider, ...rest } = options;
    const baseOptions = {
      provider,
      outputFile: `yoga-${provider}.md`,
      level: "beginner",
      duration: "60 minutes",
      focus: "strength and flexibility",
      ...rest,
    };
    super(baseOptions);
    this.options = baseOptions;
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
   * @param {string} template - The base template to use for prompt construction
   * @returns {string} The complete prompt with yoga-specific parameters
   * @description Constructs the final prompt by combining the template with
   * the teaching concept built from level, duration, and focus parameters
   */
  protected buildPrompt(template: string): string {
    const concept = this.buildConcept();
    return template.replace("{CONCEPT}", concept);
  }
}

/**
 * @async
 * @function generateYogaSequence
 * @param {YogaGeneratorOptions} options - Configuration options for yoga sequence generation
 * @returns {Promise<string>} The generated yoga sequence content
 * @description A convenience function that instantiates a YogaGenerator and generates
 * a customized yoga sequence based on the provided options. The sequence is returned
 * as a string and saved to a markdown file.
 */
export async function generateYogaSequence(options: YogaGeneratorOptions): Promise<string> {
  const generator = new YogaGenerator(options);
  return await generator.generate();
} 
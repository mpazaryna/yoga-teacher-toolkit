/**
 * @module StoryGenerator
 * @description A specialized generator module for creating stories using various LLM providers.
 * This module extends the base generator functionality to handle story-specific generation
 * with customizable concepts and provider-specific output handling.
 */

import type { StoryGeneratorOptions } from "../../types.ts";
import { BaseGenerator } from "./base.ts";

/**
 * @class StoryGenerator
 * @extends BaseGenerator
 * @description Handles the generation of stories using specified LLM providers.
 * The generator takes a concept and other configuration options to produce
 * a story output in markdown format.
 */
export class StoryGenerator extends BaseGenerator {
  protected override options: StoryGeneratorOptions & { outputFile: string };

  /**
   * @constructor
   * @param {StoryGeneratorOptions} options - Configuration options for story generation
   * @param {string} options.provider - The LLM provider to use (e.g., 'openai', 'gemini', 'claude')
   * @param {string} options.concept - The story concept or premise to base the generation on
   * @param {Object} options.rest - Additional configuration options inherited from BaseGenerator
   */
  constructor(options: StoryGeneratorOptions) {
    const { provider, ...rest } = options;
    const baseOptions = {
      provider,
      outputFile: `story-${provider}.md`,
      ...rest,
    };
    super(baseOptions);
    this.options = baseOptions;
  }

  /**
   * @protected
   * @method buildPrompt
   * @param {string} template - The base template to use for prompt construction
   * @returns {string} The complete prompt with the story concept appended
   * @description Constructs the final prompt by combining the template with the story concept
   */
  protected buildPrompt(template: string): string {
    return template.replace("{CONCEPT}", this.options.concept);
  }
}

/**
 * @async
 * @function generateStory
 * @param {StoryGeneratorOptions} options - Configuration options for story generation
 * @returns {Promise<string>} The generated story content
 * @description A convenience function that instantiates a StoryGenerator and generates
 * a story based on the provided options. The story is returned as a string and also
 * saved to a markdown file.
 */
export async function generateStory(options: StoryGeneratorOptions): Promise<string> {
  const generator = new StoryGenerator(options);
  return await generator.generate();
} 
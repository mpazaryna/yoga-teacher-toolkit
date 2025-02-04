/// <reference types="https://deno.land/x/deno@v1.40.5/mod.ts" />

/**
 * @module YogaGenerator
 * @description A specialized generator module for creating yoga sequences using various LLM providers.
 * This module extends the domain generator functionality to create customized yoga routines.
 */

import type { YogaGeneratorOptions } from "../types.ts";
import { DomainGenerator, type DomainContext } from "./domain.ts";

interface YogaContext extends DomainContext {
  level: string;
  duration: string;
  focus: string;
  style?: string;
  props?: string[];
  contraindications?: string[];
  concept?: string;
}

const YOGA_DOMAIN = {
  name: "yoga",
  version: "1.0.0",
  description: "Yoga sequence generation with customizable parameters",
  validationRules: [
    {
      name: "hasWarmup",
      pattern: /warm[- ]?up|preparation|beginning/i,
      message: "Sequence must include a warmup section"
    },
    {
      name: "hasCooldown",
      pattern: /cool[- ]?down|closing|savasana|relaxation/i,
      message: "Sequence must include a cooldown section"
    },
    {
      name: "hasStructure",
      pattern: (content: string) => content.includes("## Sequence"),
      message: "Sequence must follow the required structure"
    }
  ]
};

/**
 * @class YogaGenerator
 * @extends DomainGenerator
 * @description Handles the generation of yoga sequences using specified LLM providers.
 * The generator creates personalized yoga routines based on skill level,
 * time duration, and specific focus areas for practice.
 */
export class YogaGenerator extends DomainGenerator<YogaContext> {
  protected override options: YogaGeneratorOptions;

  /**
   * @constructor
   * @param {YogaGeneratorOptions} options - Configuration options for yoga sequence generation
   */
  constructor(options: YogaGeneratorOptions) {
    const baseOptions = {
      level: "beginner",
      duration: "60 minutes",
      focus: "strength and flexibility",
      ...options,
    };
    super(baseOptions, YOGA_DOMAIN);
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
   * @method enrichContext
   * @param {Partial<YogaContext>} context - The yoga-specific context
   * @returns {YogaContext} Enriched context with computed values
   */
  protected override enrichContext(context: Partial<YogaContext>): YogaContext {
    const baseContext = this.getBaseContext();
    return {
      ...baseContext,
      ...context,
      concept: context.concept || this.buildConcept()
    } as YogaContext;
  }

  /**
   * @protected
   * @method validateContext
   * @param {YogaContext} context - The yoga-specific context to validate
   * @returns {boolean} Whether the context is valid
   */
  protected override validateContext(context: YogaContext): boolean {
    return Boolean(
      context.level &&
      context.duration &&
      context.focus
    );
  }

  /**
   * @protected
   * @method buildConcept
   * @returns {string} A concept description based on teaching parameters
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
   */
  protected override buildPrompt(template: string): string {
    const concept = this.buildConcept();
    return template.replace("{CONCEPT}", concept);
  }
}

/**
 * @async
 * @function generateYogaSequence
 * @param {YogaGeneratorOptions} options - Configuration options for yoga sequence generation
 * @returns {Promise<string>} The generated yoga sequence content
 */
export async function generateYogaSequence(options: YogaGeneratorOptions): Promise<string> {
  const generator = new YogaGenerator(options);
  return await generator.generate();
} 
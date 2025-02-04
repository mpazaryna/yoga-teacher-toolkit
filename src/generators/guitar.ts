/**
 * @module GuitarGenerator
 * @description A specialized generator module for creating guitar lessons using various LLM providers.
 * This module extends the domain generator functionality to create customized lesson plans.
 */

import { DomainGenerator, type DomainContext } from "./domain.ts";
import type { BaseGeneratorOptions } from "../types.ts";

interface GuitarContext extends DomainContext {
  level: string;
  duration: string;
  focus: string;
  style?: string;
  techniques?: string[];
  prerequisites?: string[];
  equipment?: string[];
  theory?: string[];
  songs?: string[];
}

export interface GuitarGeneratorOptions extends BaseGeneratorOptions {
  level?: string;
  duration?: string;
  focus?: string;
  style?: string;
  techniques?: string[];
  prerequisites?: string[];
  equipment?: string[];
  theory?: string[];
  songs?: string[];
}

const GUITAR_DOMAIN = {
  name: "guitar",
  version: "1.0.0",
  description: "Guitar lesson generation with customizable parameters",
  validationRules: [
    {
      name: "hasWarmup",
      pattern: /warm[- ]?up|finger exercises|stretches/i,
      message: "Lesson must include warmup exercises"
    },
    {
      name: "hasTechnique",
      pattern: /technique|exercise|practice/i,
      message: "Lesson must include specific techniques to practice"
    },
    {
      name: "hasApplication",
      pattern: /song|piece|riff|progression/i,
      message: "Lesson must include practical application"
    },
    {
      name: "hasStructure",
      pattern: (content: string) => content.includes("## Lesson Plan"),
      message: "Lesson must follow the required structure"
    }
  ]
};

/**
 * @class GuitarGenerator
 * @extends DomainGenerator
 * @description Handles the generation of guitar lessons using specified LLM providers.
 * The generator creates personalized lesson plans based on skill level,
 * time duration, and specific focus areas for practice.
 */
export class GuitarGenerator extends DomainGenerator<GuitarContext> {
  protected override options: GuitarGeneratorOptions;

  /**
   * @constructor
   * @param {GuitarGeneratorOptions} options - Configuration options for lesson generation
   */
  constructor(options: GuitarGeneratorOptions) {
    const baseOptions = {
      level: "beginner",
      duration: "60 minutes",
      focus: "basic technique",
      ...options,
    };
    super(baseOptions, GUITAR_DOMAIN);
    this.options = baseOptions;

    // Set up base context for lesson generation
    this.setBaseContext({
      level: this.options.level,
      duration: this.options.duration,
      focus: this.options.focus,
      style: this.options.style,
      techniques: this.options.techniques,
      prerequisites: this.options.prerequisites,
      equipment: this.options.equipment,
      theory: this.options.theory,
      songs: this.options.songs
    });
  }

  /**
   * @protected
   * @method enrichContext
   * @param {Partial<GuitarContext>} context - The guitar-specific context
   * @returns {GuitarContext} Enriched context with computed values
   */
  protected override enrichContext(context: Partial<GuitarContext>): GuitarContext {
    const baseContext = this.getBaseContext();
    const enriched = {
      ...baseContext,
      ...context,
      concept: this.buildConcept()
    };

    // Add default equipment based on level if not specified
    if (!enriched.equipment) {
      enriched.equipment = this.getDefaultEquipment(enriched.level);
    }

    // Add prerequisite techniques based on focus if not specified
    if (!enriched.prerequisites) {
      enriched.prerequisites = this.getPrerequisites(enriched.focus, enriched.level);
    }

    return enriched as GuitarContext;
  }

  /**
   * @protected
   * @method validateContext
   * @param {GuitarContext} context - The guitar-specific context to validate
   * @returns {boolean} Whether the context is valid
   */
  protected override validateContext(context: GuitarContext): boolean {
    return Boolean(
      context.level &&
      context.duration &&
      context.focus
    );
  }

  /**
   * @private
   * @method getDefaultEquipment
   * @param {string} level - Student's skill level
   * @returns {string[]} Default equipment needed for the level
   */
  private getDefaultEquipment(level: string | undefined): string[] {
    const baseEquipment = ["guitar", "picks", "tuner"];
    
    switch (level?.toLowerCase() ?? "beginner") {
      case "beginner":
        return [...baseEquipment, "capo"];
      case "intermediate":
        return [...baseEquipment, "capo", "metronome"];
      case "advanced":
        return [...baseEquipment, "capo", "metronome", "audio interface"];
      default:
        return baseEquipment;
    }
  }

  /**
   * @private
   * @method getPrerequisites
   * @param {string} focus - Lesson focus
   * @param {string} level - Student's skill level
   * @returns {string[]} Prerequisite techniques
   */
  private getPrerequisites(focus: string | undefined, level: string | undefined): string[] {
    const prerequisites: string[] = [];

    // Add basic prerequisites based on level
    switch (level?.toLowerCase() ?? "beginner") {
      case "intermediate":
        prerequisites.push("basic chord transitions", "basic strumming patterns");
        break;
      case "advanced":
        prerequisites.push("intermediate chord theory", "scales", "fingerpicking");
        break;
    }

    // Add focus-specific prerequisites
    if (focus?.includes("fingerpicking")) {
      prerequisites.push("basic finger independence", "thumb control");
    } else if (focus?.includes("theory")) {
      prerequisites.push("note reading", "basic chord construction");
    }

    return prerequisites;
  }

  /**
   * @protected
   * @method buildConcept
   * @returns {string} A concept description based on lesson parameters
   */
  protected buildConcept(): string {
    const { level, duration, focus, style } = this.options;
    return `${duration} ${level}-level guitar lesson focusing on ${focus}${style ? ` in ${style} style` : ''}`;
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
 * @function generateGuitarLesson
 * @param {GuitarGeneratorOptions} options - Configuration options for lesson generation
 * @returns {Promise<string>} The generated lesson content
 */
export async function generateGuitarLesson(options: GuitarGeneratorOptions): Promise<string> {
  const generator = new GuitarGenerator(options);
  return await generator.generate();
} 
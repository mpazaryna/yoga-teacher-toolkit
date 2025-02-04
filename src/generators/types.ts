/**
 * @module types
 * @description Core type definitions for the functional generator implementation
 */

import type { ProviderType } from "../llm/types.ts";

/**
 * Template configuration options
 */
export type TemplateConfig = 
  | string 
  | { path: string }
  | { name: string };

/**
 * Base configuration for all generators
 */
export interface GeneratorConfig {
  provider: ProviderType;
  template: TemplateConfig;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Configuration specific to yoga sequence generation
 */
export interface YogaConfig extends GeneratorConfig {
  level: string;
  duration: string;
  focus: string;
  style?: string;
  props?: string[];
  contraindications?: string[];
}

/**
 * Options for retry behavior
 */
export interface RetryOptions {
  maxRetries?: number;
  onError?: (error: Error, attempt: number) => void;
  onRetry?: (attempt: number, delay: number) => void;
}

/**
 * Context data for template injection
 */
export interface ContextData {
  [key: string]: unknown;
} 
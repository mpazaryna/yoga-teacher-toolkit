/**
 * @module LLMConfig
 * @description Centralized configuration for LLM providers.
 * Provides default configurations and model settings for all supported providers.
 */

import type { ProviderType } from "../types.ts";

export interface ProviderConfig {
  model: string;
  maxTokens: number;
}

export const PROVIDER_CONFIGS: Record<ProviderType, ProviderConfig> = {
  openai: {
    model: "gpt-4-0125-preview",
    maxTokens: 4000,
  },
  claude: {
    model: "claude-3-sonnet-20240229",
    maxTokens: 4000,
  },
  gemini: {
    model: "gemini-pro",
    maxTokens: 4000,
  },
  groq: {
    model: "mixtral-8x7b-32768",
    maxTokens: 4000,
  },
};

/**
 * @function getProviderConfig
 * @param {ProviderType} provider - The LLM provider to get configuration for
 * @returns {ProviderConfig} The provider's configuration
 * @throws {Error} When an invalid provider is specified
 */
export function getProviderConfig(provider: ProviderType): ProviderConfig {
  const config = PROVIDER_CONFIGS[provider];
  if (!config) {
    throw new Error(`Invalid provider: ${provider}. Must be one of: ${Object.keys(PROVIDER_CONFIGS).join(", ")}`);
  }
  return config;
} 
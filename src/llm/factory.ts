/**
 * @module LLMFactory
 * @description Factory module for creating LLM providers.
 * Provides a unified interface for instantiating different LLM providers
 * (OpenAI, Claude, Groq, Gemini) with consistent configuration handling.
 * Acts as a central hub for provider management and initialization.
 */

import type { LLMConfig, LLMProvider, ProviderType } from "./types.ts";
import * as claude from "./providers/claude.ts";
import * as openai from "./providers/openai.ts";
import * as groq from "./providers/groq.ts";
import * as gemini from "./providers/gemini.ts";

/**
 * @function createProvider
 * @param {ProviderType} type - The type of LLM provider to create (e.g., 'openai', 'claude', 'groq', 'gemini')
 * @param {Partial<LLMConfig>} [config={}] - Configuration options for the provider
 * @returns {LLMProvider} An initialized provider instance with generateContent method
 * @throws {Error} When an unsupported provider type is specified
 * @description Creates and configures an LLM provider instance based on the specified type.
 * Each provider is initialized with the given configuration and wrapped in a consistent interface.
 * Supports multiple provider types while maintaining a unified API for content generation.
 */
export const createProvider = (type: ProviderType, config: Partial<LLMConfig> = {}): LLMProvider => {
  const providers = {
    claude: { generateContent: (prompt: string) => claude.generateContent(prompt, config) },
    openai: { generateContent: (prompt: string) => openai.generateContent(prompt, config) },
    groq: { generateContent: (prompt: string) => groq.generateContent(prompt, config) },
    gemini: { generateContent: (prompt: string) => gemini.generateContent(prompt, config) }
  };

  return providers[type] || 
    (() => { throw new Error(`Provider ${type} not supported`); })();
};
/**
 * @module LLMTypes
 * @description Type definitions for LLM providers and configurations
 */

/** Supported LLM provider types */
export type ProviderType = "claude" | "openai" | "groq" | "gemini";

/** Configuration options for LLM providers */
export interface LLMConfig {
  /** Temperature for response generation (0-1) */
  temperature?: number;
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** Model identifier to use */
  model?: string;
  /** System prompt/context */
  systemPrompt?: string;
  /** API key for the provider */
  apiKey?: string;
}

/** Response from LLM providers */
export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/** Error response from LLM providers */
export interface LLMError {
  message: string;
  code?: string;
  type?: string;
  param?: string;
  status?: number;
  provider?: ProviderType;
}

/** Interface for LLM providers */
export interface LLMProvider {
  /** Generates content based on the given prompt */
  generateContent: (prompt: string) => Promise<LLMResponse>;
} 
/**
 * @module GroqProvider
 * @description Implementation of the Groq LLM provider using their OpenAI-compatible API.
 * Provides functionality to generate content using Groq's high-performance models with
 * configurable parameters for temperature and token limits. Optimized for fast inference
 * using Mixtral and other models.
 */

import type { LLMConfig, LLMResponse, LLMError } from "../../../types.ts";
import { usageTracker } from "../../monitoring/index.ts";

/**
 * @constant
 * @description Default configuration for Groq API requests
 * @property {string} model - Default Mixtral model version
 * @property {number} maxTokens - Maximum tokens to generate
 * @property {number} temperature - Controls response randomness
 */
const defaultConfig = {
  model: "mixtral-8x7b-32768",
  maxTokens: 4000,
  temperature: 0.7,
};

/**
 * @function createHeaders
 * @param {string} apiKey - Groq API key for authentication
 * @returns {Object} Headers object for Groq API requests
 * @description Creates the necessary headers for Groq API requests including
 * content type and Bearer token authentication
 */
const createHeaders = (apiKey: string) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${apiKey}`
});

/**
 * @function handleError
 * @param {unknown} error - Error object or message to process
 * @param {number} [startTime] - Optional start time for usage tracking
 * @returns {never} Never returns, always throws an error
 * @throws {LLMError} Standardized error object for Groq API errors
 * @description Processes errors from the Groq API and converts them into
 * standardized LLMError objects for consistent error handling
 */
const handleError = (error: unknown, startTime?: number): never => {
  const llmError: LLMError = {
    code: "GROQ_ERROR",
    message: error instanceof Error ? error.message : "Unknown error",
    provider: "groq"
  };
  
  if (startTime) {
    usageTracker.recordUsage(
      "groq",
      defaultConfig.model,
      { content: "", usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } },
      Date.now() - startTime,
      llmError.message
    );
  }
  
  throw llmError;
};

/**
 * @async
 * @function generateContent
 * @param {string} prompt - The input prompt for content generation
 * @param {Partial<LLMConfig>} [config={}] - Optional configuration overrides
 * @returns {Promise<LLMResponse>} Generated content and usage statistics
 * @throws {LLMError} When API key is missing or API request fails
 * @description Main function for generating content using Groq's API.
 * Handles API key management, request configuration, and error handling.
 * Uses OpenAI-compatible chat completions endpoint for generation.
 */
export const generateContent = async (
  prompt: string, 
  config: Partial<LLMConfig> = {}
): Promise<LLMResponse> => {
  const startTime = Date.now();
  console.log("📡 Preparing Groq API request...");
  
  const apiKey = config.apiKey ?? Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    console.error("❌ No API key found!");
    return handleError({ code: "NO_API_KEY", message: "Missing API key" }, startTime);
  }

  const mergedConfig = { ...defaultConfig, ...config };
  console.log("⚙️  Using configuration:", {
    model: mergedConfig.model,
    maxTokens: mergedConfig.maxTokens,
    temperature: mergedConfig.temperature
  });
  
  try {
    console.log("🔄 Sending request to Groq API...");
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: createHeaders(apiKey),
      body: JSON.stringify({
        model: mergedConfig.model,
        max_tokens: mergedConfig.maxTokens,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: mergedConfig.temperature
      })
    });

    if (!response.ok) {
      const error = await response.json();
      usageTracker.recordUsage(
        "groq",
        mergedConfig.model,
        { content: "", usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } },
        Date.now() - startTime,
        error.message
      );
      return handleError(error);
    }

    const data = await response.json();
    console.log("✅ Received response from Groq API");
    
    const result = {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    };

    usageTracker.recordUsage(
      "groq",
      mergedConfig.model,
      result,
      Date.now() - startTime
    );

    return result;
  } catch (error) {
    usageTracker.recordUsage(
      "groq",
      mergedConfig.model,
      { content: "", usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } },
      Date.now() - startTime,
      error instanceof Error ? error.message : "Unknown error"
    );
    return handleError(error);
  }
};
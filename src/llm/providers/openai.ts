/**
 * @module OpenAIProvider
 * @description Implementation of the OpenAI LLM provider using their chat completions API.
 * Provides functionality to generate content using OpenAI's latest models with
 * configurable parameters for temperature and token limits. Optimized for GPT-4
 * and other advanced language models.
 */

import type { LLMConfig, LLMResponse, LLMError } from "../types.ts";
import { usageTracker } from "../tracker.ts";

/**
 * @constant
 * @description Default configuration for OpenAI API requests
 * @property {string} model - Default GPT-4 model version
 * @property {number} maxTokens - Maximum tokens to generate
 * @property {number} temperature - Controls response randomness
 */
const defaultConfig = {
  model: "gpt-4-0125-preview",
  maxTokens: 4000, // Increased max tokens
  temperature: 0.7,
};

/**
 * @function createHeaders
 * @param {string} apiKey - OpenAI API key for authentication
 * @returns {Object} Headers object for OpenAI API requests
 * @description Creates the necessary headers for OpenAI API requests including
 * content type and Bearer token authentication
 */
const createHeaders = (apiKey: string) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${apiKey}`
});

/**
 * @function handleError
 * @param {unknown} error - Error object or message to process
 * @param {number} startTime - Start time of the request
 * @returns {never} Never returns, always throws an error
 * @throws {LLMError} Standardized error object for OpenAI API errors
 * @description Processes errors from the OpenAI API and converts them into
 * standardized LLMError objects for consistent error handling
 */
const handleError = (error: unknown, startTime?: number): never => {
  const llmError: LLMError = {
    code: "OPENAI_ERROR",
    message: error instanceof Error ? error.message : "Unknown error",
    provider: "openai"
  };

  if (startTime) {
    usageTracker.recordUsage(
      "openai",
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
 * @description Main function for generating content using OpenAI's API.
 * Handles API key management, request configuration, and error handling.
 * Uses the chat completions endpoint for generation with detailed usage tracking.
 */
export const generateContent = async (
  prompt: string, 
  config: Partial<LLMConfig> = {}
): Promise<LLMResponse> => {
  const startTime = Date.now();
  console.log("📡 Preparing OpenAI API request...");
  
  const apiKey = config.apiKey ?? Deno.env.get("OPENAI_API_KEY");
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
    console.log("🔄 Sending request to OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
        "openai",
        mergedConfig.model,
        { content: "", usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } },
        Date.now() - startTime,
        error.message
      );
      return handleError(error);
    }

    const data = await response.json();
    console.log("✅ Received response from OpenAI API");
    
    const result = {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    };

    usageTracker.recordUsage(
      "openai",
      mergedConfig.model,
      result,
      Date.now() - startTime
    );

    return result;
  } catch (error) {
    usageTracker.recordUsage(
      "openai",
      mergedConfig.model,
      { content: "", usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } },
      Date.now() - startTime,
      error instanceof Error ? error.message : "Unknown error"
    );
    return handleError(error);
  }
};
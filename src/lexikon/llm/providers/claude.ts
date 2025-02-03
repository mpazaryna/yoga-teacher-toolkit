/**
 * @module ClaudeProvider
 * @description Implementation of the Claude LLM provider using Anthropic's API.
 * Provides functionality to generate content using Claude's latest models with
 * configurable parameters for temperature and token limits.
 */

import type { LLMConfig, LLMResponse, LLMError } from "../../../types.ts";
import { usageTracker } from "../../monitoring/index.ts";

/**
 * @constant
 * @description Default configuration for Claude API requests
 * @property {string} model - Default Claude model version
 * @property {number} maxTokens - Maximum tokens to generate
 * @property {number} temperature - Controls response randomness
 */
const defaultConfig = {
  model: "claude-3-sonnet-20240229",
  maxTokens: 4000,
  temperature: 0.7,
};

/**
 * @function createHeaders
 * @param {string} apiKey - Anthropic API key for authentication
 * @returns {Object} Headers object for Claude API requests
 * @description Creates the necessary headers for Claude API requests including
 * content type, API key, and API version specifications
 */
const createHeaders = (apiKey: string) => ({
  "Content-Type": "application/json",
  "x-api-key": apiKey,
  "anthropic-version": "2023-06-01"
});

/**
 * @function handleError
 * @param {unknown} error - Error object or message to process
 * @param {number} startTime - Start time of the request
 * @returns {never} Never returns, always throws an error
 * @throws {LLMError} Standardized error object for Claude API errors
 * @description Processes errors from the Claude API and converts them into
 * standardized LLMError objects for consistent error handling
 */
const handleError = (error: unknown, startTime?: number): never => {
  const llmError: LLMError = {
    code: "CLAUDE_ERROR",
    message: error instanceof Error ? error.message : "Unknown error",
    provider: "claude"
  };
  
  if (startTime) {
    usageTracker.recordUsage(
      "claude",
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
 * @description Main function for generating content using Claude's API.
 * Handles API key management, request configuration, and error handling.
 * Uses system prompt to specify creative writing context.
 */
export const generateContent = async (
  prompt: string, 
  config: Partial<LLMConfig> = {}
): Promise<LLMResponse> => {
  const startTime = Date.now();
  console.log("📡 Preparing Claude API request...");
  
  const apiKey = config.apiKey ?? Deno.env.get("ANTHROPIC_API_KEY");
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
    console.log("🔄 Sending request to Claude API...");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: createHeaders(apiKey),
      body: JSON.stringify({
        model: mergedConfig.model,
        max_tokens: mergedConfig.maxTokens,
        temperature: mergedConfig.temperature,
        system: "You are a creative writing assistant. Provide complete, detailed responses.",
        messages: [{ 
          role: "user", 
          content: prompt 
        }]
      })
    });

    if (!response.ok) {
      return handleError(await response.json(), startTime);
    }

    const data = await response.json();
    console.log("✅ Received response from Claude API");
    
    const result = {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)
      }
    };

    usageTracker.recordUsage(
      "claude",
      mergedConfig.model,
      result,
      Date.now() - startTime
    );

    return result;
  } catch (error) {
    return handleError(error, startTime);
  }
};
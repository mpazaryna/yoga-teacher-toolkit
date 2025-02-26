import { createOpenAIClient, createGeminiClient } from "@forge/llm";

// Define separate configurations for OpenAI and Gemini
export const openAIConfig = {
  apiKey: Deno.env.get('OPENROUTER_API_KEY')?.trim() || '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
};

export const geminiConfig = {
  apiKey: Deno.env.get('GOOGLE_API_KEY')?.trim() || '',
  model: 'gemini-pro',
  temperature: 0.7,
  maxTokens: 1000,
};

// Define a type for the client
const DEFAULT_CLIENT: 'openai' | 'gemini' = 'openai'; // Change this to 'gemini' to switch

export const getLLMClient = (config = DEFAULT_CLIENT === 'gemini' ? geminiConfig : openAIConfig) => {
  return DEFAULT_CLIENT === 'gemini' ? createGeminiClient(config) : createOpenAIClient(config);
}; 
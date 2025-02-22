import { createOpenAIClient } from "@forge/llm";

export const defaultLLMConfig = {
  apiKey: Deno.env.get('OPENROUTER_API_KEY')?.trim() || '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 1000,
};

export const getLLMClient = (config = defaultLLMConfig) => createOpenAIClient(config); 
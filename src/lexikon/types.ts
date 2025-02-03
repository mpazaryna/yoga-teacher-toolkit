// LLM Types
export type ProviderType = "openai" | "claude" | "gemini" | "groq";

export type LLMConfig = {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export type LLMResponse = {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  generateContent: (prompt: string, config?: Partial<LLMConfig>) => Promise<LLMResponse>;
}

export type LLMError = {
  code: string;
  message: string;
  provider?: string;
  status?: number;
}

// Generator Base Types
export interface BaseGeneratorOptions {
  provider: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  template?: string;
  templatePath?: string;
}

// Story Generator Types
export interface StoryGeneratorOptions extends Omit<BaseGeneratorOptions, 'outputFile'> {
  concept: string;
}

// Yoga Generator Types
export interface YogaGeneratorOptions extends Omit<BaseGeneratorOptions, 'outputFile'> {
  level?: string;
  duration?: string;
  focus?: string;
} 
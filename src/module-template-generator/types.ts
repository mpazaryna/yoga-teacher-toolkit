/**
 * Core types for template generation
 */
export type GeneratorConfig = {
  llm: LLMClient;
  retryOptions?: RetryOptions;
  transforms?: Array<(content: string) => string>;
}

export type GeneratorContext = Record<string, unknown>;

export type RetryOptions = {
  maxAttempts?: number;
  delayMs?: number;
  onError?: (error: Error, attempt: number) => void;
  onRetry?: (attempt: number, delay: number) => void;
}

export type GenerationResult = {
  content: string;
  metadata: {
    generatedAt: Date;
    templateId?: string;
    attempts?: number;
  };
}

export interface LLMClient {
  complete(messages: Array<{ role: string; content: string }>): Promise<{
    message?: { content: string };
  }>;
} 
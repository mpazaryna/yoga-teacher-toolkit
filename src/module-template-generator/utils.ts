import type { RetryOptions } from './types.ts';

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const typedError = error instanceof Error ? error : new Error(String(error));
      lastError = typedError;
      
      if (options.onError) {
        options.onError(typedError, attempt);
      }
      
      if (attempt < options.maxAttempts) {
        if (options.onRetry) {
          options.onRetry(attempt, options.delayMs);
        }
        await new Promise(resolve => setTimeout(resolve, options.delayMs));
      }
    }
  }
  
  throw lastError || new Error('Maximum retry attempts reached');
} 
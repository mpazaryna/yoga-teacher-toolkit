/**
 * @module retry
 * @description Utility function for retrying operations with exponential backoff
 */

import type { RetryOptions } from "./types.ts";

/**
 * Executes a function with retry logic and exponential backoff
 * @param fn Function to execute
 * @param options Retry configuration options
 * @returns Promise resolving to the function result
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    onError,
    onRetry
  } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (onError) {
        onError(lastError, attempt);
      }
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        
        if (onRetry) {
          onRetry(attempt, delay);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError ?? new Error('Unknown error in retry loop');
}; 
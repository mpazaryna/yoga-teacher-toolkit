/**
 * @module UsageTrackerInstance
 * @description Singleton instance of the usage tracker for monitoring LLM operations
 */

import { UsageTracker } from "./usage.ts";

// Create and export a singleton instance of the usage tracker
export const usageTracker = new UsageTracker(); 
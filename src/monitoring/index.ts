/**
 * @module Monitoring
 * @description Exports a singleton instance of the usage tracker for global monitoring.
 */

import { UsageTracker } from "./usage.ts";

// Create singleton instance
export const usageTracker: UsageTracker = new UsageTracker();

// Re-export types
export type { UsageMetrics, CostMetrics } from "./usage.ts";
export { UsageTracker } from "./usage.ts"; 
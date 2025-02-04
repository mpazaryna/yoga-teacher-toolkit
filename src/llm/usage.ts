/**
 * @module UsageTracking
 * @description Handles monitoring and tracking of LLM usage, costs, and performance metrics.
 * Provides functionality to record and analyze API calls, token usage, and response times
 * across different LLM providers.
 */

import type { ProviderType, LLMResponse } from "./types.ts";

export interface UsageMetrics {
  timestamp: number;
  provider: ProviderType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}

export interface CostMetrics extends UsageMetrics {
  promptCost: number;
  completionCost: number;
  totalCost: number;
}

// Provider-specific cost per 1K tokens (in USD)
const COST_PER_1K_TOKENS: Record<string, { prompt: number; completion: number }> = {
  "gpt-4-0125-preview": { prompt: 0.01, completion: 0.03 },
  "gpt-4": { prompt: 0.03, completion: 0.06 },
  "claude-3-sonnet-20240229": { prompt: 0.003, completion: 0.015 },
  "mixtral-8x7b-32768": { prompt: 0.0027, completion: 0.0027 },
  "gemini-pro": { prompt: 0.0005, completion: 0.0005 }
};

export class UsageTracker {
  private metrics: UsageMetrics[] = [];
  private costMetrics: CostMetrics[] = [];

  /**
   * Records usage metrics from an LLM API call
   */
  recordUsage(
    provider: ProviderType,
    model: string,
    response: LLMResponse,
    latencyMs: number,
    error?: string
  ): void {
    const metrics: UsageMetrics = {
      timestamp: Date.now(),
      provider,
      model,
      promptTokens: response.usage?.promptTokens ?? 0,
      completionTokens: response.usage?.completionTokens ?? 0,
      totalTokens: response.usage?.totalTokens ?? 0,
      latencyMs,
      success: !error,
      error
    };

    this.metrics.push(metrics);
    this.calculateCost(metrics);
  }

  /**
   * Calculates cost based on token usage and provider pricing
   */
  private calculateCost(metrics: UsageMetrics): void {
    const costs = COST_PER_1K_TOKENS[metrics.model] ?? { prompt: 0, completion: 0 };
    
    const costMetrics: CostMetrics = {
      ...metrics,
      promptCost: (metrics.promptTokens / 1000) * costs.prompt,
      completionCost: (metrics.completionTokens / 1000) * costs.completion,
      totalCost: 0
    };
    
    costMetrics.totalCost = costMetrics.promptCost + costMetrics.completionCost;
    this.costMetrics.push(costMetrics);
  }

  /**
   * Gets usage statistics for a specific time period
   */
  getUsageStats(startTime?: number, endTime?: number): {
    totalCalls: number;
    successRate: number;
    averageLatency: number;
    totalTokens: number;
    totalCost: number;
    usageByProvider: Record<ProviderType, number>;
  } {
    const filteredMetrics = this.filterByTimeRange(this.metrics, startTime, endTime);
    const filteredCosts = this.filterByTimeRange(this.costMetrics, startTime, endTime);

    const usageByProvider = filteredMetrics.reduce((acc, metric) => {
      acc[metric.provider] = (acc[metric.provider] || 0) + metric.totalTokens;
      return acc;
    }, {} as Record<ProviderType, number>);

    return {
      totalCalls: filteredMetrics.length,
      successRate: this.calculateSuccessRate(filteredMetrics),
      averageLatency: this.calculateAverageLatency(filteredMetrics),
      totalTokens: this.calculateTotalTokens(filteredMetrics),
      totalCost: this.calculateTotalCost(filteredCosts),
      usageByProvider
    };
  }

  private filterByTimeRange<T extends { timestamp: number }>(
    metrics: T[],
    startTime?: number,
    endTime?: number
  ): T[] {
    return metrics.filter(metric => {
      const afterStart = !startTime || metric.timestamp >= startTime;
      const beforeEnd = !endTime || metric.timestamp <= endTime;
      return afterStart && beforeEnd;
    });
  }

  private calculateSuccessRate(metrics: UsageMetrics[]): number {
    if (metrics.length === 0) return 0;
    const successful = metrics.filter(m => m.success).length;
    return (successful / metrics.length) * 100;
  }

  private calculateAverageLatency(metrics: UsageMetrics[]): number {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + m.latencyMs, 0);
    return total / metrics.length;
  }

  private calculateTotalTokens(metrics: UsageMetrics[]): number {
    return metrics.reduce((sum, m) => sum + m.totalTokens, 0);
  }

  private calculateTotalCost(costs: CostMetrics[]): number {
    return costs.reduce((sum, c) => sum + c.totalCost, 0);
  }
} 
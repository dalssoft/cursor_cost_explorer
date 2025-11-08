/**
 * ModelUsage entity - aggregates usage statistics for a specific model
 * Encapsulates model efficiency calculations and categorization
 */

import { isThinkingModel as registryIsThinkingModel } from '../models/registry.js';

class ModelUsage {
    constructor(model, records = []) {
        this.model = model;
        this.records = records;

        // Calculate aggregated stats
        this.totalCost = records.reduce((sum, r) => sum + r.cost, 0);
        this.requestCount = records.length;
        this.totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
        this.totalInputTokens = records.reduce((sum, r) => sum + r.input, 0);
        this.totalOutputTokens = records.reduce((sum, r) => sum + r.output, 0);
        this.totalCacheRead = records.reduce((sum, r) => sum + r.cacheRead, 0);
    }

    /**
     * Calculates cost per million tokens
     */
    getCostPerMillionTokens() {
        if (this.totalTokens === 0) return 0;
        return (this.totalCost / this.totalTokens) * 1_000_000;
    }

    /**
     * Calculates cost per million output tokens (useful for thinking models)
     */
    getCostPerMillionOutputTokens() {
        if (this.totalOutputTokens === 0) return 0;
        return (this.totalCost / this.totalOutputTokens) * 1_000_000;
    }

    /**
     * Calculates average cost per request
     */
    getAverageCostPerRequest() {
        if (this.requestCount === 0) return 0;
        return this.totalCost / this.requestCount;
    }

    /**
     * Calculates cache efficiency percentage
     */
    getCacheEfficiency() {
        if (this.totalTokens === 0) return 0;
        return (this.totalCacheRead / this.totalTokens) * 100;
    }

    /**
     * Calculates percentage of total cost (requires total cost context)
     */
    getPercentageOfTotal(totalCost) {
        if (totalCost === 0) return 0;
        return (this.totalCost / totalCost) * 100;
    }

    /**
     * Categorizes model by cost efficiency
     * Returns: 'cost_efficient' | 'specialized' | 'premium'
     */
    getCategory() {
        const costPerM = this.getCostPerMillionTokens();

        if (costPerM < 50) {
            return 'cost_efficient'; // 🟢
        } else if (costPerM < 500) {
            return 'specialized'; // 🟡
        } else {
            return 'premium'; // 🔴
        }
    }

    /**
     * Checks if this is a thinking model
     * Uses model registry first, falls back to name check
     */
    isThinkingModel() {
        // Check registry first
        return registryIsThinkingModel(this.model);
    }

    /**
     * Converts to plain object (for serialization)
     */
    toObject() {
        return {
            model: this.model,
            total_cost: this.totalCost,
            request_count: this.requestCount,
            total_tokens: this.totalTokens,
            total_input_tokens: this.totalInputTokens,
            total_output_tokens: this.totalOutputTokens,
            total_cache_read: this.totalCacheRead,
            cost_per_million_tokens: this.getCostPerMillionTokens(),
            cost_per_million_output_tokens: this.getCostPerMillionOutputTokens(),
            average_cost_per_request: this.getAverageCostPerRequest(),
            cache_efficiency: this.getCacheEfficiency(),
            category: this.getCategory(),
            is_thinking_model: this.isThinkingModel()
        };
    }
}

export { ModelUsage };


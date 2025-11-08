/**
 * Model efficiency analysis for Cursor usage data
 * Pure JavaScript - no external dependencies
 */

import { ModelUsage } from '../entities/ModelUsage.js';
import { getModelRecommendation } from '../models/registry.js';

class ModelEfficiencyAnalyzer {
    /**
     * Analyzes model efficiency from usage records
     * @param {UsageRecord[]} records - Array of usage records
     * @returns {Object} Analysis result with efficiency rankings and recommendations
     */
    analyze(records) {
        if (!records || records.length === 0) {
            throw new Error('Records array cannot be empty');
        }

        // Group records by model and create ModelUsage entities
        const modelGroups = this.groupByModel(records);
        const modelUsages = Object.entries(modelGroups).map(([model, modelRecords]) =>
            new ModelUsage(model, modelRecords)
        );

        // Calculate efficiency scores
        const efficiencyData = modelUsages.map(modelUsage => ({
            modelUsage,
            efficiencyScore: this.calculateEfficiencyScore(modelUsage),
            recommendation: this.generateRecommendation(modelUsage)
        }));

        // Rank by efficiency score (highest first)
        efficiencyData.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

        return {
            rankings: efficiencyData.map((item, index) => ({
                rank: index + 1,
                model: item.modelUsage.model,
                efficiency_score: item.efficiencyScore,
                cost_per_million_tokens: item.modelUsage.getCostPerMillionTokens(),
                cost_per_million_output_tokens: item.modelUsage.getCostPerMillionOutputTokens(),
                average_cost_per_request: item.modelUsage.getAverageCostPerRequest(),
                category: item.modelUsage.getCategory(),
                is_thinking_model: item.modelUsage.isThinkingModel(),
                recommendation: item.recommendation,
                // Include full model usage stats
                total_cost: item.modelUsage.totalCost,
                request_count: item.modelUsage.requestCount,
                total_tokens: item.modelUsage.totalTokens,
                cache_efficiency: item.modelUsage.getCacheEfficiency()
            }))
        };
    }

    /**
     * Groups records by model name
     * @param {UsageRecord[]} records - Array of usage records
     * @returns {Object.<string, UsageRecord[]>} Records grouped by model
     */
    groupByModel(records) {
        const groups = {};
        for (const record of records) {
            const model = record.model;
            if (!groups[model]) {
                groups[model] = [];
            }
            groups[model].push(record);
        }
        return groups;
    }

    /**
     * Calculates efficiency score (0-100) for a model
     * Higher score = more cost-efficient
     * 
     * Scoring algorithm:
     * - Base score: 100 - (cost_per_million_tokens / 10)
     * - Thinking models: Use output tokens instead of total tokens
     * - Clamp between 0-100
     * 
     * @param {ModelUsage} modelUsage - Model usage entity
     * @returns {number} Efficiency score from 0-100
     */
    calculateEfficiencyScore(modelUsage) {
        let costPerMillion;

        // For thinking models, use output tokens (they're judged differently)
        if (modelUsage.isThinkingModel()) {
            costPerMillion = modelUsage.getCostPerMillionOutputTokens();
        } else {
            costPerMillion = modelUsage.getCostPerMillionTokens();
        }

        // Base score: cheaper models get higher scores
        // Scale: $0/M = 100, $1000/M = 0
        let score = 100 - (costPerMillion / 10);

        // Adjust for thinking models (they're inherently more expensive but valuable)
        if (modelUsage.isThinkingModel()) {
            // Thinking models get a boost - they're expensive but provide unique value
            score = score * 1.2;
        }

        // Clamp between 0-100
        score = Math.max(0, Math.min(100, score));

        // Round to 2 decimal places
        return Math.round(score * 100) / 100;
    }

    /**
     * Generates usage recommendation for a model based on its category
     * Uses model registry for known models, falls back to category-based recommendations
     * @param {ModelUsage} modelUsage - Model usage entity
     * @returns {string} Usage recommendation text
     */
    generateRecommendation(modelUsage) {
        const category = modelUsage.getCategory();
        const modelName = modelUsage.model;

        // Use model registry for recommendations
        return getModelRecommendation(modelName, category);
    }
}

export { ModelEfficiencyAnalyzer };


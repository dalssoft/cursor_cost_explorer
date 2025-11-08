/**
 * Cache efficiency analysis for Cursor usage data
 * Pure JavaScript - no external dependencies
 */

/**
 * Cache efficiency benchmarks
 */
const CACHE_BENCHMARKS = {
    POOR: { threshold: 60, label: 'Poor', description: 'significant waste' },
    AVERAGE: { threshold: 75, label: 'Average', description: 'room for improvement' },
    GOOD: { threshold: 85, label: 'Good', description: 'effective usage' },
    EXCELLENT: { threshold: 92, label: 'Excellent', description: 'top 10%' },
    OUTSTANDING: { threshold: 100, label: 'Outstanding', description: 'top 1%' }
};

class CacheEfficiencyAnalyzer {
    /**
     * Analyzes cache efficiency from usage records
     * @param {UsageRecord[]} records - Array of usage records
     * @param {Object} costSummary - Summary statistics from cost analysis
     * @returns {Object} Cache efficiency analysis with metrics, benchmarks, and recommendations
     */
    analyze(records, costSummary) {
        if (!records || records.length === 0) {
            throw new Error('Records array cannot be empty');
        }

        // Calculate cache metrics
        const metrics = this.calculateCacheMetrics(records);

        // Calculate cost savings from cache
        const savings = this.calculateCacheSavings(records, metrics);

        // Benchmark cache efficiency
        const benchmark = this.benchmarkCacheEfficiency(metrics.cacheHitRate);

        // Generate contextual feedback
        const feedback = this.generateFeedback(metrics, benchmark, savings, costSummary);

        return {
            metrics,
            benchmark,
            savings,
            feedback
        };
    }

    /**
     * Calculates cache metrics from usage records
     * Cache hit rate = cacheTokens / (cacheTokens + inputTokens)
     * @param {UsageRecord[]} records - Array of usage records
     * @returns {Object} Cache metrics
     */
    calculateCacheMetrics(records) {
        let totalCacheTokens = 0;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalTokens = 0;

        for (const record of records) {
            totalCacheTokens += record.cacheRead || 0;
            totalInputTokens += record.input || 0;
            totalOutputTokens += record.output || 0;
            totalTokens += record.totalTokens || 0;
        }

        // Cache hit rate: cache tokens / (cache tokens + input tokens)
        // This represents how much of the input was served from cache vs fresh processing
        const cacheHitRate = (totalCacheTokens + totalInputTokens) > 0
            ? (totalCacheTokens / (totalCacheTokens + totalInputTokens)) * 100
            : 0;

        // Overall cache efficiency: cache tokens / total tokens
        // This represents cache usage relative to all tokens processed
        const overallCacheEfficiency = totalTokens > 0
            ? (totalCacheTokens / totalTokens) * 100
            : 0;

        return {
            total_cache_tokens: totalCacheTokens,
            total_input_tokens: totalInputTokens,
            total_output_tokens: totalOutputTokens,
            total_tokens: totalTokens,
            cache_hit_rate: cacheHitRate,
            overall_cache_efficiency: overallCacheEfficiency
        };
    }

    /**
     * Calculates estimated cost savings from cache usage
     * Assumes cache tokens would have cost the same as input tokens if not cached
     * @param {UsageRecord[]} records - Array of usage records
     * @param {Object} metrics - Cache metrics
     * @returns {Object} Cost savings information
     */
    calculateCacheSavings(records, metrics) {
        // Calculate average cost per input token (non-cached)
        let totalInputCost = 0;
        let totalInputTokens = 0;

        for (const record of records) {
            const inputTokens = record.input || 0;
            if (inputTokens > 0) {
                // Estimate cost per input token for this record
                // If we have input tokens, distribute cost proportionally
                const inputRatio = inputTokens / (record.totalTokens || 1);
                totalInputCost += record.cost * inputRatio;
                totalInputTokens += inputTokens;
            }
        }

        const avgCostPerInputToken = totalInputTokens > 0
            ? totalInputCost / totalInputTokens
            : 0;

        // Estimate what cache tokens would have cost if not cached
        const estimatedCostWithoutCache = metrics.total_cache_tokens * avgCostPerInputToken;

        // Actual cost (cache tokens are free or significantly cheaper)
        // For simplicity, assume cache tokens cost 0 (they're already paid for)
        const actualCostWithCache = 0;

        const monthlySavings = estimatedCostWithoutCache;
        const yearlySavings = monthlySavings * 12;

        return {
            estimated_cost_without_cache: estimatedCostWithoutCache,
            actual_cost_with_cache: actualCostWithCache,
            savings_monthly: monthlySavings,
            savings_yearly: yearlySavings,
            cache_tokens_processed: metrics.total_cache_tokens
        };
    }

    /**
     * Benchmarks cache efficiency against standard thresholds
     * @param {number} cacheHitRate - Cache hit rate percentage
     * @returns {Object} Benchmark information
     */
    benchmarkCacheEfficiency(cacheHitRate) {
        let level;
        let description;

        if (cacheHitRate < CACHE_BENCHMARKS.POOR.threshold) {
            level = CACHE_BENCHMARKS.POOR.label;
            description = CACHE_BENCHMARKS.POOR.description;
        } else if (cacheHitRate < CACHE_BENCHMARKS.AVERAGE.threshold) {
            level = CACHE_BENCHMARKS.AVERAGE.label;
            description = CACHE_BENCHMARKS.AVERAGE.description;
        } else if (cacheHitRate < CACHE_BENCHMARKS.GOOD.threshold) {
            level = CACHE_BENCHMARKS.GOOD.label;
            description = CACHE_BENCHMARKS.GOOD.description;
        } else if (cacheHitRate < CACHE_BENCHMARKS.EXCELLENT.threshold) {
            level = CACHE_BENCHMARKS.EXCELLENT.label;
            description = CACHE_BENCHMARKS.EXCELLENT.description;
        } else {
            level = CACHE_BENCHMARKS.OUTSTANDING.label;
            description = CACHE_BENCHMARKS.OUTSTANDING.description;
        }

        return {
            level,
            description,
            cache_hit_rate: cacheHitRate,
            threshold_met: cacheHitRate >= CACHE_BENCHMARKS.GOOD.threshold
        };
    }

    /**
     * Generates contextual feedback with actionable tips
     * @param {Object} metrics - Cache metrics
     * @param {Object} benchmark - Benchmark information
     * @param {Object} savings - Cost savings information
     * @param {Object} costSummary - Summary statistics
     * @returns {Object} Feedback with tips and recommendations
     */
    generateFeedback(metrics, benchmark, savings, costSummary) {
        const feedback = {
            summary: '',
            tips: [],
            potential_savings: null
        };

        const cacheHitRate = metrics.cache_hit_rate;
        const days = costSummary?.period?.days || 30;
        const monthlyCost = costSummary?.cost?.total ? (costSummary.cost.total / days) * 30 : 0;

        if (benchmark.level === CACHE_BENCHMARKS.POOR.label) {
            feedback.summary = `⚠️ Your cache rate (${cacheHitRate.toFixed(1)}%) is below average`;
            feedback.tips = [
                'Work in longer continuous sessions (not short bursts)',
                'Keep related files open together',
                'Use @Files references instead of copying code into prompts',
                'Avoid frequently switching between unrelated projects',
                'Use Cursor\'s workspace context features'
            ];

            // Estimate potential savings: assume 20-30% improvement possible
            const potentialImprovement = 0.25; // 25% improvement
            const potentialCacheIncrease = cacheHitRate + (100 - cacheHitRate) * potentialImprovement;
            const potentialSavings = monthlyCost * (potentialCacheIncrease - cacheHitRate) / 100;

            feedback.potential_savings = {
                monthly: Math.max(0, potentialSavings),
                yearly: Math.max(0, potentialSavings * 12),
                improvement_percentage: potentialCacheIncrease - cacheHitRate
            };
        } else if (benchmark.level === CACHE_BENCHMARKS.AVERAGE.label) {
            feedback.summary = `Your cache rate (${cacheHitRate.toFixed(1)}%) is average - there's room for improvement`;
            feedback.tips = [
                'Work in longer continuous sessions',
                'Keep related files open together',
                'Use @Files references instead of copying code'
            ];

            const potentialImprovement = 0.15; // 15% improvement
            const potentialCacheIncrease = cacheHitRate + (100 - cacheHitRate) * potentialImprovement;
            const potentialSavings = monthlyCost * (potentialCacheIncrease - cacheHitRate) / 100;

            feedback.potential_savings = {
                monthly: Math.max(0, potentialSavings),
                yearly: Math.max(0, potentialSavings * 12),
                improvement_percentage: potentialCacheIncrease - cacheHitRate
            };
        } else if (benchmark.level === CACHE_BENCHMARKS.GOOD.label) {
            feedback.summary = `✅ Your cache rate (${cacheHitRate.toFixed(1)}%) is good`;
            feedback.tips = [
                'Continue working in focused sessions',
                'Keep related files open together'
            ];
        } else {
            feedback.summary = `🎉 Your cache rate (${cacheHitRate.toFixed(1)}%) is ${benchmark.level.toLowerCase()}`;
            feedback.tips = [
                'You\'re leveraging Cursor\'s cache effectively',
                'Keep up the good work!'
            ];
        }

        return feedback;
    }
}

export { CacheEfficiencyAnalyzer, CACHE_BENCHMARKS };


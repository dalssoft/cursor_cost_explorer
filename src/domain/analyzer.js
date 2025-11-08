/**
 * Core analysis engine for Cursor Cost Explorer
 * Orchestrates all analysis modules and generates structured JSON output
 * Pure JavaScript - no external dependencies
 */

import { CostAnalyzer } from './analyzers/cost.js';
import { ModelEfficiencyAnalyzer } from './analyzers/model-efficiency.js';
import { PlanOptimizer } from './analyzers/plan-optimization.js';
import { CacheEfficiencyAnalyzer } from './analyzers/cache-efficiency.js';
import { SavingsOpportunitiesAnalyzer } from './analyzers/savings-opportunities.js';
import { UsagePatternAnalyzer } from './analyzers/usage-patterns.js';

class AnalysisEngine {
    /**
     * Main analysis function that orchestrates all analysis modules
     * @param {UsageRecord[]} records - Array of usage records
     * @returns {Object} Complete analysis result with all metrics and recommendations
     */
    analyze(records) {
        if (!records || records.length === 0) {
            throw new Error('Records array cannot be empty');
        }

        // Run all analyses
        const costAnalyzer = new CostAnalyzer();
        const costAnalysis = costAnalyzer.analyze(records);

        const modelEfficiencyAnalyzer = new ModelEfficiencyAnalyzer();
        const modelAnalysis = modelEfficiencyAnalyzer.analyze(records);

        const planOptimizer = new PlanOptimizer();
        const planAnalysis = planOptimizer.analyze(records, costAnalysis.summary);

        const cacheAnalyzer = new CacheEfficiencyAnalyzer();
        const cacheAnalysis = cacheAnalyzer.analyze(records, costAnalysis.summary);

        const savingsAnalyzer = new SavingsOpportunitiesAnalyzer();
        const savingsAnalysis = savingsAnalyzer.analyze(records);

        const patternAnalyzer = new UsagePatternAnalyzer();
        const patternAnalysis = patternAnalyzer.analyze(records, costAnalysis.summary);

        // Assemble complete analysis result
        return {
            metadata: {
                generated_at: new Date().toISOString(),
                total_records: records.length,
                analysis_version: '1.0'
            },
            summary: {
                period: costAnalysis.summary.period,
                cost: {
                    total: costAnalysis.summary.cost.total,
                    daily_average: costAnalysis.summary.cost.daily_average,
                    by_type: {
                        included: costAnalysis.breakdown_by_type.included.cost,
                        on_demand: costAnalysis.breakdown_by_type.on_demand.cost,
                        errored: costAnalysis.breakdown_by_type.errored.cost
                    }
                },
                usage: {
                    total_requests: costAnalysis.summary.usage.total_requests,
                    requests_per_day: costAnalysis.summary.usage.requests_per_day,
                    total_tokens: costAnalysis.summary.usage.total_tokens,
                    cache_efficiency: cacheAnalysis.metrics.overall_cache_efficiency
                }
            },
            cost_analysis: {
                breakdown_by_model: costAnalysis.breakdown_by_model,
                breakdown_by_type: costAnalysis.breakdown_by_type,
                daily_costs: costAnalysis.daily_costs,
                top_expensive_requests: costAnalysis.top_expensive_requests,
                top_expensive_days: costAnalysis.top_expensive_days,
                most_expensive_model: costAnalysis.most_expensive_model
            },
            model_efficiency: {
                rankings: modelAnalysis.rankings
            },
            plan_recommendation: {
                current_plan: planAnalysis.current_plan.plan,
                current_monthly_cost: planAnalysis.actual_monthly_cost,
                recommended_plan: planAnalysis.recommendation.recommended_plan,
                recommended_cost: planAnalysis.recommendation.recommended_cost,
                savings_monthly: planAnalysis.recommendation.savings_monthly,
                savings_yearly: planAnalysis.recommendation.savings_yearly,
                confidence: planAnalysis.recommendation.confidence,
                reasoning: planAnalysis.recommendation.reasoning,
                actions: planAnalysis.recommendation.actions
            },
            cache_efficiency: {
                metrics: cacheAnalysis.metrics,
                benchmark: cacheAnalysis.benchmark,
                savings: cacheAnalysis.savings,
                feedback: cacheAnalysis.feedback
            },
            opportunities: {
                list: savingsAnalysis.opportunities,
                total_potential_savings_monthly: savingsAnalysis.total_potential_savings_monthly,
                total_potential_savings_yearly: savingsAnalysis.total_potential_savings_yearly
            },
            patterns: {
                hourly_distribution: patternAnalysis.hourly_distribution,
                daily_distribution: patternAnalysis.daily_distribution,
                peak_hours: patternAnalysis.peak_hours,
                sprints: patternAnalysis.sprints,
                work_style: patternAnalysis.work_style,
                recommendations: patternAnalysis.recommendations
            }
        };
    }

    /**
     * Exports analysis result as JSON string
     * @param {Object} analysisResult - Analysis result object
     * @param {boolean} pretty - Whether to format JSON with indentation
     * @returns {string} JSON string
     */
    exportJSON(analysisResult, pretty = false) {
        if (pretty) {
            return JSON.stringify(analysisResult, null, 2);
        }
        return JSON.stringify(analysisResult);
    }
}

// Export singleton instance
const engine = new AnalysisEngine();

/**
 * Main analyze function - public API
 * @param {UsageRecord[]} records - Array of usage records
 * @returns {Object} Complete analysis result
 */
export function analyze(records) {
    return engine.analyze(records);
}

/**
 * Export analysis result as JSON
 * @param {Object} analysisResult - Analysis result object
 * @param {boolean} pretty - Whether to format JSON with indentation
 * @returns {string} JSON string
 */
export function exportJSON(analysisResult, pretty = false) {
    return engine.exportJSON(analysisResult, pretty);
}

export { AnalysisEngine };


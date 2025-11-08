/**
 * Savings opportunities identification for Cursor usage data
 * Pure JavaScript - no external dependencies
 */

import { PlanOptimizer } from './plan-optimization.js';
import { ModelEfficiencyAnalyzer } from './model-efficiency.js';
import { CacheEfficiencyAnalyzer } from './cache-efficiency.js';
import { CostAnalyzer } from './cost.js';

/**
 * Opportunity types
 */
const OPPORTUNITY_TYPES = {
    PLAN_OPTIMIZATION: 'plan_optimization',
    MODEL_MIGRATION: 'model_migration',
    ERROR_REDUCTION: 'error_reduction',
    CACHE_OPTIMIZATION: 'cache_optimization'
};

/**
 * Difficulty levels
 */
const DIFFICULTY = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

/**
 * Impact levels
 */
const IMPACT = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
};

class SavingsOpportunitiesAnalyzer {
    /**
     * Analyzes usage data and identifies savings opportunities
     * @param {UsageRecord[]} records - Array of usage records
     * @returns {Object} Analysis result with ranked opportunities
     */
    analyze(records) {
        if (!records || records.length === 0) {
            throw new Error('Records array cannot be empty');
        }

        // Run all analyses
        const costAnalyzer = new CostAnalyzer();
        const costAnalysis = costAnalyzer.analyze(records);

        const planOptimizer = new PlanOptimizer();
        const planAnalysis = planOptimizer.analyze(records, costAnalysis.summary);

        const modelEfficiencyAnalyzer = new ModelEfficiencyAnalyzer();
        const modelAnalysis = modelEfficiencyAnalyzer.analyze(records);

        const cacheAnalyzer = new CacheEfficiencyAnalyzer();
        const cacheAnalysis = cacheAnalyzer.analyze(records, costAnalysis.summary);

        // Identify opportunities
        const opportunities = [];

        // 1. Plan optimization opportunity
        const planOpportunity = this.identifyPlanOptimizationOpportunity(planAnalysis, costAnalysis.summary);
        if (planOpportunity) {
            opportunities.push(planOpportunity);
        }

        // 2. Model migration opportunities
        const modelOpportunities = this.identifyModelMigrationOpportunities(modelAnalysis, costAnalysis.summary);
        opportunities.push(...modelOpportunities);

        // 3. Error reduction opportunity
        const errorOpportunity = this.identifyErrorReductionOpportunity(records, costAnalysis);
        if (errorOpportunity) {
            opportunities.push(errorOpportunity);
        }

        // 4. Cache optimization opportunity
        const cacheOpportunity = this.identifyCacheOptimizationOpportunity(cacheAnalysis, costAnalysis.summary);
        if (cacheOpportunity) {
            opportunities.push(cacheOpportunity);
        }

        // Rank by ROI (savings amount)
        opportunities.sort((a, b) => b.savings_monthly - a.savings_monthly);

        // Take top 5
        const topOpportunities = opportunities.slice(0, 5);

        // Calculate total potential savings
        const totalPotentialSavings = topOpportunities.reduce((sum, opp) => sum + opp.savings_monthly, 0);

        return {
            opportunities: topOpportunities,
            total_potential_savings_monthly: totalPotentialSavings,
            total_potential_savings_yearly: totalPotentialSavings * 12,
            total_opportunities_found: opportunities.length
        };
    }

    /**
     * Identifies plan optimization opportunity
     * @param {Object} planAnalysis - Plan analysis results
     * @param {Object} costSummary - Cost summary
     * @returns {Object|null} Opportunity or null if no opportunity
     */
    identifyPlanOptimizationOpportunity(planAnalysis, costSummary) {
        const recommendation = planAnalysis.recommendation;

        // Only create opportunity if there's a savings opportunity
        if (recommendation.savings_monthly <= 0) {
            return null;
        }

        const currentPlan = planAnalysis.current_plan.plan;
        const recommendedPlan = recommendation.recommended_plan;

        // Don't create opportunity if already on recommended plan
        if (currentPlan === recommendedPlan) {
            return null;
        }

        return {
            type: OPPORTUNITY_TYPES.PLAN_OPTIMIZATION,
            title: `Upgrade to ${recommendedPlan} Plan`,
            savings_monthly: recommendation.savings_monthly,
            savings_yearly: recommendation.savings_yearly,
            difficulty: DIFFICULTY.EASY,
            impact: recommendation.savings_monthly > 50 ? IMPACT.HIGH : IMPACT.MEDIUM,
            action: recommendation.actions[0] || `Switch to ${recommendedPlan} plan`,
            reasoning: recommendation.reasoning.join(' '),
            confidence: recommendation.confidence
        };
    }

    /**
     * Identifies model migration opportunities
     * Finds expensive models that could be replaced with cheaper alternatives
     * @param {Object} modelAnalysis - Model efficiency analysis results
     * @param {Object} costSummary - Cost summary
     * @returns {Array} Array of model migration opportunities
     */
    identifyModelMigrationOpportunities(modelAnalysis, costSummary) {
        const opportunities = [];
        const rankings = modelAnalysis.rankings;

        // Find expensive models (premium category or high cost per million tokens)
        const expensiveModels = rankings.filter(m =>
            m.category === 'premium' || m.cost_per_million_tokens > 500
        );

        // Find cost-efficient alternatives
        const costEfficientModels = rankings.filter(m =>
            m.category === 'cost_efficient' && m.cost_per_million_tokens < 100
        );

        if (costEfficientModels.length === 0) {
            return opportunities;
        }

        const bestAlternative = costEfficientModels[0]; // Already sorted by efficiency

        for (const expensiveModel of expensiveModels) {
            // Calculate potential savings if we migrate a portion of requests
            // Assume we can migrate 30% of expensive model requests to cheaper alternative
            const migrationPercentage = 0.30;
            const migratableRequests = Math.floor(expensiveModel.request_count * migrationPercentage);

            if (migratableRequests === 0) {
                continue;
            }

            // Calculate cost of migratable requests with expensive model
            const expensiveCostPerRequest = expensiveModel.average_cost_per_request;
            const expensiveCostForMigratable = expensiveCostPerRequest * migratableRequests;

            // Calculate cost with cheaper alternative
            // Estimate based on average cost per request of alternative
            const alternativeCostPerRequest = bestAlternative.average_cost_per_request;
            const alternativeCostForMigratable = alternativeCostPerRequest * migratableRequests;

            const monthlySavings = (expensiveCostForMigratable - alternativeCostForMigratable);
            const days = costSummary.period.days || 30;
            const monthlySavingsScaled = (monthlySavings / days) * 30;

            // Only create opportunity if savings is significant (> $5/month)
            if (monthlySavingsScaled < 5) {
                continue;
            }

            opportunities.push({
                type: OPPORTUNITY_TYPES.MODEL_MIGRATION,
                title: `Migrate ${Math.round(migrationPercentage * 100)}% of ${expensiveModel.model} → ${bestAlternative.model}`,
                savings_monthly: monthlySavingsScaled,
                savings_yearly: monthlySavingsScaled * 12,
                difficulty: DIFFICULTY.MEDIUM,
                impact: monthlySavingsScaled > 30 ? IMPACT.HIGH : monthlySavingsScaled > 10 ? IMPACT.MEDIUM : IMPACT.LOW,
                action: `Use ${bestAlternative.model} for: ${bestAlternative.recommendation}`,
                reasoning: `${expensiveModel.model} costs $${expensiveModel.cost_per_million_tokens.toFixed(0)}/M tokens vs ${bestAlternative.model} at $${bestAlternative.cost_per_million_tokens.toFixed(0)}/M tokens`,
                migration_percentage: migrationPercentage,
                from_model: expensiveModel.model,
                to_model: bestAlternative.model,
                migratable_requests: migratableRequests
            });
        }

        return opportunities;
    }

    /**
     * Identifies error reduction opportunity
     * @param {UsageRecord[]} records - Array of usage records
     * @param {Object} costAnalysis - Cost analysis results
     * @returns {Object|null} Opportunity or null if error rate is acceptable
     */
    identifyErrorReductionOpportunity(records, costAnalysis) {
        const totalRequests = records.length;
        const erroredRequests = records.filter(r => r.isErrored()).length;
        const errorRate = (erroredRequests / totalRequests) * 100;

        // Only create opportunity if error rate > 3%
        if (errorRate <= 3) {
            return null;
        }

        const erroredCost = records
            .filter(r => r.isErrored())
            .reduce((sum, r) => sum + r.cost, 0);

        const days = costAnalysis.summary.period.days || 30;
        const monthlyErroredCost = (erroredCost / days) * 30;

        // Estimate potential savings: reduce error rate to 2%
        const targetErrorRate = 2;
        const currentErrorCost = monthlyErroredCost;
        const targetErrorCost = monthlyErroredCost * (targetErrorRate / errorRate);
        const potentialSavings = currentErrorCost - targetErrorCost;

        return {
            type: OPPORTUNITY_TYPES.ERROR_REDUCTION,
            title: `Reduce error rate from ${errorRate.toFixed(1)}% to ${targetErrorRate}%`,
            savings_monthly: Math.max(0, potentialSavings),
            savings_yearly: Math.max(0, potentialSavings * 12),
            difficulty: DIFFICULTY.MEDIUM,
            impact: errorRate > 10 ? IMPACT.MEDIUM : IMPACT.LOW,
            action: 'Review failed requests to identify patterns, break large prompts into smaller chunks',
            reasoning: `You're spending $${monthlyErroredCost.toFixed(2)}/month on errored requests (${errorRate.toFixed(1)}% error rate)`,
            current_error_rate: errorRate,
            target_error_rate: targetErrorRate,
            errored_requests: erroredRequests,
            total_requests: totalRequests
        };
    }

    /**
     * Identifies cache optimization opportunity
     * @param {Object} cacheAnalysis - Cache efficiency analysis results
     * @param {Object} costSummary - Cost summary
     * @returns {Object|null} Opportunity or null if cache rate is good
     */
    identifyCacheOptimizationOpportunity(cacheAnalysis, costSummary) {
        const cacheHitRate = cacheAnalysis.metrics.cache_hit_rate;

        // Only create opportunity if cache rate < 75%
        if (cacheHitRate >= 75) {
            return null;
        }

        const feedback = cacheAnalysis.feedback;

        // Use potential savings from feedback if available
        const potentialSavings = feedback.potential_savings
            ? feedback.potential_savings.monthly
            : 0;

        // If no potential savings calculated, estimate based on improvement
        let estimatedSavings = potentialSavings;
        if (estimatedSavings === 0) {
            const monthlyCost = costSummary.cost.total ? (costSummary.cost.total / (costSummary.period.days || 30)) * 30 : 0;
            const improvementPotential = 75 - cacheHitRate; // Target 75%
            estimatedSavings = monthlyCost * (improvementPotential / 100) * 0.5; // Conservative estimate
        }

        return {
            type: OPPORTUNITY_TYPES.CACHE_OPTIMIZATION,
            title: `Improve cache rate from ${cacheHitRate.toFixed(1)}% to 75%+`,
            savings_monthly: Math.max(0, estimatedSavings),
            savings_yearly: Math.max(0, estimatedSavings * 12),
            difficulty: DIFFICULTY.MEDIUM,
            impact: cacheHitRate < 60 ? IMPACT.MEDIUM : IMPACT.LOW,
            action: feedback.tips.join('; '),
            reasoning: `Your cache rate (${cacheHitRate.toFixed(1)}%) is below the recommended 75% threshold`,
            current_cache_rate: cacheHitRate,
            target_cache_rate: 75,
            tips: feedback.tips
        };
    }
}

export { SavingsOpportunitiesAnalyzer, OPPORTUNITY_TYPES, DIFFICULTY, IMPACT };


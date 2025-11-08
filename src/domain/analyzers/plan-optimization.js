/**
 * Plan optimization analysis for Cursor usage data
 * Pure JavaScript - no external dependencies
 */

import { PlanRecommendation } from '../entities/PlanRecommendation.js';

/**
 * Cursor plan tiers and limits
 */
const PLAN_TIERS = {
    FREE: {
        name: 'Free',
        monthlyCost: 0,
        fastRequestsLimit: 50,
        description: 'Free tier with limited requests'
    },
    PRO: {
        name: 'Pro',
        monthlyCost: 20,
        fastRequestsLimit: 500,
        description: 'Pro tier with 500 fast requests/month'
    },
    ULTRA: {
        name: 'Ultra',
        monthlyCost: 200,
        fastRequestsLimit: 10000, // Approximate, Ultra has much higher limits
        description: 'Ultra tier with ~10,000 fast requests/month'
    }
};

class PlanOptimizer {
    /**
     * Analyzes usage data and generates plan recommendations
     * @param {UsageRecord[]} records - Array of usage records
     * @param {Object} costSummary - Summary statistics from cost analysis
     * @returns {Object} Plan recommendation with current plan, recommended plan, savings, etc.
     */
    analyze(records, costSummary) {
        if (!records || records.length === 0) {
            throw new Error('Records array cannot be empty');
        }

        if (!costSummary || !costSummary.period || !costSummary.cost) {
            throw new Error('Cost summary is required');
        }

        // Calculate actual monthly cost
        const actualMonthlyCost = this.calculateMonthlyCost(costSummary);

        // Detect current plan
        const currentPlan = this.detectCurrentPlan(records, costSummary, actualMonthlyCost);

        // Analyze request volume
        const requestAnalysis = this.analyzeRequestVolume(records, costSummary);

        // Generate recommendation
        const recommendation = this.generateRecommendation(
            currentPlan,
            actualMonthlyCost,
            requestAnalysis,
            costSummary
        );

        return {
            current_plan: currentPlan,
            actual_monthly_cost: actualMonthlyCost,
            request_analysis: requestAnalysis,
            recommendation: recommendation.toObject() // Convert entity to plain object
        };
    }

    /**
     * Calculates actual monthly cost from usage data
     * @param {Object} costSummary - Summary statistics
     * @returns {number} Estimated monthly cost
     */
    calculateMonthlyCost(costSummary) {
        const days = costSummary.period.days || 1;
        const totalCost = costSummary.cost.total || 0;

        // Monthly cost = (total cost / days) * 30
        return (totalCost / days) * 30;
    }

    /**
     * Detects current plan type from usage patterns
     * @param {UsageRecord[]} records - Array of usage records
     * @param {Object} costSummary - Summary statistics
     * @param {number} monthlyCost - Calculated monthly cost
     * @returns {Object} Current plan information
     */
    detectCurrentPlan(records, costSummary, monthlyCost) {
        const totalRequests = records.length;
        const days = costSummary.period.days || 1;
        const monthlyRequests = (totalRequests / days) * 30;

        // Count included vs on-demand requests
        const includedRequests = records.filter(r => r.isIncluded()).length;
        const onDemandRequests = records.filter(r => r.isOnDemand()).length;
        const includedPercentage = (includedRequests / totalRequests) * 100;

        // Heuristic: If spending > $200/month, likely Ultra
        // If spending $15-200/month with mostly included requests, likely Pro
        // If spending < $15/month or very few requests, likely Free

        let planType;
        let confidence = 'low';

        if (monthlyCost > 220) {
            planType = PLAN_TIERS.ULTRA.name;
            confidence = 'high';
        } else if (monthlyCost > 15 && monthlyCost <= 220) {
            if (includedPercentage > 70 && monthlyRequests > 400) {
                planType = PLAN_TIERS.PRO.name;
                confidence = 'high';
            } else if (monthlyRequests > 1000) {
                planType = PLAN_TIERS.ULTRA.name;
                confidence = 'medium';
            } else {
                planType = PLAN_TIERS.PRO.name;
                confidence = 'medium';
            }
        } else {
            planType = PLAN_TIERS.FREE.name;
            confidence = monthlyCost < 5 ? 'high' : 'medium';
        }

        return {
            plan: planType,
            confidence: confidence,
            monthly_cost: monthlyCost,
            monthly_requests: monthlyRequests,
            included_requests_percentage: includedPercentage
        };
    }

    /**
     * Analyzes request volume and patterns
     * @param {UsageRecord[]} records - Array of usage records
     * @param {Object} costSummary - Summary statistics
     * @returns {Object} Request analysis
     */
    analyzeRequestVolume(records, costSummary) {
        const totalRequests = records.length;
        const days = costSummary.period.days || 1;
        const monthlyRequests = (totalRequests / days) * 30;

        const includedRequests = records.filter(r => r.isIncluded()).length;
        const onDemandRequests = records.filter(r => r.isOnDemand()).length;
        const erroredRequests = records.filter(r => r.isErrored()).length;

        // Determine if user is exceeding plan limits
        const exceedsProLimit = monthlyRequests > PLAN_TIERS.PRO.fastRequestsLimit;
        const exceedsUltraLimit = monthlyRequests > PLAN_TIERS.ULTRA.fastRequestsLimit;

        return {
            total_requests: totalRequests,
            monthly_requests: monthlyRequests,
            included_requests: includedRequests,
            on_demand_requests: onDemandRequests,
            errored_requests: erroredRequests,
            exceeds_pro_limit: exceedsProLimit,
            exceeds_ultra_limit: exceedsUltraLimit,
            requests_per_day: totalRequests / days
        };
    }

    /**
     * Generates plan recommendation based on usage patterns
     * @param {Object} currentPlan - Current plan information
     * @param {number} monthlyCost - Actual monthly cost
     * @param {Object} requestAnalysis - Request volume analysis
     * @param {Object} costSummary - Summary statistics
     * @returns {Object} Recommendation with plan, savings, confidence, reasoning, and actions
     */
    generateRecommendation(currentPlan, monthlyCost, requestAnalysis, costSummary) {
        const days = costSummary.period.days || 1;
        let recommendedPlan;
        let savings = 0;
        let confidence = currentPlan.confidence;
        const reasoning = [];
        const actions = [];

        // Decision tree based on spending
        if (monthlyCost > 220) {
            // Spending > $220/month → Recommend Ultra (saves money)
            recommendedPlan = PLAN_TIERS.ULTRA.name;
            savings = monthlyCost - PLAN_TIERS.ULTRA.monthlyCost;
            reasoning.push(`You're spending $${monthlyCost.toFixed(2)}/month, which exceeds Ultra's fixed cost of $${PLAN_TIERS.ULTRA.monthlyCost}/month`);
            reasoning.push(`Upgrading to Ultra would save $${savings.toFixed(2)}/month`);
            if (requestAnalysis.exceedsProLimit) {
                reasoning.push(`You consistently exceed Pro's ${PLAN_TIERS.PRO.fastRequestsLimit} request limit`);
            }
            actions.push('Visit cursor.sh/settings → Billing → Upgrade to Ultra');
            confidence = 'high';
        } else if (monthlyCost >= 180 && monthlyCost <= 220) {
            // Spending $180-220/month → Recommend Ultra (better experience)
            recommendedPlan = PLAN_TIERS.ULTRA.name;
            savings = monthlyCost - PLAN_TIERS.ULTRA.monthlyCost;
            reasoning.push(`You're spending $${monthlyCost.toFixed(2)}/month, close to Ultra's fixed cost`);
            reasoning.push(`Ultra provides unlimited requests and priority access for a predictable cost`);
            if (requestAnalysis.exceedsProLimit) {
                reasoning.push(`You're exceeding Pro's ${PLAN_TIERS.PRO.fastRequestsLimit} request limit`);
            }
            actions.push('Consider upgrading to Ultra for better experience and predictable costs');
            confidence = 'medium';
        } else if (monthlyCost >= 15 && monthlyCost < 180) {
            // Spending $15-180/month → Stay on Pro (optimal)
            recommendedPlan = PLAN_TIERS.PRO.name;
            savings = 0;
            reasoning.push(`You're spending $${monthlyCost.toFixed(2)}/month, which is optimal for Pro tier`);
            if (!requestAnalysis.exceedsProLimit) {
                reasoning.push(`Your usage (${requestAnalysis.monthly_requests.toFixed(0)} requests/month) fits within Pro's limits`);
            } else {
                reasoning.push(`You're exceeding Pro's ${PLAN_TIERS.PRO.fastRequestsLimit} request limit - consider Ultra if this continues`);
            }
            actions.push('Stay on Pro - your current usage is well-suited for this tier');
            confidence = 'high';
        } else {
            // Spending < $15/month → Consider downgrading or Free tier
            recommendedPlan = PLAN_TIERS.FREE.name;
            savings = monthlyCost; // Would save the entire monthly cost
            reasoning.push(`You're spending $${monthlyCost.toFixed(2)}/month, which is low`);
            reasoning.push(`Consider downgrading to Free tier if you can work within the ${PLAN_TIERS.FREE.fastRequestsLimit} request limit`);
            if (requestAnalysis.monthly_requests > PLAN_TIERS.FREE.fastRequestsLimit) {
                reasoning.push(`However, your usage (${requestAnalysis.monthly_requests.toFixed(0)} requests/month) exceeds Free tier limits`);
                recommendedPlan = PLAN_TIERS.PRO.name;
                savings = 0;
                reasoning.push('Pro tier is recommended to avoid request limits');
            }
            actions.push('Evaluate if Free tier meets your needs, or stay on Pro for flexibility');
            confidence = monthlyCost < 5 ? 'high' : 'medium';
        }

        // Calculate conservative savings (under-promise)
        const conservativeSavings = savings > 0 ? savings * 0.9 : 0; // 10% buffer

        return new PlanRecommendation({
            current_plan: currentPlan.plan,
            recommended_plan: recommendedPlan,
            recommended_cost: PLAN_TIERS[recommendedPlan.toUpperCase()].monthlyCost,
            actual_monthly_cost: monthlyCost,
            savings_monthly: Math.max(0, conservativeSavings),
            savings_yearly: Math.max(0, conservativeSavings * 12),
            confidence: confidence,
            reasoning: reasoning,
            actions: actions,
            monthly_requests: requestAnalysis.monthly_requests,
            exceeds_pro_limit: requestAnalysis.exceeds_pro_limit
        });
    }
}

export { PlanOptimizer, PLAN_TIERS };


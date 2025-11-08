/**
 * Domain type definitions for Cursor Cost Explorer
 * Pure JavaScript - no type system overhead
 */

/**
 * Validates a usage record object structure
 */
export function isValidUsageRecord(record) {
    return (
        record &&
        typeof record.date === 'string' &&
        typeof record.kind === 'string' &&
        typeof record.model === 'string' &&
        typeof record.cost === 'number' &&
        typeof record.totalTokens === 'number' &&
        typeof record.cacheRead === 'number' &&
        typeof record.input === 'number' &&
        typeof record.output === 'number'
    );
}

/**
 * Creates an empty analysis result structure
 */
export function createEmptyAnalysisResult() {
    return {
        summary: {
            period: {
                start: '',
                end: '',
                days: 0
            },
            cost: {
                total: 0,
                daily_average: 0,
                by_type: {
                    included: 0,
                    on_demand: 0,
                    errored: 0
                }
            },
            usage: {
                total_requests: 0,
                requests_per_day: 0,
                total_tokens: 0,
                cache_efficiency: 0
            }
        },
        model_efficiency: [],
        plan_recommendation: {
            current_plan: 'Free',
            current_monthly_cost: 0,
            recommended_plan: 'Free',
            recommended_cost: 0,
            savings: 0,
            confidence: 'low',
            reasoning: ''
        },
        opportunities: [],
        patterns: {
            peak_hours: [],
            work_style: 'steady_user',
            usage_consistency: 'steady',
            weekend_ratio: 0
        }
    };
}

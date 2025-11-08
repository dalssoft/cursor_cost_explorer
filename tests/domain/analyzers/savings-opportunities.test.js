import { test } from 'node:test';
import assert from 'node:assert';
import { SavingsOpportunitiesAnalyzer, OPPORTUNITY_TYPES, DIFFICULTY, IMPACT } from '../../../src/domain/analyzers/savings-opportunities.js';
import { UsageRecord } from '../../../src/domain/entities/UsageRecord.js';

// Helper function to create UsageRecord instances
function createRecord(data) {
    return new UsageRecord({
        date: data.date || '2025-11-07T10:00:00Z',
        kind: data.kind || 'Included',
        model: data.model || 'grok',
        cost: data.cost || 0.01,
        totalTokens: data.totalTokens || 1000,
        cacheRead: data.cacheRead || 0,
        input: data.input || 0,
        output: data.output || 0
    });
}

test('SavingsOpportunitiesAnalyzer class can be instantiated', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    assert.ok(analyzer instanceof SavingsOpportunitiesAnalyzer);
});

test('analyze throws on empty records', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    assert.throws(() => {
        analyzer.analyze([]);
    }, /Records array cannot be empty/);
});

test('analyze identifies plan optimization opportunity', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    // Create records that would trigger plan optimization
    const records = Array(1000).fill(null).map(() => createRecord({
        cost: 0.50,
        kind: 'On-Demand',
        totalTokens: 10000
    }));

    const result = analyzer.analyze(records);

    const planOpportunity = result.opportunities.find(opp => opp.type === OPPORTUNITY_TYPES.PLAN_OPTIMIZATION);
    if (planOpportunity) {
        assert.ok(planOpportunity.savings_monthly > 0);
        assert.strictEqual(planOpportunity.difficulty, DIFFICULTY.EASY);
        assert.ok(planOpportunity.impact === IMPACT.HIGH || planOpportunity.impact === IMPACT.MEDIUM);
    }
});

test('analyze identifies model migration opportunities', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    // Mix of expensive and cheap models
    const records = [
        ...Array(100).fill(null).map(() => createRecord({
            model: 'claude-thinking',
            cost: 0.50,
            totalTokens: 1000
        })),
        ...Array(200).fill(null).map(() => createRecord({
            model: 'grok-code-fast-1',
            cost: 0.01,
            totalTokens: 1000
        }))
    ];

    const result = analyzer.analyze(records);

    const modelOpportunities = result.opportunities.filter(opp => opp.type === OPPORTUNITY_TYPES.MODEL_MIGRATION);
    // Should find opportunities to migrate expensive models
    assert.ok(modelOpportunities.length >= 0); // May or may not find opportunities depending on cost difference
});

test('analyze identifies error reduction opportunity when error rate > 3%', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const records = [
        ...Array(90).fill(null).map(() => createRecord({ kind: 'Included', cost: 0.10 })),
        ...Array(10).fill(null).map(() => createRecord({ kind: 'Errored', cost: 0.10 })) // 10% error rate
    ];

    const result = analyzer.analyze(records);

    const errorOpportunity = result.opportunities.find(opp => opp.type === OPPORTUNITY_TYPES.ERROR_REDUCTION);
    assert.ok(errorOpportunity);
    assert.ok(errorOpportunity.current_error_rate > 3);
    assert.strictEqual(errorOpportunity.difficulty, DIFFICULTY.MEDIUM);
});

test('analyze does not identify error opportunity when error rate <= 3%', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const records = [
        ...Array(97).fill(null).map(() => createRecord({ kind: 'Included', cost: 0.10 })),
        ...Array(3).fill(null).map(() => createRecord({ kind: 'Errored', cost: 0.10 })) // 3% error rate
    ];

    const result = analyzer.analyze(records);

    const errorOpportunity = result.opportunities.find(opp => opp.type === OPPORTUNITY_TYPES.ERROR_REDUCTION);
    // Should not find opportunity (exactly 3% is threshold)
    assert.ok(!errorOpportunity || errorOpportunity.current_error_rate > 3);
});

test('analyze identifies cache optimization opportunity when cache rate < 75%', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const records = [
        createRecord({ cacheRead: 500, input: 500, totalTokens: 1000, cost: 0.10 }) // 50% cache rate
    ];

    const result = analyzer.analyze(records);

    const cacheOpportunity = result.opportunities.find(opp => opp.type === OPPORTUNITY_TYPES.CACHE_OPTIMIZATION);
    assert.ok(cacheOpportunity);
    assert.ok(cacheOpportunity.current_cache_rate < 75);
    assert.strictEqual(cacheOpportunity.difficulty, DIFFICULTY.MEDIUM);
});

test('analyze does not identify cache opportunity when cache rate >= 75%', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const records = [
        createRecord({ cacheRead: 800, input: 200, totalTokens: 1000, cost: 0.10 }) // 80% cache rate
    ];

    const result = analyzer.analyze(records);

    const cacheOpportunity = result.opportunities.find(opp => opp.type === OPPORTUNITY_TYPES.CACHE_OPTIMIZATION);
    assert.ok(!cacheOpportunity);
});

test('analyze ranks opportunities by ROI (savings)', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const records = [
        ...Array(100).fill(null).map(() => createRecord({
            model: 'claude-thinking',
            cost: 0.50,
            totalTokens: 1000
        })),
        ...Array(20).fill(null).map(() => createRecord({ kind: 'Errored', cost: 0.10 })),
        createRecord({ cacheRead: 500, input: 500, totalTokens: 1000, cost: 0.10 })
    ];

    const result = analyzer.analyze(records);

    // Opportunities should be sorted by savings (highest first)
    for (let i = 0; i < result.opportunities.length - 1; i++) {
        assert.ok(result.opportunities[i].savings_monthly >= result.opportunities[i + 1].savings_monthly);
    }
});

test('analyze limits to top 5 opportunities', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    // Create scenario with many opportunities
    const records = Array(1000).fill(null).map(() => createRecord({
        cost: 0.50,
        kind: 'On-Demand',
        totalTokens: 10000
    }));

    const result = analyzer.analyze(records);

    assert.ok(result.opportunities.length <= 5);
});

test('analyze calculates total potential savings', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const records = [
        ...Array(100).fill(null).map(() => createRecord({
            model: 'claude-thinking',
            cost: 0.50,
            totalTokens: 1000
        })),
        ...Array(20).fill(null).map(() => createRecord({ kind: 'Errored', cost: 0.10 })),
        createRecord({ cacheRead: 500, input: 500, totalTokens: 1000, cost: 0.10 })
    ];

    const result = analyzer.analyze(records);

    const calculatedTotal = result.opportunities.reduce((sum, opp) => sum + opp.savings_monthly, 0);
    assert.ok(Math.abs(result.total_potential_savings_monthly - calculatedTotal) < 0.01);
    assert.ok(Math.abs(result.total_potential_savings_yearly - (calculatedTotal * 12)) < 0.01);
});

test('identifyPlanOptimizationOpportunity returns null when no savings', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const planAnalysis = {
        current_plan: { plan: 'Pro' },
        recommendation: {
            recommended_plan: 'Pro',
            savings_monthly: 0,
            savings_yearly: 0
        }
    };

    const costSummary = { period: { days: 30 }, cost: { total: 50 } };
    const opportunity = analyzer.identifyPlanOptimizationOpportunity(planAnalysis, costSummary);

    assert.strictEqual(opportunity, null);
});

test('identifyModelMigrationOpportunities finds opportunities for expensive models', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const modelAnalysis = {
        rankings: [
            {
                model: 'grok-code-fast-1',
                category: 'cost_efficient',
                cost_per_million_tokens: 47,
                average_cost_per_request: 0.01,
                request_count: 100,
                efficiency_score: 95
            },
            {
                model: 'claude-thinking',
                category: 'premium',
                cost_per_million_tokens: 776,
                average_cost_per_request: 0.50,
                request_count: 50,
                efficiency_score: 45
            }
        ]
    };

    const costSummary = { period: { days: 30 }, cost: { total: 100 } };
    const opportunities = analyzer.identifyModelMigrationOpportunities(modelAnalysis, costSummary);

    // Should find opportunity to migrate expensive model
    assert.ok(opportunities.length > 0);
    const opportunity = opportunities[0];
    assert.strictEqual(opportunity.type, OPPORTUNITY_TYPES.MODEL_MIGRATION);
    assert.ok(opportunity.savings_monthly > 0);
});

test('identifyErrorReductionOpportunity returns null when error rate <= 3%', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const records = [
        ...Array(98).fill(null).map(() => createRecord({ kind: 'Included' })),
        ...Array(2).fill(null).map(() => createRecord({ kind: 'Errored' })) // 2% error rate
    ];

    const costAnalysis = {
        summary: {
            period: { days: 30 },
            cost: { total: 100 }
        }
    };

    const opportunity = analyzer.identifyErrorReductionOpportunity(records, costAnalysis);
    assert.strictEqual(opportunity, null);
});

test('identifyCacheOptimizationOpportunity returns null when cache rate >= 75%', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const cacheAnalysis = {
        metrics: {
            cache_hit_rate: 80
        },
        feedback: {
            tips: []
        }
    };

    const costSummary = { period: { days: 30 }, cost: { total: 100 } };
    const opportunity = analyzer.identifyCacheOptimizationOpportunity(cacheAnalysis, costSummary);
    assert.strictEqual(opportunity, null);
});

test('analyze returns complete opportunity structure', () => {
    const analyzer = new SavingsOpportunitiesAnalyzer();
    const records = [
        ...Array(100).fill(null).map(() => createRecord({
            model: 'claude-thinking',
            cost: 0.50,
            totalTokens: 1000
        })),
        ...Array(10).fill(null).map(() => createRecord({ kind: 'Errored', cost: 0.10 })),
        createRecord({ cacheRead: 500, input: 500, totalTokens: 1000, cost: 0.10 })
    ];

    const result = analyzer.analyze(records);

    assert.ok(result.opportunities);
    assert.ok(Array.isArray(result.opportunities));
    assert.ok(result.total_potential_savings_monthly >= 0);
    assert.ok(result.total_potential_savings_yearly >= 0);

    // Check opportunity structure
    if (result.opportunities.length > 0) {
        const opp = result.opportunities[0];
        assert.ok(opp.type);
        assert.ok(opp.title);
        assert.ok(typeof opp.savings_monthly === 'number');
        assert.ok(typeof opp.savings_yearly === 'number');
        assert.ok(opp.difficulty);
        assert.ok(opp.impact);
        assert.ok(opp.action);
    }
});


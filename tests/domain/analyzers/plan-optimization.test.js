import { test } from 'node:test';
import assert from 'node:assert';
import { PlanOptimizer, PLAN_TIERS } from '../../../src/domain/analyzers/plan-optimization.js';
import { UsageRecord } from '../../../src/domain/entities/UsageRecord.js';

// Helper function to create UsageRecord instances
function createRecord(data) {
    return new UsageRecord({
        date: data.date || '2025-11-07T10:00:00Z',
        kind: data.kind || 'Included',
        model: data.model || 'grok',
        cost: data.cost,
        totalTokens: data.totalTokens || 1000,
        cacheRead: data.cacheRead || 0,
        input: data.input || 0,
        output: data.output || 0
    });
}

test('PlanOptimizer class can be instantiated', () => {
    const optimizer = new PlanOptimizer();
    assert.ok(optimizer instanceof PlanOptimizer);
});

test('analyze throws on empty records', () => {
    const optimizer = new PlanOptimizer();
    const costSummary = {
        period: { days: 30 },
        cost: { total: 100 }
    };

    assert.throws(() => {
        optimizer.analyze([], costSummary);
    }, /Records array cannot be empty/);
});

test('analyze throws on missing cost summary', () => {
    const optimizer = new PlanOptimizer();
    const records = [createRecord({ cost: 10, totalTokens: 1000 })];

    assert.throws(() => {
        optimizer.analyze(records, null);
    }, /Cost summary is required/);
});

test('calculateMonthlyCost calculates correctly', () => {
    const optimizer = new PlanOptimizer();
    const costSummary = {
        period: { days: 30 },
        cost: { total: 100 }
    };

    const monthlyCost = optimizer.calculateMonthlyCost(costSummary);
    assert.strictEqual(monthlyCost, 100); // 100 / 30 * 30 = 100
});

test('calculateMonthlyCost handles partial month', () => {
    const optimizer = new PlanOptimizer();
    const costSummary = {
        period: { days: 15 },
        cost: { total: 50 }
    };

    const monthlyCost = optimizer.calculateMonthlyCost(costSummary);
    assert.strictEqual(monthlyCost, 100); // 50 / 15 * 30 = 100
});

test('detectCurrentPlan detects Ultra for high spending', () => {
    const optimizer = new PlanOptimizer();
    const records = Array(1000).fill(null).map(() => createRecord({
        cost: 0.50,
        kind: 'On-Demand',
        totalTokens: 10000
    }));

    const costSummary = {
        period: { days: 30 },
        cost: { total: 500 }
    };

    const monthlyCost = optimizer.calculateMonthlyCost(costSummary);
    const currentPlan = optimizer.detectCurrentPlan(records, costSummary, monthlyCost);

    assert.strictEqual(currentPlan.plan, PLAN_TIERS.ULTRA.name);
    assert.strictEqual(currentPlan.confidence, 'high');
});

test('detectCurrentPlan detects Pro for moderate spending', () => {
    const optimizer = new PlanOptimizer();
    const records = Array(500).fill(null).map(() => createRecord({
        cost: 0.04,
        kind: 'Included',
        totalTokens: 1000
    }));

    const costSummary = {
        period: { days: 30 },
        cost: { total: 20 }
    };

    const monthlyCost = optimizer.calculateMonthlyCost(costSummary);
    const currentPlan = optimizer.detectCurrentPlan(records, costSummary, monthlyCost);

    assert.strictEqual(currentPlan.plan, PLAN_TIERS.PRO.name);
});

test('detectCurrentPlan detects Free for low spending', () => {
    const optimizer = new PlanOptimizer();
    const records = Array(10).fill(null).map(() => createRecord({
        cost: 0.01,
        kind: 'Included',
        totalTokens: 100
    }));

    const costSummary = {
        period: { days: 30 },
        cost: { total: 0.10 }
    };

    const monthlyCost = optimizer.calculateMonthlyCost(costSummary);
    const currentPlan = optimizer.detectCurrentPlan(records, costSummary, monthlyCost);

    assert.strictEqual(currentPlan.plan, PLAN_TIERS.FREE.name);
});

test('analyzeRequestVolume calculates request metrics', () => {
    const optimizer = new PlanOptimizer();
    const records = [
        ...Array(400).fill(null).map(() => createRecord({ kind: 'Included', cost: 0.01 })),
        ...Array(100).fill(null).map(() => createRecord({ kind: 'On-Demand', cost: 0.10 })),
        ...Array(10).fill(null).map(() => createRecord({ kind: 'Errored', cost: 0.01 }))
    ];

    const costSummary = {
        period: { days: 30 },
        cost: { total: 20 }
    };

    const analysis = optimizer.analyzeRequestVolume(records, costSummary);

    assert.strictEqual(analysis.total_requests, 510);
    assert.strictEqual(analysis.included_requests, 400);
    assert.strictEqual(analysis.on_demand_requests, 100);
    assert.strictEqual(analysis.errored_requests, 10);
    assert.strictEqual(analysis.monthly_requests, 510); // 510 / 30 * 30
    assert.strictEqual(analysis.exceeds_pro_limit, true); // 510 > 500
});

test('generateRecommendation recommends Ultra for high spending', () => {
    const optimizer = new PlanOptimizer();
    const currentPlan = {
        plan: PLAN_TIERS.PRO.name,
        confidence: 'high',
        monthly_cost: 250,
        monthly_requests: 1000,
        included_requests_percentage: 50
    };

    const monthlyCost = 250;
    const requestAnalysis = {
        monthly_requests: 1000,
        exceeds_pro_limit: true,
        exceeds_ultra_limit: false
    };

    const costSummary = {
        period: { days: 30 },
        cost: { total: 250 }
    };

    const recommendation = optimizer.generateRecommendation(
        currentPlan,
        monthlyCost,
        requestAnalysis,
        costSummary
    );

    assert.strictEqual(recommendation.recommended_plan, PLAN_TIERS.ULTRA.name);
    assert.strictEqual(recommendation.recommended_cost, PLAN_TIERS.ULTRA.monthlyCost);
    assert.ok(recommendation.savings_monthly > 0);
    assert.ok(recommendation.savings_yearly > 0);
    assert.ok(recommendation.reasoning.length > 0);
    assert.ok(recommendation.actions.length > 0);
    assert.strictEqual(recommendation.confidence, 'high');
});

test('generateRecommendation recommends Pro for moderate spending', () => {
    const optimizer = new PlanOptimizer();
    const currentPlan = {
        plan: PLAN_TIERS.PRO.name,
        confidence: 'high',
        monthly_cost: 50,
        monthly_requests: 400,
        included_requests_percentage: 80
    };

    const monthlyCost = 50;
    const requestAnalysis = {
        monthly_requests: 400,
        exceeds_pro_limit: false,
        exceeds_ultra_limit: false
    };

    const costSummary = {
        period: { days: 30 },
        cost: { total: 50 }
    };

    const recommendation = optimizer.generateRecommendation(
        currentPlan,
        monthlyCost,
        requestAnalysis,
        costSummary
    );

    assert.strictEqual(recommendation.recommended_plan, PLAN_TIERS.PRO.name);
    assert.strictEqual(recommendation.recommended_cost, PLAN_TIERS.PRO.monthlyCost);
    assert.strictEqual(recommendation.savings_monthly, 0);
    assert.ok(recommendation.reasoning.length > 0);
});

test('generateRecommendation recommends Free for very low spending', () => {
    const optimizer = new PlanOptimizer();
    const currentPlan = {
        plan: PLAN_TIERS.FREE.name,
        confidence: 'high',
        monthly_cost: 5,
        monthly_requests: 30,
        included_requests_percentage: 100
    };

    const monthlyCost = 5;
    const requestAnalysis = {
        monthly_requests: 30,
        exceeds_pro_limit: false,
        exceeds_ultra_limit: false
    };

    const costSummary = {
        period: { days: 30 },
        cost: { total: 5 }
    };

    const recommendation = optimizer.generateRecommendation(
        currentPlan,
        monthlyCost,
        requestAnalysis,
        costSummary
    );

    assert.strictEqual(recommendation.recommended_plan, PLAN_TIERS.FREE.name);
    assert.ok(recommendation.savings_monthly >= 0);
});

test('generateRecommendation calculates conservative savings', () => {
    const optimizer = new PlanOptimizer();
    const currentPlan = {
        plan: PLAN_TIERS.PRO.name,
        confidence: 'high',
        monthly_cost: 250,
        monthly_requests: 1000,
        included_requests_percentage: 50
    };

    const monthlyCost = 250;
    const requestAnalysis = {
        monthly_requests: 1000,
        exceeds_pro_limit: true,
        exceeds_ultra_limit: false
    };

    const costSummary = {
        period: { days: 30 },
        cost: { total: 250 }
    };

    const recommendation = optimizer.generateRecommendation(
        currentPlan,
        monthlyCost,
        requestAnalysis,
        costSummary
    );

    // Savings should be conservative (10% buffer)
    const expectedSavings = (250 - 200) * 0.9; // 45
    assert.ok(Math.abs(recommendation.savings_monthly - expectedSavings) < 0.01);
    assert.ok(Math.abs(recommendation.savings_yearly - (expectedSavings * 12)) < 0.01);
});

test('analyze returns complete plan analysis', () => {
    const optimizer = new PlanOptimizer();
    const records = Array(600).fill(null).map(() => createRecord({
        cost: 0.05,
        kind: 'Included',
        totalTokens: 1000
    }));

    const costSummary = {
        period: { days: 30 },
        cost: { total: 30 }
    };

    const analysis = optimizer.analyze(records, costSummary);

    assert.ok(analysis.current_plan);
    assert.ok(analysis.actual_monthly_cost >= 0);
    assert.ok(analysis.request_analysis);
    assert.ok(analysis.recommendation);
    assert.ok(analysis.current_plan.plan);
    assert.ok(analysis.current_plan.confidence);
    assert.ok(analysis.recommendation.recommended_plan);
    assert.ok(analysis.recommendation.reasoning.length > 0);
    assert.ok(analysis.recommendation.actions.length > 0);
});

test('analyze handles edge case: single day of data', () => {
    const optimizer = new PlanOptimizer();
    const records = Array(20).fill(null).map(() => createRecord({
        cost: 0.10,
        kind: 'Included',
        totalTokens: 1000
    }));

    const costSummary = {
        period: { days: 1 },
        cost: { total: 2 }
    };

    const analysis = optimizer.analyze(records, costSummary);

    assert.ok(analysis.actual_monthly_cost > 0);
    assert.ok(analysis.current_plan);
    assert.ok(analysis.recommendation);
});

test('generateRecommendation handles $180-220/month range', () => {
    const optimizer = new PlanOptimizer();
    const currentPlan = {
        plan: PLAN_TIERS.PRO.name,
        confidence: 'medium',
        monthly_cost: 200,
        monthly_requests: 800,
        included_requests_percentage: 60
    };

    const monthlyCost = 200;
    const requestAnalysis = {
        monthly_requests: 800,
        exceeds_pro_limit: true,
        exceeds_ultra_limit: false
    };

    const costSummary = {
        period: { days: 30 },
        cost: { total: 200 }
    };

    const recommendation = optimizer.generateRecommendation(
        currentPlan,
        monthlyCost,
        requestAnalysis,
        costSummary
    );

    // Should recommend Ultra for better experience
    assert.strictEqual(recommendation.recommended_plan, PLAN_TIERS.ULTRA.name);
    assert.strictEqual(recommendation.confidence, 'medium');
});

test('generateRecommendation handles low spending with high request volume', () => {
    const optimizer = new PlanOptimizer();
    const currentPlan = {
        plan: PLAN_TIERS.FREE.name,
        confidence: 'medium',
        monthly_cost: 10,
        monthly_requests: 100,
        included_requests_percentage: 100
    };

    const monthlyCost = 10;
    const requestAnalysis = {
        monthly_requests: 100, // Exceeds Free limit (50)
        exceeds_pro_limit: false,
        exceeds_ultra_limit: false
    };

    const costSummary = {
        period: { days: 30 },
        cost: { total: 10 }
    };

    const recommendation = optimizer.generateRecommendation(
        currentPlan,
        monthlyCost,
        requestAnalysis,
        costSummary
    );

    // Should recommend Pro because request volume exceeds Free limit
    assert.strictEqual(recommendation.recommended_plan, PLAN_TIERS.PRO.name);
});


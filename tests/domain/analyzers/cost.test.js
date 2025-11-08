import { test } from 'node:test';
import assert from 'node:assert';
import { CostAnalyzer } from '../../../src/domain/analyzers/cost.js';
import { parseCSV } from '../../../src/domain/parsers/cursor-csv.js';
import { UsageRecord } from '../../../src/domain/entities/UsageRecord.js';

// Helper function to create UsageRecord instances from plain objects
function createRecord(data) {
    return new UsageRecord({
        date: data.date,
        kind: data.kind,
        model: data.model,
        cost: data.cost,
        totalTokens: data.totalTokens,
        cacheRead: data.cacheRead || 0,
        input: data.input || 0,
        output: data.output || 0
    });
}

test('CostAnalyzer class can be instantiated', () => {
    const analyzer = new CostAnalyzer();
    assert.ok(analyzer instanceof CostAnalyzer);
});

test('analyze throws on empty records', () => {
    const analyzer = new CostAnalyzer();
    assert.throws(() => {
        analyzer.analyze([]);
    }, /Records array cannot be empty/);

    assert.throws(() => {
        analyzer.analyze(null);
    }, /Records array cannot be empty/);
});

test('calculateSummary computes correct statistics', () => {
    const analyzer = new CostAnalyzer();
    const records = [
        createRecord({ date: '2025-10-10T10:00:00Z', cost: 10, totalTokens: 1000, kind: 'Included', model: 'grok' }),
        createRecord({ date: '2025-10-10T11:00:00Z', cost: 20, totalTokens: 2000, kind: 'On-Demand', model: 'claude' }),
        createRecord({ date: '2025-10-11T10:00:00Z', cost: 15, totalTokens: 1500, kind: 'Included', model: 'grok' })
    ];

    const summary = analyzer.calculateSummary(records);

    assert.strictEqual(summary.cost.total, 45);
    assert.strictEqual(summary.cost.daily_average, 22.5); // 45 / 2 days
    assert.strictEqual(summary.usage.total_requests, 3);
    assert.strictEqual(summary.period.days, 2);
    assert.strictEqual(summary.period.start, '2025-10-10');
    assert.strictEqual(summary.period.end, '2025-10-11');
    assert.strictEqual(summary.usage.total_tokens, 4500);
    assert.strictEqual(summary.usage.requests_per_day, 1.5);
});

test('calculateBreakdownByModel computes costs and percentages', () => {
    const analyzer = new CostAnalyzer();
    const records = [
        createRecord({ date: '2025-10-10T10:00:00Z', cost: 10, totalTokens: 1000, kind: 'Included', model: 'grok' }),
        createRecord({ date: '2025-10-10T11:00:00Z', cost: 20, totalTokens: 2000, kind: 'On-Demand', model: 'claude' }),
        createRecord({ date: '2025-10-11T10:00:00Z', cost: 20, totalTokens: 1500, kind: 'Included', model: 'claude' })
    ];

    const breakdown = analyzer.calculateBreakdownByModel(records);

    assert.strictEqual(breakdown.length, 2);
    assert.strictEqual(breakdown[0].model, 'claude'); // Higher cost, sorted first
    assert.strictEqual(breakdown[0].total_cost, 40);
    assert.strictEqual(breakdown[0].percentage, 80); // 40/50 * 100
    assert.strictEqual(breakdown[1].model, 'grok');
    assert.strictEqual(breakdown[1].total_cost, 10);
    assert.strictEqual(breakdown[1].percentage, 20); // 10/50 * 100
});

test('calculateBreakdownByType computes costs and percentages', () => {
    const analyzer = new CostAnalyzer();
    const records = [
        createRecord({ date: '2025-10-10T10:00:00Z', cost: 10, totalTokens: 1000, kind: 'Included', model: 'grok' }),
        createRecord({ date: '2025-10-10T11:00:00Z', cost: 20, totalTokens: 2000, kind: 'On-Demand', model: 'claude' }),
        createRecord({ date: '2025-10-11T10:00:00Z', cost: 15, totalTokens: 1500, kind: 'Errored, Not Charged', model: 'grok' }),
        createRecord({ date: '2025-10-11T11:00:00Z', cost: 5, totalTokens: 500, kind: 'Aborted, Not Charged', model: 'grok' })
    ];

    const breakdown = analyzer.calculateBreakdownByType(records);

    assert.strictEqual(breakdown.included.cost, 10);
    assert.strictEqual(breakdown.included.percentage, 20); // 10/50 * 100
    assert.strictEqual(breakdown.on_demand.cost, 20);
    assert.strictEqual(breakdown.on_demand.percentage, 40); // 20/50 * 100
    assert.strictEqual(breakdown.errored.cost, 20); // 15 + 5
    assert.strictEqual(breakdown.errored.percentage, 40); // 20/50 * 100

    // Percentages should sum to 100%
    const totalPercentage = breakdown.included.percentage +
        breakdown.on_demand.percentage +
        breakdown.errored.percentage;
    assert.strictEqual(Math.round(totalPercentage), 100);
});

test('calculateDailyCosts aggregates costs by day', () => {
    const analyzer = new CostAnalyzer();
    const records = [
        createRecord({ date: '2025-10-10T10:00:00Z', cost: 10, totalTokens: 1000, kind: 'Included', model: 'grok' }),
        createRecord({ date: '2025-10-10T11:00:00Z', cost: 20, totalTokens: 2000, kind: 'On-Demand', model: 'claude' }),
        createRecord({ date: '2025-10-11T10:00:00Z', cost: 15, totalTokens: 1500, kind: 'Included', model: 'grok' })
    ];

    const dailyCosts = analyzer.calculateDailyCosts(records);

    assert.strictEqual(dailyCosts.length, 2);
    assert.strictEqual(dailyCosts[0].date, '2025-10-10');
    assert.strictEqual(dailyCosts[0].cost, 30); // 10 + 20
    assert.strictEqual(dailyCosts[0].request_count, 2);
    assert.strictEqual(dailyCosts[1].date, '2025-10-11');
    assert.strictEqual(dailyCosts[1].cost, 15);
    assert.strictEqual(dailyCosts[1].request_count, 1);
});

test('findTopExpensiveRequests returns top N requests', () => {
    const analyzer = new CostAnalyzer();
    const records = [
        createRecord({ date: '2025-10-10T10:00:00Z', cost: 5, totalTokens: 1000, kind: 'Included', model: 'grok' }),
        createRecord({ date: '2025-10-10T11:00:00Z', cost: 50, totalTokens: 2000, kind: 'On-Demand', model: 'claude' }),
        createRecord({ date: '2025-10-11T10:00:00Z', cost: 30, totalTokens: 1500, kind: 'Included', model: 'grok' }),
        createRecord({ date: '2025-10-11T11:00:00Z', cost: 10, totalTokens: 500, kind: 'Included', model: 'grok' }),
        createRecord({ date: '2025-10-11T12:00:00Z', cost: 20, totalTokens: 800, kind: 'On-Demand', model: 'claude' })
    ];

    const topRequests = analyzer.findTopExpensiveRequests(records, 3);

    assert.strictEqual(topRequests.length, 3);
    assert.strictEqual(topRequests[0].cost, 50);
    assert.strictEqual(topRequests[1].cost, 30);
    assert.strictEqual(topRequests[2].cost, 20);
    assert.ok(topRequests[0].date);
    assert.ok(topRequests[0].model);
    assert.ok(topRequests[0].kind);
});

test('findTopExpensiveDays returns top N days', () => {
    const analyzer = new CostAnalyzer();
    const dailyCosts = [
        { date: '2025-10-10', cost: 10, request_count: 2 },
        { date: '2025-10-11', cost: 50, request_count: 5 },
        { date: '2025-10-12', cost: 30, request_count: 3 },
        { date: '2025-10-13', cost: 5, request_count: 1 }
    ];

    const topDays = analyzer.findTopExpensiveDays(dailyCosts, 3);

    assert.strictEqual(topDays.length, 3);
    assert.strictEqual(topDays[0].cost, 50);
    assert.strictEqual(topDays[0].date, '2025-10-11');
    assert.strictEqual(topDays[1].cost, 30);
    assert.strictEqual(topDays[2].cost, 10);
});

test('findMostExpensiveModel returns model with highest cost', () => {
    const analyzer = new CostAnalyzer();
    const breakdown = [
        { model: 'claude', total_cost: 40, percentage: 80, request_count: 2 },
        { model: 'grok', total_cost: 10, percentage: 20, request_count: 5 }
    ];

    const mostExpensive = analyzer.findMostExpensiveModel(breakdown);

    assert.strictEqual(mostExpensive.model, 'claude');
    assert.strictEqual(mostExpensive.total_cost, 40);
    assert.strictEqual(mostExpensive.percentage, 80);
});

test('findMostExpensiveModel returns null for empty breakdown', () => {
    const analyzer = new CostAnalyzer();
    const mostExpensive = analyzer.findMostExpensiveModel([]);
    assert.strictEqual(mostExpensive, null);
});

test('analyze returns complete cost analysis', () => {
    const analyzer = new CostAnalyzer();
    const records = [
        createRecord({ date: '2025-10-10T10:00:00Z', cost: 10, totalTokens: 1000, kind: 'Included', model: 'grok' }),
        createRecord({ date: '2025-10-10T11:00:00Z', cost: 20, totalTokens: 2000, kind: 'On-Demand', model: 'claude' }),
        createRecord({ date: '2025-10-11T10:00:00Z', cost: 15, totalTokens: 1500, kind: 'Included', model: 'grok' })
    ];

    const analysis = analyzer.analyze(records);

    assert.ok(analysis.summary);
    assert.ok(analysis.breakdown_by_model);
    assert.ok(analysis.breakdown_by_type);
    assert.ok(analysis.daily_costs);
    assert.ok(analysis.top_expensive_requests);
    assert.ok(analysis.top_expensive_days);
    assert.ok(analysis.most_expensive_model);
});

test('analyze with real CSV data', async () => {
    const result = parseCSV('data/usage-events-2025-11-07.csv');
    const analyzer = new CostAnalyzer();
    const analysis = analyzer.analyze(result.records);

    assert.ok(analysis.summary.cost.total > 0);
    assert.ok(analysis.summary.usage.total_requests > 0);
    assert.ok(analysis.summary.period.days > 0);
    assert.ok(analysis.breakdown_by_model.length > 0);
    assert.ok(analysis.most_expensive_model);

    // Verify percentages sum to 100%
    const typeTotal = analysis.breakdown_by_type.included.percentage +
        analysis.breakdown_by_type.on_demand.percentage +
        analysis.breakdown_by_type.errored.percentage;
    assert.ok(Math.abs(typeTotal - 100) < 0.1); // Allow small floating point errors

    // Verify model percentages sum to 100%
    const modelTotal = analysis.breakdown_by_model.reduce((sum, m) => sum + m.percentage, 0);
    assert.ok(Math.abs(modelTotal - 100) < 0.1);

    // Verify top expensive requests
    assert.strictEqual(analysis.top_expensive_requests.length, 5);
    assert.ok(analysis.top_expensive_requests[0].cost >= analysis.top_expensive_requests[1].cost);

    // Verify top expensive days
    assert.strictEqual(analysis.top_expensive_days.length, 5);
    assert.ok(analysis.top_expensive_days[0].cost >= analysis.top_expensive_days[1].cost);
});

test('calculateBreakdownByModel handles case-insensitive kind matching', () => {
    const analyzer = new CostAnalyzer();
    const records = [
        createRecord({ date: '2025-10-10T10:00:00Z', cost: 10, totalTokens: 1000, kind: 'INCLUDED', model: 'grok' }),
        createRecord({ date: '2025-10-10T11:00:00Z', cost: 20, totalTokens: 2000, kind: 'on-demand', model: 'claude' }),
        createRecord({ date: '2025-10-11T10:00:00Z', cost: 15, totalTokens: 1500, kind: 'Errored, Not Charged', model: 'grok' })
    ];

    const breakdown = analyzer.calculateBreakdownByType(records);

    assert.strictEqual(breakdown.included.cost, 10);
    assert.strictEqual(breakdown.on_demand.cost, 20);
    assert.strictEqual(breakdown.errored.cost, 15);
});

test('calculateSummary handles single day correctly', () => {
    const analyzer = new CostAnalyzer();
    const records = [
        createRecord({ date: '2025-10-10T10:00:00Z', cost: 10, totalTokens: 1000, kind: 'Included', model: 'grok' }),
        createRecord({ date: '2025-10-10T11:00:00Z', cost: 20, totalTokens: 2000, kind: 'On-Demand', model: 'claude' })
    ];

    const summary = analyzer.calculateSummary(records);

    assert.strictEqual(summary.period.days, 1);
    assert.strictEqual(summary.cost.daily_average, 30); // 30 / 1 day
    assert.strictEqual(summary.usage.requests_per_day, 2);
});

test('findTopExpensiveRequests includes context', () => {
    const analyzer = new CostAnalyzer();
    const records = [
        createRecord({ date: '2025-10-10T10:00:00Z', cost: 50, totalTokens: 5000, kind: 'On-Demand', model: 'claude' }),
        createRecord({ date: '2025-10-10T11:00:00Z', cost: 10, totalTokens: 1000, kind: 'Included', model: 'grok' })
    ];

    const topRequests = analyzer.findTopExpensiveRequests(records, 1);

    assert.strictEqual(topRequests.length, 1);
    assert.strictEqual(topRequests[0].cost, 50);
    assert.strictEqual(topRequests[0].date, '2025-10-10T10:00:00Z');
    assert.strictEqual(topRequests[0].model, 'claude');
    assert.strictEqual(topRequests[0].kind, 'On-Demand');
    assert.strictEqual(topRequests[0].total_tokens, 5000);
    assert.ok(topRequests[0].row_number);
});


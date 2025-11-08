import { test } from 'node:test';
import assert from 'node:assert';
import { CacheEfficiencyAnalyzer, CACHE_BENCHMARKS } from '../../../src/domain/analyzers/cache-efficiency.js';
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

test('CacheEfficiencyAnalyzer class can be instantiated', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    assert.ok(analyzer instanceof CacheEfficiencyAnalyzer);
});

test('analyze throws on empty records', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const costSummary = {
        period: { days: 30 },
        cost: { total: 100 }
    };

    assert.throws(() => {
        analyzer.analyze([], costSummary);
    }, /Records array cannot be empty/);
});

test('calculateCacheMetrics calculates cache hit rate correctly', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const records = [
        createRecord({ cacheRead: 700, input: 300, totalTokens: 1000 }),
        createRecord({ cacheRead: 800, input: 200, totalTokens: 1000 })
    ];

    const metrics = analyzer.calculateCacheMetrics(records);

    // Total cache: 700 + 800 = 1500
    // Total input: 300 + 200 = 500
    // Cache hit rate: 1500 / (1500 + 500) = 75%
    assert.strictEqual(metrics.total_cache_tokens, 1500);
    assert.strictEqual(metrics.total_input_tokens, 500);
    assert.ok(Math.abs(metrics.cache_hit_rate - 75) < 0.1);
});

test('calculateCacheMetrics handles zero cache tokens', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const records = [
        createRecord({ cacheRead: 0, input: 1000, totalTokens: 1000 })
    ];

    const metrics = analyzer.calculateCacheMetrics(records);

    assert.strictEqual(metrics.total_cache_tokens, 0);
    assert.strictEqual(metrics.total_input_tokens, 1000);
    assert.strictEqual(metrics.cache_hit_rate, 0);
});

test('calculateCacheMetrics handles all cache tokens', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const records = [
        createRecord({ cacheRead: 1000, input: 0, totalTokens: 1000 })
    ];

    const metrics = analyzer.calculateCacheMetrics(records);

    assert.strictEqual(metrics.total_cache_tokens, 1000);
    assert.strictEqual(metrics.total_input_tokens, 0);
    assert.strictEqual(metrics.cache_hit_rate, 100);
});

test('benchmarkCacheEfficiency categorizes Poor correctly', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const benchmark = analyzer.benchmarkCacheEfficiency(50);

    assert.strictEqual(benchmark.level, CACHE_BENCHMARKS.POOR.label);
    assert.strictEqual(benchmark.threshold_met, false);
});

test('benchmarkCacheEfficiency categorizes Average correctly', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const benchmark = analyzer.benchmarkCacheEfficiency(70);

    assert.strictEqual(benchmark.level, CACHE_BENCHMARKS.AVERAGE.label);
    assert.strictEqual(benchmark.threshold_met, false);
});

test('benchmarkCacheEfficiency categorizes Good correctly', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const benchmark = analyzer.benchmarkCacheEfficiency(80);

    assert.strictEqual(benchmark.level, CACHE_BENCHMARKS.GOOD.label);
    // 80% is Good but below the 85% threshold for threshold_met
    assert.strictEqual(benchmark.threshold_met, false);

    // Test at threshold
    const benchmarkAtThreshold = analyzer.benchmarkCacheEfficiency(85);
    assert.strictEqual(benchmarkAtThreshold.threshold_met, true);
});

test('benchmarkCacheEfficiency categorizes Excellent correctly', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const benchmark = analyzer.benchmarkCacheEfficiency(90);

    assert.strictEqual(benchmark.level, CACHE_BENCHMARKS.EXCELLENT.label);
    assert.strictEqual(benchmark.threshold_met, true);
});

test('benchmarkCacheEfficiency categorizes Outstanding correctly', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const benchmark = analyzer.benchmarkCacheEfficiency(95);

    assert.strictEqual(benchmark.level, CACHE_BENCHMARKS.OUTSTANDING.label);
    assert.strictEqual(benchmark.threshold_met, true);
});

test('calculateCacheSavings estimates savings correctly', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const records = [
        createRecord({ cacheRead: 700, input: 300, totalTokens: 1000, cost: 0.10 }),
        createRecord({ cacheRead: 800, input: 200, totalTokens: 1000, cost: 0.10 })
    ];

    const metrics = analyzer.calculateCacheMetrics(records);
    const savings = analyzer.calculateCacheSavings(records, metrics);

    assert.ok(savings.savings_monthly >= 0);
    assert.ok(savings.savings_yearly >= 0);
    assert.ok(savings.cache_tokens_processed > 0);
});

test('generateFeedback provides tips for Poor cache rate', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const records = [
        createRecord({ cacheRead: 300, input: 700, totalTokens: 1000, cost: 0.10 })
    ];

    const metrics = analyzer.calculateCacheMetrics(records);
    const benchmark = analyzer.benchmarkCacheEfficiency(metrics.cache_hit_rate);
    const savings = analyzer.calculateCacheSavings(records, metrics);

    const costSummary = {
        period: { days: 30 },
        cost: { total: 100 }
    };

    const feedback = analyzer.generateFeedback(metrics, benchmark, savings, costSummary);

    assert.ok(feedback.summary.includes('below average'));
    assert.ok(feedback.tips.length > 0);
    assert.ok(feedback.potential_savings);
});

test('generateFeedback provides tips for Average cache rate', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const records = [
        createRecord({ cacheRead: 650, input: 350, totalTokens: 1000, cost: 0.10 })
    ];

    const metrics = analyzer.calculateCacheMetrics(records);
    const benchmark = analyzer.benchmarkCacheEfficiency(metrics.cache_hit_rate);
    const savings = analyzer.calculateCacheSavings(records, metrics);

    const costSummary = {
        period: { days: 30 },
        cost: { total: 100 }
    };

    const feedback = analyzer.generateFeedback(metrics, benchmark, savings, costSummary);

    assert.ok(feedback.summary.includes('average'));
    assert.ok(feedback.tips.length > 0);
});

test('generateFeedback provides positive feedback for Good cache rate', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const records = [
        createRecord({ cacheRead: 800, input: 200, totalTokens: 1000, cost: 0.10 })
    ];

    const metrics = analyzer.calculateCacheMetrics(records);
    const benchmark = analyzer.benchmarkCacheEfficiency(metrics.cache_hit_rate);
    const savings = analyzer.calculateCacheSavings(records, metrics);

    const costSummary = {
        period: { days: 30 },
        cost: { total: 100 }
    };

    const feedback = analyzer.generateFeedback(metrics, benchmark, savings, costSummary);

    assert.ok(feedback.summary.includes('good') || feedback.summary.includes('✅'));
    assert.ok(feedback.tips.length > 0);
});

test('generateFeedback provides positive feedback for Excellent cache rate', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const records = [
        createRecord({ cacheRead: 900, input: 100, totalTokens: 1000, cost: 0.10 })
    ];

    const metrics = analyzer.calculateCacheMetrics(records);
    const benchmark = analyzer.benchmarkCacheEfficiency(metrics.cache_hit_rate);
    const savings = analyzer.calculateCacheSavings(records, metrics);

    const costSummary = {
        period: { days: 30 },
        cost: { total: 100 }
    };

    const feedback = analyzer.generateFeedback(metrics, benchmark, savings, costSummary);

    assert.ok(feedback.summary.includes('excellent') || feedback.summary.includes('🎉'));
});

test('analyze returns complete cache analysis', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const records = [
        createRecord({ cacheRead: 750, input: 250, totalTokens: 1000, cost: 0.10 }),
        createRecord({ cacheRead: 800, input: 200, totalTokens: 1000, cost: 0.10 })
    ];

    const costSummary = {
        period: { days: 30 },
        cost: { total: 100 }
    };

    const analysis = analyzer.analyze(records, costSummary);

    assert.ok(analysis.metrics);
    assert.ok(analysis.benchmark);
    assert.ok(analysis.savings);
    assert.ok(analysis.feedback);
    assert.ok(analysis.metrics.cache_hit_rate >= 0);
    assert.ok(analysis.metrics.cache_hit_rate <= 100);
    assert.ok(analysis.benchmark.level);
    assert.ok(analysis.feedback.tips.length > 0);
});

test('calculateCacheMetrics handles edge case: no tokens', () => {
    const analyzer = new CacheEfficiencyAnalyzer();
    const records = [
        createRecord({ cacheRead: 0, input: 0, totalTokens: 0, cost: 0 })
    ];

    const metrics = analyzer.calculateCacheMetrics(records);

    assert.strictEqual(metrics.cache_hit_rate, 0);
    assert.strictEqual(metrics.overall_cache_efficiency, 0);
});


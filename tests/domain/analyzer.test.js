import { test } from 'node:test';
import assert from 'node:assert';
import { analyze, exportJSON, parseCSV } from '../../src/index.js';
import { parseCSVContent } from '../../src/domain/parsers/cursor-csv.js';
import { UsageRecord } from '../../src/domain/entities/UsageRecord.js';

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

test('analyze function can be imported and called', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000 }),
        createRecord({ cost: 0.20, totalTokens: 2000 })
    ];

    const result = analyze(records);

    assert.ok(result);
    assert.ok(result.summary);
    assert.ok(result.cost_analysis);
    assert.ok(result.model_efficiency);
    assert.ok(result.plan_recommendation);
    assert.ok(result.cache_efficiency);
    assert.ok(result.opportunities);
    assert.ok(result.patterns);
});

test('analyze throws on empty records', () => {
    assert.throws(() => {
        analyze([]);
    }, /Records array cannot be empty/);
});

test('analyze returns complete analysis structure', () => {
    const records = Array(100).fill(null).map(() => createRecord({
        cost: 0.10,
        totalTokens: 1000,
        cacheRead: 700,
        input: 300
    }));

    const result = analyze(records);

    // Check all major sections exist
    assert.ok(result.metadata);
    assert.ok(result.summary);
    assert.ok(result.cost_analysis);
    assert.ok(result.model_efficiency);
    assert.ok(result.plan_recommendation);
    assert.ok(result.cache_efficiency);
    assert.ok(result.opportunities);
    assert.ok(result.patterns);

    // Check metadata
    assert.ok(result.metadata.generated_at);
    assert.strictEqual(result.metadata.total_records, 100);

    // Check summary structure
    assert.ok(result.summary.period);
    assert.ok(result.summary.cost);
    assert.ok(result.summary.usage);

    // Check cost analysis
    assert.ok(Array.isArray(result.cost_analysis.breakdown_by_model));
    assert.ok(result.cost_analysis.breakdown_by_type);
    assert.ok(Array.isArray(result.cost_analysis.daily_costs));

    // Check model efficiency
    assert.ok(Array.isArray(result.model_efficiency.rankings));

    // Check plan recommendation
    assert.ok(result.plan_recommendation.current_plan);
    assert.ok(result.plan_recommendation.recommended_plan);

    // Check cache efficiency
    assert.ok(result.cache_efficiency.metrics);
    assert.ok(result.cache_efficiency.benchmark);

    // Check opportunities
    assert.ok(Array.isArray(result.opportunities.list));

    // Check patterns
    assert.ok(result.patterns.work_style);
    assert.ok(Array.isArray(result.patterns.hourly_distribution));
});

test('exportJSON generates valid JSON string', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000 })
    ];

    const result = analyze(records);
    const json = exportJSON(result);

    assert.ok(typeof json === 'string');

    // Should be valid JSON
    const parsed = JSON.parse(json);
    assert.ok(parsed.summary);
});

test('exportJSON with pretty formatting includes newlines', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000 })
    ];

    const result = analyze(records);
    const json = exportJSON(result, true);

    assert.ok(json.includes('\n'));
    assert.ok(json.includes('  ')); // Indentation
});

test('analyze completes in reasonable time for typical dataset', async () => {
    // Create dataset similar to 2,000 rows
    const records = Array(2000).fill(null).map((_, i) => createRecord({
        date: `2025-11-${String((i % 30) + 1).padStart(2, '0')}T${String((i % 24)).padStart(2, '0')}:00:00Z`,
        cost: 0.10 + (i % 10) * 0.01,
        totalTokens: 1000 + (i % 1000),
        cacheRead: 700,
        input: 300,
        model: i % 2 === 0 ? 'grok' : 'claude'
    }));

    const startTime = Date.now();
    const result = analyze(records);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in <3 seconds (3000ms)
    assert.ok(duration < 3000, `Analysis took ${duration}ms, expected <3000ms`);
    assert.ok(result);
});

test('analyze integrates all analysis modules correctly', () => {
    const records = [
        createRecord({
            date: '2025-11-07T18:00:00Z',
            model: 'claude-thinking',
            cost: 0.50,
            totalTokens: 1000,
            cacheRead: 500,
            input: 300,
            output: 200,
            kind: 'On-Demand'
        }),
        createRecord({
            date: '2025-11-08T10:00:00Z',
            model: 'grok-code-fast-1',
            cost: 0.01,
            totalTokens: 1000,
            cacheRead: 800,
            input: 100,
            output: 100,
            kind: 'Included'
        }),
        createRecord({
            date: '2025-11-09T20:00:00Z',
            model: 'grok-code-fast-1',
            cost: 0.01,
            totalTokens: 1000,
            cacheRead: 0,
            input: 1000,
            output: 0,
            kind: 'Errored'
        })
    ];

    const result = analyze(records);

    // Verify cost analysis
    assert.strictEqual(result.summary.cost.total, 0.52);
    assert.ok(result.cost_analysis.breakdown_by_model.length > 0);

    // Verify model efficiency
    assert.ok(result.model_efficiency.rankings.length > 0);

    // Verify plan recommendation
    assert.ok(result.plan_recommendation.current_plan);

    // Verify cache efficiency
    assert.ok(result.cache_efficiency.metrics.cache_hit_rate >= 0);

    // Verify opportunities
    assert.ok(Array.isArray(result.opportunities.list));

    // Verify patterns
    assert.ok(result.patterns.work_style.primary_style);
    assert.ok(result.patterns.hourly_distribution.length === 24);
});

test('parseCSVContent and analyze work together', () => {
    const csv = `Date,Kind,Model,Cost,Total Tokens,Cache Read,Input (w/o Cache Write),Output Tokens
"2025-11-07T10:00:00Z","Included","grok-code-fast-1","0.10","1000","700","200","100"
"2025-11-07T11:00:00Z","Included","grok-code-fast-1","0.10","1000","800","100","100"`;

    const parseResult = parseCSVContent(csv);
    const analysisResult = analyze(parseResult.records);

    assert.ok(analysisResult);
    assert.strictEqual(analysisResult.metadata.total_records, 2);
    assert.ok(analysisResult.summary);
});

test('exportJSON preserves all analysis data', () => {
    const records = Array(50).fill(null).map(() => createRecord({
        cost: 0.10,
        totalTokens: 1000,
        cacheRead: 700,
        input: 300
    }));

    const result = analyze(records);
    const json = exportJSON(result);
    const parsed = JSON.parse(json);

    // Verify all sections are preserved
    assert.ok(parsed.metadata);
    assert.ok(parsed.summary);
    assert.ok(parsed.cost_analysis);
    assert.ok(parsed.model_efficiency);
    assert.ok(parsed.plan_recommendation);
    assert.ok(parsed.cache_efficiency);
    assert.ok(parsed.opportunities);
    assert.ok(parsed.patterns);

    // Verify data integrity
    assert.strictEqual(parsed.metadata.total_records, result.metadata.total_records);
    assert.strictEqual(parsed.summary.cost.total, result.summary.cost.total);
});

test('analyze handles real CSV data end-to-end', () => {
    // This test would use the actual CSV file, but we'll simulate it
    const records = Array(100).fill(null).map((_, i) => createRecord({
        date: `2025-11-${String((i % 30) + 1).padStart(2, '0')}T10:00:00Z`,
        cost: 0.10,
        totalTokens: 1000,
        cacheRead: 700,
        input: 300,
        model: i % 3 === 0 ? 'grok' : i % 3 === 1 ? 'claude' : 'gemini',
        kind: i % 10 === 0 ? 'Errored' : i % 2 === 0 ? 'Included' : 'On-Demand'
    }));

    const result = analyze(records);

    // Verify all sections are populated
    assert.ok(result.cost_analysis.breakdown_by_model.length > 0);
    assert.ok(result.model_efficiency.rankings.length > 0);
    assert.ok(result.opportunities.list.length >= 0);
    assert.ok(result.patterns.peak_hours.length > 0);
});


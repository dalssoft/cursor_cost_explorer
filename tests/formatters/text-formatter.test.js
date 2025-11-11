import { test } from 'node:test';
import assert from 'node:assert';
import { TextFormatter } from '../../src/formatters/text-formatter.js';
import { analyze } from '../../src/index.js';
import { UsageRecord } from '../../src/domain/entities/UsageRecord.js';

// Helper function to create UsageRecord instances
function createRecord(data) {
    return new UsageRecord({
        date: data.date || '2025-11-07T10:00:00Z',
        kind: data.kind || 'Included',
        model: data.model || 'grok-code-fast-1',
        cost: data.cost || 0.01,
        totalTokens: data.totalTokens || 1000,
        cacheRead: data.cacheRead || 0,
        input: data.input || 0,
        output: data.output || 0
    });
}

test('TextFormatter can be imported and instantiated', () => {
    const formatter = new TextFormatter();
    assert.ok(formatter);
    assert.ok(typeof formatter.format === 'function');
});

test('TextFormatter accepts AnalysisResult and returns formatted string', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000 }),
        createRecord({ cost: 0.20, totalTokens: 2000 })
    ];

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    assert.ok(typeof output === 'string');
    assert.ok(output.length > 0);
});

test('Formatter includes all analysis sections', () => {
    const records = Array(50).fill(null).map(() => createRecord({
        cost: 0.10,
        totalTokens: 1000,
        cacheRead: 700,
        input: 300
    }));

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    // Check for all major sections
    assert.ok(output.includes('SUMMARY'), 'Should include SUMMARY section');
    assert.ok(output.includes('COST ANALYSIS'), 'Should include COST ANALYSIS section');
    assert.ok(output.includes('MODEL EFFICIENCY'), 'Should include MODEL EFFICIENCY section');
    assert.ok(output.includes('PLAN RECOMMENDATION'), 'Should include PLAN RECOMMENDATION section');
    assert.ok(output.includes('CACHE EFFICIENCY'), 'Should include CACHE EFFICIENCY section');
    assert.ok(output.includes('SAVINGS OPPORTUNITIES'), 'Should include SAVINGS OPPORTUNITIES section');
    assert.ok(output.includes('USAGE PATTERNS'), 'Should include USAGE PATTERNS section');
});

test('Formatter uses ASCII borders in tables', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000 })
    ];

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    // Check for ASCII table characters
    assert.ok(output.includes('|'), 'Should use | for table borders');
    assert.ok(output.includes('-'), 'Should use - for table borders');
    assert.ok(output.includes('+'), 'Should use + for table corners');

    // Tables should still use ASCII, but graphs can use Unicode line-drawing chars
    // Only check that we don't have Unicode in table areas
    const lines = output.split('\n');
    const tableLines = lines.filter(line =>
        line.includes('|') && !line.includes('Daily Cost Trend') &&
        !line.includes('Weekly Usage Pattern') && !line.includes('Cost Distribution')
    );

    // Table lines should not contain Unicode box-drawing characters
    tableLines.forEach(line => {
        assert.ok(!line.includes('─'), `Table line should not use Unicode dash: ${line}`);
        assert.ok(!line.includes('│'), `Table line should not use Unicode pipe: ${line}`);
        assert.ok(!line.includes('┌'), `Table line should not use Unicode box-drawing: ${line}`);
        assert.ok(!line.includes('┐'), `Table line should not use Unicode box-drawing: ${line}`);
        assert.ok(!line.includes('└'), `Table line should not use Unicode box-drawing: ${line}`);
        assert.ok(!line.includes('┘'), `Table line should not use Unicode box-drawing: ${line}`);
    });
});

test('Formatter output is deterministic', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000 }),
        createRecord({ cost: 0.20, totalTokens: 2000 })
    ];

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();

    const output1 = formatter.format(analysisResult);
    const output2 = formatter.format(analysisResult);

    assert.strictEqual(output1, output2, 'Output should be deterministic');
});

test('Formatter handles empty or null sections gracefully', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000 })
    ];

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    // Should not crash and should produce valid output
    assert.ok(typeof output === 'string');
    assert.ok(output.length > 0);
});

test('Formatter throws on null AnalysisResult', () => {
    const formatter = new TextFormatter();
    assert.throws(() => {
        formatter.format(null);
    }, /AnalysisResult cannot be null or undefined/);
});

test('Formatter includes clear section headers', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000 })
    ];

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    // Check for section headers with separators
    assert.ok(output.includes('SUMMARY'), 'Should have SUMMARY header');
    assert.ok(output.includes('COST ANALYSIS'), 'Should have COST ANALYSIS header');
    assert.ok(output.includes('MODEL EFFICIENCY'), 'Should have MODEL EFFICIENCY header');
});

test('Formatter formats numbers correctly', () => {
    const formatter = new TextFormatter();

    assert.strictEqual(formatter.formatNumber(1234.567, 2), '1234.57');
    assert.strictEqual(formatter.formatNumber(1000), '1000');
    assert.strictEqual(formatter.formatNumber(0), '0');
});

test('Formatter formats currency correctly', () => {
    const formatter = new TextFormatter();

    assert.strictEqual(formatter.formatCurrency(123.456), '$123.46');
    assert.strictEqual(formatter.formatCurrency(0), '$0.00');
    assert.strictEqual(formatter.formatCurrency(1000), '$1000.00');
});

test('Formatter formats percentages correctly', () => {
    const formatter = new TextFormatter();

    assert.strictEqual(formatter.formatPercentage(75.5), '75.50%');
    assert.strictEqual(formatter.formatPercentage(0), '0.00%');
    assert.strictEqual(formatter.formatPercentage(100), '100.00%');
});

test('Formatter includes metadata header', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000 })
    ];

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    assert.ok(output.includes('CURSOR COST EXPLORER'), 'Should include header');
    assert.ok(output.includes('Generated:'), 'Should include generation timestamp');
    assert.ok(output.includes('Total Records:'), 'Should include record count');
});

test('Formatter includes cost breakdown tables', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000, model: 'grok-code-fast-1' }),
        createRecord({ cost: 0.20, totalTokens: 2000, model: 'claude-sonnet' })
    ];

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    assert.ok(output.includes('Cost Breakdown by Model'), 'Should include model breakdown');
    assert.ok(output.includes('Cost Breakdown by Type'), 'Should include type breakdown');
});

test('Formatter includes model efficiency rankings', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000, model: 'grok-code-fast-1' }),
        createRecord({ cost: 0.20, totalTokens: 2000, model: 'claude-sonnet' })
    ];

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    assert.ok(output.includes('Rank'), 'Should include rank column');
    assert.ok(output.includes('Model'), 'Should include model column');
    assert.ok(output.includes('Efficiency'), 'Should include efficiency column');
});

test('Formatter includes plan recommendation details', () => {
    const records = Array(100).fill(null).map(() => createRecord({
        cost: 0.10,
        totalTokens: 1000
    }));

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    assert.ok(output.includes('Current Plan'), 'Should include current plan');
    assert.ok(output.includes('Recommended Plan'), 'Should include recommended plan');
    assert.ok(output.includes('Monthly Savings'), 'Should include savings');
});

test('Formatter includes opportunities list', () => {
    const records = Array(100).fill(null).map(() => createRecord({
        cost: 0.10,
        totalTokens: 1000
    }));

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    // Opportunities section should exist (even if empty)
    assert.ok(output.includes('SAVINGS OPPORTUNITIES'), 'Should include opportunities section');
});

test('Formatter includes usage patterns', () => {
    const records = Array(100).fill(null).map((_, i) => createRecord({
        date: `2025-11-${String((i % 30) + 1).padStart(2, '0')}T${String((i % 24)).padStart(2, '0')}:00:00Z`,
        cost: 0.10,
        totalTokens: 1000
    }));

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    assert.ok(output.includes('USAGE PATTERNS'), 'Should include patterns section');
    assert.ok(output.includes('Work Style'), 'Should include work style');
});

test('Formatter output is parseable (contains structured data)', () => {
    const records = [
        createRecord({ cost: 0.10, totalTokens: 1000 })
    ];

    const analysisResult = analyze(records);
    const formatter = new TextFormatter();
    const output = formatter.format(analysisResult);

    // Should contain numeric values that can be extracted
    assert.ok(/\$[\d.]+/.test(output), 'Should contain currency values');
    assert.ok(/[\d.]+%/.test(output), 'Should contain percentage values');
    assert.ok(/\d+/.test(output), 'Should contain numeric values');
});

test('Formatter handles edge cases', () => {
    const formatter = new TextFormatter();

    // Test with zero values
    assert.strictEqual(formatter.formatNumber(0), '0');
    assert.strictEqual(formatter.formatCurrency(0), '$0.00');
    assert.strictEqual(formatter.formatPercentage(0), '0.00%');

    // Test with null/undefined
    assert.strictEqual(formatter.formatNumber(null), '0');
    assert.strictEqual(formatter.formatCurrency(undefined), '$0.00');
    assert.strictEqual(formatter.formatPercentage(NaN), '0.00%');
});

test('Formatter wraps text correctly', () => {
    const formatter = new TextFormatter();
    const longText = 'This is a very long text that should be wrapped to fit within the specified width limit';
    const wrapped = formatter.wrapText(longText, 40);

    const lines = wrapped.split('\n');
    lines.forEach(line => {
        assert.ok(line.length <= 40, `Line should not exceed width: "${line}"`);
    });
});


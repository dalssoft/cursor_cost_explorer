import { test } from 'node:test';
import assert from 'node:assert';
import { UsageRecord } from '../../../src/domain/entities/UsageRecord.js';

test('UsageRecord can be instantiated', () => {
    const data = {
        date: '2025-11-07T20:13:36.375Z',
        kind: 'Included',
        model: 'grok-code-fast-1',
        cost: 0.03,
        totalTokens: 1440897,
        cacheRead: 1432959,
        input: 6311,
        output: 1627
    };

    const record = new UsageRecord(data);
    assert.strictEqual(record.model, 'grok-code-fast-1');
    assert.strictEqual(record.cost, 0.03);
});

test('isIncluded returns true for included requests', () => {
    const record = new UsageRecord({
        date: '2025-11-07',
        kind: 'Included',
        model: 'grok',
        cost: 0.01,
        totalTokens: 1000,
        cacheRead: 500,
        input: 300,
        output: 200
    });

    assert.strictEqual(record.isIncluded(), true);
});

test('isOnDemand returns true for on-demand requests', () => {
    const record = new UsageRecord({
        date: '2025-11-07',
        kind: 'On-Demand',
        model: 'claude',
        cost: 0.50,
        totalTokens: 10000,
        cacheRead: 0,
        input: 5000,
        output: 5000
    });

    assert.strictEqual(record.isOnDemand(), true);
});

test('isErrored returns true for errored requests', () => {
    const record1 = new UsageRecord({
        date: '2025-11-07',
        kind: 'Errored',
        model: 'grok',
        cost: 0.01,
        totalTokens: 1000,
        cacheRead: 500,
        input: 300,
        output: 200
    });

    const record2 = new UsageRecord({
        date: '2025-11-07',
        kind: 'Aborted',
        model: 'grok',
        cost: 0.01,
        totalTokens: 1000,
        cacheRead: 500,
        input: 300,
        output: 200
    });

    assert.strictEqual(record1.isErrored(), true);
    assert.strictEqual(record2.isErrored(), true);
});

test('getCostPerMillionTokens calculates correctly', () => {
    const record = new UsageRecord({
        date: '2025-11-07',
        kind: 'Included',
        model: 'grok',
        cost: 0.10,
        totalTokens: 1_000_000,
        cacheRead: 500000,
        input: 400000,
        output: 100000
    });

    assert.strictEqual(record.getCostPerMillionTokens(), 0.10);
});

test('getCacheEfficiency calculates percentage correctly', () => {
    const record = new UsageRecord({
        date: '2025-11-07',
        kind: 'Included',
        model: 'grok',
        cost: 0.01,
        totalTokens: 1000,
        cacheRead: 750,
        input: 200,
        output: 50
    });

    assert.strictEqual(record.getCacheEfficiency(), 75);
});

test('getDateOnly extracts date portion', () => {
    const record = new UsageRecord({
        date: '2025-11-07T20:13:36.375Z',
        kind: 'Included',
        model: 'grok',
        cost: 0.01,
        totalTokens: 1000,
        cacheRead: 500,
        input: 300,
        output: 200
    });

    assert.strictEqual(record.getDateOnly(), '2025-11-07');
});

test('isValid returns true for valid record', () => {
    const record = new UsageRecord({
        date: '2025-11-07',
        kind: 'Included',
        model: 'grok',
        cost: 0.01,
        totalTokens: 1000,
        cacheRead: 500,
        input: 300,
        output: 200
    });

    assert.strictEqual(record.isValid(), true);
});

test('toObject returns plain object', () => {
    const data = {
        date: '2025-11-07',
        kind: 'Included',
        model: 'grok',
        cost: 0.01,
        totalTokens: 1000,
        cacheRead: 500,
        input: 300,
        output: 200
    };

    const record = new UsageRecord(data);
    const obj = record.toObject();

    assert.deepStrictEqual(obj, data);
});


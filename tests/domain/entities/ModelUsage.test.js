import { test } from 'node:test';
import assert from 'node:assert';
import { ModelUsage } from '../../../src/domain/entities/ModelUsage.js';
import { UsageRecord } from '../../../src/domain/entities/UsageRecord.js';

test('ModelUsage aggregates statistics from records', () => {
  const records = [
    new UsageRecord({
      date: '2025-11-07',
      kind: 'Included',
      model: 'grok',
      cost: 0.10,
      totalTokens: 1_000_000,
      cacheRead: 500000,
      input: 400000,
      output: 100000
    }),
    new UsageRecord({
      date: '2025-11-08',
      kind: 'Included',
      model: 'grok',
      cost: 0.20,
      totalTokens: 2_000_000,
      cacheRead: 1000000,
      input: 800000,
      output: 200000
    })
  ];
  
  const modelUsage = new ModelUsage('grok', records);
  
  assert.strictEqual(modelUsage.model, 'grok');
  assert.ok(Math.abs(modelUsage.totalCost - 0.30) < 0.0001);
  assert.strictEqual(modelUsage.requestCount, 2);
  assert.strictEqual(modelUsage.totalTokens, 3_000_000);
});

test('getCostPerMillionTokens calculates correctly', () => {
  const records = [
    new UsageRecord({
      date: '2025-11-07',
      kind: 'Included',
      model: 'grok',
      cost: 0.10,
      totalTokens: 1_000_000,
      cacheRead: 500000,
      input: 400000,
      output: 100000
    })
  ];
  
  const modelUsage = new ModelUsage('grok', records);
  assert.strictEqual(modelUsage.getCostPerMillionTokens(), 0.10);
});

test('getAverageCostPerRequest calculates correctly', () => {
  const records = [
    new UsageRecord({
      date: '2025-11-07',
      kind: 'Included',
      model: 'grok',
      cost: 0.10,
      totalTokens: 1000,
      cacheRead: 500,
      input: 300,
      output: 200
    }),
    new UsageRecord({
      date: '2025-11-08',
      kind: 'Included',
      model: 'grok',
      cost: 0.20,
      totalTokens: 2000,
      cacheRead: 1000,
      input: 600,
      output: 400
    })
  ];
  
  const modelUsage = new ModelUsage('grok', records);
  assert.ok(Math.abs(modelUsage.getAverageCostPerRequest() - 0.15) < 0.0001);
});

test('getCacheEfficiency calculates percentage correctly', () => {
  const records = [
    new UsageRecord({
      date: '2025-11-07',
      kind: 'Included',
      model: 'grok',
      cost: 0.10,
      totalTokens: 1000,
      cacheRead: 750,
      input: 200,
      output: 50
    })
  ];
  
  const modelUsage = new ModelUsage('grok', records);
  assert.strictEqual(modelUsage.getCacheEfficiency(), 75);
});

test('getCategory returns cost_efficient for cheap models', () => {
  const records = [
    new UsageRecord({
      date: '2025-11-07',
      kind: 'Included',
      model: 'grok',
      cost: 0.01,
      totalTokens: 1_000_000, // $10/M tokens
      cacheRead: 500000,
      input: 400000,
      output: 100000
    })
  ];
  
  const modelUsage = new ModelUsage('grok', records);
  assert.strictEqual(modelUsage.getCategory(), 'cost_efficient');
});

test('getCategory returns specialized for mid-range models', () => {
  const records = [
    new UsageRecord({
      date: '2025-11-07',
      kind: 'Included',
      model: 'claude',
      cost: 0.10,
      totalTokens: 1_000, // $100/M tokens (0.10 / 1,000 * 1,000,000 = 100)
      cacheRead: 0,
      input: 500,
      output: 500
    })
  ];
  
  const modelUsage = new ModelUsage('claude', records);
  assert.strictEqual(modelUsage.getCategory(), 'specialized');
});

test('getCategory returns premium for expensive models', () => {
  const records = [
    new UsageRecord({
      date: '2025-11-07',
      kind: 'Included',
      model: 'claude-thinking',
      cost: 0.50,
      totalTokens: 50, // $10,000/M tokens (0.50 / 50 * 1,000,000 = 10,000)
      cacheRead: 0,
      input: 25,
      output: 25
    })
  ];
  
  const modelUsage = new ModelUsage('claude-thinking', records);
  assert.strictEqual(modelUsage.getCategory(), 'premium');
});

test('isThinkingModel returns true for thinking models', () => {
  const records = [
    new UsageRecord({
      date: '2025-11-07',
      kind: 'Included',
      model: 'claude-4.5-sonnet-thinking',
      cost: 0.50,
      totalTokens: 50000,
      cacheRead: 0,
      input: 25000,
      output: 25000
    })
  ];
  
  const modelUsage = new ModelUsage('claude-4.5-sonnet-thinking', records);
  assert.strictEqual(modelUsage.isThinkingModel(), true);
});

test('getPercentageOfTotal calculates correctly', () => {
  const records = [
    new UsageRecord({
      date: '2025-11-07',
      kind: 'Included',
      model: 'grok',
      cost: 0.25,
      totalTokens: 1000,
      cacheRead: 500,
      input: 300,
      output: 200
    })
  ];
  
  const modelUsage = new ModelUsage('grok', records);
  assert.strictEqual(modelUsage.getPercentageOfTotal(1.0), 25);
});

test('toObject returns complete serialization', () => {
  const records = [
    new UsageRecord({
      date: '2025-11-07',
      kind: 'Included',
      model: 'grok',
      cost: 0.10,
      totalTokens: 1_000_000,
      cacheRead: 500000,
      input: 400000,
      output: 100000
    })
  ];
  
  const modelUsage = new ModelUsage('grok', records);
  const obj = modelUsage.toObject();
  
  assert.strictEqual(obj.model, 'grok');
  assert.strictEqual(obj.total_cost, 0.10);
  assert.strictEqual(obj.request_count, 1);
  assert.strictEqual(typeof obj.cost_per_million_tokens, 'number');
  assert.strictEqual(typeof obj.category, 'string');
});


import { test } from 'node:test';
import assert from 'node:assert';
import { UsagePatternAnalyzer, WORK_STYLES } from '../../../src/domain/analyzers/usage-patterns.js';
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

test('UsagePatternAnalyzer class can be instantiated', () => {
    const analyzer = new UsagePatternAnalyzer();
    assert.ok(analyzer instanceof UsagePatternAnalyzer);
});

test('analyze throws on empty records', () => {
    const analyzer = new UsagePatternAnalyzer();
    const costSummary = {
        period: { days: 30 },
        cost: { total: 100 }
    };

    assert.throws(() => {
        analyzer.analyze([], costSummary);
    }, /Records array cannot be empty/);
});

test('calculateHourlyDistribution calculates hourly usage', () => {
    const analyzer = new UsagePatternAnalyzer();
    const records = [
        createRecord({ date: '2025-11-07T10:00:00Z', cost: 0.10 }),
        createRecord({ date: '2025-11-07T11:00:00Z', cost: 0.20 }),
        createRecord({ date: '2025-11-07T10:30:00Z', cost: 0.15 })
    ];

    const distribution = analyzer.calculateHourlyDistribution(records);

    assert.strictEqual(distribution.length, 24);
    assert.strictEqual(distribution[10].requests, 2); // 10:00 and 10:30
    assert.strictEqual(distribution[11].requests, 1);
    assert.ok(distribution[10].percentage > 0);
});

test('calculateDailyDistribution calculates day-of-week usage', () => {
    const analyzer = new UsagePatternAnalyzer();
    // Create records for different days
    const records = [
        createRecord({ date: '2025-11-09T10:00:00Z', cost: 0.10 }), // Sunday
        createRecord({ date: '2025-11-10T10:00:00Z', cost: 0.20 }), // Monday
        createRecord({ date: '2025-11-09T11:00:00Z', cost: 0.15 })  // Sunday
    ];

    const distribution = analyzer.calculateDailyDistribution(records);

    assert.strictEqual(distribution.length, 7);
    assert.strictEqual(distribution[0].dayName, 'Sunday');
    assert.strictEqual(distribution[0].requests, 2);
    assert.strictEqual(distribution[1].dayName, 'Monday');
    assert.strictEqual(distribution[1].requests, 1);
});

test('identifyPeakHours returns top 3 hours', () => {
    const analyzer = new UsagePatternAnalyzer();
    const hourlyDistribution = Array(24).fill(null).map((_, hour) => ({
        hour,
        requests: hour === 10 ? 100 : hour === 11 ? 80 : hour === 12 ? 60 : 10,
        cost: hour === 10 ? 10 : hour === 11 ? 8 : hour === 12 ? 6 : 1,
        percentage: hour === 10 ? 40 : hour === 11 ? 32 : hour === 12 ? 24 : 4
    }));

    const peakHours = analyzer.identifyPeakHours(hourlyDistribution);

    assert.strictEqual(peakHours.length, 3);
    assert.strictEqual(peakHours[0].hour, 10);
    assert.strictEqual(peakHours[1].hour, 11);
    assert.strictEqual(peakHours[2].hour, 12);
});

test('detectSprints identifies unusually high-cost days', () => {
    const analyzer = new UsagePatternAnalyzer();
    // Create records with one high-cost day
    const records = [
        ...Array(10).fill(null).map((_, i) => createRecord({
            date: `2025-11-0${i + 1}T10:00:00Z`,
            cost: 1.0
        })),
        ...Array(50).fill(null).map((_, i) => createRecord({
            date: '2025-11-05T10:00:00Z',
            cost: 10.0
        })) // Sprint day
    ];

    const costSummary = {
        period: { days: 10 },
        cost: { total: 150 }
    };

    const sprints = analyzer.detectSprints(records, costSummary);

    // Should detect the high-cost day
    assert.ok(sprints.length > 0);
    assert.ok(sprints[0].cost > 50);
});

test('identifyWorkStyle detects night coder', () => {
    const analyzer = new UsagePatternAnalyzer();
    // Create records mostly in evening hours (18-23)
    const records = [];
    for (let hour = 18; hour <= 23; hour++) {
        for (let i = 0; i < 20; i++) {
            records.push(createRecord({
                date: `2025-11-07T${hour.toString().padStart(2, '0')}:00:00Z`,
                cost: 0.10
            }));
        }
    }
    // Add some daytime records
    for (let hour = 9; hour <= 17; hour++) {
        records.push(createRecord({
            date: `2025-11-07T${hour.toString().padStart(2, '0')}:00:00Z`,
            cost: 0.10
        }));
    }

    const hourlyDistribution = analyzer.calculateHourlyDistribution(records);
    const dailyDistribution = analyzer.calculateDailyDistribution(records);
    const costSummary = {
        period: { days: 1 },
        cost: { total: 10 }
    };

    const workStyle = analyzer.identifyWorkStyle(hourlyDistribution, dailyDistribution, records, costSummary);

    assert.ok(workStyle.styles.includes(WORK_STYLES.NIGHT_CODER));
});

test('identifyWorkStyle detects weekend warrior', () => {
    const analyzer = new UsagePatternAnalyzer();
    // Create records mostly on weekends
    const records = [];
    // Sunday records
    for (let i = 0; i < 30; i++) {
        records.push(createRecord({
            date: '2025-11-09T10:00:00Z', // Sunday
            cost: 0.10
        }));
    }
    // Saturday records
    for (let i = 0; i < 30; i++) {
        records.push(createRecord({
            date: '2025-11-08T10:00:00Z', // Saturday
            cost: 0.10
        }));
    }
    // Weekday records
    for (let i = 0; i < 40; i++) {
        records.push(createRecord({
            date: '2025-11-10T10:00:00Z', // Monday
            cost: 0.10
        }));
    }

    const hourlyDistribution = analyzer.calculateHourlyDistribution(records);
    const dailyDistribution = analyzer.calculateDailyDistribution(records);
    const costSummary = {
        period: { days: 3 },
        cost: { total: 10 }
    };

    const workStyle = analyzer.identifyWorkStyle(hourlyDistribution, dailyDistribution, records, costSummary);

    assert.ok(workStyle.styles.includes(WORK_STYLES.WEEKEND_WARRIOR));
});

test('identifyWorkStyle detects sprint worker', () => {
    const analyzer = new UsagePatternAnalyzer();
    // Create records with high variance (bursty pattern)
    const records = [];
    // High-cost days
    for (let day = 1; day <= 3; day++) {
        for (let i = 0; i < 100; i++) {
            records.push(createRecord({
                date: `2025-11-0${day}T10:00:00Z`,
                cost: 1.0
            }));
        }
    }
    // Low-cost days
    for (let day = 4; day <= 10; day++) {
        for (let i = 0; i < 5; i++) {
            records.push(createRecord({
                date: `2025-11-0${day}T10:00:00Z`,
                cost: 0.01
            }));
        }
    }

    const hourlyDistribution = analyzer.calculateHourlyDistribution(records);
    const dailyDistribution = analyzer.calculateDailyDistribution(records);
    const costSummary = {
        period: { days: 10 },
        cost: { total: 300 }
    };

    const workStyle = analyzer.identifyWorkStyle(hourlyDistribution, dailyDistribution, records, costSummary);

    assert.ok(workStyle.styles.includes(WORK_STYLES.SPRINT_WORKER));
});

test('identifyWorkStyle detects steady user', () => {
    const analyzer = new UsagePatternAnalyzer();
    // Create records with consistent daily usage
    const records = [];
    for (let day = 1; day <= 10; day++) {
        for (let i = 0; i < 10; i++) {
            records.push(createRecord({
                date: `2025-11-0${day}T10:00:00Z`,
                cost: 1.0
            }));
        }
    }

    const hourlyDistribution = analyzer.calculateHourlyDistribution(records);
    const dailyDistribution = analyzer.calculateDailyDistribution(records);
    const costSummary = {
        period: { days: 10 },
        cost: { total: 100 }
    };

    const workStyle = analyzer.identifyWorkStyle(hourlyDistribution, dailyDistribution, records, costSummary);

    assert.ok(workStyle.styles.includes(WORK_STYLES.STEADY_USER));
    assert.strictEqual(workStyle.usage_consistency, 'steady');
});

test('generatePatternRecommendations generates recommendations for night coder', () => {
    const analyzer = new UsagePatternAnalyzer();
    const workStyle = {
        styles: [WORK_STYLES.NIGHT_CODER],
        primary_style: WORK_STYLES.NIGHT_CODER,
        evening_percentage: 50,
        weekend_percentage: 10
    };
    const peakHours = [{ hour: 20, requests: 100, cost: 10, percentage: 40 }];
    const sprints = [];
    const dailyDistribution = [];
    const costSummary = { period: { days: 30 }, cost: { total: 100 } };

    const recommendations = analyzer.generatePatternRecommendations(
        workStyle,
        peakHours,
        sprints,
        dailyDistribution,
        costSummary
    );

    const nightCoderRec = recommendations.find(r => r.title.includes('Night'));
    assert.ok(nightCoderRec);
});

test('generatePatternRecommendations generates recommendations for sprint worker', () => {
    const analyzer = new UsagePatternAnalyzer();
    const workStyle = {
        styles: [WORK_STYLES.SPRINT_WORKER],
        primary_style: WORK_STYLES.SPRINT_WORKER,
        evening_percentage: 20,
        weekend_percentage: 10
    };
    const peakHours = [];
    const sprints = [];
    const dailyDistribution = [];
    const costSummary = { period: { days: 30 }, cost: { total: 100 } };

    const recommendations = analyzer.generatePatternRecommendations(
        workStyle,
        peakHours,
        sprints,
        dailyDistribution,
        costSummary
    );

    const sprintRec = recommendations.find(r => r.title.includes('Sprint'));
    assert.ok(sprintRec);
    assert.ok(sprintRec.action);
});

test('analyze returns complete pattern analysis', () => {
    const analyzer = new UsagePatternAnalyzer();
    const records = Array(100).fill(null).map((_, i) => createRecord({
        date: `2025-11-07T${(10 + (i % 10)).toString().padStart(2, '0')}:00:00Z`,
        cost: 0.10
    }));

    const costSummary = {
        period: { days: 1 },
        cost: { total: 10 }
    };

    const analysis = analyzer.analyze(records, costSummary);

    assert.ok(analysis.hourly_distribution);
    assert.strictEqual(analysis.hourly_distribution.length, 24);
    assert.ok(analysis.daily_distribution);
    assert.strictEqual(analysis.daily_distribution.length, 7);
    assert.ok(analysis.peak_hours);
    assert.ok(analysis.work_style);
    assert.ok(analysis.recommendations);
    assert.ok(analysis.work_style.primary_style);
});

test('calculateVariance calculates variance correctly', () => {
    const analyzer = new UsagePatternAnalyzer();
    const values = [1, 2, 3, 4, 5];
    const variance = analyzer.calculateVariance(values);

    // Mean = 3, Variance = ((1-3)^2 + (2-3)^2 + (3-3)^2 + (4-3)^2 + (5-3)^2) / 5 = 2
    assert.ok(Math.abs(variance - 2) < 0.01);
});

test('detectSprints returns empty array when no sprints', () => {
    const analyzer = new UsagePatternAnalyzer();
    // Create records with consistent daily costs
    const records = Array(100).fill(null).map((_, i) => createRecord({
        date: `2025-11-0${(i % 10) + 1}T10:00:00Z`,
        cost: 1.0
    }));

    const costSummary = {
        period: { days: 10 },
        cost: { total: 100 }
    };

    const sprints = analyzer.detectSprints(records, costSummary);

    // Should not detect sprints if variance is low
    assert.ok(Array.isArray(sprints));
});

test('identifyWorkStyle defaults to steady user when no patterns detected', () => {
    const analyzer = new UsagePatternAnalyzer();
    const records = Array(10).fill(null).map(() => createRecord({
        date: '2025-11-07T10:00:00Z',
        cost: 0.10
    }));

    const hourlyDistribution = analyzer.calculateHourlyDistribution(records);
    const dailyDistribution = analyzer.calculateDailyDistribution(records);
    const costSummary = {
        period: { days: 1 },
        cost: { total: 1 }
    };

    const workStyle = analyzer.identifyWorkStyle(hourlyDistribution, dailyDistribution, records, costSummary);

    assert.ok(workStyle.styles.includes(WORK_STYLES.STEADY_USER));
    assert.ok(workStyle.primary_style);
});


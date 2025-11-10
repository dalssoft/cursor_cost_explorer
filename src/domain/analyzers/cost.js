/**
 * Cost analysis for Cursor usage data
 * Pure JavaScript - no external dependencies
 */

import { UsageRecord } from '../entities/UsageRecord.js';
import { ModelUsage } from '../entities/ModelUsage.js';
import { DailyUsage } from '../entities/DailyUsage.js';

class CostAnalyzer {
    analyze(records) {
        if (!records || records.length === 0) {
            throw new Error('Records array cannot be empty');
        }

        const summary = this.calculateSummary(records);
        const breakdownByModel = this.calculateBreakdownByModel(records);
        const breakdownByType = this.calculateBreakdownByType(records);
        const dailyCosts = this.calculateDailyCosts(records);
        const topExpensiveRequests = this.findTopExpensiveRequests(records, 5);
        const topExpensiveDays = this.findTopExpensiveDays(dailyCosts, 5);
        const mostExpensiveModel = this.findMostExpensiveModel(breakdownByModel);

        return {
            summary,
            breakdown_by_model: breakdownByModel,
            breakdown_by_type: breakdownByType,
            daily_costs: dailyCosts,
            top_expensive_requests: topExpensiveRequests,
            top_expensive_days: topExpensiveDays,
            most_expensive_model: mostExpensiveModel
        };
    }

    calculateSummary(records) {
        const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
        const totalRequests = records.length;
        const totalTokens = records.reduce((sum, r) => sum + r.totalTokens, 0);

        // Extract unique dates using entity method
        const dates = records.map(r => r.getDateOnly());
        const uniqueDates = new Set(dates);
        const uniqueDays = uniqueDates.size;

        // Find date range
        const sortedDates = Array.from(uniqueDates).sort();
        const start = sortedDates[0] || '';
        const end = sortedDates[sortedDates.length - 1] || '';

        // Calculate days in period
        const days = uniqueDays > 0 ? uniqueDays : 1;
        const dailyAverage = totalCost / days;

        // Calculate requests per day
        const requestsPerDay = totalRequests / days;

        return {
            period: {
                start,
                end,
                days: uniqueDays
            },
            cost: {
                total: totalCost,
                daily_average: dailyAverage
            },
            usage: {
                total_requests: totalRequests,
                requests_per_day: requestsPerDay,
                total_tokens: totalTokens
            }
        };
    }

    calculateBreakdownByModel(records) {
        // Group records by model
        const modelGroups = {};
        for (const record of records) {
            const model = record.model;
            if (!modelGroups[model]) {
                modelGroups[model] = [];
            }
            modelGroups[model].push(record);
        }

        const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

        // Create ModelUsage entities and convert to plain objects with percentages
        const breakdown = Object.entries(modelGroups).map(([model, modelRecords]) => {
            const modelUsage = new ModelUsage(model, modelRecords);
            const obj = modelUsage.toObject();
            return {
                model: obj.model,
                total_cost: obj.total_cost,
                request_count: obj.request_count,
                percentage: modelUsage.getPercentageOfTotal(totalCost)
            };
        });

        // Sort by cost descending
        breakdown.sort((a, b) => b.total_cost - a.total_cost);

        return breakdown;
    }

    calculateBreakdownByType(records) {
        const typeCosts = {
            included: 0,
            on_demand: 0,
            errored: 0
        };

        const typeCounts = {
            included: 0,
            on_demand: 0,
            errored: 0
        };

        // Use entity methods for type classification
        for (const record of records) {
            if (record.isIncluded()) {
                typeCosts.included += record.cost;
                typeCounts.included++;
            } else if (record.isOnDemand()) {
                typeCosts.on_demand += record.cost;
                typeCounts.on_demand++;
            } else if (record.isErrored()) {
                // Errored requests are NOT charged (cost = 0 for billing purposes)
                typeCosts.errored += 0;
                typeCounts.errored++;
            }
        }

        const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

        return {
            included: {
                cost: typeCosts.included,
                request_count: typeCounts.included,
                percentage: totalCost > 0 ? (typeCosts.included / totalCost) * 100 : 0
            },
            on_demand: {
                cost: typeCosts.on_demand,
                request_count: typeCounts.on_demand,
                percentage: totalCost > 0 ? (typeCosts.on_demand / totalCost) * 100 : 0
            },
            errored: {
                cost: typeCosts.errored,
                request_count: typeCounts.errored,
                percentage: 0  // Errored requests don't count toward cost
            }
        };
    }

    calculateDailyCosts(records) {
        // Group records by date
        const dailyGroups = {};
        for (const record of records) {
            const date = record.getDateOnly();
            if (!dailyGroups[date]) {
                dailyGroups[date] = [];
            }
            dailyGroups[date].push(record);
        }

        // Create DailyUsage entities
        const dailyUsages = Object.entries(dailyGroups).map(([date, dateRecords]) =>
            new DailyUsage(date, dateRecords)
        );

        // Sort by date and convert to plain objects
        return dailyUsages
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(du => du.toObject());
    }

    findTopExpensiveRequests(records, limit = 5) {
        // Create array with index for context
        const requestsWithIndex = records.map((record, index) => ({
            record,
            index: index + 1
        }));

        // Sort by cost descending
        const sorted = requestsWithIndex.sort((a, b) => b.record.cost - a.record.cost);

        // Take top N
        return sorted.slice(0, limit).map(({ record, index }) => ({
            date: record.date,
            model: record.model,
            kind: record.kind,
            cost: record.cost,
            total_tokens: record.totalTokens,
            row_number: index
        }));
    }

    findTopExpensiveDays(dailyCosts, limit = 5) {
        // Convert plain objects back to DailyUsage entities for comparison
        const dailyUsages = dailyCosts.map(d => {
            // Reconstruct records from daily cost data (simplified - we don't have original records)
            // For this method, we just need cost comparison, so we can use a minimal DailyUsage
            const dailyUsage = Object.create(DailyUsage.prototype);
            dailyUsage.date = d.date;
            dailyUsage.cost = d.cost;
            dailyUsage.request_count = d.request_count || 0;
            dailyUsage.records = []; // Empty array since we don't have original records
            return dailyUsage;
        });

        // Sort by cost descending
        const sorted = dailyUsages.sort((a, b) => b.cost - a.cost);

        // Take top N and convert to plain objects
        return sorted.slice(0, limit).map(day => ({
            date: day.date,
            cost: day.cost,
            request_count: day.request_count
        }));
    }

    findMostExpensiveModel(breakdownByModel) {
        if (breakdownByModel.length === 0) {
            return null;
        }

        // Already sorted by cost descending, so first is most expensive
        const model = breakdownByModel[0];
        return {
            model: model.model,
            total_cost: model.total_cost,
            percentage: model.percentage,
            request_count: model.request_count
        };
    }
}

export { CostAnalyzer };


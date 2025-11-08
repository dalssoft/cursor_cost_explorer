/**
 * DailyUsage entity - represents aggregated usage for a single day
 * Encapsulates business logic for daily usage analysis
 */

import { UsageRecord } from './UsageRecord.js';

class DailyUsage {
    constructor(date, records = []) {
        if (!date) {
            throw new Error('Date is required for DailyUsage');
        }

        this.date = date;
        this.records = records;

        // Calculate aggregated stats
        this.cost = records.reduce((sum, r) => sum + r.cost, 0);
        this.request_count = records.length;
        this.total_tokens = records.reduce((sum, r) => sum + r.totalTokens, 0);
    }

    /**
     * Calculates average cost per request for this day
     * @returns {number} Average cost per request
     */
    getAverageCostPerRequest() {
        if (this.request_count === 0) return 0;
        return this.cost / this.request_count;
    }

    /**
     * Calculates average tokens per request for this day
     * @returns {number} Average tokens per request
     */
    getAverageTokensPerRequest() {
        if (this.request_count === 0) return 0;
        return this.total_tokens / this.request_count;
    }

    /**
     * Checks if this day is a peak day (significantly above average)
     * @param {number} averageDailyCost - Average daily cost across all days
     * @param {number} [threshold=2] - Number of standard deviations above average to be considered peak
     * @returns {boolean} True if this is a peak day
     */
    isPeakDay(averageDailyCost, threshold = 2) {
        if (averageDailyCost === 0) return false;
        const deviation = this.cost - averageDailyCost;
        // Simple threshold: if cost is more than threshold times the average
        return this.cost > (averageDailyCost * (1 + threshold * 0.5));
    }

    /**
     * Calculates deviation from average cost
     * @param {number} averageDailyCost - Average daily cost across all days
     * @returns {number} Deviation amount (positive = above average, negative = below average)
     */
    getDeviationFromAverage(averageDailyCost) {
        return this.cost - averageDailyCost;
    }

    /**
     * Calculates deviation percentage from average cost
     * @param {number} averageDailyCost - Average daily cost across all days
     * @returns {number} Deviation percentage (positive = above average, negative = below average)
     */
    getDeviationPercentage(averageDailyCost) {
        if (averageDailyCost === 0) return 0;
        return ((this.cost - averageDailyCost) / averageDailyCost) * 100;
    }

    /**
     * Checks if this day has high request volume
     * @param {number} averageRequestsPerDay - Average requests per day
     * @param {number} [threshold=1.5] - Multiplier threshold
     * @returns {boolean} True if request count is significantly above average
     */
    isHighVolumeDay(averageRequestsPerDay, threshold = 1.5) {
        if (averageRequestsPerDay === 0) return false;
        return this.request_count > (averageRequestsPerDay * threshold);
    }

    /**
     * Gets the most expensive request for this day
     * @returns {UsageRecord|null} The most expensive record, or null if no records
     */
    getMostExpensiveRequest() {
        if (this.records.length === 0) return null;
        return this.records.reduce((max, r) => r.cost > max.cost ? r : max, this.records[0]);
    }

    /**
     * Gets the most used model for this day
     * @returns {string|null} Model name, or null if no records
     */
    getMostUsedModel() {
        if (this.records.length === 0) return null;

        const modelCounts = {};
        for (const record of this.records) {
            modelCounts[record.model] = (modelCounts[record.model] || 0) + 1;
        }

        return Object.entries(modelCounts)
            .sort((a, b) => b[1] - a[1])[0][0];
    }

    /**
     * Converts to plain object (for serialization)
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            date: this.date,
            cost: this.cost,
            request_count: this.request_count,
            total_tokens: this.total_tokens,
            average_cost_per_request: this.getAverageCostPerRequest(),
            average_tokens_per_request: this.getAverageTokensPerRequest()
        };
    }
}

export { DailyUsage };


/**
 * Usage pattern analysis for Cursor usage data
 * Pure JavaScript - no external dependencies
 */

import { WorkStyle } from '../entities/WorkStyle.js';

/**
 * Work style characteristics
 */
const WORK_STYLES = {
    NIGHT_CODER: 'night_coder',
    WEEKEND_WARRIOR: 'weekend_warrior',
    SPRINT_WORKER: 'sprint_worker',
    STEADY_USER: 'steady_user'
};

class UsagePatternAnalyzer {
    /**
     * Analyzes usage patterns from records
     * @param {UsageRecord[]} records - Array of usage records
     * @param {Object} costSummary - Summary statistics from cost analysis
     * @returns {Object} Pattern analysis with temporal patterns, work styles, and recommendations
     */
    analyze(records, costSummary) {
        if (!records || records.length === 0) {
            throw new Error('Records array cannot be empty');
        }

        // Calculate temporal distributions
        const hourlyDistribution = this.calculateHourlyDistribution(records);
        const dailyDistribution = this.calculateDailyDistribution(records);

        // Identify patterns
        const peakHours = this.identifyPeakHours(hourlyDistribution);
        const sprints = this.detectSprints(records, costSummary);
        const workStyle = this.identifyWorkStyle(hourlyDistribution, dailyDistribution, records, costSummary);

        // Generate recommendations
        const recommendations = this.generatePatternRecommendations(
            workStyle,
            peakHours,
            sprints,
            dailyDistribution,
            costSummary
        );

        return {
            hourly_distribution: hourlyDistribution,
            daily_distribution: dailyDistribution,
            peak_hours: peakHours,
            sprints: sprints,
            work_style: workStyle.toObject(), // Convert entity to plain object
            recommendations: recommendations
        };
    }

    /**
     * Calculates hourly distribution of usage
     * @param {UsageRecord[]} records - Array of usage records
     * @returns {Array} Array of {hour: 0-23, requests: number, cost: number, percentage: number}
     */
    calculateHourlyDistribution(records) {
        const hourlyData = Array(24).fill(null).map((_, hour) => ({
            hour,
            requests: 0,
            cost: 0
        }));

        for (const record of records) {
            try {
                const date = new Date(record.date);
                const hour = date.getUTCHours();
                hourlyData[hour].requests += 1;
                hourlyData[hour].cost += record.cost;
            } catch (e) {
                // Skip invalid dates
                continue;
            }
        }

        const totalRequests = records.length;
        const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

        return hourlyData.map(data => ({
            hour: data.hour,
            requests: data.requests,
            cost: data.cost,
            percentage: totalRequests > 0 ? (data.requests / totalRequests) * 100 : 0,
            cost_percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0
        }));
    }

    /**
     * Calculates daily distribution (days of week)
     * @param {UsageRecord[]} records - Array of usage records
     * @returns {Array} Array of {day: 0-6 (Sun-Sat), dayName: string, requests: number, cost: number, percentage: number}
     */
    calculateDailyDistribution(records) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dailyData = Array(7).fill(null).map((_, day) => ({
            day,
            dayName: dayNames[day],
            requests: 0,
            cost: 0
        }));

        for (const record of records) {
            try {
                const date = new Date(record.date);
                const day = date.getUTCDay();
                dailyData[day].requests += 1;
                dailyData[day].cost += record.cost;
            } catch (e) {
                // Skip invalid dates
                continue;
            }
        }

        const totalRequests = records.length;
        const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

        return dailyData.map(data => ({
            day: data.day,
            dayName: data.dayName,
            requests: data.requests,
            cost: data.cost,
            percentage: totalRequests > 0 ? (data.requests / totalRequests) * 100 : 0,
            cost_percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0
        }));
    }

    /**
     * Identifies peak usage hours ("Power hours")
     * @param {Array} hourlyDistribution - Hourly distribution data
     * @returns {Array} Array of peak hours (top 3 by requests)
     */
    identifyPeakHours(hourlyDistribution) {
        // Sort by requests descending
        const sorted = [...hourlyDistribution].sort((a, b) => b.requests - a.requests);

        // Take top 3
        return sorted.slice(0, 3).map(data => ({
            hour: data.hour,
            requests: data.requests,
            cost: data.cost,
            percentage: data.percentage
        }));
    }

    /**
     * Detects sprint patterns (unusually high-cost days)
     * @param {UsageRecord[]} records - Array of usage records
     * @param {Object} costSummary - Summary statistics
     * @returns {Array} Array of sprint days
     */
    detectSprints(records, costSummary) {
        // Group by day
        const dailyCosts = {};

        for (const record of records) {
            try {
                const date = new Date(record.date);
                const dayKey = date.toISOString().split('T')[0];

                if (!dailyCosts[dayKey]) {
                    dailyCosts[dayKey] = {
                        date: dayKey,
                        cost: 0,
                        requests: 0
                    };
                }

                dailyCosts[dayKey].cost += record.cost;
                dailyCosts[dayKey].requests += 1;
            } catch (e) {
                continue;
            }
        }

        const days = Object.values(dailyCosts);
        const daysCount = days.length;

        if (daysCount === 0) {
            return [];
        }

        // Calculate average daily cost
        const avgDailyCost = days.reduce((sum, d) => sum + d.cost, 0) / daysCount;

        // Calculate standard deviation
        const variance = days.reduce((sum, d) => sum + Math.pow(d.cost - avgDailyCost, 2), 0) / daysCount;
        const stdDev = Math.sqrt(variance);

        // Sprint threshold: average + 2 standard deviations
        const sprintThreshold = avgDailyCost + (2 * stdDev);

        // Find sprint days
        const sprints = days
            .filter(d => d.cost > sprintThreshold)
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 5) // Top 5 sprint days
            .map(d => ({
                date: d.date,
                cost: d.cost,
                requests: d.requests,
                deviation: d.cost - avgDailyCost,
                deviation_percentage: avgDailyCost > 0 ? ((d.cost - avgDailyCost) / avgDailyCost) * 100 : 0
            }));

        return sprints;
    }

    /**
     * Identifies work style characteristics
     * @param {Array} hourlyDistribution - Hourly distribution
     * @param {Array} dailyDistribution - Daily distribution
     * @param {UsageRecord[]} records - Array of usage records
     * @param {Object} costSummary - Summary statistics
     * @returns {Object} Work style information
     */
    identifyWorkStyle(hourlyDistribution, dailyDistribution, records, costSummary) {
        const characteristics = [];
        const styles = [];

        // Check for night coder (peak usage 18h-23h)
        const eveningHours = hourlyDistribution.filter(h => h.hour >= 18 && h.hour <= 23);
        const eveningPercentage = eveningHours.reduce((sum, h) => sum + h.percentage, 0);
        if (eveningPercentage > 40) {
            characteristics.push('Peak usage in evening hours (18h-23h)');
            styles.push(WORK_STYLES.NIGHT_CODER);
        }

        // Check for weekend warrior (>20% usage on Sat/Sun)
        const weekendDays = dailyDistribution.filter(d => d.day === 0 || d.day === 6); // Sun, Sat
        const weekendPercentage = weekendDays.reduce((sum, d) => sum + d.percentage, 0);
        if (weekendPercentage > 20) {
            characteristics.push(`High weekend usage (${weekendPercentage.toFixed(1)}% on weekends)`);
            styles.push(WORK_STYLES.WEEKEND_WARRIOR);
        }

        // Check for sprint worker (usage in bursts, high variance)
        const days = costSummary.period.days || 1;
        const dailyCosts = this.getDailyCosts(records);
        const variance = this.calculateVariance(dailyCosts);
        const avgDailyCost = dailyCosts.reduce((sum, c) => sum + c, 0) / dailyCosts.length;
        const coefficientOfVariation = avgDailyCost > 0 ? Math.sqrt(variance) / avgDailyCost : 0;

        if (coefficientOfVariation > 0.5 && days > 7) {
            characteristics.push('Usage in bursts with high variance');
            styles.push(WORK_STYLES.SPRINT_WORKER);
        }

        // Check for steady user (consistent daily usage)
        if (coefficientOfVariation < 0.3 && days > 7) {
            characteristics.push('Consistent daily usage pattern');
            styles.push(WORK_STYLES.STEADY_USER);
        }

        // Default to steady user if no other patterns detected
        if (styles.length === 0) {
            styles.push(WORK_STYLES.STEADY_USER);
            characteristics.push('Regular usage pattern');
        }

        return new WorkStyle({
            primary_style: styles[0],
            styles: styles,
            characteristics: characteristics,
            evening_percentage: eveningPercentage,
            weekend_percentage: weekendPercentage,
            usage_consistency: coefficientOfVariation < 0.3 ? 'steady' : coefficientOfVariation < 0.5 ? 'moderate' : 'bursty'
        });
    }

    /**
     * Gets daily costs array
     * @param {UsageRecord[]} records - Array of usage records
     * @returns {Array} Array of daily costs
     */
    getDailyCosts(records) {
        const dailyCosts = {};

        for (const record of records) {
            try {
                const date = new Date(record.date);
                const dayKey = date.toISOString().split('T')[0];
                dailyCosts[dayKey] = (dailyCosts[dayKey] || 0) + record.cost;
            } catch (e) {
                continue;
            }
        }

        return Object.values(dailyCosts);
    }

    /**
     * Calculates variance of an array
     * @param {Array} values - Array of numbers
     * @returns {number} Variance
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;

        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

        return variance;
    }

    /**
     * Generates pattern-based recommendations
     * @param {Object} workStyle - Work style information
     * @param {Array} peakHours - Peak hours
     * @param {Array} sprints - Sprint days
     * @param {Array} dailyDistribution - Daily distribution
     * @param {Object} costSummary - Summary statistics
     * @returns {Array} Array of recommendations
     */
    generatePatternRecommendations(workStyle, peakHours, sprints, dailyDistribution, costSummary) {
        const recommendations = [];

        // WorkStyle is now an entity, but we receive it as plain object from analyze()
        // So we need to handle both cases
        const styles = workStyle.styles || [];
        const primaryStyle = workStyle.primary_style;
        const weekendPercentage = workStyle.weekend_percentage || 0;

        // Night coder recommendations
        if (styles.includes(WORK_STYLES.NIGHT_CODER)) {
            recommendations.push({
                type: 'work_pattern',
                title: 'Night Coding Pattern Detected',
                message: `You're most active during evening hours (${peakHours[0]?.hour || 'evening'}h). Consider optimizing your workflow for these peak hours.`,
                priority: 'low'
            });
        }

        // Weekend warrior recommendations
        if (styles.includes(WORK_STYLES.WEEKEND_WARRIOR)) {
            recommendations.push({
                type: 'work_pattern',
                title: 'Weekend Warrior Pattern',
                message: `You use Cursor heavily on weekends (${weekendPercentage.toFixed(1)}% of usage). Your steady usage justifies Pro/Ultra investment.`,
                priority: 'low'
            });
        }

        // Sprint worker recommendations
        if (styles.includes(WORK_STYLES.SPRINT_WORKER)) {
            recommendations.push({
                type: 'optimization',
                title: 'Sprint Worker Pattern',
                message: 'Your usage comes in bursts. Consider timing sprints with billing cycle start to maximize plan value.',
                priority: 'medium',
                action: 'Plan your intensive coding sessions at the start of your billing cycle'
            });
        }

        // Steady user recommendations
        if (styles.includes(WORK_STYLES.STEADY_USER) && primaryStyle === WORK_STYLES.STEADY_USER) {
            recommendations.push({
                type: 'optimization',
                title: 'Steady Usage Pattern',
                message: 'Your consistent daily usage pattern justifies Pro/Ultra investment for predictable costs.',
                priority: 'low'
            });
        }

        // Sprint detection recommendations
        if (sprints.length > 0) {
            const topSprint = sprints[0];
            recommendations.push({
                type: 'sprint',
                title: `Sprint Detected: ${topSprint.date}`,
                message: `Unusually high activity on ${topSprint.date} (${topSprint.deviation_percentage.toFixed(0)}% above average). This suggests intensive coding sessions.`,
                priority: 'low',
                sprint_date: topSprint.date,
                sprint_cost: topSprint.cost
            });
        }

        return recommendations;
    }
}

export { UsagePatternAnalyzer, WORK_STYLES };


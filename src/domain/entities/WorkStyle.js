/**
 * WorkStyle entity - represents user's coding work patterns
 * Encapsulates business logic for work style identification and recommendations
 */

class WorkStyle {
    constructor(data) {
        this.primary_style = data.primary_style || 'steady_user';
        this.styles = data.styles || [this.primary_style];
        this.characteristics = data.characteristics || [];
        this.evening_percentage = data.evening_percentage || 0;
        this.weekend_percentage = data.weekend_percentage || 0;
        this.usage_consistency = data.usage_consistency || 'moderate';
    }

    /**
     * Gets human-readable description of the work style
     * @returns {string} Description text
     */
    getDescription() {
        const descriptions = {
            'night_coder': 'You primarily code during evening hours (18h-23h)',
            'weekend_warrior': 'You do significant work on weekends',
            'sprint_worker': 'Your usage comes in bursts with high variance',
            'steady_user': 'You maintain consistent daily usage patterns'
        };

        return descriptions[this.primary_style] || 'Regular usage pattern';
    }

    /**
     * Checks if user is a night coder
     * @returns {boolean} True if night coder pattern detected
     */
    isNightCoder() {
        return this.styles.includes('night_coder');
    }

    /**
     * Checks if user is a weekend warrior
     * @returns {boolean} True if weekend warrior pattern detected
     */
    isWeekendWarrior() {
        return this.styles.includes('weekend_warrior');
    }

    /**
     * Checks if user is a sprint worker
     * @returns {boolean} True if sprint worker pattern detected
     */
    isSprintWorker() {
        return this.styles.includes('sprint_worker');
    }

    /**
     * Checks if user has steady usage
     * @returns {boolean} True if steady user pattern detected
     */
    isSteadyUser() {
        return this.styles.includes('steady_user') || this.usage_consistency === 'steady';
    }

    /**
     * Checks if usage consistency matches a pattern
     * @param {string} pattern - Pattern to check ('steady', 'moderate', 'bursty')
     * @returns {boolean} True if matches
     */
    matchesConsistency(pattern) {
        return this.usage_consistency === pattern;
    }

    /**
     * Gets style-specific recommendations
     * @returns {string[]} Array of recommendation strings
     */
    getRecommendations() {
        const recommendations = [];

        if (this.isNightCoder()) {
            recommendations.push('Consider optimizing your workflow for evening peak hours');
            recommendations.push('Ensure your plan supports your evening usage patterns');
        }

        if (this.isWeekendWarrior()) {
            recommendations.push(`Your weekend usage (${this.weekend_percentage.toFixed(1)}%) suggests steady investment in Pro/Ultra`);
            recommendations.push('Ensure your plan aligns with weekend-heavy usage');
        }

        if (this.isSprintWorker()) {
            recommendations.push('Consider timing sprints with billing cycle start to maximize plan value');
            recommendations.push('Your bursty pattern may benefit from Ultra plan for unlimited capacity');
        }

        if (this.isSteadyUser()) {
            recommendations.push('Your consistent usage pattern justifies Pro/Ultra investment for predictable costs');
            recommendations.push('Consider fixed-cost plans to avoid overage charges');
        }

        if (recommendations.length === 0) {
            recommendations.push('Your usage patterns are consistent and efficient');
        }

        return recommendations;
    }

    /**
     * Gets a summary of all characteristics
     * @returns {string} Summary text
     */
    getCharacteristicsSummary() {
        if (this.characteristics.length === 0) {
            return 'Regular usage pattern';
        }
        return this.characteristics.join('. ');
    }

    /**
     * Checks if this work style suggests a particular plan type
     * @param {string} planType - Plan type ('Free', 'Pro', 'Ultra')
     * @returns {boolean} True if work style suggests this plan
     */
    suggestsPlan(planType) {
        // Sprint workers and high weekend usage suggest Ultra
        if (planType === 'Ultra') {
            return this.isSprintWorker() || this.weekend_percentage > 30;
        }

        // Steady users suggest Pro
        if (planType === 'Pro') {
            return this.isSteadyUser() && !this.isSprintWorker();
        }

        // Low usage suggests Free
        if (planType === 'Free') {
            return this.evening_percentage < 20 && this.weekend_percentage < 10;
        }

        return false;
    }

    /**
     * Converts to plain object (for serialization)
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            primary_style: this.primary_style,
            styles: this.styles,
            characteristics: this.characteristics,
            description: this.getDescription(),
            evening_percentage: this.evening_percentage,
            weekend_percentage: this.weekend_percentage,
            usage_consistency: this.usage_consistency,
            is_night_coder: this.isNightCoder(),
            is_weekend_warrior: this.isWeekendWarrior(),
            is_sprint_worker: this.isSprintWorker(),
            is_steady_user: this.isSteadyUser(),
            recommendations: this.getRecommendations(),
            characteristics_summary: this.getCharacteristicsSummary()
        };
    }
}

export { WorkStyle };


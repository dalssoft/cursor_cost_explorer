/**
 * SavingsOpportunity entity - represents a cost-saving opportunity
 * Encapsulates business logic for opportunity evaluation and prioritization
 */

class SavingsOpportunity {
    constructor(data) {
        this.type = data.type;
        this.title = data.title;
        this.savings_monthly = data.savings_monthly || 0;
        this.savings_yearly = data.savings_yearly || (data.savings_monthly || 0) * 12;
        this.difficulty = data.difficulty || 'medium';
        this.impact = data.impact || 'medium';
        this.action = data.action || '';
        this.reasoning = data.reasoning || '';
        this.confidence = data.confidence || 'low';

        // Optional fields
        this.migration_percentage = data.migration_percentage;
        this.from_model = data.from_model;
        this.to_model = data.to_model;
        this.current_error_rate = data.current_error_rate;
        this.target_error_rate = data.target_error_rate;
        this.current_cache_rate = data.current_cache_rate;
        this.target_cache_rate = data.target_cache_rate;
        this.tips = data.tips;
    }

    /**
     * Calculates Return on Investment (ROI) score
     * Higher savings and lower difficulty = higher ROI
     * @returns {number} ROI score from 0-100
     */
    getROI() {
        const difficultyWeight = this.getDifficultyWeight();
        const impactWeight = this.getImpactWeight();

        // Base ROI = savings / difficulty (higher savings, lower difficulty = better)
        const baseROI = this.savings_monthly / difficultyWeight;

        // Scale by impact
        const roiScore = baseROI * impactWeight;

        // Normalize to 0-100 scale (assuming max savings ~$200/month)
        return Math.min(100, Math.max(0, (roiScore / 2) * 100));
    }

    /**
     * Gets difficulty weight for calculations
     * @returns {number} Weight value (higher = more difficult)
     */
    getDifficultyWeight() {
        const weights = {
            'easy': 1,
            'medium': 2,
            'hard': 3
        };
        return weights[this.difficulty] || 2;
    }

    /**
     * Gets impact weight for calculations
     * @returns {number} Weight value (higher = more impact)
     */
    getImpactWeight() {
        const weights = {
            'high': 1.5,
            'medium': 1.0,
            'low': 0.5
        };
        return weights[this.impact] || 1.0;
    }

    /**
     * Calculates priority score combining ROI, impact, and savings
     * @returns {number} Priority score (higher = more important)
     */
    getPriorityScore() {
        const roi = this.getROI();
        const impactWeight = this.getImpactWeight();
        const savingsWeight = Math.min(1, this.savings_monthly / 50); // Normalize to 0-1

        return (roi * 0.5) + (impactWeight * 20) + (savingsWeight * 30);
    }

    /**
     * Checks if this opportunity is actionable (worth pursuing)
     * @param {number} [threshold=5] - Minimum monthly savings threshold
     * @returns {boolean} True if actionable
     */
    isActionable(threshold = 5) {
        return this.savings_monthly >= threshold && this.confidence !== 'low';
    }

    /**
     * Checks if this is a high-impact opportunity
     * @returns {boolean} True if impact is high
     */
    isHighImpact() {
        return this.impact === 'high';
    }

    /**
     * Checks if this opportunity has high confidence
     * @returns {boolean} True if confidence is high
     */
    isHighConfidence() {
        return this.confidence === 'high';
    }

    /**
     * Gets savings percentage (if applicable)
     * @param {number} currentCost - Current monthly cost
     * @returns {number} Savings percentage (0-100)
     */
    getSavingsPercentage(currentCost) {
        if (currentCost === 0) return 0;
        return (this.savings_monthly / currentCost) * 100;
    }

    /**
     * Converts to plain object (for serialization)
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            type: this.type,
            title: this.title,
            savings_monthly: this.savings_monthly,
            savings_yearly: this.savings_yearly,
            difficulty: this.difficulty,
            impact: this.impact,
            action: this.action,
            reasoning: this.reasoning,
            confidence: this.confidence,
            roi_score: this.getROI(),
            priority_score: this.getPriorityScore(),
            is_actionable: this.isActionable(),
            // Optional fields
            migration_percentage: this.migration_percentage,
            from_model: this.from_model,
            to_model: this.to_model,
            current_error_rate: this.current_error_rate,
            target_error_rate: this.target_error_rate,
            current_cache_rate: this.current_cache_rate,
            target_cache_rate: this.target_cache_rate,
            tips: this.tips
        };
    }
}

export { SavingsOpportunity };


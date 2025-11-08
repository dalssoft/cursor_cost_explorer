/**
 * PlanRecommendation entity - represents a plan optimization recommendation
 * Encapsulates business logic for plan comparison and decision-making
 */

class PlanRecommendation {
    constructor(data) {
        this.current_plan = data.current_plan || 'Free';
        this.recommended_plan = data.recommended_plan || 'Free';
        this.recommended_cost = data.recommended_cost || 0;
        this.actual_monthly_cost = data.actual_monthly_cost || 0;
        this.savings_monthly = data.savings_monthly || 0;
        this.savings_yearly = data.savings_yearly || (data.savings_monthly || 0) * 12;
        this.confidence = data.confidence || 'low';
        this.reasoning = data.reasoning || [];
        this.actions = data.actions || [];
        this.monthly_requests = data.monthly_requests || 0;
        this.exceeds_pro_limit = data.exceeds_pro_limit || false;
    }

    /**
     * Checks if the current plan is already optimal
     * @returns {boolean} True if current plan matches recommended plan
     */
    isOptimal() {
        return this.current_plan === this.recommended_plan;
    }

    /**
     * Calculates savings percentage
     * @returns {number} Savings percentage (0-100)
     */
    getSavingsPercentage() {
        if (this.actual_monthly_cost === 0) return 0;
        return (this.savings_monthly / this.actual_monthly_cost) * 100;
    }

    /**
     * Checks if recommendation has high confidence
     * @returns {boolean} True if confidence is high
     */
    isHighConfidence() {
        return this.confidence === 'high';
    }

    /**
     * Checks if user should act on this recommendation
     * @param {number} [threshold=5] - Minimum savings threshold to act
     * @returns {boolean} True if should act
     */
    shouldAct(threshold = 5) {
        return !this.isOptimal() &&
            this.savings_monthly >= threshold &&
            this.isHighConfidence();
    }

    /**
     * Gets a human-readable summary of the recommendation
     * @returns {string} Summary text
     */
    getSummary() {
        if (this.isOptimal()) {
            return `Your current plan (${this.current_plan}) is optimal for your usage.`;
        }

        const savingsText = this.savings_monthly > 0
            ? `Save $${this.savings_monthly.toFixed(2)}/month`
            : 'No significant savings';

        return `Consider ${this.recommended_plan} plan. ${savingsText}.`;
    }

    /**
     * Checks if this is an upgrade recommendation
     * @returns {boolean} True if recommended plan is higher tier
     */
    isUpgrade() {
        const tiers = { 'Free': 1, 'Pro': 2, 'Ultra': 3 };
        return (tiers[this.recommended_plan] || 0) > (tiers[this.current_plan] || 0);
    }

    /**
     * Checks if this is a downgrade recommendation
     * @returns {boolean} True if recommended plan is lower tier
     */
    isDowngrade() {
        const tiers = { 'Free': 1, 'Pro': 2, 'Ultra': 3 };
        return (tiers[this.recommended_plan] || 0) < (tiers[this.current_plan] || 0);
    }

    /**
     * Gets the primary action item
     * @returns {string} Primary action, or empty string if none
     */
    getPrimaryAction() {
        return this.actions.length > 0 ? this.actions[0] : '';
    }

    /**
     * Gets the primary reasoning
     * @returns {string} Primary reasoning, or empty string if none
     */
    getPrimaryReasoning() {
        if (Array.isArray(this.reasoning)) {
            return this.reasoning.length > 0 ? this.reasoning[0] : '';
        }
        return this.reasoning || '';
    }

    /**
     * Converts to plain object (for serialization)
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            current_plan: this.current_plan,
            recommended_plan: this.recommended_plan,
            recommended_cost: this.recommended_cost,
            actual_monthly_cost: this.actual_monthly_cost,
            savings_monthly: this.savings_monthly,
            savings_yearly: this.savings_yearly,
            savings_percentage: this.getSavingsPercentage(),
            confidence: this.confidence,
            reasoning: Array.isArray(this.reasoning) ? this.reasoning : [this.reasoning],
            actions: Array.isArray(this.actions) ? this.actions : [this.actions],
            is_optimal: this.isOptimal(),
            should_act: this.shouldAct(),
            is_upgrade: this.isUpgrade(),
            is_downgrade: this.isDowngrade(),
            monthly_requests: this.monthly_requests,
            exceeds_pro_limit: this.exceeds_pro_limit
        };
    }
}

export { PlanRecommendation };


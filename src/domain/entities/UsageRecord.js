/**
 * UsageRecord entity - represents a single Cursor usage event
 * Encapsulates business logic for usage records
 */

class UsageRecord {
    constructor(data) {
        this.date = data.date;
        this.kind = data.kind;
        this.model = data.model;
        this.cost = data.cost;
        this.totalTokens = data.totalTokens;
        this.cacheRead = data.cacheRead;
        this.input = data.input;
        this.output = data.output;
    }

    /**
     * Checks if this record is an "Included" request (covered by plan)
     */
    isIncluded() {
        return this.kind.toLowerCase().includes('included');
    }

    /**
     * Checks if this record is an "On-Demand" request (pay-per-use)
     */
    isOnDemand() {
        return this.kind.toLowerCase().includes('on-demand');
    }

    /**
     * Checks if this record is an errored/aborted request
     */
    isErrored() {
        const kind = this.kind.toLowerCase();
        return kind.includes('errored') || kind.includes('aborted');
    }

    /**
     * Calculates cost per million tokens
     */
    getCostPerMillionTokens() {
        if (this.totalTokens === 0) return 0;
        return (this.cost / this.totalTokens) * 1_000_000;
    }

    /**
     * Calculates cache efficiency percentage
     */
    getCacheEfficiency() {
        if (this.totalTokens === 0) return 0;
        return (this.cacheRead / this.totalTokens) * 100;
    }

    /**
     * Calculates cost per request (same as cost, but explicit)
     */
    getCostPerRequest() {
        return this.cost;
    }

    /**
     * Gets the date portion (YYYY-MM-DD) without time
     */
    getDateOnly() {
        return this.date.split('T')[0];
    }

    /**
     * Validates the record structure
     */
    isValid() {
        return (
            this.date &&
            this.kind &&
            this.model &&
            typeof this.cost === 'number' &&
            typeof this.totalTokens === 'number' &&
            typeof this.cacheRead === 'number' &&
            typeof this.input === 'number' &&
            typeof this.output === 'number'
        );
    }

    /**
     * Converts to plain object (for serialization)
     */
    toObject() {
        return {
            date: this.date,
            kind: this.kind,
            model: this.model,
            cost: this.cost,
            totalTokens: this.totalTokens,
            cacheRead: this.cacheRead,
            input: this.input,
            output: this.output
        };
    }
}

export { UsageRecord };


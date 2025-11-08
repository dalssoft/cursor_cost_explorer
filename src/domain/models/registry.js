/**
 * Model registry - known Cursor models with their properties
 * Based on: https://cursor.com/docs/models#model-pricing
 */

/**
 * Model registry mapping model names to their properties
 */
export const MODEL_REGISTRY = {
    // Cost-Efficient Models (< $50/M tokens)
    'grok-code-fast-1': {
        name: 'grok-code-fast-1',
        displayName: 'Grok Code Fast',
        category: 'cost_efficient',
        useCase: 'Syntax checks, quick refactors, simple questions',
        typicalCostPerMillionTokens: 47
    },

    'gemini-2.5-pro': {
        name: 'gemini-2.5-pro',
        displayName: 'Gemini 2.5 Pro',
        category: 'cost_efficient',
        useCase: 'Code analysis, documentation, general coding tasks',
        typicalCostPerMillionTokens: 112
    },

    // Specialized Models ($50-$500/M tokens)
    'composer-1': {
        name: 'composer-1',
        displayName: 'Composer',
        category: 'specialized',
        useCase: 'Multi-file edits, complex refactoring',
        typicalCostPerMillionTokens: 183
    },

    'claude-4.5-sonnet': {
        name: 'claude-4.5-sonnet',
        displayName: 'Claude 4.5 Sonnet',
        category: 'specialized',
        useCase: 'Complex features, architectural decisions, difficult problems',
        typicalCostPerMillionTokens: 530
    },

    // Premium Models (> $500/M tokens)
    'claude-4.5-sonnet-thinking': {
        name: 'claude-4.5-sonnet-thinking',
        displayName: 'Claude 4.5 Sonnet Thinking',
        category: 'premium',
        useCase: 'Architecture planning, critical design decisions only',
        typicalCostPerMillionTokens: 776,
        isThinkingModel: true
    },

    'claude-4-opus': {
        name: 'claude-4-opus',
        displayName: 'Claude 4 Opus',
        category: 'premium',
        useCase: 'Most complex problems requiring highest quality reasoning',
        typicalCostPerMillionTokens: 1500
    }
};

/**
 * Gets model information from registry
 * @param {string} modelName - The model name to look up
 * @returns {Object|null} Model information or null if not found
 */
export function getModelInfo(modelName) {
    // Try exact match first
    if (MODEL_REGISTRY[modelName]) {
        return MODEL_REGISTRY[modelName];
    }

    // Try case-insensitive match
    const lowerModelName = modelName.toLowerCase();
    for (const [key, value] of Object.entries(MODEL_REGISTRY)) {
        if (key.toLowerCase() === lowerModelName) {
            return value;
        }
    }

    // Try partial match (for variations like "claude-4.5-sonnet-thinking" matching "claude-4.5-sonnet")
    for (const [key, value] of Object.entries(MODEL_REGISTRY)) {
        if (lowerModelName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerModelName)) {
            return value;
        }
    }

    return null;
}

/**
 * Checks if a model is a thinking model
 * @param {string} modelName - The model name to check
 * @returns {boolean} True if it's a thinking model
 */
export function isThinkingModel(modelName) {
    const info = getModelInfo(modelName);
    if (info) {
        return info.isThinkingModel === true;
    }
    // Fallback: check name for "thinking" keyword
    return modelName.toLowerCase().includes('thinking');
}

/**
 * Gets all models in a specific category
 * @param {string} category - 'cost_efficient', 'specialized', or 'premium'
 * @returns {Array} Array of model info objects
 */
export function getModelsByCategory(category) {
    return Object.values(MODEL_REGISTRY).filter(model => model.category === category);
}

/**
 * Gets recommendation text for a model
 * @param {string} modelName - The model name
 * @param {string} calculatedCategory - The category calculated from actual usage
 * @returns {string} Recommendation text
 */
export function getModelRecommendation(modelName, calculatedCategory) {
    const info = getModelInfo(modelName);

    if (info && info.useCase) {
        return `Use for: ${info.useCase}`;
    }

    // Fallback recommendations based on calculated category
    if (calculatedCategory === 'cost_efficient') {
        return 'Use for: General coding tasks, frequent use recommended';
    } else if (calculatedCategory === 'specialized') {
        return 'Use for: Complex tasks requiring advanced reasoning';
    } else {
        return 'Use sparingly: Only for the most complex problems';
    }
}


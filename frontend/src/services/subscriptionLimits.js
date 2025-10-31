// src/config/subscriptionLimits.js
export const SUBSCRIPTION_LIMITS = {
    free: {
        maxTransactions: 100,
        maxQuickAccounts: 3,
        canExport: false,
        canAdvancedAnalytics: false,
        maxCategories: 8,
        retentionMonths: 3
    },
    premium: {
        maxTransactions: 1000,
        maxQuickAccounts: 50,
        canExport: true,
        canAdvancedAnalytics: true,
        maxCategories: 20,
        retentionMonths: 24
    }
};

export const getLimitsForPlan = (planType) => {
    return SUBSCRIPTION_LIMITS[planType] || SUBSCRIPTION_LIMITS.free;
};
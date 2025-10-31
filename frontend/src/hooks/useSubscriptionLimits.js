// src/hooks/useSubscriptionLimits.js - VERSIÓN MEJORADA
import { useAuth } from '../auth/AuthContext';
import { useCallback, useMemo } from 'react';

export const useSubscriptionLimits = () => {
    const auth = useAuth();

    // ✅ CONFIGURACIÓN CENTRALIZADA DE LÍMITES
    const SUBSCRIPTION_PLANS = useMemo(() => ({
        FREE: {
            name: 'Gratuito',
            limits: {
                maxTransactions: 100,
                maxQuickAccounts: 3,
                maxCategories: 10,
                maxExports: 5,
                maxFileStorage: 10, // MB
                maxTeamMembers: 1,
                maxRecurringTransactions: 5
            },
            features: {
                exportData: false,
                advancedCharts: false,
                bulkOperations: false,
                apiAccess: false,
                prioritySupport: false,
                customCategories: false
            },
            price: 0,
            currency: 'USD'
        },
        PREMIUM: {
            name: 'Premium',
            limits: {
                maxTransactions: 1000,
                maxQuickAccounts: 20,
                maxCategories: 50,
                maxExports: 100,
                maxFileStorage: 1000, // MB
                maxTeamMembers: 5,
                maxRecurringTransactions: 50
            },
            features: {
                exportData: true,
                advancedCharts: true,
                bulkOperations: true,
                apiAccess: true,
                prioritySupport: true,
                customCategories: true
            },
            price: 9.99,
            currency: 'USD'
        },
        ENTERPRISE: {
            name: 'Empresarial',
            limits: {
                maxTransactions: 10000,
                maxQuickAccounts: 100,
                maxCategories: 200,
                maxExports: 1000,
                maxFileStorage: 10000, // MB
                maxTeamMembers: 50,
                maxRecurringTransactions: 500
            },
            features: {
                exportData: true,
                advancedCharts: true,
                bulkOperations: true,
                apiAccess: true,
                prioritySupport: true,
                customCategories: true,
                whiteLabel: true,
                sso: true
            },
            price: 49.99,
            currency: 'USD'
        }
    }), []);

    // ✅ OBTENER CONFIGURACIÓN DEL PLAN ACTUAL
    const getCurrentPlanConfig = useCallback(() => {
        const planType = auth.subscription?.type || 'FREE';
        return SUBSCRIPTION_PLANS[planType] || SUBSCRIPTION_PLANS.FREE;
    }, [auth.subscription, SUBSCRIPTION_PLANS]);

    // ✅ INFORMACIÓN DEL PLAN ACTUAL
    const planInfo = useMemo(() => {
        const config = getCurrentPlanConfig();
        return {
            name: config.name,
            price: config.price,
            currency: config.currency,
            isTrial: auth.subscription?.isTrial || false,
            trialDaysRemaining: auth.subscription?.trialDaysRemaining || 0,
            renewalDate: auth.subscription?.renewalDate,
            status: auth.subscription?.status || 'active'
        };
    }, [getCurrentPlanConfig, auth.subscription]);

    // ✅ LÍMITES ESPECÍFICOS
    const limits = useMemo(() => {
        const config = getCurrentPlanConfig();
        return {
            maxTransactions: config.limits.maxTransactions,
            maxQuickAccounts: config.limits.maxQuickAccounts,
            maxCategories: config.limits.maxCategories,
            maxExports: config.limits.maxExports,
            maxFileStorage: config.limits.maxFileStorage,
            maxTeamMembers: config.limits.maxTeamMembers,
            maxRecurringTransactions: config.limits.maxRecurringTransactions
        };
    }, [getCurrentPlanConfig]);

    // ✅ CARACTERÍSTICAS DISPONIBLES
    const features = useMemo(() => {
        const config = getCurrentPlanConfig();
        return config.features;
    }, [getCurrentPlanConfig]);

    // ✅ FUNCIONES DE VERIFICACIÓN MEJORADAS
    const checkLimit = useCallback((limitType, currentCount) => {
        const limit = limits[limitType] || 0;
        const hasReached = currentCount >= limit;
        const remaining = Math.max(0, limit - currentCount);
        const percentage = limit > 0 ? Math.min(100, (currentCount / limit) * 100) : 0;

        return {
            hasReached,
            remaining,
            percentage: Math.round(percentage),
            limit,
            currentCount,
            isNearLimit: percentage >= 80 && !hasReached,
            isCritical: percentage >= 95 && !hasReached
        };
    }, [limits]);

    // ✅ VERIFICACIÓN DE CARACTERÍSTICAS
    const canUseFeature = useCallback((featureName) => {
        return features[featureName] || false;
    }, [features]);

    // ✅ VERIFICACIÓN DE MÚLTIPLES LÍMITES
    const checkMultipleLimits = useCallback((usageMap) => {
        const results = {};
        Object.entries(usageMap).forEach(([limitType, currentCount]) => {
            results[limitType] = checkLimit(limitType, currentCount);
        });
        return results;
    }, [checkLimit]);

    // ✅ INFORMACIÓN DE UPGRADE
    const getUpgradeInfo = useCallback((targetPlan = 'PREMIUM') => {
        const currentPlan = getCurrentPlanConfig();
        const targetPlanConfig = SUBSCRIPTION_PLANS[targetPlan];

        if (!targetPlanConfig) return null;

        const benefits = Object.entries(targetPlanConfig.limits).map(([key, value]) => ({
            feature: key,
            current: currentPlan.limits[key] || 0,
            upgraded: value,
            improvement: value - (currentPlan.limits[key] || 0)
        })).filter(benefit => benefit.improvement > 0);

        const newFeatures = Object.entries(targetPlanConfig.features)
            .filter(([key, value]) => value && !currentPlan.features[key])
            .map(([key]) => key);

        return {
            targetPlan: targetPlanConfig.name,
            price: targetPlanConfig.price,
            currency: targetPlanConfig.currency,
            benefits,
            newFeatures,
            isUpgrade: currentPlan.price < targetPlanConfig.price
        };
    }, [getCurrentPlanConfig, SUBSCRIPTION_PLANS]);

    // ✅ VERIFICACIÓN RÁPIDA PARA COMPONENTES
    const quickChecks = useMemo(() => ({
        canExport: canUseFeature('exportData'),
        canUseAdvancedCharts: canUseFeature('advancedCharts'),
        canUseBulkOperations: canUseFeature('bulkOperations'),
        canUseCustomCategories: canUseFeature('customCategories'),
        hasApiAccess: canUseFeature('apiAccess'),
        hasPrioritySupport: canUseFeature('prioritySupport')
    }), [canUseFeature]);

    // ✅ HOOK PARA USO EN COMPONENTES ESPECÍFICOS
    const useFeatureGuard = (featureName, fallbackComponent = null) => {
        const hasAccess = canUseFeature(featureName);

        return {
            hasAccess,
            FallbackComponent: hasAccess ? null : fallbackComponent,
            withFeatureGuard: (Component) => hasAccess ? Component : fallbackComponent
        };
    };

    // ✅ HOOK PARA LÍMITES EN TIEMPO REAL
    const useLimitGuard = (limitType, currentUsage, options = {}) => {
        const { allowExceed = false, onLimitReached } = options;
        const limitCheck = checkLimit(limitType, currentUsage);

        React.useEffect(() => {
            if (limitCheck.hasReached && onLimitReached) {
                onLimitReached(limitCheck);
            }
        }, [limitCheck.hasReached, onLimitReached, limitCheck]);

        return {
            ...limitCheck,
            isAllowed: !limitCheck.hasReached || allowExceed,
            requireUpgrade: limitCheck.hasReached && !allowExceed
        };
    };

    return {
        // ✅ INFORMACIÓN BÁSICA
        planType: auth.subscription?.type || 'FREE',
        isPremium: auth.isPremium?.(),
        isEnterprise: auth.subscription?.type === 'ENTERPRISE',
        planInfo,

        // ✅ LÍMITES Y CARACTERÍSTICAS
        limits,
        features,
        quickChecks,

        // ✅ FUNCIONES DE VERIFICACIÓN
        checkLimit,
        checkMultipleLimits,
        canUseFeature,

        // ✅ INFORMACIÓN DE UPGRADE
        getUpgradeInfo,
        availablePlans: SUBSCRIPTION_PLANS,

        // ✅ HOOKS PARA COMPONENTES
        useFeatureGuard,
        useLimitGuard,

        // ✅ GESTIÓN DE SUSCRIPCIÓN
        updateSubscription: auth.updateSubscription,
        cancelSubscription: auth.cancelSubscription,
        refreshSubscription: auth.refreshSubscription
    };
};

// ✅ HOOKS ESPECIALIZADOS PARA CASOS DE USO COMUNES
export const useTransactionLimits = (currentCount) => {
    const { useLimitGuard } = useSubscriptionLimits();
    return useLimitGuard('maxTransactions', currentCount);
};

export const useQuickAccountsLimits = (currentCount) => {
    const { useLimitGuard } = useSubscriptionLimits();
    return useLimitGuard('maxQuickAccounts', currentCount);
};

export const useExportLimits = (currentCount) => {
    const { useLimitGuard, quickChecks } = useSubscriptionLimits();
    const limitGuard = useLimitGuard('maxExports', currentCount);

    return {
        ...limitGuard,
        canExport: quickChecks.canExport && limitGuard.isAllowed
    };
};

export const useFeatureAccess = (featureName) => {
    const { useFeatureGuard } = useSubscriptionLimits();
    return useFeatureGuard(featureName);
};

export default useSubscriptionLimits;
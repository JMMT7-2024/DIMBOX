// src/hooks/useLimitNotifications.js - VERSIÓN MEJORADA
import { useToast } from '@chakra-ui/react';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';

export const useLimitNotifications = () => {
    const toast = useToast();
    const { user, isPremium, getLimit, getUsagePercentage } = useAuth();

    // ✅ CONFIGURACIÓN DE LÍMITES MEJORADA
    const LIMIT_CONFIG = useMemo(() => ({
        transactions: {
            free: 100,
            premium: 1000,
            name: 'transacciones mensuales',
            icon: '📊'
        },
        categories: {
            free: 10,
            premium: 50,
            name: 'categorías personalizadas',
            icon: '🏷️'
        },
        quickAccounts: {
            free: 3,
            premium: 20,
            name: 'cuentas rápidas',
            icon: '👥'
        },
        exports: {
            free: 5,
            premium: 100,
            name: 'exportaciones mensuales',
            icon: '📥'
        },
        fileStorage: {
            free: 10, // MB
            premium: 1000, // MB
            name: 'almacenamiento',
            icon: '💾'
        }
    }), []);

    // ✅ OBTENER LÍMITE ACTUAL BASADO EN PLAN
    const getCurrentLimit = useCallback((limitType) => {
        const config = LIMIT_CONFIG[limitType];
        if (!config) return 0;

        return isPremium ? config.premium : config.free;
    }, [LIMIT_CONFIG, isPremium]);

    // ✅ OBTENER PORCENTAJE DE USO
    const getCurrentUsagePercentage = useCallback((limitType, currentUsage) => {
        const limit = getCurrentLimit(limitType);
        if (limit === 0) return 0;

        return Math.min(100, (currentUsage / limit) * 100);
    }, [getCurrentLimit]);

    // ✅ VERIFICAR Y NOTIFICAR LÍMITES
    const checkAndNotifyLimits = useCallback((currentUsage, limitType, customName = null) => {
        const config = LIMIT_CONFIG[limitType];
        if (!config) {
            console.warn(`Tipo de límite no encontrado: ${limitType}`);
            return;
        }

        const limit = getCurrentLimit(limitType);
        const usagePercent = getCurrentUsagePercentage(limitType, currentUsage);
        const resourceName = customName || config.name;
        const icon = config.icon;

        // ✅ NOTIFICACIÓN DE USO ALTO (90-99%)
        if (usagePercent >= 90 && usagePercent < 100) {
            toast({
                title: `${icon} Límite ${resourceName} cercano`,
                description: `Has usado el ${Math.round(usagePercent)}% de tu límite (${currentUsage}/${limit})`,
                status: 'warning',
                duration: 6000,
                isClosable: true,
                position: 'top-right',
            });
            return 'warning';
        }

        // ✅ NOTIFICACIÓN DE LÍMITE ALCANZADO (100%)
        if (usagePercent >= 100) {
            toast({
                title: `${icon} Límite ${resourceName} alcanzado`,
                description: isPremium
                    ? `Has alcanzado tu límite premium de ${limit} ${resourceName}.`
                    : `Límite alcanzado. Actualiza a Premium para ${config.premium} ${resourceName}.`,
                status: 'error',
                duration: 8000,
                isClosable: true,
                position: 'top-right',
            });
            return 'error';
        }

        // ✅ NOTIFICACIÓN DE USO MODERADO (75-89%) - Solo para usuarios free
        if (!isPremium && usagePercent >= 75 && usagePercent < 90) {
            toast({
                title: `${icon} Límite ${resourceName} moderado`,
                description: `Has usado el ${Math.round(usagePercent)}% de tu límite gratuito.`,
                status: 'info',
                duration: 4000,
                isClosable: true,
                position: 'top-right',
            });
            return 'info';
        }

        return 'safe';
    }, [LIMIT_CONFIG, getCurrentLimit, getCurrentUsagePercentage, isPremium, toast]);

    // ✅ VERIFICAR MÚLTIPLES LÍMITES
    const checkMultipleLimits = useCallback((usageMap) => {
        const results = {};

        Object.entries(usageMap).forEach(([limitType, currentUsage]) => {
            results[limitType] = checkAndNotifyLimits(currentUsage, limitType);
        });

        return results;
    }, [checkAndNotifyLimits]);

    // ✅ OBTENER INFORMACIÓN DE LÍMITES PARA UI
    const getLimitInfo = useCallback((limitType) => {
        const config = LIMIT_CONFIG[limitType];
        if (!config) return null;

        const currentLimit = getCurrentLimit(limitType);
        const isFreeTier = !isPremium;
        const upgradeBenefit = config.premium - config.free;

        return {
            currentLimit,
            isFreeTier,
            upgradeBenefit,
            name: config.name,
            icon: config.icon,
            freeLimit: config.free,
            premiumLimit: config.premium
        };
    }, [LIMIT_CONFIG, getCurrentLimit, isPremium]);

    // ✅ VERIFICAR SI ESTÁ CERCA DEL LÍMITE (para lógica condicional)
    const isNearLimit = useCallback((currentUsage, limitType, threshold = 90) => {
        const usagePercent = getCurrentUsagePercentage(limitType, currentUsage);
        return usagePercent >= threshold;
    }, [getCurrentUsagePercentage]);

    // ✅ VERIFICAR SI HA ALCANZADO EL LÍMITE
    const hasReachedLimit = useCallback((currentUsage, limitType) => {
        const usagePercent = getCurrentUsagePercentage(limitType, currentUsage);
        return usagePercent >= 100;
    }, [getCurrentUsagePercentage]);

    // ✅ HOOK PARA COMPONENTES QUE NECESITAN MONITOREAR LÍMITES
    const useLimitMonitor = (limitType, currentUsage, options = {}) => {
        const { autoCheck = true, threshold = 90 } = options;

        const limitInfo = getLimitInfo(limitType);
        const usagePercent = getCurrentUsagePercentage(limitType, currentUsage);
        const isNear = isNearLimit(currentUsage, limitType, threshold);
        const hasReached = hasReachedLimit(currentUsage, limitType);

        // ✅ VERIFICACIÓN AUTOMÁTICA AL CAMBIAR EL USO
        React.useEffect(() => {
            if (autoCheck && currentUsage > 0) {
                checkAndNotifyLimits(currentUsage, limitType);
            }
        }, [currentUsage, limitType, autoCheck, checkAndNotifyLimits]);

        return {
            limitInfo,
            usagePercent,
            isNearLimit: isNear,
            hasReachedLimit: hasReached,
            currentUsage,
            remaining: limitInfo ? limitInfo.currentLimit - currentUsage : 0,
            checkLimit: () => checkAndNotifyLimits(currentUsage, limitType)
        };
    };

    return {
        // ✅ FUNCIONES PRINCIPALES
        checkAndNotifyLimits,
        checkMultipleLimits,

        // ✅ INFORMACIÓN DE LÍMITES
        getLimitInfo,
        getCurrentLimit,
        getCurrentUsagePercentage,

        // ✅ VERIFICACIONES DE ESTADO
        isNearLimit,
        hasReachedLimit,

        // ✅ HOOK PARA COMPONENTES
        useLimitMonitor,

        // ✅ CONFIGURACIÓN
        LIMIT_CONFIG
    };
};

// ✅ HOOK DE USO RÁPIDO PARA LÍMITES ESPECÍFICOS
export const useTransactionLimits = (currentTransactionCount) => {
    return useLimitNotifications().useLimitMonitor('transactions', currentTransactionCount);
};

export const useCategoryLimits = (currentCategoryCount) => {
    return useLimitNotifications().useLimitMonitor('categories', currentCategoryCount);
};

export const useQuickAccountsLimits = (currentAccountsCount) => {
    return useLimitNotifications().useLimitMonitor('quickAccounts', currentAccountsCount);
};

export default useLimitNotifications;
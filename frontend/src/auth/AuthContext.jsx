// src/auth/AuthContext.jsx - VERSIÓN ACTUALIZADA CON 3 PLANES
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ready, setReady] = useState(false);

    // ✅ INICIALIZACIÓN SIMPLIFICADA
    useEffect(() => {
        const initializeAuth = async () => {
            console.log('🔐 Auth: Inicializando autenticación...');

            try {
                const authResult = await api.checkAuth();
                console.log('🔐 Auth: Resultado de checkAuth:', authResult);

                if (authResult.isAuthenticated && authResult.user) {
                    console.log('✅ Auth: Usuario autenticado:', authResult.user);
                    setUser(authResult.user);
                } else {
                    console.log('🔓 Auth: No hay usuario autenticado');
                }
            } catch (error) {
                console.error('❌ Auth: Error inicializando:', error);
            } finally {
                setLoading(false);
                setReady(true);
                console.log('🎯 Auth: Contexto listo');
            }
        };

        initializeAuth();
    }, []);

    // ✅ LOGIN CORREGIDO - MANEJO SIMPLIFICADO
    const login = async (credentials) => {
        console.log('🔐 Auth: Iniciando login...', credentials);
        setLoading(true);

        try {
            // ✅ LLAMADA DIRECTA AL API
            const result = await api.login(credentials.username, credentials.password);
            console.log('✅ Auth: Login exitoso, resultado:', result);

            // ✅ ESTABLECER USUARIO
            setUser(result.user);

            return {
                success: true,
                user: result.user
            };

        } catch (error) {
            console.error('❌ Auth: Error en login:', error);

            // Limpiar en caso de error
            api.clearAuthData();
            setUser(null);

            throw error;
        } finally {
            setLoading(false);
        }
    };

    // ✅ REGISTER
    const register = async (email, password, name) => {
        setLoading(true);
        try {
            console.log('📝 Auth: Registrando usuario...', { email, name });

            await api.register({
                email,
                password,
                name: name || email.split('@')[0],
                username: email
            });

            console.log('✅ Auth: Registro exitoso, haciendo login...');

            // Login automático
            const loginResult = await login({ username: email, password });
            return loginResult;

        } catch (error) {
            console.error('❌ Auth: Error en registro:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // ✅ LOGOUT
    const logout = () => {
        console.log('🚪 Auth: Cerrando sesión...');
        api.clearAuthData();
        setUser(null);
    };

    // ✅ FUNCIONES DE VERIFICACIÓN ACTUALIZADAS
    const getCurrentPlan = () => {
        return user?.subscription || 'FREE';
    };

    const isPremium = () => {
        const plan = getCurrentPlan();
        return plan === 'PREMIUM' || plan === 'ENTERPRISE';
    };

    const isEnterprise = () => {
        return getCurrentPlan() === 'ENTERPRISE';
    };

    const isFree = () => {
        return getCurrentPlan() === 'FREE';
    };

    const hasFeature = (feature) => {
        const plan = getCurrentPlan();

        // ✅ DEFINICIÓN DE CARACTERÍSTICAS POR PLAN
        const planFeatures = {
            FREE: ['basic_dashboard', 'limited_transactions', 'basic_categories'],
            PREMIUM: ['basic_dashboard', 'unlimited_transactions', 'advanced_categories', 'export_data', 'advanced_analytics'],
            ENTERPRISE: ['basic_dashboard', 'unlimited_transactions', 'advanced_categories', 'export_data', 'advanced_analytics', 'api_access', 'priority_support', 'custom_limits']
        };

        return planFeatures[plan]?.includes(feature) || false;
    };

    const canExport = () => {
        return hasFeature('export_data') || isPremium();
    };

    const canUseAdvancedAnalytics = () => {
        return hasFeature('advanced_analytics') || isPremium();
    };

    const hasUnlimitedTransactions = () => {
        return hasFeature('unlimited_transactions') || isPremium();
    };

    const value = {
        // Estado
        user,
        me: user,
        loading,
        ready,
        isAuthenticated: !!user,

        // Métodos
        login,
        register,
        logout,

        // ✅ VERIFICACIONES ACTUALIZADAS
        isPremium: isPremium,
        isAdmin: () => user?.role === 'ADMIN',
        isEnterprise: isEnterprise,
        isFree: isFree,
        getCurrentPlan: getCurrentPlan,

        // ✅ VERIFICACIONES DE FUNCIONALIDAD
        hasFeature: hasFeature,
        canExport: canExport,
        canUseAdvancedAnalytics: canUseAdvancedAnalytics,
        hasUnlimitedTransactions: hasUnlimitedTransactions,

        // Métodos adicionales
        refreshUser: async () => {
            try {
                const userData = await api.getProfile();
                setUser(userData);
                return userData;
            } catch (error) {
                console.error('Error actualizando usuario:', error);
                throw error;
            }
        },

        // ✅ COMPATIBILIDAD CON COMPONENTES EXISTENTES
        // Para componentes que esperan el plan como string
        getSubscription: () => user?.subscription || 'FREE',

        // Para componentes que necesitan límites
        getPlanLimits: () => {
            const plan = getCurrentPlan();
            const defaultLimits = {
                FREE: {
                    maxTransactions: 100,
                    maxQuickAccounts: 3,
                    canExport: false,
                    canAdvancedAnalytics: false,
                    maxCategories: 8,
                    retentionMonths: 3,
                    maxTransactionAmount: 10000
                },
                PREMIUM: {
                    maxTransactions: 10000,
                    maxQuickAccounts: 50,
                    canExport: true,
                    canAdvancedAnalytics: true,
                    maxCategories: 20,
                    retentionMonths: 24,
                    maxTransactionAmount: 1000000
                },
                ENTERPRISE: {
                    maxTransactions: 100000,
                    maxQuickAccounts: 200,
                    canExport: true,
                    canAdvancedAnalytics: true,
                    maxCategories: 50,
                    retentionMonths: 60,
                    maxTransactionAmount: 5000000
                }
            };

            return defaultLimits[plan] || defaultLimits.FREE;
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
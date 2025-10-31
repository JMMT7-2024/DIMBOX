// /root/DIMBOX/frontend/src/auth/ProtectedRoute.jsx - VERSIÓN CORREGIDA
import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Spinner, Center, Text, VStack } from '@chakra-ui/react';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const auth = useAuth();
    const location = useLocation();

    // ✅ DEBUG DETALLADO
    console.log('🛡️ ProtectedRoute Render:', {
        path: location.pathname,
        adminOnly,
        authState: {
            ready: auth.ready,
            loading: auth.loading,
            hasUser: !!auth.user,
            user: auth.user?.email
        }
    });

    // ✅ MEMOIZAR EL ESTADO PARA EVITAR RE-RENDERS
    const authState = useMemo(() => ({
        isReady: auth.ready && !auth.loading,
        isAuthenticated: !!auth.user,
        user: auth.user
    }), [auth.ready, auth.loading, auth.user]);

    console.log('🛡️ ProtectedRoute Computed State:', authState);

    // ✅ MOSTRAR LOADING SOLO CUANDO NO ESTÉ LISTO
    if (!authState.isReady) {
        console.log('⏳ ProtectedRoute: Mostrando loading - auth no está listo');
        return (
            <Center h="100vh" flexDirection="column" gap={4}>
                <Spinner size="xl" color="green.500" thickness="3px" />
                <Text color="gray.600" fontSize="sm">
                    Verificando acceso...
                </Text>
            </Center>
        );
    }

    // ✅ VERIFICAR AUTENTICACIÓN
    if (!authState.isAuthenticated) {
        console.log('🔐 ProtectedRoute: No autenticado, redirigiendo a login');

        // Guardar URL actual para redirección después del login
        if (location.pathname !== '/login') {
            sessionStorage.setItem('redirect_after_login', location.pathname);
            console.log('📝 ProtectedRoute: Guardada redirección:', location.pathname);
        }

        return <Navigate to="/login" replace />;
    }

    // ✅ VERIFICACIÓN DE ADMIN
    if (adminOnly) {
        console.log('🔍 ProtectedRoute: Verificando permisos admin para:', authState.user?.email);

        // ✅ LÓGICA DE ADMIN MÁS ROBUSTA
        const isAdmin = authState.user?.email === 'admin@dimbox.com' ||
            authState.user?.role === 'ADMIN' ||
            authState.user?.is_admin === true;

        if (!isAdmin) {
            console.log('🚫 ProtectedRoute: Sin permisos de admin, redirigiendo a dashboard');
            return <Navigate to="/dashboard" replace />;
        }

        console.log('✅ ProtectedRoute: Acceso admin permitido');
    }

    // ✅ ACCESO PERMITIDO
    console.log('✅ ProtectedRoute: Acceso permitido a:', location.pathname);
    return children;
}
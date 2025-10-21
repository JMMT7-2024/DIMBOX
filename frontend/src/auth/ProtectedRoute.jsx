// src/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Center, Spinner } from '@chakra-ui/react';

/**
 * Envuelve una página protegida.
 * - Si no hay usuario => redirige a /login
 * - Si adminOnly=true => solo permite role ADMIN o staff/superuser
 * - Muestra un spinner mientras Auth se inicializa
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Center minH="100vh" bg="var(--background)">
                <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="green.500" size="xl" />
            </Center>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly) {
        const isAdmin = user?.role === 'ADMIN' || user?.is_staff || user?.is_superuser;
        if (!isAdmin) return <Navigate to="/" replace />;
    }

    return children;
}

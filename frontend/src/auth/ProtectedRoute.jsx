// src/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ adminOnly = false }) {
    console.log("ProtectedRoute: 1. Verificando ruta...");
    const { user } = useAuth();
    const token = localStorage.getItem('access');
    console.log("ProtectedRoute: 2. Token encontrado en localStorage:", token);

    if (!token) {
        console.log("ProtectedRoute: 3. ¡No hay token! Redirigiendo a /login.");
        return <Navigate to="/login" replace />;
    }

    console.log("ProtectedRoute: 4. Sí hay token. Verificando permisos de admin...");

    if (adminOnly) {
        const me = JSON.parse(localStorage.getItem('me'));
        const effectiveUser = user || me;

        if (!effectiveUser || (effectiveUser.role !== 'ADMIN' && effectiveUser.role !== 'SUPERADMIN')) {
            console.log("ProtectedRoute: 5. No es admin. Redirigiendo a /.");
            return <Navigate to="/" replace />;
        }
    }

    console.log("ProtectedRoute: 6. Permisos OK. Dejando pasar.");
    return <Outlet />;
}
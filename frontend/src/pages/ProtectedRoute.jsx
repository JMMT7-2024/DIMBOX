// src/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ adminOnly = false }) {
    const { user } = useAuth(); // Obtenemos el usuario del contexto

    // --- ESTA ES LA LÍNEA CLAVE ---
    // Revisamos localStorage DIRECTAMENTE, es más rápido que el estado.
    const token = localStorage.getItem('access');

    if (!token) {
        // Si no hay token en localStorage, te mandamos al login.
        return <Navigate to="/login" replace />;
    }

    // Si llegamos aquí, SÍ tenemos un token.

    if (adminOnly) {
        // Para la ruta de admin, revisamos el rol
        const me = JSON.parse(localStorage.getItem('me'));
        const effectiveUser = user || me; // El usuario real

        if (!effectiveUser || (effectiveUser.role !== 'ADMIN' && effectiveUser.role !== 'SUPERADMIN')) {
            // Tiene token, pero no es admin. Lo mandamos al dashboard.
            return <Navigate to="/" replace />;
        }
    }

    // Tiene token y los permisos correctos. Pasa al Outlet (Dashboard o Admin).
    return <Outlet />;
}
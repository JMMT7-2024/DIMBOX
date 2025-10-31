// src/auth.js - VERSIÓN UNIFICADA Y COMPATIBLE
const ACCESS_KEY = 'authToken';    // ← UNIFICADO con api.js
const REFRESH_KEY = 'refresh';     // ← UNIFICADO con api.js
const USER_DATA_KEY = 'userData';  // ← CLAVE UNIFICADA

/**
 * ✅ GUARDAR TOKENS Y DATOS DE USUARIO DE FORMA UNIFICADA
 */
export function saveAuthData({ access, refresh, user = null }) {
    console.log('💾 Guardando datos de autenticación...');

    if (access) {
        localStorage.setItem(ACCESS_KEY, access);
        localStorage.setItem('access', access); // ← COMPATIBILIDAD
    }

    if (refresh) {
        localStorage.setItem(REFRESH_KEY, refresh);
        localStorage.setItem('refresh', refresh); // ← COMPATIBILIDAD
    }

    if (user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
        localStorage.setItem('cachedUser', JSON.stringify(user)); // ← COMPATIBILIDAD
    }

    localStorage.setItem('lastAuthCheck', Date.now().toString());
}

/**
 * ✅ OBTENER TOKEN DE ACCESO CON COMPATIBILIDAD
 */
export function getAccessToken() {
    return localStorage.getItem(ACCESS_KEY) ||
        localStorage.getItem('access') ||
        localStorage.getItem('authToken') ||
        '';
}

/**
 * ✅ OBTENER TOKEN DE REFRESH CON COMPATIBILIDAD
 */
export function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY) ||
        localStorage.getItem('refresh') ||
        '';
}

/**
 * ✅ OBTENER DATOS DEL USUARIO CON COMPATIBILIDAD
 */
export function getUserData() {
    try {
        const userData = localStorage.getItem(USER_DATA_KEY) ||
            localStorage.getItem('userData') ||
            localStorage.getItem('cachedUser');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('❌ Error parseando userData:', error);
        return null;
    }
}

/**
 * ✅ VERIFICAR SI ESTÁ AUTENTICADO
 */
export function isAuthenticated() {
    const token = getAccessToken();
    const user = getUserData();
    return Boolean(token && user);
}

/**
 * ✅ LIMPIAR TODOS LOS DATOS DE AUTENTICACIÓN
 */
export function clearAuthData() {
    console.log('🗑️ Limpiando todos los datos de autenticación...');

    // Limpiar todas las posibles claves
    const keysToRemove = [
        ACCESS_KEY, REFRESH_KEY, USER_DATA_KEY,
        'authToken', 'access', 'refresh',
        'userData', 'cachedUser', 'lastAuthCheck'
    ];

    keysToRemove.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`⚠️ No se pudo remover ${key}:`, error);
        }
    });
}

/**
 * ✅ HEADER DE AUTORIZACIÓN PARA API CALLS
 */
export function getAuthHeader() {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * ✅ VERIFICAR SI LOS DATOS ESTÁN EXPIRADOS (30 minutos)
 */
export function isAuthDataExpired() {
    const lastCheck = localStorage.getItem('lastAuthCheck');
    if (!lastCheck) return true;

    const THIRTY_MINUTES = 30 * 60 * 1000;
    return Date.now() - parseInt(lastCheck) > THIRTY_MINUTES;
}

/**
 * ✅ ACTUALIZAR MARCAS DE TIEMPO
 */
export function updateAuthTimestamp() {
    localStorage.setItem('lastAuthCheck', Date.now().toString());
}

export default {
    saveAuthData,
    getAccessToken,
    getRefreshToken,
    getUserData,
    isAuthenticated,
    clearAuthData,
    getAuthHeader,
    isAuthDataExpired,
    updateAuthTimestamp
};
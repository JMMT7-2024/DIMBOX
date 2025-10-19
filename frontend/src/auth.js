// src/auth.js
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export function saveTokens({ access, refresh }) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function getAccessToken() {
    return localStorage.getItem(ACCESS_KEY) || '';
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY) || '';
}

export function isLogged() {
    return Boolean(getAccessToken());
}

export function clearAuth() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
}

export function logout() {
    // Si luego agregas un endpoint de logout en el backend, llámalo aquí.
    clearAuth();
}

// Header listo para fetch: { Authorization: "Bearer xxx" }
export function authHeader() {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

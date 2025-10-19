// src/lib/api.js
// Base de la API: toma VITE_API_BASE_URL o cae a localhost
const BASE =
    (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api')
        .replace(/\/+$/, ''); // sin barra final

function authHeader() {
    const t = localStorage.getItem('accessToken');
    return t ? { Authorization: `Bearer ${t}` } : {};
}

async function apiFetch(path, opts = {}) {
    const {
        method = 'GET',
        headers = {},
        body,
        ...rest
    } = opts;

    const url = `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...authHeader(),
            ...headers,
        },
        body: body == null
            ? undefined
            : (typeof body === 'string' ? body : JSON.stringify(body)),
        ...rest,
    });

    // Intento único de refresh si 401
    if (res.status === 401) {
        const refresh = localStorage.getItem('refreshToken');
        if (refresh && !url.endsWith('/token/refresh/')) {
            const r = await fetch(`${BASE}/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh }),
            });
            if (r.ok) {
                const data = await r.json();
                if (data?.access) localStorage.setItem('accessToken', data.access);
                // reintenta la llamada original una sola vez
                return apiFetch(path, opts);
            }
            // refresh falló: limpia credenciales
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    }

    if (!res.ok) {
        let payload;
        try { payload = await res.json(); } catch { payload = {}; }
        const msg = payload?.detail || res.statusText || 'API error';
        const err = new Error(msg);
        err.status = res.status;
        err.payload = payload;
        throw err;
    }

    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
}

// ---------- Endpoints ----------

// Auth
export async function login(username, password) {
    const data = await apiFetch('/token/', {
        method: 'POST',
        body: { username, password },
    });
    if (data?.access) localStorage.setItem('accessToken', data.access);
    if (data?.refresh) localStorage.setItem('refreshToken', data.refresh);
    return data;
}

// Perfil / sesión
export const getMe = () => apiFetch('/me/');
export const getProfile = () => apiFetch('/profile/');

// Transacciones
export function getTransactions(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/transactions/${qs ? `?${qs}` : ''}`);
}

export const createTransaction = (payload) =>
    apiFetch('/transactions/', { method: 'POST', body: payload });

export const updateTransaction = (id, payload) =>
    apiFetch(`/transactions/${id}/`, { method: 'PUT', body: payload });

export const deleteTransaction = (id) =>
    apiFetch(`/transactions/${id}/`, { method: 'DELETE' });

export const exportCsv = () => apiFetch('/export/csv/');

// (opcional) export por defecto con todo agrupado
export default {
    login,
    getMe,
    getProfile,
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    exportCsv,
};




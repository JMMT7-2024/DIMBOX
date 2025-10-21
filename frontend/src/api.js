// src/api.js
import axios from 'axios';

// Base del backend (ya incluye /api)
const API_BASE_URL = 'https://dimbox.onrender.com/api';
// Para dev local podrías usar: const API_BASE_URL = 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

/* ============================
   Interceptores
================================ */
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si expira o es inválido el token => limpiamos y recargamos
        if (error.response?.status === 401) {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('me');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

/* ============================
   API PÚBLICA
================================ */
export default {
    /* ---------- Auth ---------- */
    async login(username, password) {
        // 1) Token
        const { data: { access, refresh } } = await apiClient.post('/token/', { username, password });

        // 2) Perfil con ese token (todavía no está en localStorage)
        const { data: me } = await apiClient.get('/me/', {
            headers: { Authorization: `Bearer ${access}` },
        });

        return { access, refresh, me };
    },

    register: (payload) => apiClient.post('/register/', payload),

    /* ---------- Perfil / Usuario ---------- */
    getProfile: () => apiClient.get('/profile/').then((r) => r.data),
    updateProfile: (payload) => apiClient.put('/profile/', payload).then((r) => r.data),

    /* ---------- Transacciones ---------- */
    getTransactions: () => apiClient.get('/transactions/').then((r) => r.data),
    createTransaction: (payload) => apiClient.post('/transactions/', payload).then((r) => r.data),
    deleteTransaction: (id) => apiClient.delete(`/transactions/${id}/`).then((r) => r.data),
    updateTransaction: (id, payload) => apiClient.put(`/transactions/${id}/`, payload).then((r) => r.data),

    exportCsv: () =>
        apiClient.get('/export/csv/', { responseType: 'blob' }), // r.data es el blob

    /* ============================
       ADMIN (func-based views)
       Endpoints en /api/admin/...
    ============================= */
    getAdminStats: () => apiClient.get('/admin/stats/').then((r) => r.data),

    /**
     * Lista de usuarios con filtros/paginación:
     * @param {Object} params
     *  - q: string (búsqueda en username/email/name)
     *  - plan: 'FREE' | 'PREMIUM'
     *  - active: 'true' | 'false'
     *  - page: number
     *  - page_size: number
     * Devuelve: { count, results: [...] }
     */
    getAdminUsers: (params = {}) =>
        apiClient.get('/admin/users/', { params }).then((r) => r.data),

    adminSetPlan: (userId, plan) =>
        apiClient.post(`/admin/users/${userId}/set-plan/`, { plan }).then((r) => r.data),

    adminSetActive: (userId, isActive) =>
        apiClient.post(`/admin/users/${userId}/set-active/`, { is_active: isActive }).then((r) => r.data),

    adminSetRole: (userId, role) =>
        apiClient.post(`/admin/users/${userId}/set-role/`, { role }).then((r) => r.data),
};

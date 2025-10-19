// src/api.js
import axios from 'axios';

// La URL de tu backend.
// Para desarrollo local:
const API_BASE_URL = 'http://localhost:8000/api';
// Para producción (ejemplo):
// const API_BASE_URL = 'https://tu-backend-en-la-nube.com/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

/**
 * Interceptor de Petición (Request)
 * Se ejecuta ANTES de que cada petición sea enviada.
 * Su trabajo es tomar el 'access' token desde localStorage
 * y añadirlo al header 'Authorization'.
 */
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('access');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Interceptor de Respuesta (Response)
 * Se ejecuta DESPUÉS de recibir una respuesta del backend.
 * Su trabajo es detectar errores, especialmente el '401 Unauthorized'.
 */
apiClient.interceptors.response.use(
    (response) => response, // Si todo está bien (2xx), devuelve la respuesta.
    (error) => {
        // Si recibimos un error 401 (Sesión expirada o token inválido)
        if (error.response?.status === 401) {
            console.error("Sesión expirada o inválida. Redirigiendo al login.");

            // Limpiamos el storage para forzar un cierre de sesión
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('me');

            // Recargamos la página. 
            // El componente ProtectedRoute se encargará de redirigir al /login
            window.location.reload();
        }

        // Rechazamos la promesa para que el .catch() en el componente se active
        return Promise.reject(error);
    }
);


// Exportamos un objeto con todas las funciones que la app necesita
export default {

    // --- Auth ---
    login: async (username, password) => {
        // 1. Pide el token
        const { data: { access, refresh } } = await apiClient.post('/token/', { username, password });

        // 2. Con el token, pide los datos del usuario ('me')
        const { data: me } = await apiClient.get('/me/', {
            headers: { Authorization: `Bearer ${access}` }
        });

        // Devolvemos todo para que AuthContext lo guarde
        return { access, refresh, me };
    },

    register: (data) => apiClient.post('/register/', data),

    // --- Perfil y Transacciones (Usuario) ---
    getProfile: () => apiClient.get('/profile/').then(res => res.data),

    updateProfile: (data) => apiClient.put('/profile/', data).then(res => res.data),

    getTransactions: () => apiClient.get('/transactions/').then(res => res.data),

    createTransaction: (data) => apiClient.post('/transactions/', data).then(res => res.data),

    deleteTransaction: (id) => apiClient.delete(`/transactions/${id}/`),

    updateTransaction: (id, data) => apiClient.put(`/transactions/${id}/`, data),

    exportCsv: () => {
        return apiClient.get('/export/csv/', {
            responseType: 'blob', // ¡Importante! Le dice a axios que espere un archivo
        });
    },

    // --- Funciones de Administración ---
    getAdminStats: () => apiClient.get('/admin/stats/').then(res => res.data),

    getAdminUsers: (query = '') => {
        const url = query ? `/admin/users/?q=${encodeURIComponent(query)}` : '/admin/users/';
        return apiClient.get(url).then(res => res.data);
    },

    adminSetPlan: (userId, plan) => {
        return apiClient.post(`/admin/users/${userId}/set-plan/`, { plan });
    },

    adminSetActive: (userId, isActive) => {
        return apiClient.post(`/admin/users/${userId}/set-active/`, { is_active: isActive });
    },

    adminSetRole: (userId, role) => {
        return apiClient.post(`/admin/users/${userId}/set-role/`, { role });
    }
};
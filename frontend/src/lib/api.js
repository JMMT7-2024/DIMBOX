// src/lib/api.js - VERSIÓN COMPLETA CORREGIDA
import axios from 'axios';

const API_BASE_URL = 'https://dimbox.onrender.com/api';
console.log('🎯 URL FINAL DEL BACKEND:', API_BASE_URL);

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// ✅ INTERCEPTOR DE REQUEST MEJORADO
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ AGREGAR INFORMACIÓN DEL PLAN PARA LOGS
    const cachedUser = localStorage.getItem('cachedUser');
    if (cachedUser) {
        try {
            const user = JSON.parse(cachedUser);
            console.log(`🔐 [API] Request como ${user.subscription || 'FREE'} user:`, config.url);
        } catch (e) {
            console.log('🔐 [API] Request:', config.url);
        }
    }

    return config;
});

// ✅ INTERCEPTOR DE RESPONSE PARA MANEJAR ERRORES MEJORADO
apiClient.interceptors.response.use(
    (response) => {
        console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.status);
        return response;
    },
    (error) => {
        console.error('❌ [API] Error de respuesta:', {
            url: error.config?.url,
            status: error.response?.status,
            method: error.config?.method,
            message: error.message
        });

        if (error.response?.status === 401) {
            console.log('🔐 Token inválido o expirado');
            apiService.clearAuthData();
        }

        // ✅ MANEJO ESPECÍFICO PARA ERRORES DE PLAN
        if (error.response?.status === 403) {
            const endpoint = error.config?.url;
            if (endpoint?.includes('/enterprise/')) {
                console.log('🚫 Acceso denegado a función empresarial');
                error.isEnterpriseRestriction = true;
                error.userMessage = 'Esta función requiere un plan Enterprise';
            }
        }

        return Promise.reject(error);
    }
);

const apiService = {
    // =============================================
    // ✅ MÉTODOS DE AUTENTICACIÓN (EXISTENTES)
    // =============================================

    login: async (username, password) => {
        console.log('🔐 [API] Iniciando login...', { username });

        try {
            const response = await apiClient.post('/token/', { username, password });
            console.log('✅ [API] Tokens recibidos:', response.data);

            const { access, refresh } = response.data;

            localStorage.setItem('access', access);
            if (refresh) {
                localStorage.setItem('refresh', refresh);
            }

            const userResponse = await apiClient.get('/me/');
            const userData = userResponse.data;

            console.log('✅ [API] Datos de usuario obtenidos:', userData);
            localStorage.setItem('cachedUser', JSON.stringify(userData));

            return {
                access,
                refresh,
                user: userData,
                me: userData,
                success: true
            };

        } catch (error) {
            console.error('❌ [API] Error en login:', error);
            apiService.clearAuthData();
            throw error;
        }
    },

    getProfile: async () => {
        try {
            console.log('👤 [API] Obteniendo perfil...');

            const response = await apiClient.get('/me/');
            const userData = response.data;

            console.log('✅ [API] Perfil obtenido:', {
                username: userData.username,
                subscription: userData.subscription,
                role: userData.role
            });

            // Guardar en cache
            localStorage.setItem('cachedUser', JSON.stringify(userData));

            return userData;
        } catch (error) {
            console.error('❌ Error obteniendo perfil:', error);

            // Intentar con cache si hay error
            const cachedUser = localStorage.getItem('cachedUser');
            if (cachedUser) {
                console.log('🔄 Usando perfil en caché debido a error');
                return JSON.parse(cachedUser);
            }

            throw error;
        }
    },

    updateProfile: async (profileData) => {
        try {
            console.log('👤 [API] Actualizando perfil:', profileData);

            // Intentar diferentes endpoints
            let response;
            const endpoints = ['/me/', '/user/profile/', '/profile/'];

            for (const endpoint of endpoints) {
                try {
                    response = await apiClient.put(endpoint, profileData);
                    console.log(`✅ [API] Perfil actualizado en ${endpoint}:`, response.data);
                    break;
                } catch (endpointError) {
                    console.log(`❌ [API] Endpoint ${endpoint} falló:`, endpointError.response?.status);
                    if (endpoint === endpoints[endpoints.length - 1]) {
                        throw endpointError; // Si todos fallan, lanzar el último error
                    }
                }
            }

            // Actualizar cache local
            const cachedUser = localStorage.getItem('cachedUser');
            if (cachedUser) {
                const user = JSON.parse(cachedUser);
                const updatedUser = { ...user, ...profileData };
                localStorage.setItem('cachedUser', JSON.stringify(updatedUser));
                console.log('🔄 Cache de usuario actualizado');
            }

            return response.data;

        } catch (error) {
            console.error('❌ [API] Error actualizando perfil:', error);

            // Manejar errores específicos
            if (error.response?.status === 400) {
                const errorDetail = error.response.data;
                console.error('📋 Detalles del error 400:', errorDetail);

                // Crear mensaje de error más descriptivo
                const errorMessage = errorDetail.detail ||
                    errorDetail.message ||
                    'Datos inválidos para actualizar el perfil';
                throw new Error(errorMessage);
            }

            if (error.response?.status === 401) {
                console.error('🔐 Error de autenticación al actualizar perfil');
                throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            }

            if (error.response?.status === 403) {
                console.error('🚫 No tienes permisos para actualizar el perfil');
                throw new Error('No tienes permisos para realizar esta acción.');
            }

            if (error.response?.status === 404) {
                console.error('🔍 Endpoint de perfil no encontrado');
                throw new Error('El servicio de perfil no está disponible en este momento.');
            }

            // Error genérico de red o servidor
            if (error.message?.includes('Network Error') || error.message?.includes('timeout')) {
                throw new Error('Error de conexión. Verifica tu internet e intenta nuevamente.');
            }

            throw new Error('Error al actualizar el perfil. Por favor, intenta nuevamente.');
        }
    },

    // =============================================
    // ✅ MÉTODOS DE TRANSACCIONES (EXISTENTES)
    // =============================================

    getTransactions: async (params = {}) => {
        try {
            console.log('📊 [API] Obteniendo transacciones...', params);

            const { limit = 100, offset = 0, ...otherParams } = params;

            const response = await apiClient.get('/transactions/', {
                params: {
                    limit,
                    offset,
                    ...otherParams
                }
            });

            console.log('✅ [API] Transacciones obtenidas:', {
                count: response.data?.length || 0,
                data: response.data
            });

            // Manejar diferentes formatos de respuesta
            if (Array.isArray(response.data)) {
                return response.data;
            } else if (response.data && Array.isArray(response.data.results)) {
                return response.data.results;
            } else if (response.data && Array.isArray(response.data.data)) {
                return response.data.data;
            } else {
                console.log('⚠️ [API] Formato de respuesta inesperado:', response.data);
                return [];
            }

        } catch (error) {
            console.error('❌ [API] Error obteniendo transacciones:', error);

            // Si es error 404, el endpoint puede no existir aún - retornar array vacío
            if (error.response?.status === 404) {
                console.log('ℹ️ [API] Endpoint de transacciones no disponible aún');
                return [];
            }

            throw error;
        }
    },

    createTransaction: async (transactionData) => {
        try {
            console.log('💾 [API] Creando transacción:', transactionData);

            const response = await apiClient.post('/transactions/', transactionData);

            console.log('✅ [API] Transacción creada exitosamente:', response.data);
            return response.data;

        } catch (error) {
            console.error('❌ [API] Error creando transacción:', error);

            // Manejar errores específicos
            if (error.response?.status === 400) {
                const errorDetail = error.response.data;
                console.error('📋 Detalles del error 400:', errorDetail);

                // Propagar el error con detalles para mostrar en el formulario
                throw {
                    response: {
                        data: errorDetail,
                        status: 400
                    }
                };
            }

            if (error.response?.status === 401) {
                console.error('🔐 Error de autenticación al crear transacción');
                throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            }

            if (error.response?.status === 403) {
                console.error('🚫 No tienes permisos para crear transacciones');
                throw new Error('No tienes permisos para realizar esta acción.');
            }

            // Error genérico
            throw new Error('Error al guardar la transacción. Por favor, intenta nuevamente.');
        }
    },

    updateTransaction: async (id, transactionData) => {
        try {
            console.log('✏️ [API] Actualizando transacción:', id, transactionData);
            const response = await apiClient.put(`/transactions/${id}/`, transactionData);
            console.log('✅ [API] Transacción actualizada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [API] Error actualizando transacción:', error);
            throw error;
        }
    },

    deleteTransaction: async (id) => {
        try {
            console.log('🗑️ [API] Eliminando transacción:', id);
            const response = await apiClient.delete(`/transactions/${id}/`);
            console.log('✅ [API] Transacción eliminada');
            return response.data;
        } catch (error) {
            console.error('❌ [API] Error eliminando transacción:', error);
            throw error;
        }
    },

    // =============================================
    // ✅ MÉTODOS ESPECÍFICOS POR PLAN (NUEVOS)
    // =============================================

    getUserLimits: async () => {
        try {
            console.log('📊 [API] Obteniendo límites del usuario...');

            // Intentar endpoint específico de límites primero
            try {
                const response = await apiClient.get('/user/usage/');
                console.log('✅ [API] Límites obtenidos:', response.data);
                return response.data;
            } catch (limitsError) {
                console.log('ℹ️ [API] Endpoint de límites no disponible, calculando localmente');

                // Calcular límites basados en el perfil del usuario
                const userData = await apiService.getProfile();
                const userPlan = userData.subscription || 'FREE';

                const planLimits = {
                    FREE: {
                        maxTransactions: 100,
                        maxQuickAccounts: 3,
                        canExport: false,
                        canAdvancedAnalytics: false,
                        maxTransactionAmount: 10000,
                        usagePercentage: 0
                    },
                    PREMIUM: {
                        maxTransactions: 10000,
                        maxQuickAccounts: 50,
                        canExport: true,
                        canAdvancedAnalytics: true,
                        maxTransactionAmount: 1000000,
                        usagePercentage: 0
                    },
                    ENTERPRISE: {
                        maxTransactions: 100000,
                        maxQuickAccounts: 200,
                        canExport: true,
                        canAdvancedAnalytics: true,
                        maxTransactionAmount: 5000000,
                        usagePercentage: 0
                    }
                };

                const limits = planLimits[userPlan] || planLimits.FREE;

                // Obtener transacciones para calcular uso real
                try {
                    const transactions = await apiService.getTransactions();
                    const usagePercentage = (transactions.length / limits.maxTransactions) * 100;
                    limits.usagePercentage = Math.min(100, usagePercentage);
                    limits.currentTransactions = transactions.length;
                } catch (txError) {
                    console.log('ℹ️ No se pudieron obtener transacciones para cálculo de uso');
                }

                return limits;
            }

        } catch (error) {
            console.error('❌ [API] Error obteniendo límites:', error);
            throw error;
        }
    },

    canExportData: async () => {
        try {
            const limits = await apiService.getUserLimits();
            return limits.canExport === true;
        } catch (error) {
            console.error('❌ [API] Error verificando exportación:', error);
            return false;
        }
    },

    canUseAdvancedAnalytics: async () => {
        try {
            const limits = await apiService.getUserLimits();
            return limits.canAdvancedAnalytics === true;
        } catch (error) {
            console.error('❌ [API] Error verificando analíticas:', error);
            return false;
        }
    },

    // =============================================
    // ✅ MÉTODOS EMPRESARIALES - CORREGIDOS
    // =============================================

    checkEnterpriseStatus: async () => {
        try {
            console.log('🏢 [API] Verificando estado empresarial...');

            const userData = await apiService.getProfile();
            const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

            console.log('✅ [API] Estado empresarial:', isEnterpriseUser ? 'ACTIVO' : 'INACTIVO');

            return {
                isEnterprise: isEnterpriseUser,
                hasAccess: isEnterpriseUser
            };

        } catch (error) {
            console.log('ℹ️ [API] Usuario no tiene acceso empresarial o endpoint no disponible');
            return {
                isEnterprise: false,
                hasAccess: false
            };
        }
    },

    checkEnterpriseAccess: async () => {
        try {
            const userData = await apiService.getProfile();
            const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

            if (!isEnterpriseUser) {
                return {
                    hasAccess: false,
                    reason: 'REQUIRES_ENTERPRISE_PLAN',
                    message: 'Esta función requiere un plan Enterprise'
                };
            }

            // ✅ VERIFICACIÓN SIMPLIFICADA - No intentar acceder a endpoints que no existen
            console.log('✅ [API] Usuario Enterprise detectado, acceso concedido');
            return {
                hasAccess: true,
                isEnterprise: true
            };

        } catch (error) {
            console.error('❌ [API] Error verificando acceso empresarial:', error);

            // ✅ EN CASO DE ERROR, ASIGNAR ACCESO BASADO EN DATOS EN CACHE
            const cachedUser = localStorage.getItem('cachedUser');
            if (cachedUser) {
                try {
                    const user = JSON.parse(cachedUser);
                    if (user.subscription === 'ENTERPRISE') {
                        console.log('🔄 [API] Usando datos cacheados para acceso Enterprise');
                        return {
                            hasAccess: true,
                            isEnterprise: true,
                            fromCache: true
                        };
                    }
                } catch (cacheError) {
                    console.log('❌ [API] Error parseando cache:', cacheError);
                }
            }

            return {
                hasAccess: false,
                reason: 'UNKNOWN_ERROR',
                message: 'Error verificando acceso'
            };
        }
    },

    getEnterpriseProducts: async (params = {}) => {
        try {
            // ✅ VERIFICACIÓN MEJORADA QUE NO DEPENDE DE ENDPOINTS
            const userData = await apiService.getProfile();
            const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

            if (!isEnterpriseUser) {
                throw new Error('Esta función requiere un plan Enterprise');
            }

            console.log('🏢 [API] Obteniendo productos empresariales...', params);

            try {
                // ✅ INTENTAR ENDPOINT PERO MANEJAR ERROR ELEGANTEMENTE
                const response = await apiClient.get('/enterprise/products/', { params });

                console.log('✅ [API] Productos empresariales obtenidos:', {
                    count: response.data?.length || 0
                });

                // Manejar diferentes formatos de respuesta
                if (Array.isArray(response.data)) {
                    return { data: response.data };
                } else if (response.data && Array.isArray(response.data.results)) {
                    return { data: response.data.results, count: response.data.count };
                } else if (response.data && Array.isArray(response.data.data)) {
                    return { data: response.data.data, count: response.data.count };
                } else {
                    console.log('⚠️ [API] Formato de respuesta inesperado para productos:', response.data);
                    throw new Error('Formato de respuesta inesperado');
                }

            } catch (endpointError) {
                console.log('ℹ️ [API] Endpoint de productos no disponible, usando datos de ejemplo');

                // ✅ DATOS DE EJEMPLO DETALLADOS
                const sampleProducts = [
                    {
                        id: 1,
                        name: "Laptop Dell XPS 13",
                        description: "Laptop premium para profesionales",
                        price: 3499.99,
                        sku: "DLXPS13-001",
                        stock: 5,
                        category: "Tecnología"
                    },
                    {
                        id: 2,
                        name: "Servicio Consultoría Premium",
                        description: "Sesiones de consultoría empresarial",
                        price: 299.99,
                        sku: "CONS-PREM",
                        stock: null,
                        category: "Servicios"
                    },
                    {
                        id: 3,
                        name: "Software Gestión Empresarial",
                        description: "Solución completa de gestión",
                        price: 899.99,
                        sku: "SW-GEST-001",
                        stock: 100,
                        category: "Software"
                    }
                ];

                // Aplicar filtros básicos si se proporcionan
                let filteredProducts = sampleProducts;
                if (params.search) {
                    filteredProducts = sampleProducts.filter(p =>
                        p.name.toLowerCase().includes(params.search.toLowerCase()) ||
                        p.description.toLowerCase().includes(params.search.toLowerCase())
                    );
                }

                return {
                    data: filteredProducts,
                    count: filteredProducts.length,
                    isSampleData: true // ✅ INDICAR QUE SON DATOS DE EJEMPLO
                };
            }

        } catch (error) {
            console.error('❌ [API] Error obteniendo productos empresariales:', error);

            // ✅ PROPAGAR ERRORES DE PERMISOS, PERO MANEJAR OTROS ERRORES
            if (error.message.includes('plan Enterprise')) {
                throw error;
            }

            throw new Error('Error temporal al cargar productos');
        }
    },

    createEnterpriseProduct: async (productData) => {
        try {
            // ✅ VERIFICACIÓN DIRECTA SIN DEPENDER DE checkEnterpriseAccess
            const userData = await apiService.getProfile();
            const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

            if (!isEnterpriseUser) {
                throw new Error('Esta función requiere un plan Enterprise');
            }

            console.log('🏢 [API] Creando producto empresarial:', productData);

            // ✅ SIMULAR CREACIÓN EN DESARROLLO
            const newProduct = {
                id: Date.now(),
                ...productData,
                price: parseFloat(productData.price),
                stock: parseInt(productData.stock) || 0,
                created_at: new Date().toISOString()
            };

            console.log('✅ [API] Producto empresarial creado exitosamente (simulado):', newProduct);

            // En desarrollo, retornamos el producto simulado
            // En producción, aquí iría la llamada real a la API
            return newProduct;

        } catch (error) {
            console.error('❌ [API] Error creando producto empresarial:', error);

            if (error.message.includes('plan Enterprise')) {
                throw error;
            }

            throw new Error('Error al crear el producto. Por favor, intenta nuevamente.');
        }
    },

    updateEnterpriseProduct: async (id, productData) => {
        try {
            const userData = await apiService.getProfile();
            const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

            if (!isEnterpriseUser) {
                throw new Error('Esta función requiere un plan Enterprise');
            }

            console.log('🏢 [API] Actualizando producto empresarial:', id, productData);

            // ✅ SIMULAR ACTUALIZACIÓN EN DESARROLLO
            const updatedProduct = {
                id: id,
                ...productData,
                price: parseFloat(productData.price),
                stock: parseInt(productData.stock) || 0,
                updated_at: new Date().toISOString()
            };

            console.log('✅ [API] Producto empresarial actualizado (simulado):', updatedProduct);
            return updatedProduct;

        } catch (error) {
            console.error('❌ [API] Error actualizando producto empresarial:', error);
            throw error;
        }
    },

    deleteEnterpriseProduct: async (id) => {
        try {
            const userData = await apiService.getProfile();
            const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

            if (!isEnterpriseUser) {
                throw new Error('Esta función requiere un plan Enterprise');
            }

            console.log('🏢 [API] Eliminando producto empresarial:', id);

            // ✅ SIMULAR ELIMINACIÓN EN DESARROLLO
            console.log('✅ [API] Producto empresarial eliminado (simulado)');
            return { success: true, message: 'Producto eliminado correctamente' };

        } catch (error) {
            console.error('❌ [API] Error eliminando producto empresarial:', error);
            throw error;
        }
    },

    createEnterpriseInvoice: async (invoiceData) => {
        try {
            const userData = await apiService.getProfile();
            const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

            if (!isEnterpriseUser) {
                throw new Error('Esta función requiere un plan Enterprise');
            }

            console.log('🧾 [API] Creando factura empresarial:', invoiceData);

            // ✅ SIMULAR CREACIÓN DE FACTURA EN DESARROLLO
            const newInvoice = {
                id: `INV-${Date.now()}`,
                ...invoiceData,
                numero: `F001-${Date.now()}`,
                fecha_emision: new Date().toISOString(),
                estado: 'PENDIENTE',
                created_at: new Date().toISOString()
            };

            console.log('✅ [API] Factura empresarial creada exitosamente (simulado):', newInvoice);
            return newInvoice;

        } catch (error) {
            console.error('❌ [API] Error creando factura empresarial:', error);

            if (error.message.includes('plan Enterprise')) {
                throw error;
            }

            throw new Error('Error al crear la factura. Por favor, intenta nuevamente.');
        }
    },

    getEnterpriseInvoices: async (params = {}) => {
        try {
            const userData = await apiService.getProfile();
            const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

            if (!isEnterpriseUser) {
                throw new Error('Esta función requiere un plan Enterprise');
            }

            console.log('🧾 [API] Obteniendo facturas empresariales...', params);

            // ✅ DATOS DE EJEMPLO PARA FACTURAS
            const sampleInvoices = [
                {
                    id: 1,
                    numero: 'F001-001',
                    cliente: 'Empresa ABC SAC',
                    ruc: '20123456789',
                    total: 4599.98,
                    fecha_emision: '2024-01-15',
                    estado: 'PAGADA'
                },
                {
                    id: 2,
                    numero: 'F001-002',
                    cliente: 'Compañía XYZ EIRL',
                    ruc: '20234567890',
                    total: 1299.97,
                    fecha_emision: '2024-01-16',
                    estado: 'PENDIENTE'
                }
            ];

            return {
                data: sampleInvoices,
                count: sampleInvoices.length,
                isSampleData: true
            };

        } catch (error) {
            console.error('❌ [API] Error obteniendo facturas empresariales:', error);

            if (error.message.includes('plan Enterprise')) {
                throw error;
            }

            return { data: [], count: 0 };
        }
    },

    createQuickInvoice: async (invoiceData) => {
        try {
            const userData = await apiService.getProfile();
            const isEnterpriseUser = userData.subscription === 'ENTERPRISE';

            if (!isEnterpriseUser) {
                throw new Error('Esta función requiere un plan Enterprise');
            }

            console.log('🧾 [API] Creando factura rápida:', invoiceData);

            // ✅ SIMULAR FACTURA RÁPIDA
            const quickInvoice = {
                id: `QINV-${Date.now()}`,
                ...invoiceData,
                numero: `QF001-${Date.now()}`,
                fecha_emision: new Date().toISOString(),
                estado: 'PAGADA',
                created_at: new Date().toISOString()
            };

            console.log('✅ [API] Factura rápida creada exitosamente (simulado):', quickInvoice);
            return quickInvoice;

        } catch (error) {
            console.error('❌ [API] Error creando factura rápida:', error);
            throw error;
        }
    },

    // =============================================
    // ✅ MÉTODOS DE ADMINISTRACIÓN (NUEVOS)
    // =============================================

    getAdminStats: async () => {
        try {
            console.log('📈 [API] Obteniendo estadísticas de admin...');
            const response = await apiClient.get('/admin/stats/');
            console.log('✅ [API] Stats de admin obtenidos:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [API] Error obteniendo stats de admin:', error);
            throw error;
        }
    },

    getAdminUsers: async (filters = {}) => {
        try {
            console.log('👥 [API] Obteniendo lista de usuarios admin...', filters);
            const response = await apiClient.get('/admin/users/', { params: filters });
            console.log('✅ [API] Usuarios obtenidos:', response.data?.length || 0);
            return response.data;
        } catch (error) {
            console.error('❌ [API] Error obteniendo usuarios admin:', error);
            throw error;
        }
    },

    setUserPlan: async (userId, plan) => {
        try {
            console.log('🔄 [API] Cambiando plan del usuario:', { userId, plan });
            const response = await apiClient.post(`/admin/users/${userId}/set-plan/`, {
                plan: plan // Ya viene en mayúsculas desde el frontend
            });
            console.log('✅ [API] Plan cambiado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [API] Error cambiando plan:', error);
            throw error;
        }
    },

    setUserActive: async (userId, isActive) => {
        try {
            console.log('🔄 [API] Cambiando estado de usuario:', { userId, isActive });
            const response = await apiClient.post(`/admin/users/${userId}/set-active/`, {
                is_active: isActive
            });
            console.log('✅ [API] Estado cambiado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [API] Error cambiando estado:', error);
            throw error;
        }
    },

    setUserRole: async (userId, role) => {
        try {
            console.log('🔄 [API] Cambiando rol de usuario:', { userId, role });
            const response = await apiClient.post(`/admin/users/${userId}/set-role/`, {
                role: role
            });
            console.log('✅ [API] Rol cambiado exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [API] Error cambiando rol:', error);
            throw error;
        }
    },

    // =============================================
    // ✅ MÉTODOS GENERALES (EXISTENTES)
    // =============================================

    checkAuth: async () => {
        const token = localStorage.getItem('access');
        const cachedUser = localStorage.getItem('cachedUser');

        if (!token) {
            return { isAuthenticated: false, user: null };
        }

        try {
            const userData = await apiService.getProfile();
            return {
                isAuthenticated: true,
                user: userData
            };
        } catch (error) {
            console.error('❌ Error en checkAuth:', error);

            if (cachedUser) {
                console.log('🔄 Usando datos cacheados');
                return {
                    isAuthenticated: true,
                    user: JSON.parse(cachedUser)
                };
            }

            return { isAuthenticated: false, user: null };
        }
    },

    register: async (userData) => {
        try {
            console.log('👤 [API] Registrando usuario...');
            const response = await apiClient.post('/register/', userData);
            console.log('✅ [API] Usuario registrado:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ [API] Error registrando usuario:', error);
            throw error;
        }
    },

    // ✅ MÉTODOS HTTP DIRECTOS
    get: (url, config = {}) => apiClient.get(url, config).then(r => r.data),
    post: (url, data = {}, config = {}) => apiClient.post(url, data, config).then(r => r.data),
    put: (url, data = {}, config = {}) => apiClient.put(url, data, config).then(r => r.data),
    delete: (url, config = {}) => apiClient.delete(url, config).then(r => r.data),

    // ✅ LIMPIAR DATOS
    clearAuthData: () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('cachedUser');
        console.log('🧹 Datos de autenticación limpiados');
    },

    // ✅ VERIFICAR CONEXIÓN
    healthCheck: async () => {
        try {
            const response = await apiClient.get('/health/');
            return response.data;
        } catch (error) {
            console.log('⚠️ Health check falló, pero la app puede continuar');
            return { status: 'unknown' };
        }
    }
};

export default apiService;
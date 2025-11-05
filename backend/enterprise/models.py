// /root/DIMBOX/frontend/src/features/enterprise/components/services/enterpriseApi.js - VERSIÓN CORREGIDA
import api from '../../../../lib/api';

class EnterpriseApiService {
    // ✅ VERIFICAR DISPONIBILIDAD MEJORADA
    async checkAvailability() {
        try {
            console.log('🔍 Verificando módulo empresarial...');

            const healthResponse = await api.get('/health/');
            console.log('✅ Health check:', healthResponse);

            try {
                const productsResponse = await api.getEnterpriseProducts();
                console.log('📦 Respuesta GET productos:', productsResponse);

                return {
                    available: true,
                    health: healthResponse.data,
                    products: productsResponse.data,
                    message: 'Módulo empresarial disponible'
                };
            } catch (enterpriseError) {
                console.error('❌ Error módulo empresarial:', enterpriseError);
                return {
                    available: false,
                    health: healthResponse.data,
                    error: 'Error en módulo empresarial',
                    status: enterpriseError.response?.status,
                    details: enterpriseError.response?.data
                };
            }

        } catch (error) {
            console.error('❌ Error verificando disponibilidad:', error);
            return {
                available: false,
                error: 'Error de conexión con el servidor',
                status: error.response?.status,
                details: error.message
            };
        }
    }

    // ✅ PRODUCTOS - CORREGIDOS SEGÚN MODELO
    async getProducts(params = {}) {
        try {
            console.log('🔍 [API] Obteniendo productos...');

            const response = await api.getEnterpriseProducts(params);
            console.log('📦 Respuesta completa de productos:', response);

            let productsArray = [];

            if (response && response.data) {
                productsArray = response.data;
                console.log(`📦 [API] ${productsArray.length} productos obtenidos desde API estructurada`);
            } else if (Array.isArray(response)) {
                productsArray = response;
                console.log(`📦 [API] ${productsArray.length} productos obtenidos (array directo)`);
            } else {
                console.log('⚠️ [API] Estructura de respuesta no reconocida:', response);
            }

            return productsArray;

        } catch (error) {
            console.error('❌ [API] Error obteniendo productos:', error);
            throw this.handleError(error, 'Error al cargar productos');
        }
    }

    async createProduct(productData) {
        try {
            console.log('📦 [API] Creando producto:', productData);

            if (!productData.name?.trim()) {
                throw new Error('El nombre del producto es obligatorio');
            }

            const payload = {
                name: String(productData.name).trim(),
                description: String(productData.description || '').trim(),
                price: this.safeNumber(productData.price, 0),
                cost: productData.cost !== undefined ? this.safeNumber(productData.cost, null) : null,
                category: String(productData.category || 'PRODUCT'),
                stock: this.safeNumber(productData.stock, 0),
                tax_rate: this.safeNumber(productData.tax_rate, 18.0),
                sku: productData.sku || '', // Se genera automáticamente en el backend
                is_active: productData.is_active !== false
            };

            const response = await api.createEnterpriseProduct(payload);
            console.log('✅ [API] Producto creado:', response);
            return response;

        } catch (error) {
            console.error('❌ [API] Error creando producto:', error);
            throw this.handleError(error, 'Error al crear producto');
        }
    }

    async updateProduct(productId, productData) {
        try {
            console.log('✏️ [API] Actualizando producto:', productId);

            const payload = {
                name: String(productData.name).trim(),
                description: String(productData.description || '').trim(),
                price: this.safeNumber(productData.price, 0),
                cost: productData.cost !== undefined ? this.safeNumber(productData.cost, null) : null,
                category: String(productData.category || 'PRODUCT'),
                stock: this.safeNumber(productData.stock, 0),
                tax_rate: this.safeNumber(productData.tax_rate, 18.0),
                is_active: productData.is_active !== false
            };

            const response = await api.updateEnterpriseProduct(productId, payload);
            console.log('✅ [API] Producto actualizado:', response);
            return response;

        } catch (error) {
            console.error('❌ [API] Error actualizando producto:', error);
            throw this.handleError(error, 'Error al actualizar producto');
        }
    }

    async deleteProduct(productId) {
        try {
            console.log('🗑️ [API] Eliminando producto:', productId);

            const response = await api.deleteEnterpriseProduct(productId);
            console.log('✅✅✅ [API] Eliminación exitosa - Status:', response.status);

            return {
                success: true,
                message: 'Producto eliminado correctamente',
                status: response.status
            };

        } catch (error) {
            console.error('❌ [API] Error eliminando producto:', error);

            if (error.response?.status === 404) {
                throw new Error('Producto no encontrado');
            } else if (error.response?.status === 409) {
                throw new Error('No se puede eliminar - está en uso en facturas');
            } else {
                throw new Error('Error al eliminar producto');
            }
        }
    }

    async getProductById(productId) {
        try {
            console.log('🔍 [API] Obteniendo producto por ID:', productId);

            const response = await api.get(`/enterprise/products/${productId}/`);
            console.log('✅ [API] Producto obtenido:', response);
            return response.data || response;

        } catch (error) {
            console.error('❌ [API] Error obteniendo producto:', error);

            if (error.response?.status === 404) {
                throw new Error('Producto no encontrado');
            }

            throw this.handleError(error, 'Error al cargar producto');
        }
    }

    // ✅ CLIENTES - CORREGIDOS SEGÚN MODELO SIMPLIFICADO
    async getClients(params = {}) {
        try {
            console.log('👥 [API] Obteniendo clientes empresariales...');

            const response = await api.getEnterpriseClients(params);
            console.log('✅ [API] Respuesta clientes:', response);

            let clientsArray = [];

            if (response && response.data) {
                clientsArray = response.data;
                console.log(`👥 [API] ${clientsArray.length} clientes obtenidos desde API estructurada`);
            } else if (Array.isArray(response)) {
                clientsArray = response;
                console.log(`👥 [API] ${clientsArray.length} clientes obtenidos (array directo)`);
            }

            return clientsArray;

        } catch (error) {
            console.error('❌ [API] Error obteniendo clientes:', error);
            throw this.handleError(error, 'Error al cargar clientes');
        }
    }

    async createClient(clientData) {
        try {
            console.log('👥 [API] Creando cliente con estructura simplificada...');

            // ✅ Validaciones según el modelo
            if (!clientData.name?.trim()) {
                throw new Error('El nombre del cliente es obligatorio');
            }

            if (!clientData.document_number?.trim()) {
                throw new Error('El número de documento es obligatorio');
            }

            const payload = {
                name: String(clientData.name).trim(),
                document_type: clientData.document_type || 'DNI',
                document_number: String(clientData.document_number).trim(),
                phone: clientData.phone?.trim() || '',
                email: clientData.email?.trim() || ''
            };

            console.log('📤 [API] Payload cliente simplificado:', payload);

            const response = await api.createEnterpriseClient(payload);
            console.log('✅ [API] Cliente creado exitosamente:', response);

            return response;

        } catch (error) {
            console.error('❌ [API] Error creando cliente:', error);

            if (error.response?.status === 400) {
                const validationError = new Error('Datos de cliente inválidos');
                validationError.status = 400;
                validationError.details = error.response.data;
                validationError.userMessage = this.parseValidationErrors(error.response.data);
                throw validationError;
            }

            if (error.response?.status === 409) {
                throw new Error('Ya existe un cliente con este número de documento');
            }

            throw this.handleError(error, 'Error al crear cliente');
        }
    }

    async updateClient(clientId, clientData) {
        try {
            console.log('✏️ [API] Actualizando cliente:', clientId);

            const payload = {
                name: String(clientData.name).trim(),
                document_type: clientData.document_type || 'DNI',
                document_number: String(clientData.document_number).trim(),
                phone: clientData.phone?.trim() || '',
                email: clientData.email?.trim() || ''
            };

            const response = await api.updateEnterpriseClient(clientId, payload);
            console.log('✅ [API] Cliente actualizado:', response);
            return response;

        } catch (error) {
            console.error('❌ [API] Error actualizando cliente:', error);
            throw this.handleError(error, 'Error al actualizar cliente');
        }
    }

    async getClientById(clientId) {
        try {
            console.log('🔍 [API] Obteniendo cliente por ID:', clientId);

            const response = await api.get(`/enterprise/clients/${clientId}/`);
            console.log('✅ [API] Cliente obtenido:', response);
            return response.data || response;

        } catch (error) {
            console.error('❌ [API] Error obteniendo cliente:', error);
            throw this.handleError(error, 'Error al cargar cliente');
        }
    }

    async deleteClient(clientId) {
        try {
            console.log('🗑️ [API] Eliminando cliente:', clientId);

            const response = await api.deleteEnterpriseClient(clientId);
            console.log('✅ [API] Cliente eliminado:', response);

            return { success: true, message: 'Cliente eliminado correctamente' };

        } catch (error) {
            console.error('❌ [API] Error eliminando cliente:', error);
            throw this.handleError(error, 'Error al eliminar cliente');
        }
    }

    // ✅ FACTURAS - CORREGIDAS SEGÚN MODELO
    async getInvoices(params = {}) {
        try {
            console.log('📋 [API] Obteniendo facturas...');

            const response = await api.getEnterpriseInvoices(params);

            let invoicesArray = [];

            if (response && response.data) {
                invoicesArray = response.data;
                console.log(`📋 [API] ${invoicesArray.length} facturas obtenidas desde API estructurada`);
            } else if (Array.isArray(response)) {
                invoicesArray = response;
                console.log(`📋 [API] ${invoicesArray.length} facturas obtenidas (array directo)`);
            }

            return invoicesArray;

        } catch (error) {
            console.error('❌ [API] Error obteniendo facturas:', error);
            throw this.handleError(error, 'Error al cargar facturas');
        }
    }

    async createInvoice(invoiceData) {
        try {
            console.log('🧾 [API] Creando factura:', invoiceData);

            // ✅ Validaciones según el modelo
            if (!invoiceData.client_name?.trim()) {
                throw new Error('El nombre del cliente es obligatorio');
            }

            if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
                throw new Error('La factura debe contener al menos un producto');
            }

            // ✅ Preparar items según modelo InvoiceItem
            const validItems = invoiceData.items.map(item => {
                if (!item.product_id) {
                    throw new Error('Cada producto debe tener un ID válido');
                }
                if (!item.quantity || item.quantity < 1) {
                    throw new Error('Cada producto debe tener una cantidad válida');
                }
                return {
                    product: item.product_id, // Clave foránea al producto
                    quantity: Math.max(1, parseInt(item.quantity)),
                    unit_price: this.safeNumber(item.unit_price, 0),
                    tax_rate: this.safeNumber(item.tax_rate, 18.0)
                };
            });

            const payload = {
                client_name: invoiceData.client_name,
                client_ruc: invoiceData.client_ruc || '',
                client_address: invoiceData.client_address || '',
                client_email: invoiceData.client_email || '',
                items: validItems,
                payment_method: invoiceData.payment_method || 'CASH',
                issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
                due_date: invoiceData.due_date || this.calculateDueDate(invoiceData.issue_date),
                subtotal: this.safeNumber(invoiceData.subtotal, 0),
                tax_amount: this.safeNumber(invoiceData.tax_amount, 0),
                total: this.safeNumber(invoiceData.total, 0),
                status: invoiceData.status || 'DRAFT'
            };

            console.log('📤 [API] Payload factura completo:', payload);

            const response = await api.createEnterpriseInvoice(payload);
            console.log('✅ [API] Factura creada:', response);

            return response;

        } catch (error) {
            console.error('❌ [API] Error creando factura:', error);

            if (error.response?.status === 400) {
                console.log('🔍 [API] DEBUG Error 400 factura:', error.response.data);
            }

            throw this.handleError(error, 'Error al crear factura');
        }
    }

    async getInvoiceById(invoiceId) {
        try {
            console.log('🔍 [API] Obteniendo factura por ID:', invoiceId);
            const response = await api.get(`/enterprise/invoices/${invoiceId}/`);
            console.log('✅ [API] Factura obtenida:', response);
            return response.data || response;

        } catch (error) {
            console.error('❌ [API] Error obteniendo factura:', error);
            throw this.handleError(error, 'Error al cargar factura');
        }
    }

    async updateInvoiceStatus(invoiceId, status, paidDate = null) {
        try {
            console.log('🔄 [API] Actualizando estado de factura:', { invoiceId, status, paidDate });

            const payload = { status };
            if (paidDate) {
                payload.paid_date = paidDate;
            }

            const response = await api.patch(`/enterprise/invoices/${invoiceId}/`, payload);
            console.log('✅ [API] Estado de factura actualizado:', response);
            return response.data || response;

        } catch (error) {
            console.error('❌ [API] Error actualizando estado de factura:', error);
            throw this.handleError(error, 'Error al actualizar estado de factura');
        }
    }

    async downloadInvoice(invoiceId) {
        try {
            console.log('📥 [API] Descargando factura:', invoiceId);
            const response = await api.get(`/enterprise/invoices/${invoiceId}/download/`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `factura-${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            console.log('✅ [API] Factura descargada');
            return { success: true, message: 'Factura descargada correctamente' };

        } catch (error) {
            console.error('❌ [API] Error descargando factura:', error);
            throw this.handleError(error, 'Error al descargar factura');
        }
    }

    // ✅ ITEMS DE FACTURA - ENDPOINTS ESPECÍFICOS
    async getInvoiceItems(invoiceId) {
        try {
            console.log('🔍 [API] Obteniendo items de factura:', invoiceId);
            const response = await api.get(`/enterprise/invoices/${invoiceId}/items/`);
            console.log('✅ [API] Items obtenidos:', response);
            return response.data || response;

        } catch (error) {
            console.error('❌ [API] Error obteniendo items de factura:', error);
            throw this.handleError(error, 'Error al cargar items de factura');
        }
    }

    async addInvoiceItem(invoiceId, itemData) {
        try {
            console.log('➕ [API] Agregando item a factura:', { invoiceId, itemData });

            const payload = {
                product: itemData.product_id,
                quantity: this.safeInteger(itemData.quantity, 1),
                unit_price: this.safeNumber(itemData.unit_price, 0),
                tax_rate: this.safeNumber(itemData.tax_rate, 18.0)
            };

            const response = await api.post(`/enterprise/invoices/${invoiceId}/items/`, payload);
            console.log('✅ [API] Item agregado:', response);
            return response.data || response;

        } catch (error) {
            console.error('❌ [API] Error agregando item a factura:', error);
            throw this.handleError(error, 'Error al agregar item a factura');
        }
    }

    // ✅ MÉTODOS DE UTILIDAD
    calculateDueDate(issueDate) {
        if (!issueDate) {
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date.toISOString().split('T')[0];
        }
        
        const date = new Date(issueDate);
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    }

    safeNumber(value, defaultValue = 0) {
        if (value === undefined || value === null) return defaultValue;
        if (value === '') return defaultValue;

        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    }

    safeInteger(value, defaultValue = 0) {
        if (value === undefined || value === null) return defaultValue;
        if (value === '') return defaultValue;

        const num = parseInt(value);
        return isNaN(num) ? defaultValue : num;
    }

    handleError(error, defaultMessage) {
        console.log('🔧 [API] Procesando error:', error);

        if (!error.response) {
            return new Error('Error de conexión. Verifica tu internet.');
        }

        const { status, data } = error.response;

        if (status === 400) {
            return new Error(this.parseValidationErrors(data) || 'Datos inválidos enviados al servidor');
        }
        if (status === 401) {
            return new Error('No autorizado. Por favor, inicia sesión nuevamente.');
        }
        if (status === 403) {
            return new Error('No tienes permisos para realizar esta acción');
        }
        if (status === 404) {
            return new Error('Recurso no encontrado en el servidor');
        }
        if (status === 409) {
            return new Error('Conflicto: El recurso ya existe o está en uso');
        }
        if (status === 500) {
            return new Error('Error interno del servidor. Por favor, intenta más tarde.');
        }

        if (data) {
            if (data.detail) return new Error(data.detail);
            if (data.message) return new Error(data.message);
            if (typeof data === 'string') return new Error(data);
            if (Array.isArray(data)) return new Error(data.join(', '));
        }

        return new Error(defaultMessage || 'Error desconocido en el servidor');
    }

    parseValidationErrors(data) {
        if (typeof data === 'string') return data;
        if (Array.isArray(data)) return data.join(', ');

        if (typeof data === 'object') {
            const errors = [];
            for (const key in data) {
                if (Array.isArray(data[key])) {
                    errors.push(`${this.formatFieldName(key)}: ${data[key].join(', ')}`);
                } else {
                    errors.push(`${this.formatFieldName(key)}: ${data[key]}`);
                }
            }
            return errors.join('; ');
        }

        return null;
    }

    formatFieldName(fieldName) {
        const fieldMap = {
            'name': 'Nombre',
            'email': 'Correo electrónico',
            'phone': 'Teléfono',
            'document_type': 'Tipo de documento',
            'document_number': 'Número de documento',
            'price': 'Precio',
            'cost': 'Costo',
            'stock': 'Stock',
            'tax_rate': 'Tasa de impuesto',
            'category': 'Categoría',
            'quantity': 'Cantidad',
            'unit_price': 'Precio unitario',
            'client_name': 'Nombre del cliente',
            'client_ruc': 'RUC del cliente',
            'client_address': 'Dirección del cliente',
            'client_email': 'Email del cliente',
            'payment_method': 'Método de pago',
            'issue_date': 'Fecha de emisión',
            'due_date': 'Fecha de vencimiento',
            'subtotal': 'Subtotal',
            'tax_amount': 'Impuesto',
            'total': 'Total'
        };

        return fieldMap[fieldName] || fieldName;
    }

    // ✅ HEALTH CHECK
    async healthCheck() {
        try {
            console.log('🏥 [API] Verificando salud del sistema...');

            const [health, products, clients, invoices] = await Promise.all([
                api.get('/health/').catch(() => ({ data: { status: 'unreachable' } })),
                this.getProducts().catch(() => []),
                this.getClients().catch(() => []),
                this.getInvoices().catch(() => [])
            ]);

            const status = {
                backend: health.data?.status === 'ok',
                products: Array.isArray(products),
                clients: Array.isArray(clients),
                invoices: Array.isArray(invoices)
            };

            const allHealthy = Object.values(status).every(Boolean);

            return {
                status: allHealthy ? 'healthy' : 'degraded',
                backend: health.data,
                modules: {
                    products: {
                        count: products.length,
                        status: status.products ? 'ok' : 'error'
                    },
                    clients: {
                        count: clients.length,
                        status: status.clients ? 'ok' : 'error'
                    },
                    invoices: {
                        count: invoices.length,
                        status: status.invoices ? 'ok' : 'error'
                    }
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ [API] Error en health check:', error);
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // ✅ DEBUG
    async debugApiStructure() {
        try {
            console.log('🔍 === DEBUG ESTRUCTURA API ===');

            const [products, clients, invoices] = await Promise.all([
                this.getProducts().catch(() => []),
                this.getClients().catch(() => []),
                this.getInvoices().catch(() => [])
            ]);

            const debugInfo = {
                products: {
                    count: products.length,
                    sample: products[0] || 'No hay productos',
                    ids: products.map(p => p.id)
                },
                clients: {
                    count: clients.length,
                    sample: clients[0] || 'No hay clientes',
                    ids: clients.map(c => c.id)
                },
                invoices: {
                    count: invoices.length,
                    sample: invoices[0] || 'No hay facturas'
                },
                timestamp: new Date().toISOString()
            };

            console.log('📊 [API] Resumen debug:', debugInfo);
            return debugInfo;

        } catch (error) {
            console.error('❌ [API] Error en debug:', error);
            return { error: error.message };
        }
    }
}

// ✅ INSTANCIA ÚNICA Y EXPORTACIÓN
const enterpriseApi = new EnterpriseApiService();
export default enterpriseApi;
# enterprise/urls.py - MÓDULO EMPRESARIAL COMPLETO Y ACTUALIZADO
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"clients", views.ClientViewSet, basename="client")
router.register(r"products", views.ProductViewSet, basename="product")
router.register(r"invoices", views.InvoiceViewSet, basename="invoice")

urlpatterns = [
    # ================================
    # 🚀 VIEWSETS PRINCIPALES (RECOMENDADO)
    # ================================
    path("", include(router.urls)),
    # ================================
    # 📦 ENDPOINTS DE COMPATIBILIDAD (PARA FRONTEND EXISTENTE)
    # ================================
    # -------------------------------
    # CLIENTES - COMPATIBILIDAD
    # -------------------------------
    path(
        "clients-direct/",
        views.enterprise_clients_direct,
        name="enterprise-clients-direct",
    ),
    # -------------------------------
    # PRODUCTOS - COMPATIBILIDAD
    # -------------------------------
    path(
        "products/legacy/",
        views.products_list_create,
        name="enterprise-products-list-legacy",
    ),
    path(
        "products/legacy/<int:pk>/",
        views.product_detail,
        name="enterprise-product-detail-legacy",
    ),
    path(
        "products/legacy/stats/",
        views.products_stats,
        name="enterprise-products-stats-legacy",
    ),
    # RUTA DE EMERGENCIA PARA CREACIÓN DIRECTA DE PRODUCTOS
    path(
        "products/direct/",
        views.create_product_direct,
        name="enterprise-products-direct",
    ),
    # -------------------------------
    # FACTURAS - COMPATIBILIDAD
    # -------------------------------
    path(
        "invoices/legacy/",
        views.invoices_list_create,
        name="enterprise-invoices-list-legacy",
    ),
    path(
        "invoices/legacy/quick-create/",
        views.invoices_quick_create,
        name="enterprise-invoices-quick-create-legacy",
    ),
    path(
        "invoices/legacy/<int:pk>/",
        views.invoice_detail,
        name="enterprise-invoice-detail-legacy",
    ),
    path(
        "invoices/legacy/<int:pk>/status/",
        views.invoice_update_status,
        name="enterprise-invoice-status-legacy",
    ),
    path(
        "invoices/legacy/stats/",
        views.invoices_stats,
        name="enterprise-invoices-stats-legacy",
    ),
    # ================================
    # 📊 DASHBOARD Y ESTADÍSTICAS
    # ================================
    path("dashboard/", views.enterprise_dashboard, name="enterprise-dashboard"),
    # ================================
    # 🔧 UTILIDADES Y DIAGNÓSTICO
    # ================================
    path(
        "debug/product-validation/",
        views.debug_product_validation,
        name="debug-product-validation",
    ),
    path(
        "health-check/",
        views.enterprise_health_check,
        name="enterprise-health-check",
    ),
]

# ================================
# 📋 MAPA DE URLS DISPONIBLES:
# ================================
"""
🚀 VIEWSETS (RECOMENDADO):
-----------------------------
GET    /api/enterprise/clients/          # Listar clientes
POST   /api/enterprise/clients/          # Crear cliente
GET    /api/enterprise/clients/{id}/     # Detalle cliente
PUT    /api/enterprise/clients/{id}/     # Actualizar cliente
DELETE /api/enterprise/clients/{id}/     # Eliminar cliente
GET    /api/enterprise/clients/search/   # Buscar clientes
GET    /api/enterprise/clients/stats/    # Stats clientes

GET    /api/enterprise/products/         # Listar productos  
POST   /api/enterprise/products/         # Crear producto
GET    /api/enterprise/products/{id}/    # Detalle producto
PUT    /api/enterprise/products/{id}/    # Actualizar producto
DELETE /api/enterprise/products/{id}/    # Eliminar producto
GET    /api/enterprise/products/stats/   # Stats productos
POST   /api/enterprise/products/{id}/update_stock/  # Actualizar stock

GET    /api/enterprise/invoices/         # Listar facturas
POST   /api/enterprise/invoices/         # Crear factura
GET    /api/enterprise/invoices/{id}/    # Detalle factura
PUT    /api/enterprise/invoices/{id}/    # Actualizar factura  
DELETE /api/enterprise/invoices/{id}/    # Eliminar factura
GET    /api/enterprise/invoices/stats/   # Stats facturas
GET    /api/enterprise/invoices/recent/  # Facturas recientes
POST   /api/enterprise/invoices/{id}/mark_as_paid/  # Marcar como pagada
POST   /api/enterprise/invoices/{id}/update_status/ # Actualizar estado
GET    /api/enterprise/invoices/{id}/download_pdf/  # Descargar PDF

📦 ENDPOINTS LEGACY (COMPATIBILIDAD):
-----------------------------
GET    /api/enterprise/clients-direct/              # Clientes directo
POST   /api/enterprise/clients-direct/              # Crear cliente directo

GET    /api/enterprise/products/legacy/             # Listar productos (legacy)
POST   /api/enterprise/products/legacy/             # Crear producto (legacy)  
GET    /api/enterprise/products/legacy/{id}/        # Detalle producto (legacy)
PUT    /api/enterprise/products/legacy/{id}/        # Actualizar producto (legacy)
DELETE /api/enterprise/products/legacy/{id}/        # Eliminar producto (legacy)
GET    /api/enterprise/products/legacy/stats/       # Stats productos (legacy)
POST   /api/enterprise/products/direct/             # Crear producto directo

GET    /api/enterprise/invoices/legacy/             # Listar facturas (legacy)
POST   /api/enterprise/invoices/legacy/             # Crear factura (legacy)
POST   /api/enterprise/invoices/legacy/quick-create/# Creación rápida (legacy)
GET    /api/enterprise/invoices/legacy/{id}/        # Detalle factura (legacy)
PUT    /api/enterprise/invoices/legacy/{id}/        # Actualizar factura (legacy)
DELETE /api/enterprise/invoices/legacy/{id}/        # Eliminar factura (legacy)
POST   /api/enterprise/invoices/legacy/{id}/status/ # Actualizar estado (legacy)
GET    /api/enterprise/invoices/legacy/stats/       # Stats facturas (legacy)

📊 DASHBOARD Y DIAGNÓSTICO:
-----------------------------
GET    /api/enterprise/dashboard/                   # Dashboard empresarial
GET    /api/enterprise/health-check/                # Health check del módulo
POST   /api/enterprise/debug/product-validation/    # Debug validación productos
"""

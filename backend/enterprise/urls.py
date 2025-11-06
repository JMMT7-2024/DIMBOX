# enterprise/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# =============================================
# CONFIGURACIÓN DEL ROUTER PRINCIPAL
# =============================================
router = DefaultRouter()
router.register(r"clients", views.ClientViewSet, basename="client")
router.register(r"products", views.ProductViewSet, basename="product")
router.register(r"invoices", views.InvoiceViewSet, basename="invoice")

# =============================================
# PATTERNS DE URL PRINCIPALES
# =============================================
urlpatterns = [
    # ================================
    # 🚀 VIEWSETS PRINCIPALES (API REST)
    # ================================
    path("", include(router.urls)),
    # ================================
    # 👥 ENDPOINTS ESPECÍFICOS DE CLIENTES
    # ================================
    path(
        "clients/search/",
        views.ClientViewSet.as_view({"get": "search"}),
        name="clients-search",
    ),
    path(
        "clients/stats/",
        views.ClientViewSet.as_view({"get": "stats"}),
        name="clients-stats",
    ),
    # ================================
    # 📦 ENDPOINTS ESPECÍFICOS DE PRODUCTOS
    # ================================
    path(
        "products/stats/",
        views.ProductViewSet.as_view({"get": "stats"}),
        name="products-stats",
    ),
    path(
        "products/<int:pk>/update-stock/",
        views.ProductViewSet.as_view({"post": "update_stock"}),
        name="product-update-stock",
    ),
    path(
        "products/categories/",
        views.ProductViewSet.as_view({"get": "categories"}),
        name="product-categories",
    ),
    # ================================
    # 🧾 ENDPOINTS ESPECÍFICOS DE FACTURAS
    # ================================
    path(
        "invoices/stats/",
        views.InvoiceViewSet.as_view({"get": "stats"}),
        name="invoices-stats",
    ),
    path(
        "invoices/recent/",
        views.InvoiceViewSet.as_view({"get": "recent"}),
        name="invoices-recent",
    ),
    path(
        "invoices/<int:pk>/mark-as-paid/",
        views.InvoiceViewSet.as_view({"post": "mark_as_paid"}),
        name="invoice-mark-paid",
    ),
    path(
        "invoices/<int:pk>/update-status/",
        views.InvoiceViewSet.as_view({"post": "update_status"}),
        name="invoice-update-status",
    ),
    path(
        "invoices/<int:pk>/download-pdf/",
        views.InvoiceViewSet.as_view({"get": "download_pdf"}),
        name="invoice-download-pdf",
    ),
    path(
        "invoices/<int:pk>/send-email/",
        views.InvoiceViewSet.as_view({"post": "send_email"}),
        name="invoice-send-email",
    ),
    path(
        "invoices/<int:pk>/duplicate/",
        views.InvoiceViewSet.as_view({"post": "duplicate"}),
        name="invoice-duplicate",
    ),
    # ================================
    # 🔧 ENDPOINTS DE COMPATIBILIDAD (LEGACY)
    # ================================
    # Clientes - Legacy
    path(
        "clients-direct/",
        views.enterprise_clients_direct,
        name="enterprise-clients-direct",
    ),
    path(
        "clients/legacy/search/",
        views.clients_search_legacy,
        name="clients-search-legacy",
    ),
    # Productos - Legacy
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
    path(
        "products/legacy/bulk-create/",
        views.products_bulk_create,
        name="products-bulk-create-legacy",
    ),
    path(
        "products/direct/",
        views.create_product_direct,
        name="enterprise-products-direct",
    ),
    path(
        "products/legacy/import/", views.products_import, name="products-import-legacy"
    ),
    # Facturas - Legacy
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
    path(
        "invoices/legacy/bulk-create/",
        views.invoices_bulk_create,
        name="invoices-bulk-create-legacy",
    ),
    # ================================
    # 📈 DASHBOARD Y REPORTES
    # ================================
    path("dashboard/", views.enterprise_dashboard, name="enterprise-dashboard"),
    path(
        "dashboard/quick-stats/",
        views.dashboard_quick_stats,
        name="dashboard-quick-stats",
    ),
    path("reports/sales/", views.sales_report, name="sales-report"),
    path("reports/inventory/", views.inventory_report, name="inventory-report"),
    path("reports/clients/", views.clients_report, name="clients-report"),
    # ================================
    # 🔧 UTILIDADES Y DIAGNÓSTICO
    # ================================
    path(
        "debug/product-validation/",
        views.debug_product_validation,
        name="debug-product-validation",
    ),
    path(
        "debug/invoice-validation/",
        views.debug_invoice_validation,
        name="debug-invoice-validation",
    ),
    path(
        "health-check/", views.enterprise_health_check, name="enterprise-health-check"
    ),
    path("system-info/", views.system_info, name="system-info"),
    path("backup/data/", views.backup_data, name="backup-data"),
    # ================================
    # 🔄 OPERACIONES MASIVAS
    # ================================
    path(
        "operations/bulk-update-products/",
        views.bulk_update_products,
        name="bulk-update-products",
    ),
    path(
        "operations/update-prices/", views.update_prices_bulk, name="update-prices-bulk"
    ),
    path("operations/update-stock/", views.update_stock_bulk, name="update-stock-bulk"),
    # ================================
    # 📊 ANALÍTICAS AVANZADAS
    # ================================
    path("analytics/sales-trends/", views.sales_trends, name="sales-trends"),
    path("analytics/top-products/", views.top_products, name="top-products"),
    path("analytics/top-clients/", views.top_clients, name="top-clients"),
    path("analytics/revenue-metrics/", views.revenue_metrics, name="revenue-metrics"),
]

# =============================================
# DOCUMENTACIÓN DE ENDPOINTS DISPONIBLES
# =============================================
"""
🏢 MÓDULO EMPRESARIAL - ENDPOINTS DISPONIBLES:

👥 CLIENTES:
-----------
GET    /api/enterprise/clients/                    # Listar todos los clientes
POST   /api/enterprise/clients/                    # Crear nuevo cliente
GET    /api/enterprise/clients/{id}/               # Obtener cliente específico
PUT    /api/enterprise/clients/{id}/               # Actualizar cliente
DELETE /api/enterprise/clients/{id}/               # Eliminar cliente
GET    /api/enterprise/clients/search/             # Búsqueda de clientes
GET    /api/enterprise/clients/stats/              # Estadísticas de clientes

📦 PRODUCTOS:
------------
GET    /api/enterprise/products/                   # Listar todos los productos
POST   /api/enterprise/products/                   # Crear nuevo producto
GET    /api/enterprise/products/{id}/              # Obtener producto específico
PUT    /api/enterprise/products/{id}/              # Actualizar producto
DELETE /api/enterprise/products/{id}/              # Eliminar producto
GET    /api/enterprise/products/stats/             # Estadísticas de productos
POST   /api/enterprise/products/{id}/update-stock/ # Actualizar stock
GET    /api/enterprise/products/categories/        # Listar categorías

🧾 FACTURAS:
-----------
GET    /api/enterprise/invoices/                   # Listar todas las facturas
POST   /api/enterprise/invoices/                   # Crear nueva factura
GET    /api/enterprise/invoices/{id}/              # Obtener factura específica
PUT    /api/enterprise/invoices/{id}/              # Actualizar factura
DELETE /api/enterprise/invoices/{id}/              # Eliminar factura
GET    /api/enterprise/invoices/stats/             # Estadísticas de facturas
GET    /api/enterprise/invoices/recent/            # Facturas recientes
POST   /api/enterprise/invoices/{id}/mark-as-paid/ # Marcar como pagada
POST   /api/enterprise/invoices/{id}/update-status/# Actualizar estado
GET    /api/enterprise/invoices/{id}/download-pdf/ # Descargar PDF
POST   /api/enterprise/invoices/{id}/send-email/   # Enviar por email
POST   /api/enterprise/invoices/{id}/duplicate/    # Duplicar factura

📊 DASHBOARD Y REPORTES:
-----------------------
GET    /api/enterprise/dashboard/                  # Dashboard principal
GET    /api/enterprise/dashboard/quick-stats/      # Estadísticas rápidas
GET    /api/enterprise/reports/sales/              # Reporte de ventas
GET    /api/enterprise/reports/inventory/          # Reporte de inventario
GET    /api/enterprise/reports/clients/            # Reporte de clientes

🔄 OPERACIONES MASIVAS:
----------------------
POST   /api/enterprise/operations/bulk-update-products/ # Actualizar productos masivamente
POST   /api/enterprise/operations/update-prices/   # Actualizar precios masivamente
POST   /api/enterprise/operations/update-stock/    # Actualizar stock masivamente

📈 ANALÍTICAS:
-------------
GET    /api/enterprise/analytics/sales-trends/     # Tendencias de ventas
GET    /api/enterprise/analytics/top-products/     # Productos más vendidos
GET    /api/enterprise/analytics/top-clients/      # Clientes principales
GET    /api/enterprise/analytics/revenue-metrics/  # Métricas de ingresos

🔧 DIAGNÓSTICO Y UTILIDADES:
---------------------------
GET    /api/enterprise/health-check/               # Verificar salud del sistema
POST   /api/enterprise/debug/product-validation/   # Validar datos de producto
POST   /api/enterprise/debug/invoice-validation/   # Validar datos de factura
GET    /api/enterprise/system-info/                # Información del sistema
GET    /api/enterprise/backup/data/                # Respaldar datos

🔙 ENDPOINTS LEGACY (COMPATIBILIDAD):
------------------------------------
GET    /api/enterprise/clients-direct/             # Clientes directo (legacy)
POST   /api/enterprise/products/direct/            # Crear producto directo (legacy)
GET    /api/enterprise/products/legacy/            # Productos legacy
POST   /api/enterprise/invoices/legacy/quick-create/# Creación rápida legacy
"""

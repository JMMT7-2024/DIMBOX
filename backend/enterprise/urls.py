# enterprise/urls.py - MÓDULO EMPRESARIAL COMPLETO
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"clients", views.ClientViewSet, basename="client")

urlpatterns = [
    # -------------------------------
    # 👥 CLIENTES (ViewSet)
    # -------------------------------
    path("", include(router.urls)),
    # -------------------------------
    # 📦 PRODUCTOS
    # -------------------------------
    # Rutas principales de productos
    path(
        "products/",
        views.products_list_create,
        name="enterprise-products-list",
    ),
    path(
        "products/<int:pk>/",
        views.product_detail,
        name="enterprise-product-detail",
    ),
    path(
        "products/stats/",
        views.products_stats,
        name="enterprise-products-stats",
    ),
    # ✅ RUTA DE EMERGENCIA PARA CREACIÓN DIRECTA DE PRODUCTOS
    path(
        "products/direct/",
        views.create_product_direct,
        name="enterprise-products-direct",
    ),
    # -------------------------------
    # 🧾 FACTURAS
    # -------------------------------
    path(
        "invoices/",
        views.invoices_list_create,
        name="enterprise-invoices-list",
    ),
    path(
        "invoices/quick-create/",
        views.invoices_quick_create,
        name="enterprise-invoices-quick-create",
    ),
    path(
        "invoices/<int:pk>/",
        views.invoice_detail,
        name="enterprise-invoice-detail",
    ),
    path(
        "invoices/<int:pk>/status/",
        views.invoice_update_status,
        name="enterprise-invoice-status",
    ),
    path(
        "invoices/stats/",
        views.invoices_stats,
        name="enterprise-invoices-stats",
    ),
    # -------------------------------
    # 📊 DASHBOARD EMPRESARIAL
    # -------------------------------
    path("dashboard/", views.enterprise_dashboard, name="enterprise-dashboard"),
    # -------------------------------
    # 🛠️ UTILIDADES Y DEBUG
    # -------------------------------
    path(
        "debug/product-validation/",
        views.debug_product_validation,
        name="debug-product-validation",
    ),
    path(
        "clients-direct/",
        views.enterprise_clients_direct,
        name="enterprise-clients-direct",
    ),
]

# ✅ NOTAS IMPORTANTES:
"""
ESTRUCTURA DE RUTAS EMPRESARIALES:

🏢 MÓDULO EMPRESARIAL COMPLETO:
/api/enterprise/

👥 CLIENTES:
GET/POST    /api/enterprise/clients/
GET/PUT/DEL /api/enterprise/clients/{id}/
GET         /api/enterprise/clients/search/?q=term

📦 PRODUCTOS:
GET/POST    /api/enterprise/products/           ← Principal
GET/PUT/DEL /api/enterprise/products/{id}/      ← Detalle
GET         /api/enterprise/products/stats/     ← Estadísticas
POST        /api/enterprise/products/direct/    ← Emergencia

🧾 FACTURAS:
GET/POST    /api/enterprise/invoices/
POST        /api/enterprise/invoices/quick-create/
GET/PUT/DEL /api/enterprise/invoices/{id}/
POST        /api/enterprise/invoices/{id}/status/
GET         /api/enterprise/invoices/stats/

📊 DASHBOARD:
GET         /api/enterprise/dashboard/

INSTRUCCIONES DE USO:

🔧 TEMPORAL (Funciona inmediatamente):
   POST /api/enterprise/products/direct/

🎯 PERMANENTE (Una vez verificado):
   POST /api/enterprise/products/

🛠️ PARA DEBUG:
   POST /api/enterprise/debug/product-validation/
"""

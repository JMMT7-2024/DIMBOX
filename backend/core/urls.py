# core/urls.py - VERSIÓN CORREGIDA Y OPTIMIZADA
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # -------------------------------
    # 🔐 AUTENTICACIÓN JWT
    # -------------------------------
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # -------------------------------
    # 🔄 RECUPERACIÓN DE CONTRASEÑAS
    # -------------------------------
    path(
        "password/reset/",
        views.CustomPasswordResetView.as_view(),
        name="password_reset",
    ),
    path(
        "password/reset/confirm/",
        views.CustomPasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
    # -------------------------------
    # 👤 REGISTRO Y PERFIL
    # -------------------------------
    path("register/", views.register, name="register"),
    path("me/", views.me, name="me"),
    path("profile/", views.profile_view, name="profile"),
    # -------------------------------
    # 💰 TRANSACCIONES
    # -------------------------------
    path(
        "transactions/", views.transactions_list_create, name="transactions_list_create"
    ),
    path("transactions/<int:pk>/", views.transaction_detail, name="transaction_detail"),
    path("export/csv/", views.export_csv, name="export_csv"),
    # -------------------------------
    # 📊 SISTEMA DE LÍMITES
    # -------------------------------
    path("user/usage/", views.user_usage, name="user-usage"),
    path("admin/limits/stats/", views.admin_limits_stats, name="admin-limits-stats"),
    path(
        "admin/users/<int:user_id>/limits/",
        views.admin_set_custom_limits,
        name="admin-set-custom-limits",
    ),
    path(
        "admin/users/<int:user_id>/limits/reset/",
        views.admin_reset_limits,
        name="admin-reset-limits",
    ),
    path(
        "admin/users/near-limits/",
        views.admin_users_near_limits,
        name="admin-users-near-limits",
    ),
    path(
        "admin/limits/global/",
        views.admin_update_global_limits,
        name="admin-update-global-limits",
    ),
    # -------------------------------
    # 👑 ADMINISTRACIÓN (TODO DESDE VIEWS.PRINCIPAL)
    # -------------------------------
    path("admin/stats/", views.admin_stats, name="admin-stats"),
    path("admin/users/", views.admin_users_list, name="admin-users"),
    path(
        "admin/users/<int:user_id>/set-plan/",
        views.admin_set_plan,
        name="admin-set-plan",
    ),
    path(
        "admin/users/<int:user_id>/set-active/",
        views.admin_set_active,
        name="admin-set-active",
    ),
    path(
        "admin/users/<int:user_id>/set-role/",
        views.admin_set_role,
        name="admin-set-role",
    ),
    # -------------------------------
    # 🏢 MÓDULO EMPRESARIAL
    # -------------------------------
    # 📦 PRODUCTOS
    path(
        "enterprise/products/",
        views.products_list_create,
        name="enterprise-products-list",
    ),
    path(
        "enterprise/products/<int:pk>/",
        views.product_detail,
        name="enterprise-product-detail",
    ),
    path(
        "enterprise/products/stats/",
        views.products_stats,
        name="enterprise-products-stats",
    ),
    # 🧾 FACTURAS
    path(
        "enterprise/invoices/",
        views.invoices_list_create,
        name="enterprise-invoices-list",
    ),
    path(
        "enterprise/invoices/quick-create/",
        views.invoices_quick_create,
        name="enterprise-invoices-quick-create",
    ),
    path(
        "enterprise/invoices/<int:pk>/",
        views.invoice_detail,
        name="enterprise-invoice-detail",
    ),
    path(
        "enterprise/invoices/<int:pk>/status/",
        views.invoice_update_status,
        name="enterprise-invoice-status",
    ),
    path(
        "enterprise/invoices/stats/",
        views.invoices_stats,
        name="enterprise-invoices-stats",
    ),
    # 📊 DASHBOARD
    path(
        "enterprise/dashboard/", views.enterprise_dashboard, name="enterprise-dashboard"
    ),
    # -------------------------------
    # 🩺 HEALTH & UTILIDADES
    # -------------------------------
    path("health/", views.health, name="health"),
    path("whoami/", views.whoami, name="whoami"),
    # -------------------------------
    # 🔗 CUENTAS RÁPIDAS (si existe)
    # -------------------------------
    # path("quick-accounts/", include("quick_accounts.urls")),
]

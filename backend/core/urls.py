# core/urls.py - VERSIÓN COMPLETA CORREGIDA CON PASSWORD RESET
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views
from . import admin_views  # ✅ IMPORTAR ADMIN_VIEWS

urlpatterns = [
    # -------------------------------
    # Autenticación JWT
    # -------------------------------
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.asview(), name="token_refresh"),
    # -------------------------------
    # ✅ RECUPERACIÓN DE CONTRASEÑAS - NUEVO ENDPOINT
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
    # Registro y perfil de usuario
    # -------------------------------
    path("register/", views.register, name="register"),
    path("me/", views.me, name="me"),
    path("profile/", views.profile_view, name="profile"),
    # -------------------------------
    # Gestión de transacciones
    # -------------------------------
    path(
        "transactions/", views.transactions_list_create, name="transactions_list_create"
    ),
    path("transactions/<int:pk>/", views.transaction_detail, name="transaction_detail"),
    # -------------------------------
    # Exportación de datos
    # -------------------------------
    path("export/csv/", views.export_csv, name="export_csv"),
    # -------------------------------
    # ✅ SISTEMA DE LÍMITES - NUEVOS ENDPOINTS
    # -------------------------------
    # Límites del usuario actual
    path("user/usage/", views.user_usage, name="user-usage"),
    # Administración de límites
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
    # Administración de usuarios (CORREGIDO)
    # -------------------------------
    path("admin/stats/", admin_views.admin_stats, name="admin-stats"),
    path(
        "admin/users/", admin_views.admin_users_list, name="admin-users"
    ),  # ✅ Corregido nombre
    path(
        "admin/users/<int:user_id>/set-plan/",
        admin_views.admin_set_plan,  # ✅ Desde admin_views
        name="admin-set-plan",
    ),
    path(
        "admin/users/<int:user_id>/set-active/",
        admin_views.admin_set_active,  # ✅ Desde admin_views
        name="admin-set-active",
    ),
    path(
        "admin/users/<int:user_id>/set-role/",
        admin_views.admin_set_role,  # ✅ Desde admin_views
        name="admin-set-role",
    ),
    # -------------------------------
    # Cuentas rápidas
    # -------------------------------
    path("quick-accounts/", include("quick_accounts.urls")),
    # -------------------------------
    # Health checks y utilidades
    # -------------------------------
    path("health/", views.health, name="health"),
    path("whoami/", views.whoami, name="whoami"),
]

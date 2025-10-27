# core/urls.py - VERSIÓN COMPLETA CON SISTEMA DE LÍMITES
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # -------------------------------
    # Autenticación JWT
    # -------------------------------
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
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
    # Administración de usuarios
    # -------------------------------
    path("admin/stats/", views.admin_stats, name="admin-stats"),
    path("admin/users/", views.admin_users, name="admin-users"),
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
    # Cuentas rápidas
    # -------------------------------
    path("quick-accounts/", include("quick_accounts.urls")),
    # -------------------------------
    # Health checks y utilidades
    # -------------------------------
    path("health/", views.health, name="health"),
    path("whoami/", views.whoami, name="whoami"),
]

# ✅ DOCUMENTACIÓN DE ENDPOINTS PARA DESARROLLADORES
"""
📋 RESUMEN DE ENDPOINTS DISPONIBLES:

🔐 AUTENTICACIÓN:
  POST /api/token/                 - Obtener tokens JWT
  POST /api/token/refresh/         - Refrescar token de acceso
  POST /api/register/              - Registrar nuevo usuario

👤 USUARIO:
  GET  /api/me/                    - Información completa del usuario autenticado
  GET  /api/profile/               - Perfil del usuario (alias de /me/)
  PUT  /api/profile/               - Actualizar perfil (nombre, meta de ahorro)

💳 TRANSACCIONES:
  GET  /api/transactions/          - Listar transacciones del usuario
  POST /api/transactions/          - Crear nueva transacción (con verificación de límites)
  GET  /api/transactions/{id}/     - Obtener transacción específica
  PUT  /api/transactions/{id}/     - Actualizar transacción
  DELETE /api/transactions/{id}/   - Eliminar transacción

📊 SISTEMA DE LÍMITES:
  GET  /api/user/usage/            - Estadísticas de uso actual del usuario
  GET  /api/admin/limits/stats/    - Estadísticas globales de límites (Admin)
  PUT  /api/admin/users/{id}/limits/ - Configurar límites personalizados (Admin)
  DELETE /api/admin/users/{id}/limits/reset/ - Restablecer límites (Admin)
  GET  /api/admin/users/near-limits/ - Usuarios cerca/excediendo límites (Admin)
  PUT  /api/admin/limits/global/   - Actualizar límites globales (Admin)

👑 ADMINISTRACIÓN:
  GET  /api/admin/stats/           - Estadísticas generales del sistema
  GET  /api/admin/users/           - Listar usuarios (con filtros)
  POST /api/admin/users/{id}/set-plan/    - Cambiar plan de usuario
  POST /api/admin/users/{id}/set-active/  - Activar/desactivar usuario
  POST /api/admin/users/{id}/set-role/    - Cambiar rol de usuario

📤 EXPORTACIÓN:
  GET  /api/export/csv/            - Exportar transacciones a CSV (solo Premium)

🏦 CUENTAS RÁPIDAS:
  GET  /api/quick-accounts/        - Ver todas las cuentas rápidas
  POST /api/quick-accounts/        - Crear nueva cuenta rápida
  ... (más endpoints en quick_accounts/urls.py)

🔧 UTILIDADES:
  GET  /api/health/                - Health check del API
  GET  /api/whoami/                - Información básica del usuario autenticado
"""

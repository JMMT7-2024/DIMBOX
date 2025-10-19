# core/urls.py
from django.urls import path

# Importa las vistas JWT necesarias
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Importa tus vistas de 'views.py'
from . import views
# Importa tus vistas de 'admin_views.py' (si las moviste allí)
# O si las añadiste al final de 'views.py', no necesitas esto.
# from . import admin_views # Asegúrate que esto sea correcto

urlpatterns = [
    # --- Autenticación (JWT Tokens) ---
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # --- Registro y Perfil de Usuario ---
    path("register/", views.register, name="register"),
    path("me/", views.me, name="me"),
    path("profile/", views.profile_view, name="profile"),
    # --- Transacciones ---
    path(
        "transactions/", views.transactions_list_create, name="transactions_list_create"
    ),
    path("transactions/<int:pk>/", views.transaction_detail, name="transaction_detail"),
    path("export/csv/", views.export_csv, name="export_csv"),
    # --- Rutas de Administración ---
    # Asegúrate de que estas vistas estén importadas correctamente
    # (ya sea desde views.py o admin_views.py)
    path("admin/stats/", views.admin_stats, name="admin_stats"),
    path("admin/users/", views.admin_users_list, name="admin_users_list"),
    path("admin/users/<int:pk>/set-plan/", views.admin_set_plan, name="admin_set_plan"),
    path(
        "admin/users/<int:pk>/set-active/",
        views.admin_set_active,
        name="admin_set_active",
    ),
    path("admin/users/<int:pk>/set-role/", views.admin_set_role, name="admin_set_role"),
]

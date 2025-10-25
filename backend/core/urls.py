# core/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # Autenticación JWT
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Registro y perfil de usuario
    path("register/", views.register, name="register"),
    path("me/", views.me, name="me"),
    path("profile/", views.profile_view, name="profile"),
    # Gestión de transacciones
    path(
        "transactions/", views.transactions_list_create, name="transactions_list_create"
    ),
    path("transactions/<int:pk>/", views.transaction_detail, name="transaction_detail"),
    # Exportación de datos
    path("export/csv/", views.export_csv, name="export_csv"),
    # ✅ CUENTAS RÁPIDAS - Integradas en la API principal
    path("quick-accounts/", include("quick_accounts.urls")),
    # Health checks y utilidades
    path("health/", views.health, name="health"),
    path("whoami/", views.whoami, name="whoami"),
]

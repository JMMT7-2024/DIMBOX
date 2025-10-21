# core/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # --- Auth (JWT) ---
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # --- Registro y Perfil ---
    path("register/", views.register, name="register"),
    path("me/", views.me, name="me"),
    path(
        "profile/", views.profile, name="profile"
    ),  # <-- CORREGIDO (antes profile_view)
    # --- Transacciones ---
    path(
        "transactions/", views.transactions_list_create, name="transactions_list_create"
    ),
    path("transactions/<int:pk>/", views.transaction_detail, name="transaction_detail"),
    # --- Export ---
    path("export/csv/", views.export_csv, name="export_csv"),
    # --- Sondas ---
    path("health/", views.health, name="health"),
    path("whoami/", views.whoami, name="whoami"),
]

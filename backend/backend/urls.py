# core/urls.py
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # ✅ AUTH ENDPOINTS
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("register/", views.register, name="register"),
    path("me/", views.me, name="me"),
    # ✅ PROFILE ENDPOINTS
    path("profile/", views.profile_view, name="profile"),
    # ✅ TRANSACTIONS ENDPOINTS
    path(
        "transactions/", views.transactions_list_create, name="transactions_list_create"
    ),
    path("transactions/<int:pk>/", views.transaction_detail, name="transaction_detail"),
    # ✅ EXPORT ENDPOINTS
    path("export/csv/", views.export_csv, name="export_csv"),
    # ✅ QUICK ACCOUNTS ENDPOINTS - NUEVOS
    path("quick-accounts/", views.quick_accounts_view, name="quick_accounts"),
    # ✅ HEALTH & UTILITY ENDPOINTS
    path("health/", views.health, name="health"),
    path("whoami/", views.whoami, name="whoami"),
]

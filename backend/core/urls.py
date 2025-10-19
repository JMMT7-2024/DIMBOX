# core/urls.py
from django.urls import path
from .views import (
    register, me, profile_view,
    transactions_list_create, transaction_detail,
    export_csv,
)
from .admin_views import (           # <— IMPORTA de admin_views
    admin_stats,
    admin_users_list,
    admin_set_plan,
    admin_set_active,
    admin_set_role,
)
from . import views

urlpatterns = [
    # Auth / perfil / transacciones ya conocidas…
    path('register/', register, name='register'),
    path('me/', me, name='me'),
    path('profile/', profile_view, name='profile'),
    path('transactions/', transactions_list_create, name='transactions'),
    path('transactions/<int:pk>/', transaction_detail, name='transaction-detail'),
    path('export/csv/', export_csv, name='export-csv'),

    # --- Tus URLs de Auth y Transacciones ---
    path('register/', views.register, name='register'),
    path('me/', views.me, name='me'),
    path('profile/', views.profile_view, name='profile'),
    path('transactions/', views.transactions_list_create, name='transactions_list_create'),
    path('transactions/<int:pk>/', views.transaction_detail, name='transaction_detail'),
    path('export/csv/', views.export_csv, name='export_csv'),

    # --- Rutas de ADMIN ---
    path('admin/stats/', admin_stats, name='admin-stats'),
    path('admin/users/', admin_users_list, name='admin-users'),
    path('admin/users/<int:pk>/plan/', admin_set_plan, name='admin-set-plan'),
    path('admin/users/<int:pk>/active/', admin_set_active, name='admin-set-active'),
    path('admin/users/<int:pk>/role/', admin_set_role, name='admin-set-role'),
    path('admin/stats/', views.admin_stats, name='admin_stats'),
    path('admin/users/', views.admin_users_list, name='admin_users_list'),
    path('admin/users/<int:pk>/set-plan/', views.admin_set_plan, name='admin_set_plan'),
    path('admin/users/<int:pk>/set-active/', views.admin_set_active, name='admin_set_active'),
    path('admin/users/<int:pk>/set-role/', views.admin_set_role, name='admin_set_role'),
]

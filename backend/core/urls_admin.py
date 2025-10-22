# core/urls_admin.py
from django.urls import path
from . import admin_views as views

urlpatterns = [
    path("stats/", views.admin_stats, name="admin_stats"),
    path("users/", views.admin_users_list, name="admin_users_list"),
    path("users/<int:pk>/set-plan/", views.admin_set_plan, name="admin_set_plan"),
    path("users/<int:pk>/set-active/", views.admin_set_active, name="admin_set_active"),
    path("users/<int:pk>/set-role/", views.admin_set_role, name="admin_set_role"),
]

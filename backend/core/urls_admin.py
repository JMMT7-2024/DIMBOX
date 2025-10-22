# core/urls_admin.py
from django.urls import path
from .admin_views import (
    admin_stats,
    admin_users_list,
    admin_set_plan,
    admin_set_active,
    admin_set_role,
)

urlpatterns = [
    path("stats/", admin_stats),
    path("users/", admin_users_list),
    path("users/<int:pk>/set-plan/", admin_set_plan),
    path("users/<int:pk>/set-active/", admin_set_active),
    path("users/<int:pk>/set-role/", admin_set_role),
]

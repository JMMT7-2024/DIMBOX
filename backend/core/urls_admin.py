# backend/core/urls_admin.py
from django.urls import path
from . import admin_views as v

urlpatterns = [
    path("stats/", v.admin_stats, name="admin-stats"),
    path("users/", v.admin_users_list, name="admin-users-list"),
    path("users/<int:user_id>/set-plan/", v.admin_set_plan, name="admin-set-plan"),
    path(
        "users/<int:user_id>/set-active/", v.admin_set_active, name="admin-set-active"
    ),
    path("users/<int:user_id>/set-role/", v.admin_set_role, name="admin-set-role"),
]

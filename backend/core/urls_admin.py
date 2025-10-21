# core/urls_admin.py
from django.urls import path
from . import admin_views as v

urlpatterns = [
    path("stats/", v.admin_stats, name="admin_stats"),
    path("users/", v.admin_users_list, name="admin_users_list"),
    path("users/<int:user_id>/set-plan/", v.admin_set_plan, name="admin_set_plan"),
    path(
        "users/<int:user_id>/set-active/", v.admin_set_active, name="admin_set_active"
    ),
    path("users/<int:user_id>/set-role/", v.admin_set_role, name="admin_set_role"),
]

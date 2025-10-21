# core/admin_urls.py
from django.urls import path
from . import admin_views

urlpatterns = [
    path("stats/", admin_views.admin_stats, name="admin-stats"),
    path("users/", admin_views.admin_users_list, name="admin-users"),
    path(
        "users/<int:user_id>/set-plan/",
        admin_views.admin_set_plan,
        name="admin-set-plan",
    ),
    path(
        "users/<int:user_id>/set-active/",
        admin_views.admin_set_active,
        name="admin-set-active",
    ),
    path(
        "users/<int:user_id>/set-role/",
        admin_views.admin_set_role,
        name="admin-set-role",
    ),
]

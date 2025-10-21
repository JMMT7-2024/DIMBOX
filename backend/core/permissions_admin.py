# core/permissions_admin.py
from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model

User = get_user_model()


class IsRoleAdmin(BasePermission):
    """
    Permite acceso solo a usuarios con rol ADMIN o staff/superuser.
    """

    def has_permission(self, request, view):
        u = request.user
        return bool(
            u
            and u.is_authenticated
            and (getattr(u, "role", None) == "ADMIN" or u.is_staff or u.is_superuser)
        )

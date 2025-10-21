# core/permissions.py
from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        return getattr(u, "role", None) == "ADMIN" or u.is_staff or u.is_superuser


# Compatibilidad con imports antiguos
IsAdminUser = IsAdminRole

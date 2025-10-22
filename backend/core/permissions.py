# core/permissions.py
from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(
            u and u.is_authenticated and getattr(u, "role", "").upper() == "ADMIN"
        )


# Alias de compatibilidad por si en algún sitio quedó IsAdminUser
IsAdminUser = IsAdminRole

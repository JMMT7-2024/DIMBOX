# core/permissions.py
from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Permite acceso solo a usuarios autenticados con role == 'ADMIN'.
    """

    def has_permission(self, request, view):
        u = request.user
        return bool(
            u and u.is_authenticated and getattr(u, "role", "").upper() == "ADMIN"
        )


# Alias para evitar errores si algún import anterior usaba IsAdminUser
IsAdminUser = IsAdminRole

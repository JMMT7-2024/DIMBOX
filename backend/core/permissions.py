# core/permissions.py
from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Permite acceso SOLO a usuarios autenticados con role == 'ADMIN'.
    (Si quieres permitir is_staff / is_superuser, agrega el OR correspondiente)
    """

    def has_permission(self, request, view):
        u = request.user
        return bool(
            u
            and u.is_authenticated
            and (
                getattr(u, "role", "").upper() == "ADMIN"
                or u.is_staff
                or u.is_superuser
            )
        )


# Alias para compatibilidad con imports antiguos
IsAdminUser = IsAdminRole

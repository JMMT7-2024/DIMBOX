# core/permissions.py
from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Permite acceso a usuarios con role ADMIN o con banderas de staff/superuser.
    """

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        role = (getattr(u, "role", "") or "").upper()
        return (
            role == "ADMIN"
            or getattr(u, "is_staff", False)
            or getattr(u, "is_superuser", False)
        )

from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """
    Permite el acceso solo a usuarios con rol 'ADMIN' o 'SUPERADMIN'.
    """
    def has_permission(self, request, view):
        # request.user existe gracias a IsAuthenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_role = getattr(request.user, 'role', 'USER')
        return user_role in ('ADMIN', 'SUPERADMIN')
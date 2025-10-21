# core/admin_views.py
import logging
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .permissions import (
    IsAdminRole,
)  # Alias IsAdminUser = IsAdminRole en permissions.py (compat)
# Si prefieres, puedes mantener: from .permissions import IsAdminUser

logger = logging.getLogger(__name__)
User = get_user_model()


# Helpers seguros: no asumen que existan todos los campos
def _has_field(model, name: str) -> bool:
    try:
        return any(f.name == name for f in model._meta.get_fields())
    except Exception:
        return False


def _user_dict(u):
    """Convierte el usuario a dict sin romper si faltan campos."""
    data = {
        "id": getattr(u, "id", None),
        "username": getattr(u, "username", ""),
        "email": getattr(u, "email", ""),
        "is_active": bool(getattr(u, "is_active", False)),
        "is_staff": bool(getattr(u, "is_staff", False)),
        "is_superuser": bool(getattr(u, "is_superuser", False)),
    }
    # Campos opcionales del custom User
    if _has_field(User, "name"):
        data["name"] = getattr(u, "name", "")
    if _has_field(User, "role"):
        data["role"] = getattr(u, "role", "USER")
    if _has_field(User, "subscription"):
        data["subscription"] = getattr(u, "subscription", "FREE")
    if _has_field(User, "record_count"):
        data["record_count"] = getattr(u, "record_count", 0)
    return data


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_stats(request):
    """Totales rápidos para tarjetas."""
    try:
        qs = User.objects.all()
        total = qs.count()

        # Contadores seguros: si no existe el campo, asume 0
        def _count_by(field, value):
            if _has_field(User, field):
                return qs.filter(**{field: value}).count()
            return 0

        premium = _count_by("subscription", "PREMIUM")
        free = _count_by("subscription", "FREE")

        # Activos: si no hay subscription, solo cuenta is_active
        active = qs.filter(is_active=True).count()

        return Response(
            {"total": total, "premium": premium, "free": free, "active": active},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.exception("admin_stats failed")
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_users_list(request):
    """
    Devuelve LISTA simple (no {count, results}) para compatibilidad con tu frontend actual.
    GET params opcionales: ?q=..., ?plan=FREE|PREMIUM, ?active=true|false
    """
    try:
        q = (request.GET.get("q") or "").strip()
        plan = (request.GET.get("plan") or "").upper()
        active = request.GET.get("active")

        qs = User.objects.all().order_by("id")

        if q:
            # Filtra solo por campos que existan
            q_filter = Q()
            if _has_field(User, "username"):
                q_filter |= Q(username__icontains=q)
            if _has_field(User, "email"):
                q_filter |= Q(email__icontains=q)
            if _has_field(User, "name"):
                q_filter |= Q(name__icontains=q)
            qs = qs.filter(q_filter)

        if plan in ("FREE", "PREMIUM") and _has_field(User, "subscription"):
            qs = qs.filter(subscription=plan)

        if active in ("true", "false"):
            qs = qs.filter(is_active=(active == "true"))

        data = [_user_dict(u) for u in qs]
        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.exception("admin_users_list failed")
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_plan(request, user_id):
    try:
        plan = (request.data.get("plan") or "").upper()
        if plan not in ("FREE", "PREMIUM"):
            return Response(
                {"detail": "plan inválido"}, status=status.HTTP_400_BAD_REQUEST
            )
        if not _has_field(User, "subscription"):
            return Response(
                {"detail": "el modelo no soporta 'subscription'"}, status=400
            )

        u = User.objects.get(id=user_id)
        setattr(u, "subscription", plan)
        u.save(update_fields=["subscription"])
        return Response({"ok": True, "user": _user_dict(u)}, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.exception("admin_set_plan failed")
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_active(request, user_id):
    try:
        u = User.objects.get(id=user_id)
        new_active = bool(request.data.get("is_active"))
        # Evita que un admin se deshabilite a sí mismo
        if u.id == request.user.id and not new_active:
            return Response(
                {"detail": "no puedes deshabilitar tu propia cuenta"}, status=400
            )
        u.is_active = new_active
        u.save(update_fields=["is_active"])
        return Response({"ok": True, "user": _user_dict(u)}, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.exception("admin_set_active failed")
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_role(request, user_id):
    try:
        role = (request.data.get("role") or "").upper()
        if role not in ("USER", "ADMIN"):
            return Response(
                {"detail": "rol inválido"}, status=status.HTTP_400_BAD_REQUEST
            )
        if not _has_field(User, "role"):
            return Response({"detail": "el modelo no soporta 'role'"}, status=400)

        u = User.objects.get(id=user_id)
        # Evita que un admin se quite su propio rol
        if u.id == request.user.id and role != "ADMIN":
            return Response(
                {"detail": "no puedes quitarte el rol ADMIN a ti mismo"}, status=400
            )

        setattr(u, "role", role)
        u.save(update_fields=["role"])
        return Response({"ok": True, "user": _user_dict(u)}, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.exception("admin_set_role failed")
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

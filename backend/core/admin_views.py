# core/admin_views.py
import logging
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsAdminRole

logger = logging.getLogger(__name__)
User = get_user_model()


def _has_field(model, name: str) -> bool:
    try:
        return any(f.name == name for f in model._meta.get_fields())
    except Exception:
        return False


def _user_base_dict(u):
    """Campos que existen siempre en cualquier User."""
    return {
        "id": getattr(u, "id", None),
        "username": getattr(u, "username", ""),
        "email": getattr(u, "email", ""),
        "is_active": bool(getattr(u, "is_active", False)),
        "is_staff": bool(getattr(u, "is_staff", False)),
        "is_superuser": bool(getattr(u, "is_superuser", False)),
    }


def _user_optional_fields(u, data):
    """Campos del CustomUser: si la columna no existe en DB, se omite sin romper."""
    for name, default in (
        ("name", ""),
        ("role", "USER"),
        ("subscription", "FREE"),
        ("record_count", 0),
    ):
        try:
            val = getattr(u, name)
        except Exception:
            continue
        else:
            data[name] = val


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_stats(request):
    try:
        qs = User.objects.all()
        total = qs.count()

        # si no existe 'subscription' aún en DB, estos counts no rompen
        premium = (
            qs.filter(subscription="PREMIUM").count()
            if _has_field(User, "subscription")
            else 0
        )
        free = (
            qs.filter(subscription="FREE").count()
            if _has_field(User, "subscription")
            else 0
        )
        active = qs.filter(is_active=True).count()

        return Response(
            {"total": total, "premium": premium, "free": free, "active": active}
        )
    except Exception as e:
        logger.exception("admin_stats failed")
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_users_list(request):
    """
    Devuelve una LISTA simple de usuarios (no {count, results}) para simplicidad.
    Filtra por ?q=... | ?plan=FREE|PREMIUM | ?active=true|false
    Evita SELECT * con .only(...) para no romper si faltan columnas.
    """
    try:
        q = (request.GET.get("q") or "").strip()
        plan = (request.GET.get("plan") or "").upper()
        active = request.GET.get("active")

        base_fields = [
            "id",
            "username",
            "email",
            "is_active",
            "is_staff",
            "is_superuser",
        ]
        qs = User.objects.only(*base_fields).order_by("id")

        if q:
            qf = Q(username__icontains=q) | Q(email__icontains=q)
            if _has_field(User, "name"):
                qf |= Q(name__icontains=q)
            qs = qs.filter(qf)

        if plan in ("FREE", "PREMIUM") and _has_field(User, "subscription"):
            qs = qs.filter(subscription=plan)

        if active in ("true", "false"):
            qs = qs.filter(is_active=(active == "true"))

        data = []
        for u in qs:
            row = _user_base_dict(u)
            _user_optional_fields(u, row)
            data.append(row)

        return Response(data)

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

        u = User.objects.get(id=user_id)
        if not _has_field(User, "subscription"):
            return Response(
                {"detail": "el modelo no tiene 'subscription' en esta base de datos"},
                status=400,
            )

        u.subscription = plan
        u.save(update_fields=["subscription"])
        row = _user_base_dict(u)
        _user_optional_fields(u, row)
        return Response({"ok": True, "user": row})

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
        # evita deshabilitarse a sí mismo
        new_active = bool(request.data.get("is_active"))
        if u.id == request.user.id and not new_active:
            return Response(
                {"detail": "no puedes deshabilitar tu propia cuenta"}, status=400
            )

        u.is_active = new_active
        u.save(update_fields=["is_active"])
        row = _user_base_dict(u)
        _user_optional_fields(u, row)
        return Response({"ok": True, "user": row})

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

        u = User.objects.get(id=user_id)
        if not _has_field(User, "role"):
            return Response(
                {"detail": "el modelo no tiene 'role' en esta base de datos"},
                status=400,
            )

        # evita que un admin se quite su propio rol
        if u.id == request.user.id and role != "ADMIN":
            return Response(
                {"detail": "no puedes quitarte el rol ADMIN a ti mismo"}, status=400
            )

        u.role = role
        u.save(update_fields=["role"])
        row = _user_base_dict(u)
        _user_optional_fields(u, row)
        return Response({"ok": True, "user": row})

    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.exception("admin_set_role failed")
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

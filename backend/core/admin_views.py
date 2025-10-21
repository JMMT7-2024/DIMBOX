# core/admin_views.py
import logging
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .permissions import IsAdminRole  # tu permiso de admin

logger = logging.getLogger(__name__)
User = get_user_model()


def _user_base_dict(u):
    """Campos seguros que existen siempre en cualquier User."""
    return {
        "id": getattr(u, "id", None),
        "username": getattr(u, "username", ""),
        "email": getattr(u, "email", ""),
        "is_active": bool(getattr(u, "is_active", False)),
        "is_staff": bool(getattr(u, "is_staff", False)),
        "is_superuser": bool(getattr(u, "is_superuser", False)),
    }


def _user_optional_fields(u, data):
    """
    Campos opcionales del CustomUser. Si faltan en la DB, los ignoramos.
    Evitamos que un acceso de campo dispare un 500.
    """
    for name, default in (
        ("name", ""),
        ("role", "USER"),
        ("subscription", "FREE"),
        ("record_count", 0),
    ):
        try:
            val = getattr(u, name)
        except Exception:
            continue  # columna no existe en la DB actual → se omite
        else:
            data[name] = val


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_stats(request):
    try:
        qs = User.objects.all()
        total = qs.count()
        # Si tu DB de prod aún no tiene 'subscription', estos counts no fallan
        premium = (
            qs.filter(subscription="PREMIUM").count()
            if hasattr(User, "subscription")
            else 0
        )
        free = (
            qs.filter(subscription="FREE").count()
            if hasattr(User, "subscription")
            else 0
        )
        active = qs.filter(is_active=True).count()
        return Response(
            {"total": total, "premium": premium, "free": free, "active": active}
        )
    except Exception as e:
        logger.exception("admin_stats failed")
        return Response({"detail": str(e)}, status=400)


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_users_list(request):
    """
    Devuelve una LISTA simple de usuarios para tu tabla.
    Selecciona solo columnas seguras (evita SELECT * que rompe si faltan columnas).
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
            # Añadimos name a la búsqueda solo si existe (si no, no la tocamos)
            if hasattr(User, "name"):
                qf |= Q(name__icontains=q)
            qs = qs.filter(qf)

        if plan in ("FREE", "PREMIUM") and hasattr(User, "subscription"):
            qs = qs.filter(subscription=plan)

        if active in ("true", "false"):
            qs = qs.filter(is_active=(active == "true"))

        data = []
        for u in qs:
            row = _user_base_dict(u)
            _user_optional_fields(
                u, row
            )  # añade name/role/subscription/record_count si están
            data.append(row)

        return Response(data)

    except Exception as e:
        logger.exception("admin_users_list failed")
        return Response({"detail": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_plan(request, user_id):
    try:
        plan = (request.data.get("plan") or "").upper()
        if plan not in ("FREE", "PREMIUM"):
            return Response({"detail": "plan inválido"}, status=400)
        u = User.objects.get(id=user_id)
        if not hasattr(u, "subscription"):
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
        return Response({"detail": "usuario no encontrado"}, status=404)
    except Exception as e:
        logger.exception("admin_set_plan failed")
        return Response({"detail": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_active(request, user_id):
    try:
        u = User.objects.get(id=user_id)
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
        return Response({"detail": "usuario no encontrado"}, status=404)
    except Exception as e:
        logger.exception("admin_set_active failed")
        return Response({"detail": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_role(request, user_id):
    try:
        role = (request.data.get("role") or "").upper()
        if role not in ("USER", "ADMIN"):
            return Response({"detail": "rol inválido"}, status=400)
        u = User.objects.get(id=user_id)
        if not hasattr(u, "role"):
            return Response(
                {"detail": "el modelo no tiene 'role' en esta base de datos"},
                status=400,
            )
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
        return Response({"detail": "usuario no encontrado"}, status=404)
    except Exception as e:
        logger.exception("admin_set_role failed")
        return Response({"detail": str(e)}, status=400)

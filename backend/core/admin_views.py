# core/admin_views.py
import logging
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsAdminRole  # o IsAdminUser si usas el alias
from .models import User as CoreUser

logger = logging.getLogger(__name__)
User = get_user_model()


def _user_dict(u: User):
    # Evita AttributeError si el modelo difiere
    return {
        "id": u.id,
        "username": getattr(u, "username", ""),
        "email": getattr(u, "email", ""),
        "name": getattr(u, "name", ""),
        "role": getattr(u, "role", "USER"),
        "subscription": getattr(u, "subscription", "FREE"),
        "is_active": bool(getattr(u, "is_active", False)),
        "is_staff": bool(getattr(u, "is_staff", False)),
        "is_superuser": bool(getattr(u, "is_superuser", False)),
        "record_count": getattr(u, "record_count", 0),
        "date_joined": getattr(u, "date_joined", None),
    }


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_stats(request):
    try:
        premium = User.objects.filter(
            subscription=CoreUser.SubscriptionStatus.PREMIUM
        ).count()
        free = User.objects.filter(
            subscription=CoreUser.SubscriptionStatus.FREE
        ).count()
        total = User.objects.count()
        active = User.objects.filter(is_active=True).count()
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
    try:
        q = (request.GET.get("q") or "").strip()
        plan = (request.GET.get("plan") or "").upper()
        active = request.GET.get("active")

        qs = User.objects.all().order_by("id")

        if q:
            qs = qs.filter(
                Q(username__icontains=q) | Q(email__icontains=q) | Q(name__icontains=q)
            )

        if plan in (
            CoreUser.SubscriptionStatus.FREE,
            CoreUser.SubscriptionStatus.PREMIUM,
        ):
            qs = qs.filter(subscription=plan)

        if active in ("true", "false"):
            qs = qs.filter(is_active=(active == "true"))

        try:
            page = int(request.GET.get("page", "1"))
            page_size = max(1, min(200, int(request.GET.get("page_size", "50"))))
        except ValueError:
            page, page_size = 1, 50

        start = (page - 1) * page_size
        end = start + page_size
        total = qs.count()

        data = [_user_dict(u) for u in qs[start:end]]
        return Response({"count": total, "results": data}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception("admin_users_list failed")
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_plan(request, user_id):
    try:
        plan = (request.data.get("plan") or "").upper()
        if plan not in (
            CoreUser.SubscriptionStatus.FREE,
            CoreUser.SubscriptionStatus.PREMIUM,
        ):
            return Response(
                {"detail": "plan inválido"}, status=status.HTTP_400_BAD_REQUEST
            )

        u = User.objects.get(id=user_id)
        u.subscription = plan
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
        if u.id == request.user.id and request.data.get("is_active") in (
            False,
            "false",
            "0",
        ):
            return Response(
                {"detail": "no puedes deshabilitar tu propia cuenta"}, status=400
            )
        u.is_active = bool(request.data.get("is_active"))
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
        if role not in (CoreUser.Role.USER, CoreUser.Role.ADMIN):
            return Response(
                {"detail": "rol inválido"}, status=status.HTTP_400_BAD_REQUEST
            )

        u = User.objects.get(id=user_id)
        if u.id == request.user.id and role != CoreUser.Role.ADMIN:
            return Response(
                {"detail": "no puedes quitarte el rol ADMIN a ti mismo"}, status=400
            )
        u.role = role
        u.save(update_fields=["role"])
        return Response({"ok": True, "user": _user_dict(u)}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.exception("admin_set_role failed")
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

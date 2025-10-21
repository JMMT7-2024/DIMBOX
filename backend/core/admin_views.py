# core/admin_views.py
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsAdminRole  # usa la clase nueva (alias existe)

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_stats(request):
    try:
        total = User.objects.count()
        premium = User.objects.filter(subscription="PREMIUM").count()
        free = User.objects.filter(subscription="FREE").count()
        active = User.objects.filter(is_active=True, subscription="PREMIUM").count()
        return Response(
            {"total": total, "premium": premium, "free": free, "active": active}
        )
    except Exception as e:
        return Response(
            {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_users_list(request):
    try:
        q = (request.GET.get("q") or "").strip()
        plan = (request.GET.get("plan") or "").upper()
        active = request.GET.get("active")  # 'true' | 'false' | None

        qs = User.objects.all().order_by("id")
        if q:
            qs = qs.filter(
                Q(username__icontains=q) | Q(email__icontains=q) | Q(name__icontains=q)
            )
        if plan in ("FREE", "PREMIUM"):
            qs = qs.filter(subscription=plan)
        if active in ("true", "false"):
            qs = qs.filter(is_active=(active == "true"))

        data = [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "subscription": u.subscription,
                "is_active": u.is_active,
                "record_count": getattr(u, "record_count", 0),
            }
            for u in qs
        ]
        return Response(data)
    except Exception as e:
        return Response(
            {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
        u.subscription = plan
        u.save(update_fields=["subscription"])
        return Response({"ok": True, "subscription": u.subscription})
    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_active(request, user_id):
    try:
        u = User.objects.get(id=user_id)
        u.is_active = bool(request.data.get("is_active"))
        u.save(update_fields=["is_active"])
        return Response({"ok": True, "is_active": u.is_active})
    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


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
        u.role = role
        u.save(update_fields=["role"])
        return Response({"ok": True, "role": u.role})
    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# core/admin_views.py
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .permissions import IsAdminRole

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_stats(request):
    try:
        premium = User.objects.filter(subscription="PREMIUM").count()
        free = User.objects.filter(subscription="FREE").count()
        total = User.objects.count()
        active = User.objects.filter(is_active=True, subscription="PREMIUM").count()
        return Response(
            {"total": total, "premium": premium, "free": free, "active": active}
        )
    except Exception as e:
        return Response({"detail": f"error: {e}"}, status=500)


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_users_list(request):
    try:
        q = (request.GET.get("q") or "").strip()
        plan = (request.GET.get("plan") or "").upper()
        active = request.GET.get("active")

        qs = User.objects.all().order_by("id")
        if q:
            from django.db.models import Q

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
                "role": getattr(u, "role", "USER"),
                "subscription": getattr(u, "subscription", "FREE"),
                "is_active": u.is_active,
                "record_count": getattr(u, "record_count", 0),
            }
            for u in qs
        ]
        return Response(data)
    except Exception as e:
        return Response({"detail": f"error: {e}"}, status=500)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_plan(request, pk):
    try:
        plan = (request.data.get("plan") or "").upper()
        if plan not in ("FREE", "PREMIUM"):
            return Response({"detail": "plan inválido"}, status=400)
        u = User.objects.get(pk=pk)
        u.subscription = plan
        u.save(update_fields=["subscription"])
        return Response({"ok": True, "subscription": u.subscription})
    except User.DoesNotExist:
        return Response({"detail": "usuario no encontrado"}, status=404)
    except Exception as e:
        return Response({"detail": f"error: {e}"}, status=500)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_active(request, pk):
    try:
        u = User.objects.get(pk=pk)
        is_active = bool(request.data.get("is_active"))
        u.is_active = is_active
        u.save(update_fields=["is_active"])
        return Response({"ok": True, "is_active": u.is_active})
    except User.DoesNotExist:
        return Response({"detail": "usuario no encontrado"}, status=404)
    except Exception as e:
        return Response({"detail": f"error: {e}"}, status=500)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_role(request, pk):
    try:
        role = (request.data.get("role") or "").upper()
        if role not in ("USER", "ADMIN"):
            return Response({"detail": "rol inválido"}, status=400)
        u = User.objects.get(pk=pk)
        u.role = role
        u.save(update_fields=["role"])
        return Response({"ok": True, "role": u.role})
    except User.DoesNotExist:
        return Response({"detail": "usuario no encontrado"}, status=404)
    except Exception as e:
        return Response({"detail": f"error: {e}"}, status=500)

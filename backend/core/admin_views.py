# core/admin_views.py
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .permissions import IsAdminRole

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_stats(request):
    data = {
        "total": User.objects.count(),
        "premium": User.objects.filter(subscription="PREMIUM").count(),
        "free": User.objects.filter(subscription="FREE").count(),
        "active": User.objects.filter(subscription="PREMIUM", is_active=True).count(),
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_users_list(request):
    from django.db.models import Q

    q = (request.GET.get("q") or "").strip()
    plan = (request.GET.get("plan") or "").upper()
    active = request.GET.get("active")

    qs = User.objects.all().order_by("id")
    if q:
        qs = qs.filter(
            Q(username__icontains=q) | Q(email__icontains=q) | Q(name__icontains=q)
        )
    if plan in ("FREE", "PREMIUM"):
        qs = qs.filter(subscription=plan)
    if active in ("true", "false"):
        qs = qs.filter(is_active=(active == "true"))

    out = [
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
    return Response(out)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_plan(request, pk):
    plan = (request.data.get("plan") or "").upper()
    if plan not in ("FREE", "PREMIUM"):
        return Response({"detail": "plan inválido"}, status=400)
    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"detail": "usuario no encontrado"}, status=404)
    u.subscription = plan
    u.save(update_fields=["subscription"])
    return Response({"ok": True, "subscription": u.subscription})


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_active(request, pk):
    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"detail": "usuario no encontrado"}, status=404)
    u.is_active = bool(request.data.get("is_active"))
    u.save(update_fields=["is_active"])
    return Response({"ok": True, "is_active": u.is_active})


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_role(request, pk):
    role = (request.data.get("role") or "").upper()
    if role not in ("USER", "ADMIN"):
        return Response({"detail": "rol inválido"}, status=400)
    try:
        u = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"detail": "usuario no encontrado"}, status=404)
    u.role = role
    u.save(update_fields=["role"])
    return Response({"ok": True, "role": u.role})

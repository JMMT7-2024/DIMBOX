# core/admin_views.py
from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .permissions import IsAdminRole  # <-- nuestro permiso
from .models import User as CoreUser  # para usar enums Role/SubscriptionStatus

User = get_user_model()


def _user_dict(u: User):
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "name": getattr(u, "name", ""),
        "role": getattr(u, "role", "USER"),
        "subscription": getattr(u, "subscription", "FREE"),
        "is_active": bool(u.is_active),
        "is_staff": bool(u.is_staff),
        "is_superuser": bool(u.is_superuser),
        "record_count": getattr(u, "record_count", 0),
        "date_joined": u.date_joined,
    }


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_stats(request):
    premium = User.objects.filter(
        subscription=CoreUser.SubscriptionStatus.PREMIUM
    ).count()
    free = User.objects.filter(subscription=CoreUser.SubscriptionStatus.FREE).count()
    total = User.objects.count()
    active = User.objects.filter(is_active=True).count()
    return Response(
        {"total": total, "premium": premium, "free": free, "active": active},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAdminRole])
def admin_users_list(request):
    q = (request.GET.get("q") or "").strip()
    plan = (request.GET.get("plan") or "").upper()
    active = request.GET.get("active")

    qs = User.objects.all().order_by("id")

    if q:
        qs = qs.filter(
            Q(username__icontains=q) | Q(email__icontains=q) | Q(name__icontains=q)
        )

    if plan in (CoreUser.SubscriptionStatus.FREE, CoreUser.SubscriptionStatus.PREMIUM):
        qs = qs.filter(subscription=plan)

    if active in ("true", "false"):
        qs = qs.filter(is_active=(active == "true"))

    # (Opcional) Paginación simple
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


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_plan(request, user_id):
    plan = (request.data.get("plan") or "").upper()
    if plan not in (
        CoreUser.SubscriptionStatus.FREE,
        CoreUser.SubscriptionStatus.PREMIUM,
    ):
        return Response({"detail": "plan inválido"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        u = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    u.subscription = plan
    u.save(update_fields=["subscription"])
    return Response({"ok": True, "user": _user_dict(u)}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_active(request, user_id):
    try:
        u = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    # Defensa: evitar auto-deshabilitarse
    if u.id == request.user.id and request.data.get("is_active") in (
        False,
        "false",
        "0",
    ):
        return Response(
            {"detail": "no puedes deshabilitar tu propia cuenta"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    is_active = bool(request.data.get("is_active"))
    u.is_active = is_active
    u.save(update_fields=["is_active"])
    return Response({"ok": True, "user": _user_dict(u)}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAdminRole])
def admin_set_role(request, user_id):
    role = (request.data.get("role") or "").upper()
    if role not in (CoreUser.Role.USER, CoreUser.Role.ADMIN):
        return Response({"detail": "rol inválido"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        u = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    # Defensa: evitar auto-degradarse si no hay otro admin
    if u.id == request.user.id and role != CoreUser.Role.ADMIN:
        return Response(
            {"detail": "no puedes quitarte el rol ADMIN a ti mismo"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    u.role = role
    u.save(update_fields=["role"])
    return Response({"ok": True, "user": _user_dict(u)}, status=status.HTTP_200_OK)

# core/admin_views.py
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .permissions import IsAdminUser # <-- El nombre correcto está aquí

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAdminUser]) # <-- CORREGIDO
def admin_stats(request):
    premium = User.objects.filter(subscription='PREMIUM').count()
    free = User.objects.filter(subscription='FREE').count()
    total = User.objects.count()
    active = User.objects.filter(is_active=True, subscription='PREMIUM').count()
    return Response({"total": total, "premium": premium, "free": free, "active": active})

@api_view(['GET'])
@permission_classes([IsAdminUser]) # <-- CORREGIDO
def admin_users_list(request):
    q = request.GET.get('q', '').strip()
    plan = request.GET.get('plan', '').upper()
    active = request.GET.get('active')
    qs = User.objects.all().order_by('id')
    if q:
        from django.db.models import Q
        qs = qs.filter(Q(username__icontains=q)|Q(email__icontains=q)|Q(name__icontains=q))
    if plan in ('FREE','PREMIUM'):
        qs = qs.filter(subscription=plan)
    if active in ('true','false'):
        qs = qs.filter(is_active=(active=='true'))
    data = [{
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "name": u.name,
        "role": u.role,
        "subscription": u.subscription,
        "is_active": u.is_active,
        "record_count": getattr(u, "record_count", 0),
    } for u in qs]
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAdminUser]) # <-- CORREGIDO
def admin_set_plan(request, user_id):
    plan = request.data.get('plan', '').upper()
    if plan not in ('FREE','PREMIUM'):
        return Response({"detail":"plan inválido"}, status=400)
    try:
        u = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"detail":"usuario no encontrado"}, status=404)
    u.subscription = plan
    u.save()
    return Response({"ok": True, "subscription": u.subscription})

@api_view(['POST'])
@permission_classes([IsAdminUser]) # <-- CORREGIDO
def admin_set_active(request, user_id):
    try:
        u = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"detail":"usuario no encontrado"}, status=404)
    u.is_active = bool(request.data.get('is_active'))
    u.save()
    return Response({"ok": True, "is_active": u.is_active})

@api_view(['POST'])
@permission_classes([IsAdminUser]) # <-- CORREGIDO
def admin_set_role(request, user_id):
    role = (request.data.get('role') or '').upper()
    if role not in ('USER','ADMIN'):
        return Response({"detail":"rol inválido"}, status=400)
    try:
        u = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"detail":"usuario no encontrado"}, status=404)
    u.role = role
    u.save()
    return Response({"ok": True, "role": u.role})
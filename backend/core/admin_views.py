# core/admin_views.py - VERSIÓN COMPLETA Y CORREGIDA
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Q, Count, Sum
from datetime import datetime, timedelta
from core.models import Transaction

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """
    ✅ ESTADÍSTICAS COMPLETAS CON MÉTRICAS DE LÍMITES
    """
    try:
        print("📊 admin_stats llamado")

        total_users = User.objects.count()
        premium_users = User.objects.filter(subscription="PREMIUM").count()
        enterprise_users = User.objects.filter(subscription="ENTERPRISE").count()
        free_users = User.objects.filter(subscription="FREE").count()
        active_users = User.objects.filter(is_active=True).count()

        # Usuarios registrados hoy
        today = datetime.now().date()
        today_registrations = User.objects.filter(date_joined__date=today).count()

        # Total de transacciones en el sistema
        total_transactions = Transaction.objects.count()

        # Métricas de límites
        users_near_limit = 0
        users_exceeded_limit = 0
        total_usage = 0

        users = User.objects.all()
        for user in users:
            usage_stats = user.usage_stats
            usage_percentage = usage_stats.get("usage_percentage", 0)
            total_usage += usage_percentage

            if usage_percentage >= 100:
                users_exceeded_limit += 1
            elif usage_percentage >= 80:
                users_near_limit += 1

        average_usage = total_usage / users.count() if users.count() > 0 else 0

        data = {
            "total": total_users,
            "premium": premium_users,
            "free": free_users,
            "enterprise": enterprise_users,
            "active": active_users,
            "today_registrations": today_registrations,
            "total_transactions": total_transactions,
            "limits_usage": {
                "near_limit_users": users_near_limit,
                "exceeded_limit_users": users_exceeded_limit,
                "average_usage": round(average_usage, 2),
            },
        }

        print(f"✅ Estadísticas generadas: {data}")
        return Response(data)

    except Exception as e:
        print(f"❌ Error en admin_stats: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users_list(request):
    """
    ✅ LISTA DE USUARIOS CON DATOS COMPLETOS
    """
    try:
        print("👥 admin_users_list llamado")

        q = (request.GET.get("q") or "").strip()
        plan = (request.GET.get("plan") or "").upper()
        role_filter = (request.GET.get("role") or "").upper()
        active = request.GET.get("active")

        qs = User.objects.all().order_by("-date_joined")

        # Aplicar filtros
        if q:
            qs = qs.filter(
                Q(username__icontains=q) | Q(email__icontains=q) | Q(name__icontains=q)
            )

        if plan in ("FREE", "PREMIUM", "ENTERPRISE"):
            qs = qs.filter(subscription=plan)

        if role_filter in ("USER", "ADMIN"):
            qs = qs.filter(role=role_filter)

        if active in ("true", "false"):
            qs = qs.filter(is_active=(active == "true"))

        # ✅ ESTRUCTURA CORREGIDA: Incluir todos los campos necesarios para el frontend
        out = []
        for u in qs:
            user_data = {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "subscription": u.subscription,
                "is_active": u.is_active,
                "record_count": getattr(u, "record_count", 0),
                "date_joined": u.date_joined.isoformat() if u.date_joined else None,
                "last_login": u.last_login.isoformat() if u.last_login else None,
                # ✅ CAMPOS CRÍTICOS PARA EL FRONTEND
                "usage_stats": getattr(u, "usage_stats", {}),
                "custom_limits": getattr(u, "custom_limits", None),
                "goal_name": getattr(u, "goal_name", ""),
                "goal_amount": float(getattr(u, "goal_amount", 0)),
            }
            out.append(user_data)

        print(f"✅ Usuarios encontrados: {len(out)}")
        return Response({"users": out})

    except Exception as e:
        print(f"❌ Error en admin_users_list: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_set_plan(request, pk):
    """
    ✅ CAMBIAR PLAN - COMPATIBLE CON 'plan' Y 'subscription'
    """
    try:
        print(f"🎯 admin_set_plan llamado: user_id={pk}, data={request.data}")

        # ✅ ACEPTAR AMBOS CAMPOS: 'subscription' O 'plan'
        subscription = (
            request.data.get("subscription") or request.data.get("plan") or ""
        )
        subscription = subscription.upper()

        if subscription not in ("FREE", "PREMIUM", "ENTERPRISE"):
            return Response(
                {"error": "Plan inválido. Debe ser: FREE, PREMIUM o ENTERPRISE"},
                status=400,
            )

        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=404)

        old_plan = user.subscription
        user.subscription = subscription
        user.save(update_fields=["subscription"])

        print(f"✅ Plan actualizado en BD: {old_plan} -> {user.subscription}")

        # ✅ DEVOLVER RESPUESTA COMPLETA CON DATOS ACTUALIZADOS
        return Response(
            {
                "success": True,
                "message": f"Plan actualizado de {old_plan} a {subscription}",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "subscription": user.subscription,
                    "role": user.role,
                    "is_active": user.is_active,
                },
            }
        )

    except Exception as e:
        print(f"❌ Error en admin_set_plan: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_set_active(request, pk):
    """
    ✅ ACTIVAR/DESACTIVAR USUARIO - CORREGIDO
    """
    try:
        print(f"🎯 admin_set_active llamado: user_id={pk}, data={request.data}")

        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=404)

        is_active = request.data.get("is_active")
        if is_active is None:
            return Response({"error": "El campo 'is_active' es requerido"}, status=400)

        old_status = user.is_active
        user.is_active = bool(is_active)
        user.save(update_fields=["is_active"])

        print(f"✅ Estado actualizado: {old_status} -> {user.is_active}")

        return Response(
            {
                "success": True,
                "message": f"Usuario {'activado' if user.is_active else 'desactivado'}",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "subscription": user.subscription,
                    "role": user.role,
                    "is_active": user.is_active,
                },
            }
        )

    except Exception as e:
        print(f"❌ Error en admin_set_active: {str(e)}")
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_set_role(request, pk):
    """
    ✅ CAMBIAR ROL - CORREGIDO
    """
    try:
        print(f"🎯 admin_set_role llamado: user_id={pk}, data={request.data}")

        role = (request.data.get("role") or "").upper()

        if role not in ("USER", "ADMIN"):
            return Response(
                {"error": "Rol inválido. Debe ser: USER o ADMIN"}, status=400
            )

        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "Usuario no encontrado"}, status=404)

        old_role = user.role
        user.role = role
        user.save(update_fields=["role"])

        print(f"✅ Rol actualizado: {old_role} -> {user.role}")

        return Response(
            {
                "success": True,
                "message": f"Rol actualizado de {old_role} a {role}",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "subscription": user.subscription,
                    "role": user.role,
                    "is_active": user.is_active,
                },
            }
        )

    except Exception as e:
        print(f"❌ Error en admin_set_role: {str(e)}")
        return Response({"error": str(e)}, status=500)

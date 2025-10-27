# core/views.py - VERSIÓN ACTUALIZADA CON SERIALIZERS MEJORADOS
from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
import csv
from io import StringIO

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils.timezone import now
from django.db.models import Q, Count, Sum, Avg
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .models import Transaction, TransactionType, GastoCategoria
from .serializers import (  # ✅ IMPORTAR LOS NUEVOS SERIALIZERS
    UserSerializer,
    MeSerializer,
    ProfileUpdateSerializer,
    AdminUserSerializer,
    UserLimitsSerializer,
    TransactionSerializer,
)

User = get_user_model()

# -------------------------------
# Helpers (MANTENIDOS PARA COMPATIBILIDAD)
# -------------------------------


def _to_decimal(value, default="0"):
    """
    Convierte strings/números a Decimal de forma segura.
    """
    if value in (None, ""):
        value = default
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Monto inválido")


def _parse_date(value):
    """
    Acepta 'YYYY-MM-DD'. Lanza ValueError si no puede.
    """
    if not value:
        raise ValueError("Fecha requerida")
    return datetime.strptime(value, "%Y-%m-%d").date()


def _tx_to_dict(tx: Transaction) -> dict:
    """
    Representación serializada mínima para no depender de serializers externos.
    """
    return {
        "id": tx.id,
        "transaction_type": tx.transaction_type,  # 'IN' | 'OUT'
        "amount": str(tx.amount),
        "date": tx.date.isoformat(),
        "description": tx.description or "",
        "category": tx.category,  # códigos: 'AL','TR','SE','VI','OC','SA','ED','OT' o None
        "created_at": tx.created_at.isoformat(),
    }


def _validate_category(code: str | None) -> str | None:
    """
    Valida/normaliza categoría. Acepta None/'' (opcional).
    Acepta código en mayúsculas; rechaza valores no válidos.
    """
    if not code:
        return None
    code = str(code).upper().strip()
    valid_codes = {choice[0] for choice in GastoCategoria.choices}
    if code not in valid_codes:
        raise ValueError(
            f"Categoría inválida: '{code}'. Usa códigos {sorted(valid_codes)}"
        )
    return code


def _validate_tx_type(tx_type: str) -> str:
    """
    Debe ser 'IN' o 'OUT'.
    """
    t = (tx_type or "").upper()
    if t not in (TransactionType.INGRESO, TransactionType.GASTO):
        raise ValueError("transaction_type debe ser IN u OUT")
    return t


# -------------------------------
# Auth / Perfil - ACTUALIZADOS CON SERIALIZERS
# -------------------------------


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """
    Crea un usuario. Campos esperados:
      - username (requerido)
      - password (requerido)
      - email (opcional)
      - name (opcional)
    """
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # ✅ USAR MeSerializer PARA RESPUESTA COMPLETA
        response_serializer = MeSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Devuelve info del usuario autenticado (para AuthContext).
    ✅ ACTUALIZADO: Usar MeSerializer para información completa
    """
    serializer = MeSerializer(request.user)
    return Response(serializer.data)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    GET: datos del perfil (meta/objetivo).
    PUT: actualizar name, goal_name, goal_amount
    ✅ ACTUALIZADO: Usar serializers apropiados
    """
    if request.method == "GET":
        serializer = MeSerializer(request.user)
        return Response(serializer.data)

    # PUT - Actualizar perfil
    serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        # ✅ DEVOLVER RESPUESTA COMPLETA CON MeSerializer
        response_serializer = MeSerializer(request.user)
        return Response(response_serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------------
# Transacciones - ACTUALIZADOS CON SERIALIZERS
# -------------------------------


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def transactions_list_create(request):
    """
    GET: lista de transacciones del usuario (ordenadas por fecha desc, creación desc).
    POST: crea una transacción.
    ✅ MEJORADO: Usar TransactionSerializer con validación de límites
    """
    user = request.user

    if request.method == "GET":
        transactions = Transaction.objects.filter(user=user).order_by(
            "-date", "-created_at"
        )
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    # POST - CON VERIFICACIÓN DE LÍMITES
    # ✅ OBTENER LÍMITES ACTUALES DEL USUARIO
    user_serializer = MeSerializer(user)
    user_data = user_serializer.data
    effective_limits = user_data["effective_limits"]
    current_count = user_data["usage_stats"]["transactions_count"]
    max_transactions = effective_limits.get("maxTransactions", 100)

    # Verificar límite de transacciones
    if current_count >= max_transactions:
        return Response(
            {
                "detail": f"Límite de transacciones alcanzado. Máximo permitido: {max_transactions}",
                "limit_type": "maxTransactions",
                "current_count": current_count,
                "max_limit": max_transactions,
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    # Verificar límite de monto por transacción
    serializer = TransactionSerializer(data=request.data)
    if serializer.is_valid():
        amount = Decimal(str(serializer.validated_data["amount"]))
        max_amount = effective_limits.get("maxTransactionAmount", 10000)

        if amount > max_amount:
            return Response(
                {
                    "detail": f"El monto excede el límite permitido. Máximo por transacción: S/ {max_amount}",
                    "limit_type": "maxTransactionAmount",
                    "current_amount": float(amount),
                    "max_limit": max_amount,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # ✅ GUARDAR TRANSACCIÓN
        transaction = serializer.save(user=user)

        # Actualizar record_count del usuario
        if hasattr(user, "record_count"):
            try:
                user.record_count = Transaction.objects.filter(user=user).count()
                user.save(update_fields=["record_count"])
            except Exception:
                pass

        return Response(
            TransactionSerializer(transaction).data, status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def transaction_detail(request, pk: int):
    """
    GET: detalle
    PUT: actualizar (mismos campos que POST)
    DELETE: eliminar
    ✅ ACTUALIZADO: Usar TransactionSerializer
    """
    user = request.user
    try:
        tx = Transaction.objects.get(id=pk, user=user)
    except Transaction.DoesNotExist:
        return Response({"detail": "No encontrado"}, status=404)

    if request.method == "GET":
        serializer = TransactionSerializer(tx)
        return Response(serializer.data)

    if request.method == "DELETE":
        tx.delete()
        # actualizar contador si existe
        if hasattr(user, "record_count"):
            try:
                user.record_count = Transaction.objects.filter(user=user).count()
                user.save(update_fields=["record_count"])
            except Exception:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PUT
    serializer = TransactionSerializer(tx, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------------
# Export CSV - MANTENIDO
# -------------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_csv(request):
    """
    Exporta todas las transacciones del usuario a CSV.
    ✅ NUEVO: Verificación de límites para exportación
    """
    user = request.user

    # ✅ VERIFICAR SI EL USUARIO PUEDE EXPORTAR
    user_serializer = MeSerializer(user)
    user_data = user_serializer.data
    effective_limits = user_data["effective_limits"]

    if not effective_limits.get("canExport", False):
        return Response(
            {
                "detail": "La exportación no está disponible para tu plan actual. Actualiza a Premium para desbloquear esta función."
            },
            status=status.HTTP_403_FORBIDDEN,
        )

    qs = Transaction.objects.filter(user=user).order_by("date", "created_at")

    # Construimos CSV en memoria
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["date", "type", "amount", "category", "description"])

    for t in qs:
        writer.writerow(
            [
                t.date.isoformat(),
                t.transaction_type,
                str(t.amount),
                t.category or "",
                (t.description or "").replace("\n", " ").strip(),
            ]
        )

    # Respuesta
    resp = HttpResponse(buffer.getvalue(), content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = (
        f'attachment; filename="mis_movimientos_{now().date().isoformat()}.csv"'
    )
    return resp


# -------------------------------
# Sistema de Límites - ACTUALIZADOS CON SERIALIZERS
# -------------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_usage(request):
    """
    ✅ NUEVO: Obtener estadísticas de uso actual del usuario
    """
    user = request.user
    serializer = MeSerializer(user)
    return Response({"success": True, "data": serializer.data["usage_stats"]})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_limits_stats(request):
    """
    ✅ NUEVO: Estadísticas de límites para panel de administración
    """
    # Calcular usuarios cerca o excediendo límites
    all_users = User.objects.all()
    near_limit_count = 0
    exceeded_limit_count = 0
    usage_percentages = []

    for user in all_users:
        serializer = MeSerializer(user)
        user_data = serializer.data
        usage_percentage = user_data["usage_stats"]["usage_percentage"]
        usage_percentages.append(usage_percentage)

        if usage_percentage >= 100:
            exceeded_limit_count += 1
        elif usage_percentage >= 80:
            near_limit_count += 1

    average_usage = (
        sum(usage_percentages) / len(usage_percentages) if usage_percentages else 0
    )

    stats = {
        "near_limit_users": near_limit_count,
        "exceeded_limit_users": exceeded_limit_count,
        "average_usage": round(average_usage, 1),
        "total_transactions": Transaction.objects.count(),
        "total_users": all_users.count(),
        "premium_users": all_users.filter(subscription="PREMIUM").count(),
        "free_users": all_users.filter(subscription="FREE").count(),
    }

    return Response(stats)


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def admin_set_custom_limits(request, user_id):
    """
    ✅ NUEVO: Configurar límites personalizados para un usuario
    ✅ ACTUALIZADO: Usar UserLimitsSerializer
    """
    try:
        user = User.objects.get(id=user_id)
        serializer = UserLimitsSerializer(user, data=request.data)

        if serializer.is_valid():
            serializer.save()
            # ✅ DEVOLVER USUARIO ACTUALIZADO
            response_serializer = AdminUserSerializer(user)
            return Response(
                {
                    "success": True,
                    "message": "Límites personalizados guardados correctamente",
                    "user": response_serializer.data,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except User.DoesNotExist:
        return Response({"detail": "Usuario no encontrado"}, status=404)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_reset_limits(request, user_id):
    """
    ✅ NUEVO: Restablecer límites a valores por defecto del plan
    """
    try:
        user = User.objects.get(id=user_id)

        # Restablecer a valores por defecto
        user.custom_limits = None
        user.save()

        # ✅ DEVOLVER USUARIO ACTUALIZADO
        response_serializer = AdminUserSerializer(user)
        return Response(
            {
                "success": True,
                "message": "Límites restablecidos a valores por defecto",
                "user": response_serializer.data,
            }
        )

    except User.DoesNotExist:
        return Response({"detail": "Usuario no encontrado"}, status=404)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users_near_limits(request):
    """
    ✅ NUEVO: Obtener usuarios cerca o excediendo límites
    ✅ ACTUALIZADO: Usar AdminUserSerializer
    """
    limit_status = request.GET.get("limit_status", "all")
    page = int(request.GET.get("page", 1))
    limit = int(request.GET.get("limit", 20))

    offset = (page - 1) * limit

    all_users = User.objects.all()
    filtered_users = []

    for user in all_users:
        serializer = MeSerializer(user)
        user_data = serializer.data
        usage_percentage = user_data["usage_stats"]["usage_percentage"]

        if limit_status == "near_limit" and 80 <= usage_percentage < 100:
            filtered_users.append(user_data)
        elif limit_status == "exceeded" and usage_percentage >= 100:
            filtered_users.append(user_data)
        elif limit_status == "normal" and usage_percentage < 80:
            filtered_users.append(user_data)
        elif limit_status == "all":
            filtered_users.append(user_data)

    # Paginación manual
    total_count = len(filtered_users)
    paginated_users = filtered_users[offset : offset + limit]

    return Response(
        {
            "users": paginated_users,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }
    )


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def admin_update_global_limits(request):
    """
    ✅ NUEVO: Actualizar configuración global de límites
    (En una implementación real, esto guardaría en base de datos/configuración)
    """
    global_limits = request.data

    # Validar estructura
    if "free" not in global_limits or "premium" not in global_limits:
        return Response(
            {
                "detail": "Se requieren configuraciones para ambos planes: free y premium"
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # En una implementación real, aquí guardarías en base de datos
    # Por ahora solo retornamos éxito
    return Response(
        {
            "success": True,
            "message": "Configuración global de límites actualizada",
            "global_limits": global_limits,
        }
    )


# -------------------------------
# Administración - ACTUALIZADOS CON SERIALIZERS
# -------------------------------


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """
    Estadísticas para panel de administración
    ✅ MEJORADO: Incluye estadísticas de límites
    """
    total_users = User.objects.count()
    premium_users = User.objects.filter(subscription="PREMIUM").count()
    free_users = User.objects.filter(subscription="FREE").count()
    active_users = User.objects.filter(is_active=True).count()

    # Usuarios registrados hoy
    today = now().date()
    today_registrations = User.objects.filter(date_joined__date=today).count()

    total_transactions = Transaction.objects.count()

    # ✅ INCLUIR ESTADÍSTICAS DE LÍMITES
    limits_stats_response = admin_limits_stats(request._request)
    limits_stats = limits_stats_response.data

    return Response(
        {
            "total": total_users,
            "premium": premium_users,
            "free": free_users,
            "active": active_users,
            "today_registrations": today_registrations,
            "total_transactions": total_transactions,
            "limits_usage": {
                "near_limit_users": limits_stats.get("near_limit_users", 0),
                "exceeded_limit_users": limits_stats.get("exceeded_limit_users", 0),
                "average_usage": limits_stats.get("average_usage", 0),
            },
            "trends": {
                "total": 0,  # Podrías calcular trends con datos históricos
                "premium": 0,
                "free": 0,
                "active": 0,
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users(request):
    """
    Lista de usuarios para administración
    ✅ MEJORADO: Usar AdminUserSerializer
    """
    q = request.GET.get("q", "").strip()
    plan = request.GET.get("plan", "").strip()
    active = request.GET.get("active", "").strip()
    role = request.GET.get("role", "").strip()
    limit_status = request.GET.get("limit_status", "").strip()

    page = int(request.GET.get("page", 1))
    limit = int(request.GET.get("limit", 20))
    offset = (page - 1) * limit

    users_qs = User.objects.all()

    # Filtros
    if q:
        users_qs = users_qs.filter(
            Q(username__icontains=q) | Q(email__icontains=q) | Q(name__icontains=q)
        )
    if plan:
        users_qs = users_qs.filter(subscription=plan)
    if active:
        users_qs = users_qs.filter(is_active=(active.lower() == "true"))
    if role:
        users_qs = users_qs.filter(role=role)

    total_count = users_qs.count()
    users_page = users_qs[offset : offset + limit]

    # ✅ USAR AdminUserSerializer PARA RESPUESTA CONSISTENTE
    serializer = AdminUserSerializer(users_page, many=True)

    return Response(
        {
            "users": serializer.data,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": (total_count + limit - 1) // limit,
        }
    )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_set_plan(request, user_id):
    """
    Cambiar plan de usuario (FREE/PREMIUM)
    ✅ MEJORADO: Limpia límites personalizados al cambiar de plan
    ✅ ACTUALIZADO: Usar AdminUserUpdateSerializer
    """
    try:
        user = User.objects.get(id=user_id)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            # ✅ LIMPIAR LÍMITES PERSONALIZADOS AL CAMBIAR DE PLAN
            if "subscription" in serializer.validated_data:
                user.custom_limits = None

            serializer.save()

            # ✅ DEVOLVER USUARIO ACTUALIZADO
            response_serializer = AdminUserSerializer(user)
            return Response(
                {
                    "success": True,
                    "message": f"Usuario actualizado correctamente",
                    "user": response_serializer.data,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except User.DoesNotExist:
        return Response({"detail": "Usuario no encontrado"}, status=404)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_set_active(request, user_id):
    """
    Activar/desactivar usuario
    ✅ ACTUALIZADO: Usar AdminUserUpdateSerializer
    """
    try:
        user = User.objects.get(id=user_id)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()

            # ✅ DEVOLVER USUARIO ACTUALIZADO
            response_serializer = AdminUserSerializer(user)
            return Response(
                {
                    "success": True,
                    "message": f"Usuario {'activado' if user.is_active else 'desactivado'}",
                    "user": response_serializer.data,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except User.DoesNotExist:
        return Response({"detail": "Usuario no encontrado"}, status=404)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_set_role(request, user_id):
    """
    Cambiar rol de usuario (USER/ADMIN)
    ✅ ACTUALIZADO: Usar AdminUserUpdateSerializer
    """
    try:
        user = User.objects.get(id=user_id)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()

            # ✅ DEVOLVER USUARIO ACTUALIZADO
            response_serializer = AdminUserSerializer(user)
            return Response(
                {
                    "success": True,
                    "message": f"Usuario cambiado a rol {user.role}",
                    "user": response_serializer.data,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except User.DoesNotExist:
        return Response({"detail": "Usuario no encontrado"}, status=404)


# -------------------------------
# Utilidades - MANTENIDOS
# -------------------------------


@api_view(["GET"])
def health(request):
    return Response({"ok": True, "time": now().isoformat()})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def whoami(request):
    u = request.user
    return Response(
        {
            "id": u.id,
            "username": u.username,
            "role": getattr(u, "role", "USER"),
            "is_staff": bool(getattr(u, "is_staff", False)),
            "is_superuser": bool(getattr(u, "is_superuser", False)),
        }
    )

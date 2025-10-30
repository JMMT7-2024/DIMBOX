from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
import csv
from io import StringIO

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils.timezone import now
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .models import Transaction, TransactionType, GastoCategoria
from .serializers import (
    UserSerializer,
    MeSerializer,
    ProfileUpdateSerializer,
    AdminUserSerializer,
    UserLimitsSerializer,
    TransactionSerializer,
    AdminUserUpdateSerializer,
)

User = get_user_model()

# -------------------------------
# Helpers
# -------------------------------


def _to_decimal(value, default="0"):
    """Convierte strings/números a Decimal de forma segura."""
    if value in (None, ""):
        value = default
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Monto inválido")


def _parse_date(value):
    """Acepta 'YYYY-MM-DD'. Lanza ValueError si no puede."""
    if not value:
        raise ValueError("Fecha requerida")
    return datetime.strptime(value, "%Y-%m-%d").date()


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
    """Debe ser 'IN' o 'OUT'."""
    t = (tx_type or "").upper()
    if t not in (TransactionType.INGRESO, TransactionType.GASTO):
        raise ValueError("transaction_type debe ser IN u OUT")
    return t


# -------------------------------
# Auth / Perfil
# -------------------------------


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """Crea un usuario nuevo."""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        response_serializer = MeSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Devuelve la información del usuario autenticado."""
    serializer = MeSerializer(request.user)
    return Response(serializer.data)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    GET: datos del perfil.
    PUT: actualizar name, goal_name, goal_amount.
    """
    if request.method == "GET":
        serializer = MeSerializer(request.user)
        return Response(serializer.data)

    serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        response_serializer = MeSerializer(request.user)
        return Response(response_serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------------
# Transacciones
# -------------------------------


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def transactions_list_create(request):
    """
    GET: lista de transacciones.
    POST: crea una nueva transacción.
    """
    user = request.user

    if request.method == "GET":
        transactions = Transaction.objects.filter(user=user).order_by(
            "-date", "-created_at"
        )
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    # POST - Crear transacción con validación de límites
    user_serializer = MeSerializer(user)
    user_data = user_serializer.data
    effective_limits = user_data["effective_limits"]
    current_count = user_data["usage_stats"]["transactions_count"]
    max_transactions = effective_limits.get("maxTransactions", 100)

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

    serializer = TransactionSerializer(data=request.data)
    if serializer.is_valid():
        amount = Decimal(str(serializer.validated_data["amount"]))
        max_amount = Decimal(str(effective_limits.get("maxTransactionAmount", 10000)))

        if amount > max_amount:
            return Response(
                {
                    "detail": f"El monto excede el límite permitido. Máximo por transacción: S/ {max_amount}",
                    "limit_type": "maxTransactionAmount",
                    "current_amount": float(amount),
                    "max_limit": float(max_amount),
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        transaction = serializer.save(user=user)

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
    """Detalle, actualización o eliminación de una transacción."""
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
        if hasattr(user, "record_count"):
            try:
                user.record_count = Transaction.objects.filter(user=user).count()
                user.save(update_fields=["record_count"])
            except Exception:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = TransactionSerializer(tx, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------------
# Exportar CSV
# -------------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_csv(request):
    """Exporta todas las transacciones del usuario a CSV."""
    user = request.user
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

    resp = HttpResponse(buffer.getvalue(), content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = (
        f'attachment; filename="mis_movimientos_{now().date().isoformat()}.csv"'
    )
    return resp


# -------------------------------
# Sistema de Límites
# -------------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_usage(request):
    """Estadísticas de uso del usuario."""
    user = request.user
    serializer = MeSerializer(user)
    return Response({"success": True, "data": serializer.data["usage_stats"]})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_limits_stats(request):
    """Estadísticas de límites para panel admin."""
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
    """Configura límites personalizados para un usuario."""
    try:
        user = User.objects.get(id=user_id)
        serializer = UserLimitsSerializer(user, data=request.data)

        if serializer.is_valid():
            serializer.save()
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
    """Restablece los límites a valores por defecto."""
    try:
        user = User.objects.get(id=user_id)
        user.custom_limits = None
        user.save()
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
    """Obtiene usuarios cerca o excediendo límites."""
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
    """Actualiza configuración global de límites."""
    global_limits = request.data
    if "free" not in global_limits or "premium" not in global_limits:
        return Response(
            {
                "detail": "Se requieren configuraciones para ambos planes: free y premium"
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(
        {
            "success": True,
            "message": "Configuración global actualizada",
            "global_limits": global_limits,
        }
    )


# -------------------------------
# Administración - CORREGIDO
# -------------------------------


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """Estadísticas generales para panel admin."""
    try:
        total_users = User.objects.count()
        premium_users = User.objects.filter(subscription="PREMIUM").count()
        free_users = User.objects.filter(subscription="FREE").count()
        active_users = User.objects.filter(is_active=True).count()
        today = now().date()
        today_registrations = User.objects.filter(date_joined__date=today).count()
        total_transactions = Transaction.objects.count()

        # Calcular estadísticas de límites manualmente para evitar recursión
        all_users = User.objects.all()
        near_limit_count = 0
        exceeded_limit_count = 0
        usage_percentages = []

        for user in all_users:
            try:
                # Calcular uso básico sin depender de MeSerializer
                user_transactions = Transaction.objects.filter(user=user).count()
                user_limits = user.get_effective_limits()
                max_transactions = user_limits.get("maxTransactions", 100)

                if max_transactions > 0:
                    usage_percentage = (user_transactions / max_transactions) * 100
                else:
                    usage_percentage = 0

                usage_percentages.append(usage_percentage)

                if usage_percentage >= 100:
                    exceeded_limit_count += 1
                elif usage_percentage >= 80:
                    near_limit_count += 1
            except Exception:
                continue

        average_usage = (
            sum(usage_percentages) / len(usage_percentages) if usage_percentages else 0
        )

        return Response(
            {
                "total": total_users,
                "premium": premium_users,
                "free": free_users,
                "active": active_users,
                "today_registrations": today_registrations,
                "total_transactions": total_transactions,
                "limits_usage": {
                    "near_limit_users": near_limit_count,
                    "exceeded_limit_users": exceeded_limit_count,
                    "average_usage": round(average_usage, 1),
                },
                "trends": {"total": 0, "premium": 0, "free": 0, "active": 0},
            }
        )

    except Exception as e:
        return Response(
            {"error": f"Error calculando estadísticas: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users(request):
    """Lista de usuarios para administración."""
    q = request.GET.get("q", "").strip()
    plan = request.GET.get("plan", "").strip()
    active = request.GET.get("active", "").strip()
    role = request.GET.get("role", "").strip()

    page = int(request.GET.get("page", 1))
    limit = int(request.GET.get("limit", 20))
    offset = (page - 1) * limit

    users_qs = User.objects.all()
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
    """Cambia el plan de usuario (FREE/PREMIUM)."""
    try:
        user = User.objects.get(id=user_id)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            if "subscription" in serializer.validated_data:
                user.custom_limits = None
            serializer.save()

            response_serializer = AdminUserSerializer(user)
            return Response(
                {
                    "success": True,
                    "message": "Usuario actualizado correctamente",
                    "user": response_serializer.data,
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({"detail": "Usuario no encontrado"}, status=404)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_set_active(request, user_id):
    """Activa o desactiva un usuario."""
    try:
        user = User.objects.get(id=user_id)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
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
    """Cambia el rol del usuario (USER/ADMIN)."""
    try:
        user = User.objects.get(id=user_id)
        serializer = AdminUserUpdateSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
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
# Utilidades
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

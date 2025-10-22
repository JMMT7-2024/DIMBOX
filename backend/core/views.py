# core/views.py
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
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Transaction, TransactionType, GastoCategoria

User = get_user_model()

# -------------------------------
# Helpers
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


def _user_to_dict(u: User) -> dict:
    """
    Datos de usuario que la app de frontend necesita.
    """
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email or "",
        "name": getattr(u, "name", "") or "",
        "role": getattr(u, "role", "USER"),
        "subscription": getattr(u, "subscription", "FREE"),
        "goal_name": getattr(u, "goal_name", "Meta de Ahorro"),
        "goal_amount": str(getattr(u, "goal_amount", Decimal("0"))),
        "is_staff": bool(getattr(u, "is_staff", False)),
        "is_superuser": bool(getattr(u, "is_superuser", False)),
        "record_count": int(getattr(u, "record_count", 0)),
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
# Auth / Perfil
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
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""
    email = (request.data.get("email") or "").strip()
    name = (request.data.get("name") or "").strip()

    if not username or not password:
        return Response({"detail": "username y password son requeridos"}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "El usuario ya existe"}, status=400)

    u = User(username=username, email=email)
    if hasattr(u, "name"):
        u.name = name
    u.set_password(password)
    u.save()

    return Response(_user_to_dict(u), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Devuelve info del usuario autenticado (para AuthContext).
    """
    return Response(_user_to_dict(request.user))


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    GET: datos del perfil (meta/objetivo).
    PUT: actualizar name, goal_name, goal_amount
    """
    u = request.user

    if request.method == "GET":
        return Response(_user_to_dict(u))

    # PUT
    name = request.data.get("name")
    goal_name = request.data.get("goal_name")
    goal_amount = request.data.get("goal_amount")

    if name is not None and hasattr(u, "name"):
        u.name = str(name).strip()
    if goal_name is not None and hasattr(u, "goal_name"):
        u.goal_name = str(goal_name).strip()
    if goal_amount is not None and hasattr(u, "goal_amount"):
        try:
            u.goal_amount = _to_decimal(goal_amount, default="0")
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)

    u.save()
    return Response(_user_to_dict(u))


# -------------------------------
# Transacciones
# -------------------------------


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def transactions_list_create(request):
    """
    GET: lista de transacciones del usuario (ordenadas por fecha desc, creación desc).
    POST: crea una transacción.
      Campos POST esperados:
        - transaction_type: 'IN' | 'OUT'
        - amount: decimal
        - date: 'YYYY-MM-DD'
        - category: código opcional (AL, TR, SE, VI, OC, SA, ED, OT)
        - description: opcional
    """
    user = request.user

    if request.method == "GET":
        qs = Transaction.objects.filter(user=user).order_by("-date", "-created_at")
        return Response([_tx_to_dict(t) for t in qs])

    # POST
    data = request.data
    try:
        tx_type = _validate_tx_type(data.get("transaction_type"))
        amount = _to_decimal(data.get("amount"))
        date = _parse_date(data.get("date"))
        category = _validate_category(data.get("category"))
        description = (data.get("description") or "").strip() or None
    except ValueError as e:
        return Response({"detail": str(e)}, status=400)

    tx = Transaction.objects.create(
        user=user,
        transaction_type=tx_type,
        amount=amount,
        date=date,
        description=description,
        category=category,
    )

    # (opcional) contador de registros
    if hasattr(user, "record_count"):
        try:
            user.record_count = Transaction.objects.filter(user=user).count()
            user.save(update_fields=["record_count"])
        except Exception:
            pass

    return Response(_tx_to_dict(tx), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def transaction_detail(request, pk: int):
    """
    GET: detalle
    PUT: actualizar (mismos campos que POST)
    DELETE: eliminar
    """
    user = request.user
    try:
        tx = Transaction.objects.get(id=pk, user=user)
    except Transaction.DoesNotExist:
        return Response({"detail": "No encontrado"}, status=404)

    if request.method == "GET":
        return Response(_tx_to_dict(tx))

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
    data = request.data
    try:
        if "transaction_type" in data:
            tx.transaction_type = _validate_tx_type(data.get("transaction_type"))
        if "amount" in data:
            tx.amount = _to_decimal(data.get("amount"))
        if "date" in data:
            tx.date = _parse_date(data.get("date"))
        if "category" in data:
            tx.category = _validate_category(data.get("category"))
        if "description" in data:
            desc = (data.get("description") or "").strip()
            tx.description = desc or None
    except ValueError as e:
        return Response({"detail": str(e)}, status=400)

    tx.save()
    return Response(_tx_to_dict(tx))


# -------------------------------
# Export CSV
# -------------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_csv(request):
    """
    Exporta todas las transacciones del usuario a CSV.
    """
    user = request.user
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

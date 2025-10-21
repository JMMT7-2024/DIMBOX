# core/views.py
from __future__ import annotations

import csv
import io
import unicodedata
from decimal import Decimal, InvalidOperation
from datetime import date as date_cls

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.http import HttpResponse

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Transaction, GastoCategoria

User = get_user_model()

# ---------------------------
# Helpers
# ---------------------------


def _soles(n) -> str:
    try:
        return f"S/ {Decimal(n):.2f}"
    except Exception:
        return "S/ 0.00"


def _parse_date(iso_str: str) -> date_cls:
    """
    Espera 'YYYY-MM-DD'. Si no, lanza ValueError.
    """
    return date_cls.fromisoformat(iso_str)


def _to_decimal(val) -> Decimal:
    """
    Convierte string/float a Decimal. Acepta coma como separador decimal.
    """
    if val is None or val == "":
        raise InvalidOperation("empty amount")
    if isinstance(val, (int, float, Decimal)):
        return Decimal(str(val))
    s = str(val).strip().replace(",", ".")
    return Decimal(s)


def _serialize_txn(t: Transaction) -> dict:
    return {
        "id": t.id,
        "transaction_type": t.transaction_type,  # 'IN' | 'OUT'
        "amount": str(t.amount),
        "date": t.date.isoformat(),
        "description": t.description or "",
        "category": t.category,  # código 'AL' | ... | None
        "created_at": t.created_at.isoformat(),
    }


def _normalize_label(s: str) -> str:
    """
    Normaliza texto para comparar (sin acentos, mayúsculas, sin espacios extra).
    """
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    return s.strip().upper()


# Mapeo LABEL → CÓDIGO (por si te llega 'Alimentación' en lugar de 'AL')
_LABEL_TO_CODE = {
    _normalize_label("Alimentación"): "AL",
    _normalize_label("Transporte"): "TR",
    _normalize_label("Servicios"): "SE",
    _normalize_label("Vivienda"): "VI",
    _normalize_label("Ocio"): "OC",
    _normalize_label("Salud"): "SA",
    _normalize_label("Educación"): "ED",
    _normalize_label("Otros"): "OT",
}


def _coerce_category(value: str | None) -> str | None:
    """
    Devuelve un código válido (AL/TR/...) o None. Acepta etiqueta o código.
    """
    if not value:
        return None
    v = str(value).strip()
    code = v.upper()
    if code in dict(GastoCategoria.choices):
        return code
    # intentar por etiqueta
    norm = _normalize_label(v)
    return _LABEL_TO_CODE.get(norm)  # puede ser None si no la reconoce


# ---------------------------
# Sondas de salud / auth
# ---------------------------


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"ok": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def whoami(request):
    u = request.user
    return Response(
        {
            "id": getattr(u, "id", None),
            "username": getattr(u, "username", ""),
            "email": getattr(u, "email", ""),
            "name": getattr(u, "name", ""),
            "role": getattr(u, "role", "USER"),
            "subscription": getattr(u, "subscription", "FREE"),
            "is_active": bool(getattr(u, "is_active", False)),
            "is_staff": bool(getattr(u, "is_staff", False)),
            "is_superuser": bool(getattr(u, "is_superuser", False)),
        }
    )


# ---------------------------
# Auth / Registro
# ---------------------------


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """
    Crea un usuario. Espera: username, password, email, name (opcional).
    No emite tokens (el front luego hace /token/).
    """
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""
    email = (request.data.get("email") or "").strip()
    name = (request.data.get("name") or "").strip()

    if not username or not password or not email:
        return Response(
            {"detail": "username, password y email son requeridos"}, status=400
        )

    if User.objects.filter(username=username).exists():
        return Response({"detail": "usuario ya existe"}, status=400)

    if User.objects.filter(email=email).exists():
        return Response({"detail": "email ya está registrado"}, status=400)

    u = User(
        username=username,
        email=email,
        is_active=True,
    )
    # si tu CustomUser tiene estos campos:
    if hasattr(u, "name"):
        u.name = name
    if hasattr(u, "role"):
        u.role = "USER"
    if hasattr(u, "subscription"):
        u.subscription = "FREE"

    u.set_password(password)
    u.save()

    return Response(
        {"ok": True, "id": u.id, "username": u.username, "email": u.email}, status=201
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Devuelve el perfil mínimo del usuario autenticado (para el AuthContext).
    """
    u = request.user
    return Response(
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "name": getattr(u, "name", ""),
            "role": getattr(u, "role", "USER"),
            "subscription": getattr(u, "subscription", "FREE"),
            "goal_name": getattr(u, "goal_name", "Meta de Ahorro"),
            "goal_amount": str(getattr(u, "goal_amount", "0.00")),
        }
    )


# ---------------------------
# Perfil (GET/PUT)
# ---------------------------


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    GET: datos del perfil extendido.
    PUT: actualizar name / goal_name / goal_amount (y opcionalmente email).
    """
    u = request.user

    if request.method == "GET":
        data = {
            "username": u.username,
            "email": u.email,
            "name": getattr(u, "name", ""),
            "goal_name": getattr(u, "goal_name", "Meta de Ahorro"),
            "goal_amount": str(getattr(u, "goal_amount", "0.00")),
            "subscription": getattr(u, "subscription", "FREE"),
            "role": getattr(u, "role", "USER"),
        }
        return Response(data)

    # PUT
    name = request.data.get("name")
    goal_name = request.data.get("goal_name")
    goal_amount = request.data.get("goal_amount")
    email = request.data.get("email")

    if name is not None and hasattr(u, "name"):
        u.name = str(name).strip()

    if goal_name is not None and hasattr(u, "goal_name"):
        u.goal_name = str(goal_name).strip() or "Meta de Ahorro"

    if goal_amount is not None and hasattr(u, "goal_amount"):
        try:
            u.goal_amount = Decimal(str(goal_amount).replace(",", "."))
        except InvalidOperation:
            return Response({"detail": "goal_amount inválido"}, status=400)

    if email is not None:
        email = str(email).strip()
        # validar duplicados de email
        if email and User.objects.exclude(id=u.id).filter(email=email).exists():
            return Response({"detail": "email ya está registrado"}, status=400)
        u.email = email

    u.save()
    return Response({"ok": True})


# ---------------------------
# Transacciones
# ---------------------------


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def transactions_list_create(request):
    """
    GET: lista de transacciones del usuario.
    POST: crea una transacción.
      Campos:
        - transaction_type: 'IN' | 'OUT'
        - amount: number/string
        - date: 'YYYY-MM-DD'
        - description?: string
        - category?: código ('AL','TR',...) o etiqueta ('Alimentación', etc.) solo si OUT
    """
    user = request.user

    if request.method == "GET":
        txns = Transaction.objects.filter(user=user).order_by("-date", "-created_at")
        return Response([_serialize_txn(t) for t in txns])

    # POST
    txn_type = (request.data.get("transaction_type") or "").upper()
    if txn_type not in ("IN", "OUT"):
        return Response(
            {"detail": "transaction_type inválido (use 'IN' o 'OUT')"}, status=400
        )

    try:
        amount = _to_decimal(request.data.get("amount"))
    except InvalidOperation:
        return Response({"detail": "amount inválido"}, status=400)

    if amount <= 0:
        return Response({"detail": "amount debe ser mayor a 0"}, status=400)

    date_str = request.data.get("date") or ""
    try:
        txn_date = _parse_date(date_str)
    except Exception:
        return Response({"detail": "date inválida, use 'YYYY-MM-DD'"}, status=400)

    description = (request.data.get("description") or "").strip() or None

    raw_category = request.data.get("category")
    category_code = _coerce_category(raw_category)

    if txn_type == "IN":
        # ingresos NO llevan categoría
        category_code = None
    else:
        # gastos: categoría opcional, pero si viene debe ser válida
        if (
            raw_category
            not in (
                None,
                "",
            )
            and category_code is None
        ):
            return Response({"detail": "categoría inválida"}, status=400)

    t = Transaction.objects.create(
        user=user,
        transaction_type=txn_type,
        amount=amount,
        date=txn_date,
        description=description,
        category=category_code,
    )

    # actualizar contador si existe en tu modelo
    if hasattr(user, "record_count"):
        try:
            user.record_count = Transaction.objects.filter(user=user).count()
            user.save(update_fields=["record_count"])
        except Exception:
            pass

    return Response(_serialize_txn(t), status=201)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def transaction_detail(request, pk: int):
    """
    PUT: actualiza una transacción del usuario.
    DELETE: elimina una transacción del usuario.
    """
    user = request.user
    try:
        t = Transaction.objects.get(id=pk, user=user)
    except Transaction.DoesNotExist:
        return Response({"detail": "no encontrado"}, status=404)

    if request.method == "DELETE":
        t.delete()
        # actualizar contador si existe
        if hasattr(user, "record_count"):
            try:
                user.record_count = Transaction.objects.filter(user=user).count()
                user.save(update_fields=["record_count"])
            except Exception:
                pass
        return Response(status=204)

    # PUT
    data = request.data

    # transaction_type (opcional)
    txn_type = data.get("transaction_type")
    if txn_type is not None:
        txn_type = str(txn_type).upper()
        if txn_type not in ("IN", "OUT"):
            return Response({"detail": "transaction_type inválido"}, status=400)
        t.transaction_type = txn_type

    # amount (opcional)
    if "amount" in data:
        try:
            amt = _to_decimal(data.get("amount"))
        except InvalidOperation:
            return Response({"detail": "amount inválido"}, status=400)
        if amt <= 0:
            return Response({"detail": "amount debe ser mayor a 0"}, status=400)
        t.amount = amt

    # date (opcional)
    if "date" in data:
        try:
            t.date = _parse_date(str(data.get("date")))
        except Exception:
            return Response({"detail": "date inválida"}, status=400)

    # description (opcional)
    if "description" in data:
        desc = (data.get("description") or "").strip()
        t.description = desc or None

    # category (opcional; solo si OUT)
    if "category" in data:
        raw_category = data.get("category")
        cat_code = _coerce_category(raw_category)
        if t.transaction_type == "IN":
            # ingresos nunca llevan categoría
            cat_code = None
        else:
            # gastos: si envían algo inválido, error
            if (
                raw_category
                not in (
                    None,
                    "",
                )
                and cat_code is None
            ):
                return Response({"detail": "categoría inválida"}, status=400)
        t.category = cat_code

    t.save()
    return Response(_serialize_txn(t))


# ---------------------------
# Export CSV
# ---------------------------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_csv(request):
    """
    Devuelve un CSV con las transacciones del usuario.
    """
    user = request.user
    qs = Transaction.objects.filter(user=user).order_by("-date", "-created_at")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["id", "type", "amount", "date", "category", "description", "created_at"]
    )
    for t in qs:
        writer.writerow(
            [
                t.id,
                t.transaction_type,
                str(t.amount),
                t.date.isoformat(),
                t.category or "",
                (t.description or "").replace("\n", " ").strip(),
                t.created_at.isoformat(),
            ]
        )

    resp = HttpResponse(output.getvalue(), content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = 'attachment; filename="mis_movimientos.csv"'
    return resp

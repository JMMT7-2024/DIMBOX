# core/views.py
from datetime import date
import csv
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User, Transaction
from .serializers import UserSerializer, TransactionSerializer, ProfileUpdateSerializer
from django.db.models import Count, Q
from core.permissions import IsAdminRole  # <-- (Arreglado)
from .serializers import AdminUserSerializer

FREE_LIMIT = 10

# ---------- AUTH / PERFIL ----------


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """
    Crea un usuario básico (FREE, rol USER).
    Espera: name, username, email, password.
    """
    required = ["name", "username", "email", "password"]
    data = request.data or {}
    missing = [k for k in required if not data.get(k)]
    if missing:
        return Response(
            {"detail": f"Campos faltantes: {', '.join(missing)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=data["username"]).exists():
        return Response({"detail": "username ya existe"}, status=400)
    if User.objects.filter(email=data["email"]).exists():
        return Response({"detail": "email ya existe"}, status=400)

    u = User(
        name=data["name"],
        username=data["username"],
        email=data["email"],
        subscription="FREE",  # FREE por defecto
        role="USER",
        is_active=True,
    )
    u.set_password(data["password"])
    u.save()
    return Response(
        {"id": u.id, "username": u.username, "email": u.email, "name": u.name},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Devuelve datos básicos del usuario y contador de registros.
    """
    u: User = request.user
    payload = {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "name": getattr(u, "name", ""),
        "subscription": getattr(u, "subscription", "FREE"),
        "role": getattr(u, "role", "USER"),
        "record_count": Transaction.objects.filter(user=u).count(),
    }
    return Response(payload)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    GET: ver perfil (usa UserSerializer)
    PUT: actualizar perfil (usa ProfileUpdateSerializer)
    """
    u: User = request.user

    if request.method == "GET":
        # GET sigue igual, devuelve el perfil completo
        serializer = UserSerializer(u)
        return Response(serializer.data)

    # --- ESTA ES LA LÓGICA 'PUT' CORREGIDA ---
    if request.method == "PUT":
        # Usamos ProfileUpdateSerializer, que SÍ incluye goal_name y goal_amount
        # Le pasamos el usuario 'u' (la instancia a actualizar)
        # Le pasamos 'request.data' (los nuevos datos)
        # 'partial=True' permite que solo enviemos los campos que queremos cambiar
        serializer = ProfileUpdateSerializer(u, data=request.data, partial=True)

        # Verificamos si los datos son válidos
        serializer.is_valid(raise_exception=True)

        # Guardamos los cambios en la base de datos
        serializer.save()

        # Devolvemos el perfil COMPLETO y ACTUALIZADO
        # (Usamos UserSerializer para la respuesta, así el frontend recibe todo)
        return Response(UserSerializer(u).data)


# ---------- TRANSACCIONES ----------


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def transactions_list_create(request):
    """
    GET: lista de transacciones del usuario (orden desc por fecha, id)
    POST: crea transacción; si es FREE y ya llegó a 10, bloquea.
    """
    u: User = request.user

    if request.method == "GET":
        qs = Transaction.objects.filter(user=u).order_by("-date", "-id")
        return Response(TransactionSerializer(qs, many=True).data)

    # POST
    # Límite para FREE
    if getattr(u, "subscription", "FREE") == "FREE":
        current = Transaction.objects.filter(user=u).count()
        if current >= FREE_LIMIT:
            return Response(
                {
                    "detail": "FREE limit reached",
                    "code": "limit_reached",
                    "limit": FREE_LIMIT,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

    data = request.data.copy()
    # saneo de campos necesarios
    tx_type = data.get("transaction_type")
    if tx_type not in ("IN", "OUT"):
        return Response({"detail": "transaction_type debe ser IN u OUT"}, status=400)

    # completar user y fecha por defecto
    data["user"] = u.id
    if not data.get("date"):
        data["date"] = date.today()

    ser = TransactionSerializer(data=data, context={"request": request})
    ser.is_valid(raise_exception=True)
    obj = ser.save(user=u)
    return Response(TransactionSerializer(obj).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def transaction_detail(request, pk: int):
    """
    CRUD sobre una transacción del usuario.
    """
    u: User = request.user
    tx = get_object_or_404(Transaction, pk=pk, user=u)

    if request.method == "GET":
        return Response(TransactionSerializer(tx).data)

    if request.method == "PUT":
        data = request.data.copy()
        ser = TransactionSerializer(
            tx, data=data, partial=True, context={"request": request}
        )
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    # DELETE
    tx.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- EXPORT CSV ----------


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_csv(request):
    """
    Exporta todas las transacciones del usuario en CSV.
    """
    u: User = request.user
    qs = Transaction.objects.filter(user=u).order_by("date", "id")

    resp = HttpResponse(content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = 'attachment; filename="transacciones.csv"'
    writer = csv.writer(resp)
    writer.writerow(
        ["id", "date", "transaction_type", "amount", "description", "category"]
    )

    for t in qs:
        writer.writerow(
            [
                t.id,
                t.date,
                t.transaction_type,
                t.amount,
                t.description or "",
                t.category or "",
            ]
        )

    return resp


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_stats(request):
    """
    Devuelve estadísticas para el panel de admin.
    """
    total = User.objects.count()
    premium = User.objects.filter(subscription="PREMIUM").count()
    free = User.objects.filter(subscription="FREE").count()
    # Activos son premium que no están marcados como is_active=False
    active_premium = User.objects.filter(subscription="PREMIUM", is_active=True).count()

    return Response(
        {
            "total": total,
            "premium": premium,
            "free": free,
            "active": active_premium,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_users_list(request):
    """
    Devuelve la lista de usuarios para el panel de admin.
    Incluye conteo de registros y permite búsqueda por 'q'.
    """
    queryset = User.objects.annotate(record_count=Count("transactions")).order_by(
        "-date_joined"
    )

    query = request.query_params.get("q", None)
    if query:
        # Busca por username, email o name
        queryset = queryset.filter(
            Q(username__icontains=query)
            | Q(email__icontains=query)
            | Q(name__icontains=query)
        )

    serializer = AdminUserSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_set_plan(request, pk: int):
    """
    Establece el plan (FREE/PREMIUM) para un usuario.
    """
    user_to_edit = get_object_or_404(User, pk=pk)
    plan = request.data.get("plan")
    if plan not in ["FREE", "PREMIUM"]:
        return Response({"detail": "El plan debe ser FREE o PREMIUM"}, status=400)

    user_to_edit.subscription = plan
    user_to_edit.save(update_fields=["subscription"])
    return Response(AdminUserSerializer(user_to_edit).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_set_active(request, pk: int):
    """
    Activa o desactiva un usuario.
    """
    user_to_edit = get_object_or_404(User, pk=pk)
    is_active = request.data.get("is_active")
    if not isinstance(is_active, bool):
        return Response({"detail": "is_active debe ser true o false"}, status=400)

    user_to_edit.is_active = is_active
    user_to_edit.save(update_fields=["is_active"])
    return Response(AdminUserSerializer(user_to_edit).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_set_role(request, pk: int):
    """
    Establece el ROL (USER/ADMIN) para un usuario.
    """
    user_to_edit = get_object_or_404(User, pk=pk)
    role = request.data.get("role")
    if role not in ["USER", "ADMIN"]:
        return Response({"detail": "El rol debe ser USER o ADMIN"}, status=400)

    # Protección: No se puede cambiar el rol del superusuario ID 1
    # ni del usuario admin que está haciendo la petición
    if user_to_edit.id == 1 or user_to_edit.id == request.user.id:
        return Response(
            {"detail": "No se puede cambiar el rol de este usuario"}, status=403
        )

    user_to_edit.role = role
    user_to_edit.save(update_fields=["role"])
    return Response(AdminUserSerializer(user_to_edit).data)

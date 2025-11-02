from __future__ import annotations

from datetime import datetime
from decimal import Decimal, InvalidOperation
import csv
from io import StringIO
import re
from django.db import models
from django.db.models import Sum, Count

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils.timezone import now
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

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

# ✅ IMPORTACIONES NECESARIAS PARA PASSWORD RESET
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_str, force_bytes
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import Product, Invoice, InvoiceItem
from .serializers import (
    ProductSerializer,
    ProductListSerializer,
    InvoiceSerializer,
    InvoiceCreateSerializer,
    InvoiceItemSerializer,
)

User = get_user_model()

# -------------------------------
# ✅ VISTAS DE PASSWORD RESET - AGREGADAS
# -------------------------------


class CustomPasswordResetView(APIView):
    """
    Vista personalizada para reset de password
    Compatible con el frontend React
    """

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()

        if not email:
            return Response(
                {"email": ["Este campo es requerido."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validación básica de email
        email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_regex, email):
            return Response(
                {"email": ["Ingresa una dirección de email válida."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar si existe un usuario con este email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Por seguridad, no revelar si el email existe o no
            return Response(
                {
                    "detail": "Si el email existe en nuestro sistema, recibirás un enlace de recuperación."
                },
                status=status.HTTP_200_OK,
            )

        # Verificar que el usuario esté activo
        if not user.is_active:
            return Response(
                {"detail": "Esta cuenta está desactivada."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generar token y enviar email
        try:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))

            # Contexto para el email
            context = {
                "user": user,
                "uid": uid,
                "token": token,
                "protocol": "https" if request.is_secure() else "http",
                "domain": request.get_host(),
                "site_name": "DIMBOX",
            }

            # Renderizar templates de email
            subject = "Restablecer tu contraseña - DIMBOX"

            # Template HTML mejorado
            html_message = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #48BB78, #4299E1); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ background: #48BB78; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
                    .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
                    .code {{ background: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace; margin: 10px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Restablecer Contraseña</h1>
                    </div>
                    <div class="content">
                        <p>Hola <strong>{user.username}</strong>,</p>
                        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en DIMBOX.</p>
                        <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
                        
                        <p style="text-align: center;">
                            <a href="{request.build_absolute_uri("/reset-password")}?uid={uid}&token={token}" 
                               class="button" 
                               style="color: white; text-decoration: none;">
                               🔑 Restablecer Contraseña
                            </a>
                        </p>
                        
                        <p>O copia esta URL en tu navegador:</p>
                        <div class="code">
                            {request.build_absolute_uri("/reset-password")}?uid={uid}&token={token}
                        </div>
                        
                        <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
                        <p>El enlace expirará en 24 horas por seguridad.</p>
                        
                        <div class="footer">
                            <p>Saludos,<br>El equipo de DIMBOX</p>
                            <p>💼 Tu gestor financiero personal</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """

            plain_message = f"""
            Restablecer contraseña - DIMBOX
            
            Hola {user.username},
            
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en DIMBOX.
            
            Usa el siguiente enlace para crear una nueva contraseña:
            {request.build_absolute_uri("/reset-password")}?uid={uid}&token={token}
            
            Si no solicitaste este cambio, puedes ignorar este mensaje.
            El enlace expirará en 24 horas por seguridad.
            
            Saludos,
            El equipo de DIMBOX
            """

            # Enviar email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

            return Response(
                {
                    "detail": "Se ha enviado un email con instrucciones para resetear tu contraseña."
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            print(f"Error enviando email de recuperación: {e}")
            return Response(
                {
                    "detail": "Error al enviar el email de recuperación. Por favor, intenta más tarde."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CustomPasswordResetConfirmView(APIView):
    """
    Vista para confirmar el reset de password
    """

    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not all([uidb64, token, new_password]):
            return Response(
                {"detail": "Faltan campos requeridos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {"detail": "Las contraseñas no coinciden."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(new_password) < 8:
            return Response(
                {"detail": "La contraseña debe tener al menos 8 caracteres."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Decodificar el uid
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            # Token válido, cambiar la contraseña
            user.set_password(new_password)
            user.save()

            # Enviar email de confirmación
            try:
                send_mail(
                    subject="Contraseña actualizada - DIMBOX",
                    message=f"Hola {user.username},\n\nTu contraseña ha sido actualizada exitosamente.\n\nSi no realizaste este cambio, por favor contacta con soporte inmediatamente.\n\nSaludos,\nEl equipo de DIMBOX",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass  # No fallar si el email de confirmación no se envía

            return Response(
                {
                    "detail": "Contraseña restablecida exitosamente. Ya puedes iniciar sesión."
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"detail": "El enlace de recuperación es inválido o ha expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )


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
def admin_users_list(request):
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
@permission_classes([AllowAny])
def health(request):
    """Health check del servicio"""
    return Response({"ok": True, "time": now().isoformat()})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def whoami(request):
    """Información básica del usuario autenticado"""
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


# -------------------------------
# ✅ VISTAS EMPRESARIALES - PRODUCTOS E INVOICES
# -------------------------------


# 📦 VISTAS DE PRODUCTOS - CON DEBUG MEJORADO
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def products_list_create(request):
    """
    GET: Lista todos los productos del usuario
    POST: Crea un nuevo producto
    """
    user = request.user
    print(f"🔍 DEBUG products_list_create - User: {user}")
    print(f"🔍 DEBUG Request method: {request.method}")

    if request.method == "GET":
        # Filtros opcionales
        category = request.GET.get("category", "")
        is_active = request.GET.get("is_active", "")

        products = Product.objects.filter(user=user)

        if category:
            products = products.filter(category=category)
        if is_active.lower() == "true":
            products = products.filter(is_active=True)
        elif is_active.lower() == "false":
            products = products.filter(is_active=False)

        products = products.order_by("-created_at")
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    # POST - Crear producto CON DEBUG DETALLADO
    print("🎯 [BACKEND DEBUG] === INICIANDO CREACIÓN DE PRODUCTO ===")
    print(f"🔍 [BACKEND DEBUG] Usuario autenticado: {user.id} - {user.username}")
    print(f"🔍 [BACKEND DEBUG] Datos recibidos: {request.data}")
    print(f"🔍 [BACKEND DEBUG] Request type: {type(request)}")
    print(f"🔍 [BACKEND DEBUG] Request tiene user: {hasattr(request, 'user')}")

    try:
        # ✅ CORRECCIÓN: Pasar el contexto EXPLÍCITAMENTE
        serializer_context = {"request": request}
        print(f"🔍 [BACKEND DEBUG] Contexto del serializer: {serializer_context}")

        serializer = ProductSerializer(data=request.data, context=serializer_context)

        print("🔍 [BACKEND DEBUG] Serializer creado, verificando validez...")

        if serializer.is_valid():
            print("✅ [BACKEND DEBUG] Serializer VÁLIDO - Procediendo a guardar...")
            try:
                product = serializer.save()
                print("🎉 [BACKEND DEBUG] PRODUCTO CREADO EXITOSAMENTE:")
                print(f"   - ID: {product.id}")
                print(f"   - Nombre: {product.name}")
                print(f"   - SKU: {getattr(product, 'sku', 'N/A')}")
                print(
                    f"   - Usuario: {product.user.username if product.user else 'N/A'}"
                )

                # Serializar respuesta
                response_serializer = ProductSerializer(product)
                return Response(
                    response_serializer.data, status=status.HTTP_201_CREATED
                )

            except Exception as save_error:
                print(
                    f"🔥 [BACKEND DEBUG] ERROR al guardar producto: {str(save_error)}"
                )
                import traceback

                print("🔥 [BACKEND DEBUG] Traceback completo:")
                print(traceback.format_exc())
                return Response(
                    {"detail": f"Error interno al guardar: {str(save_error)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            print(
                f"❌ [BACKEND DEBUG] Serializer INVÁLIDO - Errores: {serializer.errors}"
            )
            return Response(
                {
                    "detail": "Error de validación en los datos",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    except Exception as e:
        print(f"💥 [BACKEND DEBUG] EXCEPCIÓN GENERAL en products_list_create: {str(e)}")
        import traceback

        print("💥 [BACKEND DEBUG] Traceback completo:")
        print(traceback.format_exc())
        return Response(
            {"detail": f"Error interno del servidor: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def product_detail(request, pk):
    """
    GET: Obtener detalle de producto
    PUT: Actualizar producto
    DELETE: Eliminar producto (soft delete)
    """
    user = request.user
    try:
        product = Product.objects.get(id=pk, user=user)
    except Product.DoesNotExist:
        return Response(
            {"detail": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = ProductSerializer(product)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = ProductSerializer(
            product, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        # Soft delete - marcar como inactivo
        product.is_active = False
        product.save()
        return Response(
            {"detail": "Producto eliminado correctamente"}, status=status.HTTP_200_OK
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def products_stats(request):
    """Estadísticas de productos del usuario"""
    user = request.user
    total_products = Product.objects.filter(user=user).count()
    active_products = Product.objects.filter(user=user, is_active=True).count()
    low_stock_products = Product.objects.filter(
        user=user, stock__lte=5, stock__gt=0
    ).count()
    out_of_stock_products = Product.objects.filter(user=user, stock=0).count()

    # Valor total del inventario
    inventory_value = (
        Product.objects.filter(user=user, is_active=True).aggregate(
            total_value=models.Sum(models.F("price") * models.F("stock"))
        )["total_value"]
        or 0
    )

    # Productos por categoría
    by_category = (
        Product.objects.filter(user=user, is_active=True)
        .values("category")
        .annotate(
            count=models.Count("id"),
            total_value=models.Sum(models.F("price") * models.F("stock")),
        )
    )

    return Response(
        {
            "total_products": total_products,
            "active_products": active_products,
            "low_stock_products": low_stock_products,
            "out_of_stock_products": out_of_stock_products,
            "inventory_value": float(inventory_value),
            "by_category": list(by_category),
        }
    )


# 🧾 VISTAS DE FACTURAS (INVOICES)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def invoices_list_create(request):
    """
    GET: Lista todas las facturas del usuario
    POST: Crea una nueva factura
    """
    user = request.user

    if request.method == "GET":
        # Filtros opcionales
        status_filter = request.GET.get("status", "")
        date_from = request.GET.get("date_from", "")
        date_to = request.GET.get("date_to", "")

        invoices = Invoice.objects.filter(user=user)

        if status_filter:
            invoices = invoices.filter(status=status_filter)
        if date_from:
            invoices = invoices.filter(issue_date__gte=date_from)
        if date_to:
            invoices = invoices.filter(issue_date__lte=date_to)

        invoices = invoices.order_by("-issue_date", "-created_at")
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)

    # POST - Crear factura
    serializer = InvoiceSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        invoice = serializer.save()
        response_serializer = InvoiceSerializer(invoice)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def invoices_quick_create(request):
    """
    Creación rápida de factura desde datos simplificados
    """
    serializer = InvoiceCreateSerializer(
        data=request.data, context={"request": request}
    )
    if serializer.is_valid():
        invoice = serializer.save()
        response_serializer = InvoiceSerializer(invoice)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def invoice_detail(request, pk):
    """
    GET: Obtener detalle de factura
    PUT: Actualizar factura
    DELETE: Eliminar factura
    """
    user = request.user
    try:
        invoice = Invoice.objects.get(id=pk, user=user)
    except Invoice.DoesNotExist:
        return Response(
            {"detail": "Factura no encontrada"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = InvoiceSerializer(
            invoice, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        invoice.delete()
        return Response(
            {"detail": "Factura eliminada correctamente"},
            status=status.HTTP_204_NO_CONTENT,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def invoice_update_status(request, pk):
    """
    Actualizar estado de una factura
    """
    user = request.user
    try:
        invoice = Invoice.objects.get(id=pk, user=user)
    except Invoice.DoesNotExist:
        return Response(
            {"detail": "Factura no encontrada"}, status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get("status")
    if not new_status:
        return Response(
            {"detail": "El campo 'status' es requerido"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validar estado
    valid_statuses = [choice[0] for choice in Invoice.STATUS_CHOICES]
    if new_status not in valid_statuses:
        return Response(
            {"detail": f"Estado inválido. Debe ser: {', '.join(valid_statuses)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    invoice.status = new_status

    # Si se marca como pagada, establecer fecha de pago
    if new_status == "PAID" and not invoice.paid_date:
        from django.utils import timezone

        invoice.paid_date = timezone.now().date()

    invoice.save()

    serializer = InvoiceSerializer(invoice)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def invoices_stats(request):
    """Estadísticas de facturas del usuario"""
    user = request.user
    from django.db.models import Sum, Count
    from django.utils import timezone
    from datetime import timedelta

    # Totales generales
    total_invoices = Invoice.objects.filter(user=user).count()
    total_amount = (
        Invoice.objects.filter(user=user).aggregate(total=Sum("total"))["total"] or 0
    )

    # Por estado
    by_status = (
        Invoice.objects.filter(user=user)
        .values("status")
        .annotate(count=Count("id"), amount=Sum("total"))
    )

    # Facturas vencidas
    overdue_invoices = Invoice.objects.filter(
        user=user,
        status="SENT",
        due_date__lt=timezone.now().date(),
        paid_date__isnull=True,
    ).count()

    # Facturas del mes actual
    current_month = timezone.now().date().replace(day=1)
    next_month = current_month + timedelta(days=32)
    next_month = next_month.replace(day=1)

    monthly_invoices = Invoice.objects.filter(
        user=user, issue_date__gte=current_month, issue_date__lt=next_month
    ).aggregate(count=Count("id"), amount=Sum("total"))

    return Response(
        {
            "total_invoices": total_invoices,
            "total_amount": float(total_amount),
            "overdue_invoices": overdue_invoices,
            "monthly_stats": {
                "count": monthly_invoices["count"] or 0,
                "amount": float(monthly_invoices["amount"] or 0),
            },
            "by_status": list(by_status),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def enterprise_dashboard(request):
    """Dashboard empresarial con resumen de productos y facturas"""
    user = request.user

    # Obtener stats de productos
    products_stats_data = products_stats(request._request).data

    # Obtener stats de facturas
    invoices_stats_data = invoices_stats(request._request).data

    # Clientes únicos
    unique_clients = (
        Invoice.objects.filter(user=user).values("client_name").distinct().count()
    )

    # Productos más vendidos
    top_products = (
        InvoiceItem.objects.filter(invoice__user=user)
        .values("product__name")
        .annotate(
            total_sold=Sum("quantity"),
            total_revenue=Sum(models.F("unit_price") * models.F("quantity")),
        )
        .order_by("-total_sold")[:5]
    )

    return Response(
        {
            "products": products_stats_data,
            "invoices": invoices_stats_data,
            "unique_clients": unique_clients,
            "top_products": list(top_products),
            "summary": {
                "total_products": products_stats_data.get("total_products", 0),
                "total_invoices": invoices_stats_data.get("total_invoices", 0),
                "total_revenue": invoices_stats_data.get("total_amount", 0),
                "inventory_value": products_stats_data.get("inventory_value", 0),
            },
        }
    )


# ✅ ENDPOINT TEMPORAL PARA DEBUG DE VALIDACIÓN
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def debug_product_validation(request):
    """Endpoint para debug de validación de productos"""
    print(f"🎯 DEBUG debug_product_validation - Data recibida: {request.data}")

    # Validar campos requeridos manualmente
    required_fields = ["name", "price"]
    missing_fields = [field for field in required_fields if field not in request.data]

    if missing_fields:
        return Response(
            {
                "error": "Campos requeridos faltantes",
                "missing_fields": missing_fields,
                "received_data": request.data,
            },
            status=400,
        )

    # Validar tipos de datos
    try:
        price = float(request.data["price"])
        if price <= 0:
            return Response(
                {
                    "error": "Precio debe ser mayor a 0",
                    "received_price": request.data["price"],
                },
                status=400,
            )
    except (ValueError, TypeError):
        return Response(
            {
                "error": "Precio debe ser un número válido",
                "received_price": request.data["price"],
            },
            status=400,
        )

    # Validar categoría
    valid_categories = ["SERVICE", "PRODUCT", "DIGITAL", "OTHER"]
    category = request.data.get("category", "PRODUCT")
    if category not in valid_categories:
        return Response(
            {
                "error": "Categoría inválida",
                "received_category": category,
                "valid_categories": valid_categories,
            },
            status=400,
        )

    return Response(
        {
            "success": True,
            "message": "Datos válidos",
            "validated_data": {
                "name": request.data["name"],
                "price": float(request.data["price"]),
                "category": category,
                "description": request.data.get("description", ""),
                "stock": int(request.data.get("stock", 0)),
                "cost": float(request.data["cost"]) if "cost" in request.data else None,
                "tax_rate": float(request.data.get("tax_rate", 18.0)),
            },
        }
    )

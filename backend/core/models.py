# core/models.py - VERSIÓN ACTUALIZADA CON SISTEMA DE LÍMITES
from django.db import models
from django.contrib.auth.models import AbstractUser
from decimal import Decimal
import json


class User(AbstractUser):
    class SubscriptionStatus(models.TextChoices):
        FREE = "FREE", "Gratis"
        PREMIUM = "PREMIUM", "Premium"

    class Role(models.TextChoices):
        USER = "USER", "Usuario"
        ADMIN = "ADMIN", "Administrador"

    # Perfil
    name = models.CharField(max_length=255, blank=True)
    goal_name = models.CharField(max_length=255, blank=True, default="Meta de Ahorro")
    goal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Gestión
    subscription = models.CharField(
        max_length=10,
        choices=SubscriptionStatus.choices,
        default=SubscriptionStatus.FREE,
    )
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    record_count = models.PositiveIntegerField(default=0)

    # ✅ SISTEMA DE LÍMITES - NUEVO CAMPO
    custom_limits = models.JSONField(
        null=True,
        blank=True,
        help_text="Límites personalizados que sobrescriben los del plan. Formato JSON.",
    )

    # Evitar conflictos y ajustar relaciones
    first_name = None
    last_name = None
    groups = models.ManyToManyField(
        "auth.Group", related_name="core_user_set", blank=True
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission", related_name="core_user_permissions_set", blank=True
    )

    def __str__(self):
        return self.username

    @property
    def effective_limits(self):
        """
        ✅ NUEVO: Devuelve los límites efectivos (personalizados o por defecto del plan)
        """
        if self.custom_limits:
            return self.custom_limits

        # Límites por defecto según plan
        if self.subscription == self.SubscriptionStatus.PREMIUM:
            return {
                "maxTransactions": 10000,
                "maxQuickAccounts": 50,
                "canExport": True,
                "canAdvancedAnalytics": True,
                "maxTransactionAmount": 1000000,
                "maxCategories": 20,
                "retentionMonths": 24,
                "features": [
                    "transactions_unlimited",
                    "export_excel",
                    "advanced_analytics",
                    "quick_accounts_unlimited",
                ],
            }
        else:  # FREE
            return {
                "maxTransactions": 100,
                "maxQuickAccounts": 3,
                "canExport": False,
                "canAdvancedAnalytics": False,
                "maxTransactionAmount": 10000,
                "maxCategories": 8,
                "retentionMonths": 3,
                "features": [
                    "transactions_basic",
                    "categories_basic",
                    "dashboard_basic",
                ],
            }

    @property
    def usage_stats(self):
        """
        ✅ NUEVO: Calcula estadísticas de uso actual
        """
        from django.db.models import Count, Sum

        transactions_count = self.transactions.count()
        total_amount = self.transactions.aggregate(total=Sum("amount"))[
            "total"
        ] or Decimal("0")

        max_tx = self.effective_limits.get("maxTransactions", 100)
        usage_percentage = (transactions_count / max_tx * 100) if max_tx > 0 else 0

        return {
            "transactions_count": transactions_count,
            "total_amount": float(total_amount),
            "usage_percentage": round(usage_percentage, 1),
        }

    def has_reached_limit(self, limit_type, current_count=None):
        """
        ✅ NUEVO: Verifica si se ha alcanzado un límite específico
        """
        limits = self.effective_limits
        limit_value = limits.get(limit_type)

        if limit_value is None:
            return False

        if current_count is None:
            # Calcular current_count basado en limit_type
            if limit_type == "maxTransactions":
                current_count = self.transactions.count()
            elif limit_type == "maxQuickAccounts":
                # Aquí deberías tener un modelo para QuickAccounts
                current_count = 0
            else:
                return False

        return current_count >= limit_value

    def can_export(self):
        """
        ✅ NUEVO: Verifica si el usuario puede exportar
        """
        return self.effective_limits.get("canExport", False)

    def save(self, *args, **kwargs):
        """
        ✅ MEJORADO: Auto-calcular record_count al guardar
        """
        if not self.record_count:
            self.record_count = self.transactions.count()
        super().save(*args, **kwargs)


class TransactionType(models.TextChoices):
    INGRESO = "IN", "Ingreso"
    GASTO = "OUT", "Gasto"


class GastoCategoria(models.TextChoices):
    ALIMENTACION = "AL", "Alimentación"
    TRANSPORTE = "TR", "Transporte"
    SERVICIOS = "SE", "Servicios"
    VIVIENDA = "VI", "Vivienda"
    OCIO = "OC", "Ocio"
    SALUD = "SA", "Salud"
    EDUCACION = "ED", "Educación"
    OTROS = "OT", "Otros"


class Transaction(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="transactions"
    )
    transaction_type = models.CharField(max_length=3, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    category = models.CharField(
        max_length=3, choices=GastoCategoria.choices, blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "date"]),
            models.Index(fields=["user", "transaction_type"]),
            models.Index(fields=["user", "category"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - {self.amount}"

    def clean(self):
        """
        ✅ NUEVO: Validación de límites antes de guardar
        """
        from django.core.exceptions import ValidationError

        # Solo validar para transacciones nuevas (cuando no tiene ID)
        if not self.pk:
            user_limits = self.user.effective_limits

            # Verificar límite de transacciones
            max_transactions = user_limits.get("maxTransactions", 100)
            current_count = self.user.transactions.count()
            if current_count >= max_transactions:
                raise ValidationError(
                    f"Límite de transacciones alcanzado. Máximo permitido: {max_transactions}"
                )

            # Verificar límite de monto por transacción
            max_amount = user_limits.get("maxTransactionAmount", 10000)
            if self.amount > max_amount:
                raise ValidationError(
                    f"El monto excede el límite permitido. Máximo: S/ {max_amount}"
                )

    def save(self, *args, **kwargs):
        """
        ✅ MEJORADO: Incluir validación de límites al guardar
        """
        self.clean()
        super().save(*args, **kwargs)

        # Actualizar record_count del usuario
        if hasattr(self.user, "record_count"):
            self.user.record_count = self.user.transactions.count()
            self.user.save(update_fields=["record_count"])

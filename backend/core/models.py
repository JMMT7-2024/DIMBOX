# core/models.py - VERSIÓN COMPLETAMENTE CORREGIDA
from django.db import models
from django.contrib.auth.models import AbstractUser
from decimal import Decimal, InvalidOperation
import json


class User(AbstractUser):
    class SubscriptionStatus(models.TextChoices):
        FREE = "FREE", "Gratis"
        PREMIUM = "PREMIUM", "Premium"
        ENTERPRISE = "ENTERPRISE", "Enterprise"

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
        if self.subscription == self.SubscriptionStatus.ENTERPRISE:
            return {
                "maxTransactions": 100000,
                "maxQuickAccounts": 200,
                "canExport": True,
                "canAdvancedAnalytics": True,
                "maxTransactionAmount": 5000000,
                "maxCategories": 50,
                "retentionMonths": 60,
                "features": [
                    "transactions_unlimited",
                    "export_excel",
                    "advanced_analytics",
                    "quick_accounts_unlimited",
                    "priority_support",
                    "api_access",
                ],
            }
        elif self.subscription == self.SubscriptionStatus.PREMIUM:
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
        ✅ CORREGIDO: Auto-calcular record_count solo después de tener primary key
        """
        # Guardar primero para obtener el primary key
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # Solo calcular record_count después de guardar y si es necesario
        if is_new and not self.record_count:
            self.record_count = self.transactions.count()
            # Actualizar solo el campo record_count para evitar recursión
            super().save(update_fields=["record_count"])


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


# ✅ MODELOS EMPRESARIALES - AGREGAR AL FINAL DEL ARCHIVO
class Product(models.Model):
    CATEGORY_CHOICES = [
        ("SERVICE", "Servicio"),
        ("PRODUCT", "Producto"),
        ("DIGITAL", "Digital"),
        ("OTHER", "Otro"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="enterprise_products"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    sku = models.CharField(max_length=100, blank=True, null=True, unique=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="Costo del producto para calcular margen",
    )
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="PRODUCT"
    )
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    tax_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=18.00, help_text="IGV Perú (18%)"
    )
    image = models.ImageField(upload_to="products/", blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "enterprise_products"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["user", "category"]),
        ]

    def __str__(self):
        return f"{self.name} - S/ {self.price}"

    @property
    def profit_margin(self):
        """Calcula el margen de ganancia en porcentaje - VERSIÓN CORREGIDA"""
        if self.cost and self.price:
            try:
                cost_decimal = Decimal(str(self.cost))
                price_decimal = Decimal(str(self.price))
                if price_decimal > 0:
                    return float(((price_decimal - cost_decimal) / price_decimal) * 100)
            except (ValueError, TypeError, InvalidOperation):
                pass
        return 0.0

    @property
    def tax_amount(self):
        """Calcula el monto del impuesto - VERSIÓN CORREGIDA"""
        try:
            price_decimal = Decimal(str(self.price))
            tax_rate_decimal = Decimal(str(self.tax_rate))
            return float((price_decimal * tax_rate_decimal) / Decimal("100"))
        except (ValueError, TypeError, InvalidOperation):
            return 0.0

    @property
    def price_with_tax(self):
        """Precio con impuesto incluido - VERSIÓN CORREGIDA"""
        try:
            price_decimal = Decimal(str(self.price))
            tax_amount_decimal = Decimal(str(self.tax_amount))
            return float(price_decimal + tax_amount_decimal)
        except (ValueError, TypeError, InvalidOperation):
            return float(self.price)

    def clean(self):
        """Validaciones del modelo"""
        from django.core.exceptions import ValidationError

        if self.price <= 0:
            raise ValidationError("El precio debe ser mayor a 0")

        if self.cost and self.cost < 0:
            raise ValidationError("El costo no puede ser negativo")

        if self.stock < 0:
            raise ValidationError("El stock no puede ser negativo")

    def save(self, *args, **kwargs):
        """Guardar con validaciones"""
        self.clean()

        # Generar SKU automático si no se proporciona
        if not self.sku:
            last_product = Product.objects.filter(user=self.user).last()
            next_id = (last_product.id + 1) if last_product else 1
            self.sku = f"PROD-{self.user.id}-{next_id:04d}"

        super().save(*args, **kwargs)


class Invoice(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "Borrador"),
        ("SENT", "Enviada"),
        ("PAID", "Pagada"),
        ("CANCELLED", "Cancelada"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("CASH", "Efectivo"),
        ("CARD", "Tarjeta"),
        ("TRANSFER", "Transferencia"),
        ("OTHER", "Otro"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="invoices")
    invoice_number = models.CharField(max_length=50, unique=True)
    client_name = models.CharField(max_length=255)
    client_ruc = models.CharField(max_length=20, blank=True, null=True)
    client_address = models.TextField(blank=True, null=True)
    client_email = models.EmailField(blank=True, null=True)

    # Totales
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    # Estado y método de pago
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="DRAFT")
    payment_method = models.CharField(
        max_length=10, choices=PAYMENT_METHOD_CHOICES, default="CASH"
    )

    # Fechas
    issue_date = models.DateField()
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "enterprise_invoices"
        ordering = ["-issue_date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["invoice_number"]),
            models.Index(fields=["user", "issue_date"]),
        ]

    def __str__(self):
        return f"Factura {self.invoice_number} - {self.client_name}"

    def save(self, *args, **kwargs):
        """Generar número de factura automáticamente"""
        if not self.invoice_number:
            last_invoice = Invoice.objects.filter(user=self.user).last()
            next_id = (last_invoice.id + 1) if last_invoice else 1
            self.invoice_number = f"F{self.user.id}-{next_id:06d}"

        # Calcular fechas si no se proporcionan
        if not self.due_date and self.issue_date:
            from datetime import timedelta

            self.due_date = self.issue_date + timedelta(days=30)

        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        """Verifica si la factura está vencida"""
        from django.utils import timezone

        return (
            self.status == "SENT"
            and self.due_date < timezone.now().date()
            and not self.paid_date
        )


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="invoice_items"
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)

    class Meta:
        db_table = "enterprise_invoice_items"
        indexes = [
            models.Index(fields=["invoice", "product"]),
        ]

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    @property
    def subtotal(self):
        """Subtotal sin impuestos"""
        return float(self.unit_price * self.quantity)

    @property
    def tax_amount(self):
        """Monto de impuestos - VERSIÓN CORREGIDA"""
        try:
            subtotal_decimal = Decimal(str(self.subtotal))
            tax_rate_decimal = Decimal(str(self.tax_rate))
            return float((subtotal_decimal * tax_rate_decimal) / Decimal("100"))
        except (ValueError, TypeError, InvalidOperation):
            return 0.0

    @property
    def total(self):
        """Total con impuestos - VERSIÓN CORREGIDA"""
        try:
            subtotal_decimal = Decimal(str(self.subtotal))
            tax_amount_decimal = Decimal(str(self.tax_amount))
            return float(subtotal_decimal + tax_amount_decimal)
        except (ValueError, TypeError, InvalidOperation):
            return float(self.subtotal)

    def clean(self):
        """Validaciones"""
        from django.core.exceptions import ValidationError

        if self.quantity <= 0:
            raise ValidationError("La cantidad debe ser mayor a 0")

        if self.unit_price <= 0:
            raise ValidationError("El precio unitario debe ser mayor a 0")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

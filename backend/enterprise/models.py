# enterprise/models.py - MÓDULO EMPRESARIAL COMPLETO
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from core.models import User


class Client(models.Model):
    """Modelo SIMPLIFICADO para clientes - solo datos básicos"""

    class DocumentType(models.TextChoices):
        DNI = "DNI", _("DNI")
        RUC = "RUC", _("RUC")
        CE = "CE", _("Carnet Extranjería")

    # ✅ SOLO campos esenciales
    name = models.CharField(max_length=200, verbose_name=_("Nombre Completo"))
    document_type = models.CharField(
        max_length=10,
        choices=DocumentType.choices,
        default=DocumentType.DNI,
        verbose_name=_("Tipo de Documento"),
    )
    document_number = models.CharField(
        max_length=20, verbose_name=_("Número de Documento")
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name=_("Celular"))
    email = models.EmailField(blank=True, verbose_name=_("Email"))

    # ✅ Metadata simple
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name=_("Creado por"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "enterprise_clients"
        verbose_name = _("Cliente")
        verbose_name_plural = _("Clientes")
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["created_by", "document_number"],
                name="unique_user_document",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.document_number})"


class Product(models.Model):
    """Modelo para productos y servicios empresariales"""

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
        """Calcula el margen de ganancia en porcentaje"""
        if self.cost and self.price:
            try:
                cost_float = float(self.cost)
                price_float = float(self.price)
                if price_float > 0:
                    margin = ((price_float - cost_float) / price_float) * 100
                    return round(margin, 2)
            except (ValueError, TypeError, AttributeError):
                pass
        return 0.0

    @property
    def tax_amount(self):
        """Calcula el monto del impuesto"""
        try:
            price_float = float(self.price)
            tax_rate_float = float(self.tax_rate)
            tax = (price_float * tax_rate_float) / 100.0
            return round(tax, 2)
        except (ValueError, TypeError, AttributeError):
            return 0.0

    @property
    def price_with_tax(self):
        """Precio con impuesto incluido"""
        try:
            price_float = float(self.price)
            tax_amount_float = float(self.tax_amount)
            total = price_float + tax_amount_float
            return round(total, 2)
        except (ValueError, TypeError, AttributeError):
            return float(self.price)

    def clean(self):
        """Validaciones del modelo"""
        if self.price <= 0:
            raise ValidationError("El precio debe ser mayor a 0")

        if self.cost and self.cost < 0:
            raise ValidationError("El costo no puede ser negativo")

        if self.stock < 0:
            raise ValidationError("El stock no puede ser negativo")

    def save(self, *args, **kwargs):
        """Guardar con validaciones y generación de SKU robusta"""
        self.clean()

        if not self.sku:
            try:
                if self.user and self.user.id:
                    last_product = (
                        Product.objects.filter(user=self.user).order_by("-id").first()
                    )
                    if last_product and last_product.id:
                        next_id = last_product.id + 1
                    else:
                        next_id = 1
                    self.sku = f"PROD-{self.user.id}-{next_id:04d}"
                else:
                    import time

                    self.sku = f"PROD-TEMP-{int(time.time())}"
            except Exception:
                import time

                self.sku = f"PROD-ERR-{int(time.time())}"

        super().save(*args, **kwargs)


class Invoice(models.Model):
    """Modelo para facturación empresarial"""

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
    """Modelo para items de factura"""

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
        """Monto de impuestos"""
        try:
            subtotal_float = float(self.subtotal)
            tax_rate_float = float(self.tax_rate)
            tax = (subtotal_float * tax_rate_float) / 100.0
            return round(tax, 2)
        except (ValueError, TypeError, AttributeError):
            return 0.0

    @property
    def total(self):
        """Total con impuestos"""
        try:
            subtotal_float = float(self.subtotal)
            tax_amount_float = float(self.tax_amount)
            total = subtotal_float + tax_amount_float
            return round(total, 2)
        except (ValueError, TypeError, AttributeError):
            return float(self.subtotal)

    def clean(self):
        """Validaciones"""
        if self.quantity <= 0:
            raise ValidationError("La cantidad debe ser mayor a 0")

        if self.unit_price <= 0:
            raise ValidationError("El precio unitario debe ser mayor a 0")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

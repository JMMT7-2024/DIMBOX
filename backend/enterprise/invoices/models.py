from django.db import models
from django.conf import settings  # ✅ AGREGAR
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
from enterprise.products.models import Product


class Invoice(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "✏️ Borrador"),
        ("SENT", "📤 Enviada"),
        ("PAID", "✅ Pagada"),
        ("OVERDUE", "⚠️ Vencida"),
        ("CANCELLED", "❌ Cancelada"),
        ("REFUNDED", "🔄 Reembolsada"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("CASH", "💵 Efectivo"),
        ("CARD", "💳 Tarjeta"),
        ("TRANSFER", "🏦 Transferencia"),
        ("CHECK", "📄 Cheque"),
        ("DIGITAL_WALLET", "📱 Billetera Digital"),
        ("OTHER", "📋 Otro"),
    ]

    CURRENCY_CHOICES = [
        ("PEN", "S/ - Sol Peruano"),
        ("USD", "$ - Dólar Americano"),
        ("EUR", "€ - Euro"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # ✅ CORREGIDO
        on_delete=models.CASCADE,
        related_name="enterprise_invoices",
        verbose_name="Usuario",
    )
    invoice_number = models.CharField(
        max_length=50, unique=True, verbose_name="Número de Factura"
    )
    client_name = models.CharField(max_length=255, verbose_name="Nombre del Cliente")
    client_ruc = models.CharField(
        max_length=20, blank=True, null=True, verbose_name="RUC/DNI del Cliente"
    )
    client_address = models.TextField(
        blank=True, null=True, verbose_name="Dirección del Cliente"
    )
    client_email = models.EmailField(
        blank=True, null=True, verbose_name="Email del Cliente"
    )
    client_phone = models.CharField(
        max_length=20, blank=True, null=True, verbose_name="Teléfono del Cliente"
    )

    # Totales
    subtotal = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Subtotal"
    )
    tax_amount = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Impuesto"
    )
    discount_amount = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Descuento"
    )
    shipping_cost = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, verbose_name="Costo de Envío"
    )
    total = models.DecimalField(
        max_digits=15, decimal_places=2, default=0, verbose_name="Total"
    )

    # Estado y método de pago
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="DRAFT", verbose_name="Estado"
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default="CASH",
        verbose_name="Método de Pago",
    )
    currency = models.CharField(
        max_length=3, choices=CURRENCY_CHOICES, default="PEN", verbose_name="Moneda"
    )
    exchange_rate = models.DecimalField(
        max_digits=10, decimal_places=4, default=1, verbose_name="Tipo de Cambio"
    )

    # Fechas
    issue_date = models.DateField(default=timezone.now, verbose_name="Fecha de Emisión")
    due_date = models.DateField(verbose_name="Fecha de Vencimiento")
    paid_date = models.DateField(blank=True, null=True, verbose_name="Fecha de Pago")

    # Información adicional
    notes = models.TextField(blank=True, null=True, verbose_name="Notas")
    terms_conditions = models.TextField(
        blank=True, null=True, verbose_name="Términos y Condiciones"
    )
    payment_terms = models.CharField(
        max_length=100, blank=True, null=True, verbose_name="Términos de Pago"
    )

    # Metadata
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de Creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Fecha de Actualización"
    )

    class Meta:
        verbose_name = "Factura"
        verbose_name_plural = "Facturas"
        ordering = ["-issue_date", "-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["invoice_number"]),
            models.Index(fields=["client_name"]),
            models.Index(fields=["issue_date"]),
            models.Index(fields=["due_date"]),
        ]

    def __str__(self):
        return f"{self.invoice_number} - {self.client_name} - S/ {self.total}"

    def save(self, *args, **kwargs):
        """Generar número de factura y establecer fechas por defecto"""
        if not self.invoice_number:
            last_invoice = (
                Invoice.objects.filter(user=self.user).order_by("-id").first()
            )
            next_id = (last_invoice.id + 1) if last_invoice else 1
            self.invoice_number = f"F{self.user.id}-{next_id:06d}"

        if not self.due_date:
            self.due_date = self.issue_date + timezone.timedelta(days=30)

        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        """Verificar si la factura está vencida"""
        return (
            self.status == "SENT"
            and self.due_date < timezone.now().date()
            and not self.paid_date
        )

    @property
    def days_until_due(self):
        """Días hasta el vencimiento"""
        if self.paid_date:
            return 0
        delta = self.due_date - timezone.now().date()
        return delta.days

    @property
    def payment_status(self):
        """Estado de pago"""
        if self.status == "PAID":
            return "paid"
        elif self.is_overdue:
            return "overdue"
        elif self.status == "SENT":
            return "pending"
        else:
            return "draft"

    def mark_as_paid(self, payment_date=None):
        """Marcar factura como pagada"""
        self.status = "PAID"
        self.paid_date = payment_date or timezone.now().date()
        self.save()


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(
        Invoice, related_name="items", on_delete=models.CASCADE, verbose_name="Factura"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, verbose_name="Producto"
    )
    quantity = models.PositiveIntegerField(
        default=1, validators=[MinValueValidator(1)], verbose_name="Cantidad"
    )
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        verbose_name="Precio Unitario",
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=18.00,
        verbose_name="Tasa de Impuesto (%)",
    )
    discount = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, verbose_name="Descuento (%)"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="Notas del Item")
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de Creación"
    )

    class Meta:
        verbose_name = "Item de Factura"
        verbose_name_plural = "Items de Factura"
        ordering = ["id"]
        indexes = [
            models.Index(fields=["invoice", "product"]),
        ]

    def __str__(self):
        return f"{self.product.name} x {self.quantity} - {self.invoice.invoice_number}"

    def clean(self):
        """Validaciones del item"""
        from django.core.exceptions import ValidationError

        if self.quantity < 1:
            raise ValidationError({"quantity": "La cantidad debe ser al menos 1"})

        if self.unit_price < 0:
            raise ValidationError({"unit_price": "El precio no puede ser negativo"})

    @property
    def subtotal(self):
        """Calcular subtotal del item"""
        base_amount = self.unit_price * self.quantity
        discount_amount = base_amount * (self.discount / Decimal("100"))
        return base_amount - discount_amount

    @property
    def tax_amount(self):
        """Calcular impuesto del item"""
        return self.subtotal * (self.tax_rate / Decimal("100"))

    @property
    def total(self):
        """Calcular total del item"""
        return self.subtotal + self.tax_amount

    @property
    def profit(self):
        """Calcular ganancia del item"""
        if self.product.cost:
            cost_total = self.product.cost * self.quantity
            return self.subtotal - cost_total
        return Decimal("0.00")

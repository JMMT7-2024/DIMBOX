# enterprise/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal


class Client(models.Model):
    DOCUMENT_TYPES = [
        ("DNI", "DNI"),
        ("RUC", "RUC"),
        ("CE", "Carnet Extranjería"),
        ("PASSPORT", "Pasaporte"),
    ]

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="enterprise_clients",
        verbose_name="Creado por",
    )
    name = models.CharField(max_length=255, verbose_name="Nombre/Razón Social")
    document_type = models.CharField(
        max_length=10,
        choices=DOCUMENT_TYPES,
        default="DNI",
        verbose_name="Tipo de Documento",
    )
    document_number = models.CharField(
        max_length=20, verbose_name="Número de Documento"
    )
    email = models.EmailField(blank=True, null=True, verbose_name="Correo Electrónico")
    phone = models.CharField(
        max_length=20, blank=True, null=True, verbose_name="Teléfono"
    )
    address = models.TextField(blank=True, null=True, verbose_name="Dirección")
    city = models.CharField(
        max_length=100, blank=True, null=True, verbose_name="Ciudad"
    )
    country = models.CharField(max_length=100, default="Perú", verbose_name="País")
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de Creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Fecha de Actualización"
    )

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        unique_together = ["created_by", "document_number"]
        ordering = ["name"]
        indexes = [
            models.Index(fields=["created_by", "document_number"]),
            models.Index(fields=["name"]),
            models.Index(fields=["document_number"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.document_type}: {self.document_number})"

    def clean(self):
        """Validaciones adicionales del modelo"""
        from django.core.exceptions import ValidationError

        if self.document_type == "RUC" and len(self.document_number) != 11:
            raise ValidationError({"document_number": "El RUC debe tener 11 dígitos"})
        elif self.document_type == "DNI" and len(self.document_number) != 8:
            raise ValidationError({"document_number": "El DNI debe tener 8 dígitos"})

    @property
    def full_address(self):
        """Dirección completa formateada"""
        parts = []
        if self.address:
            parts.append(self.address)
        if self.city:
            parts.append(self.city)
        if self.country:
            parts.append(self.country)
        return ", ".join(parts) if parts else "Sin dirección"


class Product(models.Model):
    CATEGORY_CHOICES = [
        ("PRODUCT", "📦 Producto Físico"),
        ("SERVICE", "🛠️ Servicio"),
        ("DIGITAL", "💻 Producto Digital"),
        ("SUBSCRIPTION", "🔄 Suscripción"),
        ("OTHER", "📋 Otro"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="enterprise_products",
        verbose_name="Usuario",
    )
    name = models.CharField(max_length=255, verbose_name="Nombre del Producto")
    description = models.TextField(blank=True, null=True, verbose_name="Descripción")
    sku = models.CharField(
        max_length=100, unique=True, blank=True, null=True, verbose_name="SKU/Código"
    )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        verbose_name="Precio de Venta",
    )
    cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name="Costo",
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default="PRODUCT",
        verbose_name="Categoría",
    )
    stock = models.IntegerField(default=0, verbose_name="Stock Disponible")
    min_stock = models.IntegerField(default=0, verbose_name="Stock Mínimo")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=18.00,
        verbose_name="Tasa de Impuesto (%)",
    )
    image = models.ImageField(
        upload_to="products/%Y/%m/%d/", blank=True, null=True, verbose_name="Imagen"
    )
    barcode = models.CharField(
        max_length=100, blank=True, null=True, verbose_name="Código de Barras"
    )
    weight = models.DecimalField(
        max_digits=8, decimal_places=2, blank=True, null=True, verbose_name="Peso (kg)"
    )
    dimensions = models.CharField(
        max_length=50, blank=True, null=True, verbose_name="Dimensiones"
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de Creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Fecha de Actualización"
    )

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["category"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.name} - S/ {self.price}"

    def save(self, *args, **kwargs):
        """Generar SKU automáticamente si no existe"""
        if not self.sku:
            last_product = (
                Product.objects.filter(user=self.user).order_by("-id").first()
            )
            next_id = (last_product.id + 1) if last_product else 1
            self.sku = f"SKU-{self.user.id}-{next_id:06d}"

        # Validar stock mínimo
        if self.stock <= self.min_stock and self.stock > 0:
            print(f"⚠️ Advertencia: Producto {self.name} tiene stock bajo")

        super().save(*args, **kwargs)

    @property
    def profit_margin(self):
        """Calcular margen de ganancia"""
        if self.cost and self.cost > 0:
            return ((self.price - self.cost) / self.cost) * 100
        return Decimal("0.00")

    @property
    def tax_amount(self):
        """Calcular monto de impuesto"""
        return self.price * (self.tax_rate / Decimal("100"))

    @property
    def price_with_tax(self):
        """Calcular precio con impuesto"""
        return self.price + self.tax_amount

    @property
    def is_low_stock(self):
        """Verificar si el stock está bajo"""
        return self.stock <= self.min_stock

    @property
    def is_out_of_stock(self):
        """Verificar si está agotado"""
        return self.stock == 0

    @property
    def stock_status(self):
        """Estado del stock"""
        if self.is_out_of_stock:
            return "out_of_stock"
        elif self.is_low_stock:
            return "low_stock"
        else:
            return "in_stock"

    def update_stock(self, quantity):
        """Actualizar stock de forma segura"""
        new_stock = self.stock + quantity
        if new_stock < 0:
            raise ValueError("Stock no puede ser negativo")
        self.stock = new_stock
        self.save()


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
        User,
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

        # Recalcular total si es necesario
        if self.pk:
            self.calculate_totals()

        super().save(*args, **kwargs)

    def calculate_totals(self):
        """Calcular totales automáticamente basado en los items"""
        items = self.items.all()
        self.subtotal = sum(item.subtotal for item in items)
        self.tax_amount = sum(item.tax_amount for item in items)
        self.total = (
            self.subtotal + self.tax_amount - self.discount_amount + self.shipping_cost
        )

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

    def add_item(self, product, quantity, unit_price=None, tax_rate=None):
        """Agregar item a la factura"""
        unit_price = unit_price or product.price
        tax_rate = tax_rate or product.tax_rate

        InvoiceItem.objects.create(
            invoice=self,
            product=product,
            quantity=quantity,
            unit_price=unit_price,
            tax_rate=tax_rate,
        )
        self.calculate_totals()
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

    def save(self, *args, **kwargs):
        """Validar stock antes de guardar"""
        if self.pk is None:  # Nuevo item
            if self.product.stock < self.quantity:
                raise ValueError(
                    f"Stock insuficiente. Disponible: {self.product.stock}"
                )

            # Actualizar stock del producto
            self.product.stock -= self.quantity
            self.product.save()

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Restaurar stock al eliminar item"""
        # Restaurar stock del producto
        self.product.stock += self.quantity
        self.product.save()
        super().delete(*args, **kwargs)

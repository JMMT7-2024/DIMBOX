from django.db import models
from django.conf import settings  # ✅ AGREGAR
from django.core.validators import MinValueValidator
from decimal import Decimal


class Product(models.Model):
    CATEGORY_CHOICES = [
        ("PRODUCT", "📦 Producto Físico"),
        ("SERVICE", "🛠️ Servicio"),
        ("DIGITAL", "💻 Producto Digital"),
        ("SUBSCRIPTION", "🔄 Suscripción"),
        ("OTHER", "📋 Otro"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # ✅ CORREGIDO
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

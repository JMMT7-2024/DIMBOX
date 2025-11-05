# enterprise/serializers.py - MÓDULO EMPRESARIAL COMPLETO CORREGIDO
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Client, Product, Invoice, InvoiceItem


class ClientSerializer(serializers.ModelSerializer):
    """Serializer SIMPLIFICADO - solo campos esenciales"""

    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "document_type",
            "document_number",
            "phone",
            "email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        """CORRECCIÓN CRÍTICA: Asignar usuario automáticamente - MISMO PATRÓN QUE PRODUCTOS"""
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["created_by"] = request.user
        return super().create(validated_data)

    def validate_document_number(self, value):
        """Validación básica de documento"""
        value = value.strip()
        if not value:
            raise serializers.ValidationError("El número de documento es obligatorio")
        return value

    def validate_name(self, value):
        """Validación básica de nombre"""
        value = value.strip()
        if not value:
            raise serializers.ValidationError("El nombre es obligatorio")
        return value


class ProductSerializer(serializers.ModelSerializer):
    profit_margin = serializers.ReadOnlyField()
    tax_amount = serializers.ReadOnlyField()
    price_with_tax = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "sku",
            "price",
            "cost",
            "category",
            "stock",
            "is_active",
            "tax_rate",
            "image",
            "profit_margin",
            "tax_amount",
            "price_with_tax",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "profit_margin",
            "tax_amount",
            "price_with_tax",
        ]

    def validate_price(self, value):
        """Validar que el precio sea mayor a 0"""
        if value <= 0:
            raise serializers.ValidationError("El precio debe ser mayor a 0")
        return value

    def validate_stock(self, value):
        """Validar que el stock no sea negativo"""
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo")
        return value

    def validate_cost(self, value):
        """Validar que el costo no sea negativo"""
        if value is not None and value < 0:
            raise serializers.ValidationError("El costo no puede ser negativo")
        return value

    def create(self, validated_data):
        """CORRECCIÓN CRÍTICA: Asignar usuario del contexto"""
        request = self.context.get("request")

        if request and hasattr(request, "user"):
            validated_data["user"] = request.user
        else:
            if "user" not in validated_data:
                raise serializers.ValidationError(
                    "No se pudo determinar el usuario para el producto"
                )

        return super().create(validated_data)


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas de productos"""

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "price",
            "category",
            "stock",
            "is_active",
            "created_at",
        ]


class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    subtotal = serializers.ReadOnlyField()
    tax_amount = serializers.ReadOnlyField()
    total = serializers.ReadOnlyField()

    class Meta:
        model = InvoiceItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "unit_price",
            "tax_rate",
            "subtotal",
            "tax_amount",
            "total",
        ]
        read_only_fields = ["id", "subtotal", "tax_amount", "total"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0")
        return value

    def validate_unit_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("El precio unitario debe ser mayor a 0")
        return value


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, required=False)
    is_overdue = serializers.ReadOnlyField()
    client_info = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "client_name",
            "client_ruc",
            "client_address",
            "client_email",
            "client_info",
            "subtotal",
            "tax_amount",
            "total",
            "status",
            "payment_method",
            "issue_date",
            "due_date",
            "paid_date",
            "is_overdue",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "invoice_number",
            "subtotal",
            "tax_amount",
            "total",
            "created_at",
            "updated_at",
            "is_overdue",
        ]

    def get_client_info(self, obj):
        """Información resumida del cliente"""
        return {
            "name": obj.client_name,
            "ruc": obj.client_ruc,
            "email": obj.client_email,
        }

    def validate(self, data):
        """Validaciones cruzadas"""
        if data.get("due_date") and data.get("issue_date"):
            if data["due_date"] < data["issue_date"]:
                raise serializers.ValidationError(
                    {
                        "due_date": "La fecha de vencimiento no puede ser anterior a la fecha de emisión"
                    }
                )
        return data

    def create(self, validated_data):
        """Crear invoice con items"""
        items_data = validated_data.pop("items", [])
        request = self.context.get("request")

        if request and hasattr(request, "user"):
            validated_data["user"] = request.user

        # Calcular totales iniciales
        validated_data.setdefault("subtotal", 0)
        validated_data.setdefault("tax_amount", 0)
        validated_data.setdefault("total", 0)

        invoice = Invoice.objects.create(**validated_data)

        # Crear items y recalcular totales
        if items_data:
            self._create_invoice_items(invoice, items_data)
            invoice.save()

        return invoice

    def update(self, instance, validated_data):
        """Actualizar invoice con items"""
        items_data = validated_data.pop("items", [])

        # Actualizar campos del invoice
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Actualizar items si se proporcionan
        if items_data is not None:
            instance.items.all().delete()
            self._create_invoice_items(instance, items_data)

        instance.save()
        return instance

    def _create_invoice_items(self, invoice, items_data):
        """Helper para crear items y calcular totales"""
        subtotal = 0
        tax_amount = 0

        for item_data in items_data:
            item = InvoiceItem.objects.create(invoice=invoice, **item_data)
            subtotal += item.subtotal
            tax_amount += item.tax_amount

        # Actualizar totales del invoice
        invoice.subtotal = subtotal
        invoice.tax_amount = tax_amount
        invoice.total = subtotal + tax_amount


class InvoiceCreateSerializer(serializers.Serializer):
    """Serializer para creación rápida de facturas desde el frontend"""

    client_name = serializers.CharField(max_length=255)
    client_ruc = serializers.CharField(max_length=20, required=False, allow_blank=True)
    client_email = serializers.EmailField(required=False, allow_blank=True)
    client_address = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.ChoiceField(
        choices=Invoice.PAYMENT_METHOD_CHOICES, default="CASH"
    )
    issue_date = serializers.DateField(required=False)
    due_date = serializers.DateField(required=False)

    # Items como lista de productos con cantidades
    items = serializers.ListField(child=serializers.DictField(), min_length=1)

    def validate_items(self, value):
        """Validar estructura de items"""
        for item in value:
            if "product_id" not in item:
                raise serializers.ValidationError("Cada item debe tener product_id")
            if "quantity" not in item:
                raise serializers.ValidationError("Cada item debe tener quantity")

            try:
                quantity = int(item["quantity"])
                if quantity <= 0:
                    raise serializers.ValidationError("La cantidad debe ser mayor a 0")
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    "La cantidad debe ser un número válido"
                )

        return value

    def create(self, validated_data):
        """Crear factura completa desde datos simplificados"""
        from django.utils import timezone
        from datetime import timedelta

        request = self.context.get("request")
        items_data = validated_data.pop("items")

        # Configurar fechas por defecto
        if not validated_data.get("issue_date"):
            validated_data["issue_date"] = timezone.now().date()
        if not validated_data.get("due_date"):
            validated_data["due_date"] = validated_data["issue_date"] + timedelta(
                days=30
            )

        # Crear invoice base
        invoice_data = {
            "user": request.user,
            "client_name": validated_data["client_name"],
            "client_ruc": validated_data.get("client_ruc", ""),
            "client_email": validated_data.get("client_email", ""),
            "client_address": validated_data.get("client_address", ""),
            "payment_method": validated_data.get("payment_method", "CASH"),
            "issue_date": validated_data["issue_date"],
            "due_date": validated_data["due_date"],
            "subtotal": 0,
            "tax_amount": 0,
            "total": 0,
        }

        invoice = Invoice.objects.create(**invoice_data)

        # Procesar items
        subtotal = 0
        tax_amount = 0

        for item in items_data:
            try:
                product = Product.objects.get(
                    id=item["product_id"], user=request.user, is_active=True
                )

                invoice_item = InvoiceItem.objects.create(
                    invoice=invoice,
                    product=product,
                    quantity=item["quantity"],
                    unit_price=product.price,
                    tax_rate=product.tax_rate,
                )

                subtotal += invoice_item.subtotal
                tax_amount += invoice_item.tax_amount

            except Product.DoesNotExist:
                raise serializers.ValidationError(
                    {"items": f"Producto con ID {item['product_id']} no encontrado"}
                )

        # Actualizar totales
        invoice.subtotal = subtotal
        invoice.tax_amount = tax_amount
        invoice.total = subtotal + tax_amount
        invoice.save()

        return invoice

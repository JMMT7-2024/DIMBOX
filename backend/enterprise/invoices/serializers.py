from rest_framework import serializers
from .models import Invoice, InvoiceItem
from enterprise.clients.models import Client  # ✅ IMPORT ABSOLUTO
from enterprise.products.models import Product  # ✅ IMPORT ABSOLUTO


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


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "client_name",
            "client_ruc",
            "client_address",
            "client_email",
            "client_phone",
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
        ]
        read_only_fields = ["id", "invoice_number", "created_at"]


class InvoiceCreateSerializer(serializers.Serializer):
    client_id = serializers.IntegerField(required=False)
    client_name = serializers.CharField(required=False)
    client_ruc = serializers.CharField(required=False, allow_blank=True)
    payment_method = serializers.CharField(default="CASH")
    items = serializers.ListField(child=serializers.DictField(), min_length=1)

    def validate(self, data):
        if not data.get("client_id") and not data.get("client_name"):
            raise serializers.ValidationError("Se requiere client_id o client_name")
        return data


class InvoiceSummarySerializer(serializers.ModelSerializer):
    is_overdue = serializers.ReadOnlyField()
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_number",
            "client_name",
            "total",
            "status",
            "payment_method",
            "issue_date",
            "due_date",
            "is_overdue",
            "items_count",
        ]

    def get_items_count(self, obj):
        return obj.items.count()

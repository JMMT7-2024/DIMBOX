from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    profit_margin = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()

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
            "min_stock",
            "is_active",
            "tax_rate",
            "barcode",
            "profit_margin",
            "is_low_stock",
            "is_out_of_stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "sku", "created_at", "updated_at"]


class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["name", "price", "category", "stock", "description", "cost"]


class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "sku", "price", "category", "stock", "is_active"]

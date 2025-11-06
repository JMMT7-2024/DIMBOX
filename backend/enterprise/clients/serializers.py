from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    full_address = serializers.ReadOnlyField()

    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "document_type",
            "document_number",
            "email",
            "phone",
            "address",
            "city",
            "country",
            "is_active",
            "full_address",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "name",
            "document_type",
            "document_number",
            "email",
            "phone",
            "address",
        ]


class ClientListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "document_type",
            "document_number",
            "email",
            "phone",
            "is_active",
        ]

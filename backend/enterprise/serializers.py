# /root/DIMBOX/backend/enterprise/serializers.py
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    """Serializer completo para Clientes"""

    # Campos calculados
    full_document = serializers.ReadOnlyField()
    contact_info = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )

    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "client_type",
            "document_type",
            "document_number",
            "full_document",
            "email",
            "phone",
            "address",
            "is_active",
            "is_taxpayer",
            "contact_info",
            "created_at",
            "updated_at",
            "created_by_name",
            "enterprise",
        ]
        read_only_fields = [
            "id",
            "full_document",
            "contact_info",
            "created_by_name",
            "created_at",
            "updated_at",
            "enterprise",
        ]

    def validate_document_number(self, value):
        """Validación del documento"""
        document_type = self.initial_data.get("document_type")

        if document_type == Client.DocumentType.RUC and len(value) != 11:
            raise serializers.ValidationError(_("El RUC debe tener 11 dígitos"))

        elif document_type == Client.DocumentType.DNI and len(value) != 8:
            raise serializers.ValidationError(_("El DNI debe tener 8 dígitos"))

        return value.strip()

    def create(self, validated_data):
        """Asignar empresa y usuario automáticamente"""
        validated_data["enterprise"] = self.context["request"].user.enterprise
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class ClientListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas"""

    full_document = serializers.ReadOnlyField()

    class Meta:
        model = Client
        fields = [
            "id",
            "name",
            "document_type",
            "document_number",
            "full_document",
            "email",
            "phone",
            "is_active",
        ]


class ClientCreateSerializer(serializers.ModelSerializer):
    """Serializer específico para creación"""

    class Meta:
        model = Client
        fields = [
            "name",
            "client_type",
            "document_type",
            "document_number",
            "email",
            "phone",
            "address",
            "is_taxpayer",
        ]

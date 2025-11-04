# /root/DIMBOX/backend/enterprise/serializers.py
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Client


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
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        """✅ Asignar automáticamente el usuario que crea"""
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)

    def validate_document_number(self, value):
        """✅ Validación básica de documento"""
        value = value.strip()
        if not value:
            raise serializers.ValidationError("El número de documento es obligatorio")
        return value

    def validate_name(self, value):
        """✅ Validación básica de nombre"""
        value = value.strip()
        if not value:
            raise serializers.ValidationError("El nombre es obligatorio")
        return value

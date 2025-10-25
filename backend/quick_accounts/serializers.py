from rest_framework import serializers
from .models import QuickAccount


class QuickAccountSerializer(serializers.ModelSerializer):
    # Campo computado para la respuesta
    complete_data = serializers.SerializerMethodField()

    class Meta:
        model = QuickAccount
        fields = [
            "id",
            "user",
            "title",
            "description",
            "currency",
            "accounts_data",
            "complete_data",
            "last_sync",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "complete_data",
            "last_sync",
            "created_at",
            "updated_at",
        ]

    def get_complete_data(self, obj):
        return obj.get_complete_data()


class QuickAccountUpdateSerializer(serializers.Serializer):
    # Serializer específico para actualizaciones
    data = serializers.DictField(required=True)

    def validate_data(self, value):
        """Validar estructura básica de datos"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Los datos deben ser un objeto JSON")

        # Validar estructura esperada
        expected_keys = ["quickAccount", "entries", "expenses", "lastModified"]
        for key in expected_keys:
            if key not in value:
                raise serializers.ValidationError(f"Falta la clave requerida: {key}")

        return value

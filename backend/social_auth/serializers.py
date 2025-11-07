from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


# Mantener el serializer de Google por ahora
class GoogleAuthSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=True, write_only=True)

    def validate_access_token(self, value):
        if not value or len(value) < 10:
            raise serializers.ValidationError("Token de acceso inválido")
        return value


# ✅ NUEVO: Serializer para Firebase
class FirebaseAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField(required=True, write_only=True)

    def validate_id_token(self, value):
        if not value or len(value) < 10:
            raise serializers.ValidationError("Token de Firebase inválido")
        return value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "username",
            "subscription",
            "role",
            "goal_name",
            "goal_amount",
        )
        read_only_fields = fields

# core/serializers_admin.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "name",
            "role",
            "subscription",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined", "is_superuser"]

    def validate(self, attrs):
        # opcional: evita quitarse is_active a sí mismo, etc.
        return super().validate(attrs)

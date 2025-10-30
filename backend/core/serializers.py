# core/serializers.py - VERSIÓN COMPLETAMENTE CORREGIDA
from rest_framework import serializers
from .models import User, Transaction


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "name",
            "subscription",
            "role",
            "record_count",
            "goal_name",
            "goal_amount",
            "is_active",
            "custom_limits",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "role": {"read_only": True},
            "record_count": {"read_only": True},
            "is_active": {"read_only": True},
            "custom_limits": {"read_only": True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data.get("name", ""),
        )
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["name", "goal_name", "goal_amount"]


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    # ✅ SOLUCIÓN: Hacer los campos más flexibles
    subscription = serializers.CharField(required=False)
    role = serializers.CharField(required=False)
    is_active = serializers.BooleanField(required=False)

    class Meta:
        model = User
        fields = ["subscription", "role", "is_active"]

    def validate_subscription(self, value):
        """Validación flexible que acepta mayúsculas/minúsculas"""
        if value:
            value_upper = value.upper()
            valid_choices = ["FREE", "PREMIUM", "ENTERPRISE"]
            if value_upper not in valid_choices:
                raise serializers.ValidationError(
                    f"Subscription debe ser: {', '.join(valid_choices)}"
                )
            return value_upper  # ✅ Siempre devolver en mayúsculas
        return value

    def validate_role(self, value):
        """Validación flexible que acepta mayúsculas/minúsculas"""
        if value:
            value_upper = value.upper()
            valid_choices = ["USER", "ADMIN"]  # ✅ Solo USER y ADMIN como en tu modelo
            if value_upper not in valid_choices:
                raise serializers.ValidationError(
                    f"Role debe ser: {', '.join(valid_choices)}"
                )
            return value_upper  # ✅ Siempre devolver en mayúsculas
        return value


class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source="user.username")

    class Meta:
        model = Transaction
        fields = [
            "id",
            "user",
            "transaction_type",
            "amount",
            "date",
            "description",
            "category",
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    record_count = serializers.IntegerField(read_only=True)
    usage_stats = serializers.SerializerMethodField()
    effective_limits = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "name",
            "subscription",
            "role",
            "is_active",
            "record_count",
            "date_joined",
            "last_login",
            "custom_limits",
            "usage_stats",
            "effective_limits",
        )

    def get_usage_stats(self, obj):
        return obj.usage_stats

    def get_effective_limits(self, obj):
        return obj.effective_limits


class UserLimitsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["custom_limits"]

    def validate_custom_limits(self, value):
        if value is not None:
            allowed_keys = {
                "maxTransactions",
                "maxQuickAccounts",
                "canExport",
                "canAdvancedAnalytics",
                "maxTransactionAmount",
                "maxCategories",
                "retentionMonths",
                "features",
            }
            for key in value.keys():
                if key not in allowed_keys:
                    raise serializers.ValidationError(
                        f"Clave no permitida en custom_limits: {key}"
                    )
        return value


class PublicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "name", "subscription"]


class MeSerializer(serializers.ModelSerializer):
    usage_stats = serializers.SerializerMethodField()
    effective_limits = serializers.SerializerMethodField()
    is_premium = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "name",
            "subscription",
            "role",
            "goal_name",
            "goal_amount",
            "record_count",
            "is_active",
            "custom_limits",
            "usage_stats",
            "effective_limits",
            "is_premium",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def get_usage_stats(self, obj):
        return obj.usage_stats

    def get_effective_limits(self, obj):
        return obj.effective_limits

    def get_is_premium(self, obj):
        """✅ Campo conveniente corregido"""
        return obj.subscription in ["PREMIUM", "ENTERPRISE"]  # ✅ Corregido

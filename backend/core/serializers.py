# core/serializers.py - VERSIÓN CORREGIDA
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
            "custom_limits",  # ✅ Agregar custom_limits
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            # ✅ QUITAR 'subscription' de read_only para que el frontend lo reciba
            "role": {"read_only": True},
            "record_count": {"read_only": True},
            "is_active": {"read_only": True},
            "custom_limits": {
                "read_only": True
            },  # ✅ Mantener custom_limits como read_only
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
    # ✅ DEFINIR EXPLÍCITAMENTE LAS OPCIONES QUE COINCIDEN CON EL MODELO
    subscription = serializers.ChoiceField(
        choices=[
            ("FREE", "Free"),
            ("PREMIUM", "Premium"),
            ("ENTERPRISE", "Enterprise"),
        ],
        required=False,
    )

    role = serializers.ChoiceField(
        choices=[
            ("USER", "User"),
            ("ADMIN", "Admin"),
            # 'MODERATOR' NO EXISTE en tu modelo - ELIMINAR
        ],
        required=False,
    )

    class Meta:
        model = User
        fields = ["subscription", "role", "is_active"]


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

    # ✅ NUEVO: Propiedades calculadas para el admin
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
            "effective_limits",  # ✅ Campos adicionales para admin
        )

    def get_usage_stats(self, obj):
        """✅ Obtener estadísticas de uso del usuario"""
        return obj.usage_stats

    def get_effective_limits(self, obj):
        """✅ Obtener límites efectivos del usuario"""
        return obj.effective_limits


# ✅ NUEVO: Serializer para actualización de límites personalizados
class UserLimitsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["custom_limits"]

    def validate_custom_limits(self, value):
        """✅ Validar que custom_limits tenga el formato correcto"""
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


# ✅ NUEVO: Serializer para endpoints públicos (sin información sensible)
class PublicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "name", "subscription"]


# ✅ NUEVO: Serializer para el endpoint /me/ con información completa
class MeSerializer(serializers.ModelSerializer):
    usage_stats = serializers.SerializerMethodField()
    effective_limits = serializers.SerializerMethodField()
    is_premium = (
        serializers.SerializerMethodField()
    )  # ✅ Campo conveniente para frontend

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
        """✅ Campo conveniente para que el frontend verifique fácilmente"""
        return obj.subscription == User.SubscriptionStatus.PREMIUM

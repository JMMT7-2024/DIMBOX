from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Client, Enterprise


class EnterpriseSerializer(serializers.ModelSerializer):
    """Serializer para Empresa"""

    class Meta:
        model = Enterprise
        fields = [
            "id",
            "name",
            "ruc",
            "business_name",
            "address",
            "phone",
            "email",
            "website",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClientSerializer(serializers.ModelSerializer):
    """Serializer completo para Clientes"""

    # Campos calculados
    full_document = serializers.ReadOnlyField()
    contact_info = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )
    enterprise_name = serializers.CharField(source="enterprise.name", read_only=True)

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
            "enterprise_name",
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
            "enterprise_name",
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
        user = self.context["request"].user

        # Verificar que el usuario es ENTERPRISE
        if user.plan_type != "ENTERPRISE":
            raise serializers.ValidationError(
                _("Tu plan no incluye la gestión de clientes empresariales")
            )

        # Asignar empresa automáticamente
        if hasattr(user, "enterprise") and user.enterprise:
            validated_data["enterprise"] = user.enterprise
            validated_data["created_by"] = user
            return super().create(validated_data)
        else:
            raise serializers.ValidationError(
                _("No se encontró una empresa asignada. Contacta al administrador.")
            )


class ClientListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listas"""

    full_document = serializers.ReadOnlyField()
    enterprise_name = serializers.CharField(source="enterprise.name", read_only=True)

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
            "enterprise_name",
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

    def create(self, validated_data):
        """Asignar empresa automáticamente al usuario ENTERPRISE"""
        user = self.context["request"].user

        # Verificar plan
        if user.plan_type != "ENTERPRISE":
            raise serializers.ValidationError(
                {"error": _("Tu plan no incluye la gestión de clientes empresariales")}
            )

        # Asignar empresa automáticamente
        if hasattr(user, "enterprise") and user.enterprise:
            validated_data["enterprise"] = user.enterprise
            validated_data["created_by"] = user

            # Validar documento único en la empresa
            document_number = validated_data.get("document_number")
            enterprise = user.enterprise

            if Client.objects.filter(
                enterprise=enterprise, document_number=document_number
            ).exists():
                raise serializers.ValidationError(
                    {
                        "document_number": _(
                            "Ya existe un cliente con este documento en tu empresa"
                        )
                    }
                )

            return super().create(validated_data)
        else:
            # Intentar crear empresa automáticamente como fallback
            try:
                from enterprise.models import Enterprise

                enterprise = Enterprise.objects.create(
                    name=f"Empresa de {user.get_full_name() or user.email}",
                    ruc=f"99{user.id:09d}",
                    business_name=f"Empresa de {user.get_full_name() or user.email}",
                    address="Dirección automática",
                    owner=user,
                )
                validated_data["enterprise"] = enterprise
                validated_data["created_by"] = user
                return super().create(validated_data)
            except Exception as e:
                raise serializers.ValidationError(
                    {
                        "error": _(
                            "Error al crear empresa automática. Contacta al administrador."
                        )
                    }
                )

    def validate_document_number(self, value):
        """Validación del documento"""
        document_type = self.initial_data.get("document_type")

        if document_type == Client.DocumentType.RUC and len(value) != 11:
            raise serializers.ValidationError(_("El RUC debe tener 11 dígitos"))

        elif document_type == Client.DocumentType.DNI and len(value) != 8:
            raise serializers.ValidationError(_("El DNI debe tener 8 dígitos"))

        return value.strip()

# /root/DIMBOX/backend/enterprise/models.py
from django.db import models
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _
from core.models import User  # Solo importar User desde core


class Enterprise(models.Model):
    """Modelo para empresas/organizaciones"""

    name = models.CharField(max_length=255, verbose_name=_("Nombre de la Empresa"))
    ruc = models.CharField(max_length=11, unique=True, verbose_name=_("RUC"))
    business_name = models.CharField(max_length=255, verbose_name=_("Razón Social"))
    address = models.TextField(verbose_name=_("Dirección Fiscal"))
    phone = models.CharField(
        max_length=20, blank=True, null=True, verbose_name=_("Teléfono")
    )
    email = models.EmailField(blank=True, null=True, verbose_name=_("Email"))
    website = models.URLField(blank=True, null=True, verbose_name=_("Sitio Web"))

    # Campos de estado
    is_active = models.BooleanField(default=True, verbose_name=_("Activa"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Relación con el usuario propietario
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="enterprises",
        verbose_name=_("Propietario"),
    )

    class Meta:
        db_table = "enterprise_enterprises"
        verbose_name = _("Empresa")
        verbose_name_plural = _("Empresas")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.ruc})"


class Client(models.Model):
    class DocumentType(models.TextChoices):
        RUC = "RUC", _("RUC")
        DNI = "DNI", _("DNI")
        CE = "CE", _("Carnet de Extranjería")

    class ClientType(models.TextChoices):
        INDIVIDUAL = "INDIVIDUAL", _("Persona Natural")
        COMPANY = "COMPANY", _("Persona Jurídica")

    # Relación con empresa (usando el modelo que definimos arriba)
    enterprise = models.ForeignKey(
        Enterprise,  # Ahora usa el modelo local
        on_delete=models.CASCADE,
        related_name="clients",
        verbose_name=_("Empresa"),
    )

    # Información básica
    name = models.CharField(max_length=200, verbose_name=_("Nombre/Razón Social"))

    client_type = models.CharField(
        max_length=10,
        choices=ClientType.choices,
        default=ClientType.INDIVIDUAL,
        verbose_name=_("Tipo de Cliente"),
    )

    # Documentación
    document_type = models.CharField(
        max_length=10,
        choices=DocumentType.choices,
        default=DocumentType.RUC,
        verbose_name=_("Tipo de Documento"),
    )

    document_number = models.CharField(
        max_length=20,
        verbose_name=_("Número de Documento"),
        help_text=_("Número único de identificación"),
    )

    # Información de contacto
    email = models.EmailField(
        blank=True, null=True, verbose_name=_("Correo Electrónico")
    )

    phone_regex = RegexValidator(
        regex=r"^\+?1?\d{9,15}$",
        message=_("El número de teléfono debe tener entre 9 y 15 dígitos."),
    )
    phone = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        null=True,
        verbose_name=_("Teléfono"),
    )

    address = models.TextField(blank=True, null=True, verbose_name=_("Dirección"))

    # Estados
    is_active = models.BooleanField(default=True, verbose_name=_("Activo"))

    is_taxpayer = models.BooleanField(default=True, verbose_name=_("Es Contribuyente"))

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_clients",
        verbose_name=_("Creado por"),
    )

    class Meta:
        db_table = "enterprise_clients"
        verbose_name = _("Cliente")
        verbose_name_plural = _("Clientes")
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["enterprise", "document_number"],
                name="unique_enterprise_document",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.document_type}: {self.document_number})"

    def clean(self):
        """Validaciones del modelo"""
        from django.core.exceptions import ValidationError

        if (
            self.document_type == self.DocumentType.RUC
            and len(self.document_number) != 11
        ):
            raise ValidationError(
                {"document_number": _("El RUC debe tener 11 dígitos")}
            )

        elif (
            self.document_type == self.DocumentType.DNI
            and len(self.document_number) != 8
        ):
            raise ValidationError({"document_number": _("El DNI debe tener 8 dígitos")})

    @property
    def full_document(self):
        return f"{self.document_type}: {self.document_number}"

    @property
    def contact_info(self):
        contact_parts = []
        if self.phone:
            contact_parts.append(f"Tel: {self.phone}")
        if self.email:
            contact_parts.append(f"Email: {self.email}")
        return " | ".join(contact_parts)

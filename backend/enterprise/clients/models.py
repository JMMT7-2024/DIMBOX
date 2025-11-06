from django.db import models
from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Client(models.Model):
    DOCUMENT_TYPES = [
        ("DNI", "DNI"),
        ("RUC", "RUC"),
        ("CE", "Carnet Extranjería"),
        ("PASSPORT", "Pasaporte"),
    ]

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="enterprise_clients",
        verbose_name="Creado por",
    )
    name = models.CharField(max_length=255, verbose_name="Nombre/Razón Social")
    document_type = models.CharField(
        max_length=10,
        choices=DOCUMENT_TYPES,
        default="DNI",
        verbose_name="Tipo de Documento",
    )
    document_number = models.CharField(
        max_length=20, verbose_name="Número de Documento"
    )
    email = models.EmailField(blank=True, null=True, verbose_name="Correo Electrónico")
    phone = models.CharField(
        max_length=20, blank=True, null=True, verbose_name="Teléfono"
    )
    address = models.TextField(blank=True, null=True, verbose_name="Dirección")
    city = models.CharField(
        max_length=100, blank=True, null=True, verbose_name="Ciudad"
    )
    country = models.CharField(max_length=100, default="Perú", verbose_name="País")

    # ✅ CAMPO CRÍTICO AÑADIDO
    is_active = models.BooleanField(default=True, verbose_name="Activo")

    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de Creación"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Fecha de Actualización"
    )

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        unique_together = ["created_by", "document_number"]
        ordering = ["name"]
        indexes = [
            models.Index(fields=["created_by", "document_number"]),
            models.Index(fields=["name"]),
            models.Index(fields=["document_number"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.document_type}: {self.document_number})"

    def clean(self):
        """Validaciones adicionales del modelo"""
        if self.document_type == "RUC" and len(self.document_number) != 11:
            raise ValidationError({"document_number": "El RUC debe tener 11 dígitos"})
        elif self.document_type == "DNI" and len(self.document_number) != 8:
            raise ValidationError({"document_number": "El DNI debe tener 8 dígitos"})

    @property
    def full_address(self):
        """Dirección completa formateada"""
        parts = []
        if self.address:
            parts.append(self.address)
        if self.city:
            parts.append(self.city)
        if self.country:
            parts.append(self.country)
        return ", ".join(parts) if parts else "Sin dirección"

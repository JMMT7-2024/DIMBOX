# /root/DIMBOX/backend/enterprise/models.py
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import User


class Client(models.Model):
    """Modelo SIMPLIFICADO para clientes - solo datos básicos"""

    class DocumentType(models.TextChoices):
        DNI = "DNI", _("DNI")
        RUC = "RUC", _("RUC")
        CE = "CE", _("Carnet Extranjería")

    # ✅ SOLO campos esenciales
    name = models.CharField(max_length=200, verbose_name=_("Nombre Completo"))
    document_type = models.CharField(
        max_length=10,
        choices=DocumentType.choices,
        default=DocumentType.DNI,
        verbose_name=_("Tipo de Documento"),
    )
    document_number = models.CharField(
        max_length=20, verbose_name=_("Número de Documento")
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name=_("Celular"))
    email = models.EmailField(blank=True, verbose_name=_("Email"))

    # ✅ Metadata simple
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name=_("Creado por"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "enterprise_clients"
        verbose_name = _("Cliente")
        verbose_name_plural = _("Clientes")
        ordering = ["name"]
        # ✅ Solo evitar duplicados por documento por usuario
        constraints = [
            models.UniqueConstraint(
                fields=["created_by", "document_number"],
                name="unique_user_document",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.document_number})"

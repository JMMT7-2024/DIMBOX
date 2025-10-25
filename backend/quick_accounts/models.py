from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class QuickAccount(models.Model):
    CURRENCY_CHOICES = [
        ("PEN", "Soles Peruanos"),
        ("USD", "Dólares Americanos"),
        ("EUR", "Euros"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="quick_account"
    )

    # Campos principales para búsqueda rápida
    title = models.CharField(max_length=200, default="Mis Cuentas Rápidas")
    description = models.TextField(blank=True, default="")
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="PEN")

    # Almacenar toda la estructura JSON
    accounts_data = models.JSONField(
        default=dict, help_text="Estructura completa de cuentas rápidas"
    )

    last_sync = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "quick_accounts"
        verbose_name = "Cuenta Rápida"
        verbose_name_plural = "Cuentas Rápidas"
        indexes = [
            models.Index(fields=["user", "updated_at"]),
        ]

    def __str__(self):
        return f"Cuentas Rápidas - {self.user.username}"

    def get_complete_data(self):
        """Obtener datos estructurados con valores por defecto"""
        default_data = {
            "quickAccount": {
                "title": self.title,
                "description": self.description,
                "currency": self.currency,
            },
            "entries": [],
            "expenses": [],
            "lastModified": self.updated_at.isoformat(),
        }

        # Combinar con datos existentes
        if self.accounts_data:
            return self._deep_merge(default_data, self.accounts_data)
        return default_data

    def _deep_merge(self, source, destination):
        """Merge recursivo de diccionarios"""
        for key, value in source.items():
            if isinstance(value, dict):
                node = destination.setdefault(key, {})
                self._deep_merge(value, node)
            else:
                destination.setdefault(key, value)
        return destination

    def update_from_complete_data(self, complete_data):
        """Actualizar desde datos completos"""
        if "quickAccount" in complete_data:
            quick_account_data = complete_data["quickAccount"]
            self.title = quick_account_data.get("title", self.title)
            self.description = quick_account_data.get("description", self.description)
            self.currency = quick_account_data.get("currency", self.currency)

        self.accounts_data = complete_data
        self.save()

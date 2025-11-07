# social_auth/models.py - MODELO COMPLETO Y FUNCIONAL
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Modelo de usuario personalizado para DIMBOX
    """

    # Información básica
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True)

    # Firebase
    firebase_uid = models.CharField(
        max_length=128, unique=True, null=True, blank=True, verbose_name="Firebase UID"
    )

    # Perfil de usuario
    avatar = models.URLField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)

    # Configuraciones de la app
    subscription = models.CharField(
        max_length=50,
        default="free",
        choices=[
            ("free", "Free"),
            ("premium", "Premium"),
            ("enterprise", "Enterprise"),
        ],
    )

    # Límites de uso
    record_count = models.IntegerField(default=0)
    custom_limits = models.JSONField(default=dict, blank=True)

    # Fechas
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Campos requeridos para AbstractUser
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "auth_user"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        # Asegurar que el username esté basado en email si no existe
        if not self.username and self.email:
            base_username = self.email.split("@")[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            self.username = username

        # Asegurar que name esté completo
        if not self.name and (self.first_name or self.last_name):
            self.name = f"{self.first_name} {self.last_name}".strip()

        super().save(*args, **kwargs)

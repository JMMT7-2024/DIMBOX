# core/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class SubscriptionStatus(models.TextChoices):
        FREE = 'FREE', 'Gratis'
        PREMIUM = 'PREMIUM', 'Premium'

    class Role(models.TextChoices):
        USER = 'USER', 'Usuario'
        ADMIN = 'ADMIN', 'Administrador'

    # Perfil
    name = models.CharField(max_length=255, blank=True)
    goal_name = models.CharField(max_length=255, blank=True, default="Meta de Ahorro")
    goal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Gestión
    subscription = models.CharField(max_length=10, choices=SubscriptionStatus.choices,
                                    default=SubscriptionStatus.FREE)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    record_count = models.PositiveIntegerField(default=0)

    # Evitar conflictos y ajustar relaciones
    first_name = None
    last_name = None
    groups = models.ManyToManyField('auth.Group', related_name='core_user_set', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='core_user_permissions_set', blank=True)

    def __str__(self):
        return self.username


class TransactionType(models.TextChoices):
    INGRESO = 'IN', 'Ingreso'
    GASTO = 'OUT', 'Gasto'

class GastoCategoria(models.TextChoices):
    ALIMENTACION = 'AL', 'Alimentación'
    TRANSPORTE = 'TR', 'Transporte'
    SERVICIOS = 'SE', 'Servicios'
    VIVIENDA = 'VI', 'Vivienda'
    OCIO = 'OC', 'Ocio'
    SALUD = 'SA', 'Salud'
    EDUCACION = 'ED', 'Educación'
    OTROS = 'OT', 'Otros'

class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=3, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=3, choices=GastoCategoria.choices, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.transaction_type} - {self.amount}'

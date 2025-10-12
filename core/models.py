# core/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

# Es una buena práctica crear un modelo de Usuario personalizado desde el inicio.
# Heredamos de AbstractUser para tener todos los campos de autenticación de Django.
class User(AbstractUser):
    name = models.CharField(max_length=255, blank=True)
    goal_name = models.CharField(max_length=255, blank=True, default="Meta de Ahorro")
    goal_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Sobrescribimos el campo `first_name` para que no sea obligatorio.
    first_name = None
    last_name = None
    groups = models.ManyToManyField('auth.Group', related_name='core_user_set', blank=True)
    user_permissions = models.ManyToManyField('auth.Permission', related_name='core_user_permissions_set', blank=True)

    def __str__(self):
        return self.username

# Definimos las opciones para los campos con elecciones fijas,
# igual que en los selectores de tu formulario.
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

# El modelo principal que contendrá tanto ingresos como gastos.
class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=3, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    
    # Campos específicos para gastos
    category = models.CharField(max_length=3, choices=GastoCategoria.choices, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at'] # Ordenar por fecha descendente

    def __str__(self):
        return f'{self.user.username} - {self.transaction_type} - {self.amount}'
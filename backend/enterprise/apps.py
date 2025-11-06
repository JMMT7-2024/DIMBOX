# enterprise/apps.py
from django.apps import AppConfig


class EnterpriseConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "enterprise"
    verbose_name = "Sistema Empresarial"

    def ready(self):
        # Importar todos los módulos para asegurar que se registren
        try:
            from . import clients, products, invoices
        except ImportError as e:
            print(f"Error importing modules: {e}")

# /root/DIMBOX/backend/enterprise/apps.py
from django.apps import AppConfig


class EnterpriseConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "enterprise"
    verbose_name = "Sistema Empresarial"

    def ready(self):
        # Importar señales si las hay
        try:
            from . import signals
        except ImportError:
            pass

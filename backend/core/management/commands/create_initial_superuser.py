# core/management/commands/create_initial_superuser.py
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Crea un superusuario (si no existe) usando variables de entorno"

    def handle(self, *args, **opts):
        User = get_user_model()
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin123")

        user = User.objects.filter(username=username).first()
        if not user:
            user = User.objects.create_superuser(
                username=username, email=email, password=password
            )
            # setear campos propios del modelo
            try:
                from core.models import User as CoreUser

                user.role = CoreUser.Role.ADMIN
                user.subscription = CoreUser.SubscriptionStatus.PREMIUM
                user.save(update_fields=["role", "subscription"])
            except Exception:
                pass

            self.stdout.write(self.style.SUCCESS(f"Superusuario '{username}' creado"))
        else:
            self.stdout.write(
                self.style.WARNING(f"Superusuario '{username}' ya existe")
            )

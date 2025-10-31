#!/usr/bin/env python3
"""
👤 CREADOR DE USUARIO - CON MODELO CORREGIDO
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
os.environ["DJANGO_SECRET_KEY"] = "dev-insecure-use-only-locally"
os.environ["DJANGO_DEBUG"] = "True"

django.setup()

from core.models import User


def create_enterprise_user():
    username = "empresa"
    password = "empresa123"
    email = "empresa@dimbox.com"

    print("🔧 Creando usuario ENTERPRISE con modelo corregido...")

    # Verificar si ya existe
    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        user.subscription = "ENTERPRISE"
        user.set_password(password)
        user.save()
        print("✅ Usuario existente actualizado a ENTERPRISE")
    else:
        # Crear nuevo usuario - ahora debería funcionar con el save() corregido
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            subscription="ENTERPRISE",
            name="Usuario Empresa Demo",
        )
        print("✅ Nuevo usuario ENTERPRISE creado exitosamente")

    # Verificar información
    print(f"\n📋 USUARIO CREADO:")
    print(f"   👤 Username: {user.username}")
    print(f"   🔑 Password: {password}")
    print(f"   🏢 Plan: {user.subscription}")
    print(f"   🆔 ID: {user.id}")
    print(f"   📊 Record Count: {user.record_count}")

    return user


if __name__ == "__main__":
    user = create_enterprise_user()
    if user:
        print(f"\n🎉 ¡USUARIO ENTERPRISE LISTO!")
        print(f"   Usa: empresa / empresa123")
    else:
        print("❌ No se pudo crear el usuario")

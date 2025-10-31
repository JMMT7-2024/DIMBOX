#!/usr/bin/env python3
"""
👤 CREADOR DE USUARIO ENTERPRISE - PRODUCCIÓN
Este script se ejecuta LOCALMENTE pero conecta a la base de datos de PRODUCCIÓN
"""

import os
import django

# ✅ CONFIGURACIÓN PARA PRODUCCIÓN - Conecta a tu DB de Neon
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
os.environ["DATABASE_URL"] = (
    "postgresql://neondb_owner:npg_GyC9kH7bTjrS@ep-little-moon-aciuzzth-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
)
os.environ["DEBUG"] = "False"
os.environ["DJANGO_SECRET_KEY"] = (
    "clave-temporal-produccion"  # ⚠️ Usa la misma que en Render
)

print("🚀 Conectando a base de datos de PRODUCCIÓN...")
print("📍 Base de datos: Neon PostgreSQL")

try:
    django.setup()

    from core.models import User
    from django.contrib.auth import get_user_model

    def create_production_user():
        print("\n🔧 Creando usuario ENTERPRISE en PRODUCCIÓN...")

        username = "empresa"
        password = "empresa123"  # ⚠️ Cambia esto después!
        email = "empresa@dimbox.com"

        UserModel = get_user_model()

        try:
            # Verificar si ya existe
            if UserModel.objects.filter(username=username).exists():
                user = UserModel.objects.get(username=username)
                user.subscription = "ENTERPRISE"
                user.set_password(password)
                user.save()
                print("✅ Usuario existente actualizado a ENTERPRISE")
            else:
                # Crear nuevo usuario
                user = UserModel.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    subscription="ENTERPRISE",
                    name="Usuario Empresa Producción",
                    is_active=True,
                )
                print("✅ NUEVO usuario ENTERPRISE creado en producción")

            # Verificar
            user_refreshed = UserModel.objects.get(username=username)
            print(f"\n📋 USUARIO CREADO EN PRODUCCIÓN:")
            print(f"   👤 Username: {user_refreshed.username}")
            print(f"   🔑 Password: {password}")
            print(f"   📧 Email: {user_refreshed.email}")
            print(f"   🏢 Plan: {user_refreshed.subscription}")
            print(f"   🆔 ID: {user_refreshed.id}")
            print(f"   ✅ Activo: {user_refreshed.is_active}")

            return user_refreshed

        except Exception as e:
            print(f"❌ Error creando usuario: {e}")
            return None

    if __name__ == "__main__":
        user = create_production_user()
        if user:
            print(f"\n🎉 ¡USUARIO LISTO PARA PRODUCCIÓN!")
            print(f"   Puedes probar en: https://dimbox.onrender.com/api/")
        else:
            print(f"\n❌ No se pudo crear el usuario")

except Exception as e:
    print(f"❌ Error de conexión: {e}")
    print(f"💡 Verifica:")
    print(f"   1. Que la DATABASE_URL sea correcta")
    print(f"   2. Que Neon esté funcionando")
    print(f"   3. Que tengas conexión a internet")

import os
import django

os.environ['FIREBASE_CREDENTIALS_PATH'] = "/root/DIMBOX/backend/prueba-diovic-firebase-adminsdk-87skk-facd0a4699.json"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings

print("🔍 Verificando configuración Firebase en settings...")

# Verificar si está configurado en settings
print(f"📋 Configuración actual:")
print(f"   settings.FIREBASE_CREDENTIALS_PATH: {getattr(settings, 'FIREBASE_CREDENTIALS_PATH', 'NO CONFIGURADO')}")
print(f"   settings.FIREBASE_CREDENTIALS_JSON: {getattr(settings, 'FIREBASE_CREDENTIALS_JSON', 'NO CONFIGURADO')}")

# Verificar variable de entorno
print(f"   os.environ FIREBASE_CREDENTIALS_PATH: {os.environ.get('FIREBASE_CREDENTIALS_PATH')}")

# El problema: el servicio usa settings, no la variable de entorno directamente
print(f"\n💡 PROBLEMA IDENTIFICADO:")
print(f"   El servicio busca en settings.FIREBASE_CREDENTIALS_PATH")
print(f"   Pero estamos configurando la variable de entorno")

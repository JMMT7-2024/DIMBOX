import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings

print("🔍 Verificando configuración Firebase...")

# Verificar diferentes métodos de configuración
config_methods = [
    ("FIREBASE_CREDENTIALS_PATH", getattr(settings, 'FIREBASE_CREDENTIALS_PATH', None)),
    ("FIREBASE_CREDENTIALS_JSON", "✅ SET" if getattr(settings, 'FIREBASE_CREDENTIALS_JSON', '') else "❌ NOT SET"),
]

for name, value in config_methods:
    print(f"   {name}: {value}")

# Verificar si el archivo existe
if hasattr(settings, 'FIREBASE_CREDENTIALS_PATH'):
    import pathlib
    path = pathlib.Path(settings.FIREBASE_CREDENTIALS_PATH)
    if path.exists():
        print(f"   📁 Archivo credentials: ✅ EXISTE ({path})")
    else:
        print(f"   📁 Archivo credentials: ❌ NO EXISTE ({path})")

print("\n✅ Configuración verificada")

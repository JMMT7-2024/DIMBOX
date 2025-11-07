import os

# Ruta al settings.py
settings_path = 'backend/settings.py'

# Leer el contenido actual
with open(settings_path, 'r') as f:
    content = f.read()

# Verificar si ya existe la configuración
if 'FIREBASE_CREDENTIALS_PATH' in content:
    print("✅ FIREBASE_CREDENTIALS_PATH ya está en settings.py")
else:
    # Buscar donde agregar la configuración (después de los imports)
    lines = content.split('\\n')
    new_lines = []
    added = False
    
    for line in lines:
        new_lines.append(line)
        # Agregar después de BASE_DIR
        if 'BASE_DIR =' in line and not added:
            new_lines.append('')
            new_lines.append('# Firebase Configuration')
            new_lines.append('FIREBASE_CREDENTIALS_PATH = os.path.join(BASE_DIR, "prueba-diovic-firebase-adminsdk-87skk-facd0a4699.json")')
            new_lines.append('')
            added = True
    
    # Escribir el nuevo contenido
    with open(settings_path, 'w') as f:
        f.write('\\n'.join(new_lines))
    
    print("✅ FIREBASE_CREDENTIALS_PATH agregado a settings.py")

# Verificar la configuración
print(f"\\n🔍 Verificando configuración...")
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print(f"   FIREBASE_CREDENTIALS_PATH: {getattr(settings, 'FIREBASE_CREDENTIALS_PATH', 'NO CONFIGURADO')}")
print(f"   Archivo existe: {os.path.exists(getattr(settings, 'FIREBASE_CREDENTIALS_PATH', ''))}")

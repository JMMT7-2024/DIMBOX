import os
import django

os.environ['FIREBASE_CREDENTIALS_PATH'] = "/root/DIMBOX/backend/prueba-diovic-firebase-adminsdk-87skk-facd0a4699.json"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print("🔍 Inspeccionando método initialize_firebase...")

# Leer el código fuente del servicio
service_path = 'social_auth/firebase_service.py'

with open(service_path, 'r') as f:
    content = f.read()

# Encontrar y mostrar el método initialize_firebase
lines = content.split('\n')
in_initialize_method = False
indentation_level = 0

print("📄 Código de initialize_firebase:")
for i, line in enumerate(lines):
    if 'def initialize_firebase' in line:
        in_initialize_method = True
        print(f"{i+1:3}: {line}")
        continue
    
    if in_initialize_method:
        if line.strip() and not line.startswith(' ') and not line.startswith('\t'):
            # Fuera del método
            break
        print(f"{i+1:3}: {line}")

print(f"\n🧪 Probando inicialización paso a paso...")

# Importar después de ver el código
from social_auth.firebase_service import FirebaseAuthService

# Verificar la variable de entorno que el servicio está usando
print(f"🔍 Variable de entorno detectada: {os.environ.get('FIREBASE_CREDENTIALS_PATH')}")

# Verificar si el archivo existe desde la perspectiva del servicio
cred_path = os.environ.get('FIREBASE_CREDENTIALS_PATH')
print(f"📁 Archivo existe: {os.path.exists(cred_path) if cred_path else 'No path'}")

import os
import django

os.environ['FIREBASE_CREDENTIALS_PATH'] = "/root/DIMBOX/backend/prueba-diovic-firebase-adminsdk-87skk-facd0a4699.json"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print("🔍 Inspeccionando FirebaseAuthService...")

from social_auth.firebase_service import FirebaseAuthService

# Verificar todos los atributos de la clase
print("📋 Atributos de FirebaseAuthService:")
for attr in dir(FirebaseAuthService):
    if not attr.startswith('__'):
        print(f"   {attr}: {getattr(FirebaseAuthService, attr)}")

# Verificar si existe método de inicialización
print(f"\n🔧 Métodos disponibles:")
methods = [method for method in dir(FirebaseAuthService) if not method.startswith('__')]
for method in methods:
    print(f"   {method}")

# Probar llamar a verify_firebase_token directamente
print(f"\n🧪 Probando verify_firebase_token directamente...")
try:
    user_data, error = FirebaseAuthService.verify_firebase_token("token-invalido")
    print(f"   Resultado: user_data={user_data}, error={error}")
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()

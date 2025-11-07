import os
import django

# Configurar ANTES de importar Django
os.environ['FIREBASE_CREDENTIALS_PATH'] = "/root/DIMBOX/backend/prueba-diovic-firebase-adminsdk-87skk-facd0a4699.json"

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print("🔍 DEBUG: Firebase Service")

# Verificar variable de entorno
print(f"✅ FIREBASE_CREDENTIALS_PATH: {os.environ.get('FIREBASE_CREDENTIALS_PATH')}")

# Importar después de configurar
from social_auth.firebase_service import FirebaseAuthService

print(f"🔍 Estado de FirebaseAuthService:")
print(f"   _initialized: {FirebaseAuthService._initialized}")
print(f"   _instance: {FirebaseAuthService._instance}")

# Forzar reinicialización
print(f"\n🔄 Forzando reinicialización...")
FirebaseAuthService._instance = None
FirebaseAuthService._initialized = False

# Crear nueva instancia
try:
    service = FirebaseAuthService()
    print(f"✅ FirebaseAuthService reinicializado correctamente")
    print(f"   _initialized: {FirebaseAuthService._initialized}")
    print(f"   _instance: {FirebaseAuthService._instance is not None}")
    
    # Probar verificación de token
    print(f"\n🧪 Probando verificación de token...")
    user_data, error = FirebaseAuthService.verify_firebase_token("token-invalido")
    if error:
        print(f"✅ Comportamiento correcto: {error}")
    else:
        print(f"❌ Comportamiento inesperado")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

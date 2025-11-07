import os
import django

os.environ['FIREBASE_CREDENTIALS_PATH'] = "/root/DIMBOX/backend/prueba-diovic-firebase-adminsdk-87skk-facd0a4699.json"
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print("🔧 Inicializando Firebase manualmente...")

from social_auth.firebase_service import FirebaseAuthService

# Verificar estado antes
print(f"📊 Estado antes de inicializar:")
print(f"   _initialized: {FirebaseAuthService._initialized}")

# Llamar al método de inicialización directamente
print(f"\n🔄 Llamando a initialize_firebase()...")
try:
    FirebaseAuthService.initialize_firebase()
    print(f"✅ initialize_firebase() ejecutado")
except Exception as e:
    print(f"❌ Error en initialize_firebase(): {e}")

# Verificar estado después
print(f"\n📊 Estado después de inicializar:")
print(f"   _initialized: {FirebaseAuthService._initialized}")

# Probar verificación de token
print(f"\n🧪 Probando verify_firebase_token después de inicializar...")
user_data, error = FirebaseAuthService.verify_firebase_token("token-invalido")

if error:
    print(f"✅ Comportamiento correcto: {error}")
else:
    print(f"❌ Comportamiento inesperado: user_data={user_data}")

print(f"\n🎯 RESULTADO: {'✅ FIREBASE OPERATIVO' if FirebaseAuthService._initialized else '❌ FIREBASE NO INICIALIZADO'}")

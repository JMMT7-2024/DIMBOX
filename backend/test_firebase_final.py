import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

print("🔥 TEST FINAL: Firebase con configuración en settings.py")

from django.conf import settings
print(f"📋 Configuración Firebase:")
print(f"   FIREBASE_CREDENTIALS_PATH: {getattr(settings, 'FIREBASE_CREDENTIALS_PATH', 'NO CONFIGURADO')}")

try:
    from social_auth.firebase_service import FirebaseAuthService
    
    print(f"\\n🧪 Estado inicial de FirebaseAuthService:")
    print(f"   _initialized: {FirebaseAuthService._initialized}")
    
    # Probar verificación de token
    print(f"\\n🔒 Probando verificación de token...")
    user_data, error = FirebaseAuthService.verify_firebase_token("token-invalido")
    
    print(f"   Estado final: _initialized={FirebaseAuthService._initialized}")
    print(f"   Resultado: {error}")
    
    if FirebaseAuthService._initialized:
        print(f"\\n🎯 ✅ FIREBASE INICIALIZADO Y FUNCIONANDO")
        print(f"   El servicio está listo para recibir tokens reales del frontend")
    else:
        print(f"\\n❌ Firebase no se inicializó correctamente")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

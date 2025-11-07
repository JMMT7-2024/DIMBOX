import os
import json

def setup_firebase():
    credential_path = "/root/DIMBOX/backend/prueba-diovic-firebase-adminsdk-87skk-facd0a4699.json"
    
    print("�� Configurando Firebase...")
    print(f"📁 Ruta de credenciales: {credential_path}")
    
    # Verificar que el archivo existe
    if not os.path.exists(credential_path):
        print("❌ Archivo de credenciales no encontrado")
        return False
    
    print("✅ Archivo de credenciales encontrado")
    
    # Configurar variable de entorno
    os.environ['FIREBASE_CREDENTIALS_PATH'] = credential_path
    print("✅ Variable FIREBASE_CREDENTIALS_PATH configurada")
    
    # Verificar que el JSON es válido
    try:
        with open(credential_path, 'r') as f:
            cred_data = json.load(f)
        print("✅ Archivo JSON de credenciales válido")
        print(f"   Proyecto: {cred_data.get('project_id', 'No encontrado')}")
    except Exception as e:
        print(f"❌ Error en archivo JSON: {e}")
        return False
    
    # Probar configuración de Django y Firebase
    try:
        import django
        from django.conf import settings
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
        django.setup()
        
        print("✅ Django configurado correctamente")
        
        # Verificar configuración en settings
        print(f"📋 Configuración Django:")
        print(f"   DEBUG: {settings.DEBUG}")
        print(f"   ALLOWED_HOSTS: {settings.ALLOWED_HOSTS[:3]}...")
        
        # Probar Firebase
        from social_auth.firebase_service import FirebaseAuthService
        print("✅ Módulo Firebase importado correctamente")
        
        # Probar inicialización
        service = FirebaseAuthService()
        print("✅ FirebaseAuthService inicializado correctamente")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en configuración: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = setup_firebase()
    print(f"\n🎯 RESULTADO: {'✅ CONFIGURACIÓN EXITOSA' if success else '❌ CONFIGURACIÓN FALLIDA'}")

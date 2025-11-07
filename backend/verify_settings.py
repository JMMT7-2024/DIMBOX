import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    django.setup()
    print("✅ Django se inicializó correctamente")
    
    from django.conf import settings
    
    print("\\n📋 Configuración Firebase:")
    print(f"   FIREBASE_CREDENTIALS_PATH: {getattr(settings, 'FIREBASE_CREDENTIALS_PATH', 'NO CONFIGURADO')}")
    
    if hasattr(settings, 'FIREBASE_CREDENTIALS_PATH'):
        path = settings.FIREBASE_CREDENTIALS_PATH
        print(f"   Archivo existe: {os.path.exists(path)}")
        if os.path.exists(path):
            print(f"   Ruta absoluta: {os.path.abspath(path)}")
    
except Exception as e:
    print(f"❌ Error al inicializar Django: {e}")
    import traceback
    traceback.print_exc()

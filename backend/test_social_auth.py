import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Test 1: Verificar que el módulo carga
try:
    from social_auth.views import SocialAuthHealthView
    print("✅ Módulo social_auth importado CORRECTAMENTE")
    
    # Test 2: Verificar Firebase
    from social_auth.firebase_service import FirebaseAuthService
    print("✅ Firebase service importado CORRECTAMENTE")
    
    # Test 3: Health check simulado
    view = SocialAuthHealthView()
    from rest_framework.test import APIRequestFactory
    factory = APIRequestFactory()
    request = factory.get('/health/')
    response = view.get(request)
    
    print("✅ Health Check Response:")
    print(f"Status: {response.status_code}")
    print(f"Data: {response.data}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

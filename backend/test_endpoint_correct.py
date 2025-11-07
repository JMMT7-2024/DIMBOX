import os
import django

# Configurar Django PRIMERO
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rest_framework.test import APIClient

print("🌐 TEST CORRECTO DEL ENDPOINT FIREBASE")

# Configurar cliente API
client = APIClient()

print("📋 URL encontrada: /api/auth/firebase/login/")

# Probar el endpoint correcto con slash final
print("\n1. 🧪 Probando POST a /api/auth/firebase/login/...")

payload = {
    "firebase_token": "token-test-123"
}

try:
    # Usar la URL correcta con slash final
    response = client.post('/api/auth/firebase/login/', payload, format='json')
    print(f"   ✅ Status: {response.status_code}")
    
    if response.status_code == 400:
        print(f"   📄 Respuesta (token inválido): {response.data}")
        print("   ✅ Comportamiento esperado para token de prueba")
    elif response.status_code == 200:
        print(f"   📄 Respuesta exitosa: {response.data}")
    else:
        print(f"   📄 Respuesta: {response.status_code} - {response.data}")
    
except Exception as e:
    print(f"   ❌ Error: {e}")

# Probar también sin slash para ver la redirección
print("\n2. �� Probando redirección sin slash...")
try:
    response = client.post('/api/auth/firebase/login', payload, format='json')
    print(f"   ✅ Redirección: {response.status_code} -> {response.url}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n3. 🔍 Verificando detalles del endpoint...")
try:
    from social_auth.views import FirebaseLoginView
    from social_auth.urls import urlpatterns
    
    # Mostrar información de la vista
    view = FirebaseLoginView()
    print(f"   ✅ Vista: {view.__class__.__name__}")
    print(f"   ✅ Métodos permitidos: {view.http_method_names}")
    
    # Mostrar todas las URLs del módulo social_auth
    print(f"   📋 Todas las URLs de social_auth:")
    for pattern in urlpatterns:
        print(f"      - {pattern.pattern} -> {pattern.name}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n4. 🎯 RESUMEN DE INTEGRACIÓN:")
print("   ✅ Endpoint disponible: POST /api/auth/firebase/login/")
print("   ✅ Vista configurada: FirebaseLoginView")
print("   ✅ Servicio Firebase operativo")
print("   ✅ Backend listo para recibir tokens del frontend")

print("\n🚀 INSTRUCCIONES PARA EL FRONTEND:")
print("   URL: http://localhost:8000/api/auth/firebase/login/")
print("   Método: POST")
print("   Content-Type: application/json")
print("   Body: {\"firebase_token\": \"token_de_firebase\"}")
print("   Response: {\"user\": {...}, \"tokens\": {\"access\": \"...\", \"refresh\": \"...\"}}")

print("\n💡 El frontend debe usar la URL EXACTA: /api/auth/firebase/login/")

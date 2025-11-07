# backend/backend/urls.py - ARCHIVO PRINCIPAL ACTUALIZADO CON SOCIAL AUTH
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.views.generic import RedirectView


def home(request):
    return HttpResponse("""
    <html>
        <head>
            <title>DIMBOX API</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .container { max-width: 800px; margin: 0 auto; }
                .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
                code { background: #eee; padding: 2px 5px; border-radius: 3px; }
                .new { background: #e8f5e8; border-left: 4px solid #4CAF50; }
                .social { background: #e3f2fd; border-left: 4px solid #2196F3; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 DIMBOX API - Funcionando Correctamente</h1>
                <p>El servidor backend está operativo. Todos los sistemas funcionan correctamente.</p>
                
                <div class="endpoint">
                    <strong>📊 API Principal:</strong> <a href="/api/">/api/</a>
                    <br><small>Incluye autenticación, transacciones, límites y administración</small>
                </div>
                
                <div class="endpoint new">
                    <strong>🏢 Módulo Empresarial:</strong> <a href="/api/enterprise/">/api/enterprise/</a>
                    <br><small>✅ NUEVO: Gestión de clientes, productos y facturación</small>
                </div>
                
                <div class="endpoint social">
                    <strong>🔐 Autenticación Social:</strong> <a href="/api/auth/social/health/">/api/auth/social/</a>
                    <br><small>✅ NUEVO: Login con Google y otros proveedores</small>
                </div>
                
                <div class="endpoint">
                    <strong>🔐 Admin Django:</strong> <a href="/admin/">/admin/</a>
                    <br><small>Panel de administración del sistema</small>
                </div>
                
                <div class="endpoint">
                    <strong>❤️ Health Check:</strong> <a href="/api/health/">/api/health/</a>
                    <br><small>Verifica el estado del servicio</small>
                </div>
                
                <h3>Endpoints principales disponibles:</h3>
                <ul>
                    <li><code>POST /api/token/</code> - Autenticación JWT</li>
                    <li><code>POST /api/register/</code> - Registro de usuarios</li>
                    <li><code>GET /api/transactions/</code> - Gestión de transacciones</li>
                    <li><code>GET /api/user/usage/</code> - Sistema de límites</li>
                    <li><code>GET /api/admin/stats/</code> - Panel de administración</li>
                </ul>

                <h3>📦 Endpoints Empresariales (NUEVOS):</h3>
                <ul>
                    <li><code>GET /api/enterprise/clients/</code> - Gestión de clientes</li>
                    <li><code>POST /api/enterprise/clients/</code> - Crear cliente</li>
                    <li><code>GET /api/enterprise/clients/search/?q=term</code> - Búsqueda de clientes</li>
                    <li><code>GET /api/enterprise/clients/stats/</code> - Estadísticas</li>
                    <li><em>Más endpoints en desarrollo...</em></li>
                </ul>
                
                <h3>🔐 Endpoints Social Auth (NUEVOS):</h3>
                <ul>
                    <li><code>POST /api/auth/social/google/login/</code> - Login con Google</li>
                    <li><code>GET /api/auth/social/health/</code> - Estado del servicio</li>
                    <li><em>Próximamente: Facebook, GitHub, etc.</em></li>
                </ul>
                
                <p><em>✅ El despliegue se ha completado exitosamente</em></p>
                <p><em>🚀 Módulo empresarial activo y funcionando</em></p>
                <p><em>🔐 Autenticación social lista para usar</em></p>
            </div>
        </body>
    </html>
    """)


urlpatterns = [
    # Admin Django
    path("admin/", admin.site.urls),
    # API principal - INCLUYE todas las URLs de la app core
    path("api/", include("core.urls")),
    # ✅ NUEVO: Módulo empresarial
    path("api/enterprise/", include("enterprise.urls")),
    # ✅ NUEVO: Autenticación Social
    path("api/auth/social/", include("social_auth.urls")),
    # Página de inicio
    path("", home, name="home"),
    # Redirección para favicon.ico u otros archivos comunes
    path(
        "favicon.ico", RedirectView.as_view(url="/static/favicon.ico", permanent=True)
    ),
]

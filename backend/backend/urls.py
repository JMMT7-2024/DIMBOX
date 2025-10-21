# backend/backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # API normal de tu app (perfil, transacciones, auth, etc.)
    path("api/", include("core.urls")),
    # API de administración (endpoints del panel admin)
    path("api/admin/", include("core.urls_admin")),
]

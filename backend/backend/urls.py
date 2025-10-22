# backend/backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),  # auth/perfil/transacciones
    path("api/admin/", include("core.urls_admin")),  # SOLO admin panel
]

# backend/backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # API normal de la app (auth, perfil, transacciones, etc.)
    path("api/", include("core.urls")),
    # API del panel admin (solo ADMIN)
    path("api/admin/", include("core.urls_admin")),
]

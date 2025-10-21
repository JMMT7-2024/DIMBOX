# backend/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # API normal de tu app
    path("api/", include("core.urls")),
    # API de administración
    path("api/admin/", include("core.admin_urls")),
]

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),  # tus endpoints normales
    path("api/admin/", include("core.urls_admin")),  # ✅ ENDPOINTS DE ADMIN
]

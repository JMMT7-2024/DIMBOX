# enterprise/urls.py - REEMPLAZAR CON ESTE CONTENIDO
from django.urls import path, include

urlpatterns = [
    path("products/", include("enterprise.products.urls")),
    path("clients/", include("enterprise.clients.urls")),
    path("invoices/", include("enterprise.invoices.urls")),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, EnterpriseViewSet

router = DefaultRouter()
router.register(r"clients", ClientViewSet, basename="client")
router.register(r"my-enterprise", EnterpriseViewSet, basename="enterprise")

urlpatterns = [
    path("", include(router.urls)),
]

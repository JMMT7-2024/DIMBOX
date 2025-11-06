from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"", views.ProductViewSet, basename="product")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "stats/", views.ProductViewSet.as_view({"get": "stats"}), name="products-stats"
    ),
]

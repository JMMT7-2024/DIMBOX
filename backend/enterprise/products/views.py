from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from .models import Product
from .serializers import (
    ProductSerializer,
    ProductCreateSerializer,
    ProductListSerializer,
)


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return ProductCreateSerializer
        elif self.action == "list":
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Product.objects.filter(user=user)

        # Filtros
        search = self.request.GET.get("search", "")
        category = self.request.GET.get("category", "")
        low_stock = self.request.GET.get("low_stock", "")

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(sku__icontains=search)
                | Q(description__icontains=search)
            )
        if category:
            queryset = queryset.filter(category=category)
        if low_stock == "true":
            queryset = queryset.filter(stock__lte=5, stock__gt=0)

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Estadísticas de productos"""
        user = request.user
        stats = Product.objects.filter(user=user).aggregate(
            total_products=Count("id"),
            active_products=Count("id", filter=Q(is_active=True)),
            low_stock_products=Count("id", filter=Q(stock__lte=5, stock__gt=0)),
            out_of_stock_products=Count("id", filter=Q(stock=0)),
            inventory_value=Sum("price") * Sum("stock"),
        )
        return Response(stats)

    @action(detail=True, methods=["post"])
    def update_stock(self, request, pk=None):
        """Actualizar stock de producto"""
        product = self.get_object()
        new_stock = request.data.get("stock")

        if new_stock is None or int(new_stock) < 0:
            return Response(
                {"error": "Stock válido requerido"}, status=status.HTTP_400_BAD_REQUEST
            )

        product.stock = int(new_stock)
        product.save()

        serializer = self.get_serializer(product)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def categories(self, request):
        """Obtener categorías disponibles"""
        categories = [
            {"value": value, "label": label}
            for value, label in Product.CATEGORY_CHOICES
        ]
        return Response(categories)

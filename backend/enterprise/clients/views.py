from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from .models import Client
from .serializers import ClientSerializer, ClientCreateSerializer, ClientListSerializer


class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return ClientCreateSerializer
        elif self.action == "list":
            return ClientListSerializer
        return ClientSerializer

    def get_queryset(self):
        user = self.request.user
        # ✅ CORREGIDO: Ahora is_active existe en el modelo
        queryset = Client.objects.filter(created_by=user, is_active=True)

        search = self.request.GET.get("search", "")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(document_number__icontains=search)
                | Q(email__icontains=search)
            )

        return queryset.order_by("name")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Búsqueda rápida de clientes"""
        query = request.GET.get("q", "")
        if not query:
            return Response([])

        clients = self.get_queryset().filter(
            Q(name__icontains=query) | Q(document_number__icontains=query)
        )[:10]

        serializer = self.get_serializer(clients, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Estadísticas de clientes"""
        user = request.user
        stats = Client.objects.filter(created_by=user).aggregate(
            total_clients=Count("id"),
            active_clients=Count("id", filter=Q(is_active=True)),
        )

        by_document_type = (
            Client.objects.filter(created_by=user)
            .values("document_type")
            .annotate(count=Count("id"))
        )

        return Response({**stats, "by_document_type": list(by_document_type)})

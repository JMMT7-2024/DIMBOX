# /root/DIMBOX/backend/enterprise/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet SIMPLIFICADO para clientes
    Solo CRUD básico - nada de empresas complejas
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ClientSerializer

    def get_queryset(self):
        """✅ Solo los clientes del usuario actual"""
        return Client.objects.filter(created_by=self.request.user).order_by("name")

    def create(self, request, *args, **kwargs):
        """✅ Crear cliente simplificado"""
        try:
            # Validar datos mínimos
            if not request.data.get("name") or not request.data.get("document_number"):
                return Response(
                    {"error": "Nombre y número de documento son obligatorios"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return super().create(request, *args, **kwargs)

        except Exception as e:
            return Response(
                {"error": f"Error al crear cliente: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["get"])
    def search(self, request):
        """✅ Búsqueda simple por nombre o documento"""
        query = request.GET.get("q", "").strip()

        if not query:
            return Response([])

        clients = self.get_queryset().filter(
            Q(name__icontains=query) | Q(document_number__icontains=query)
        )[:10]  # Límite de 10 resultados

        serializer = self.get_serializer(clients, many=True)
        return Response(serializer.data)

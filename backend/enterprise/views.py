import logging
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from .models import Client
from .serializers import ClientSerializer, ClientListSerializer, ClientCreateSerializer

logger = logging.getLogger(__name__)


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de clientes empresariales
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = ["client_type", "document_type", "is_active", "is_taxpayer"]
    search_fields = ["name", "document_number", "email"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        """Solo clientes de la empresa del usuario"""
        user = self.request.user
        if hasattr(user, "enterprise") and user.enterprise:
            return Client.objects.filter(
                enterprise=user.enterprise, is_active=True
            ).select_related("created_by")
        return Client.objects.none()

    def get_serializer_class(self):
        """Serializer específico por acción"""
        if self.action == "list":
            return ClientListSerializer
        elif self.action == "create":
            return ClientCreateSerializer
        return ClientSerializer

    def create(self, request, *args, **kwargs):
        """Sobrescribir create para agregar logging"""
        logger.info(f"📥 CREATE CLIENT - Datos recibidos: {request.data}")
        logger.info(f"📥 CREATE CLIENT - Usuario: {request.user}")
        logger.info(
            f"📥 CREATE CLIENT - Empresa del usuario: {getattr(request.user, 'enterprise', 'No tiene empresa')}"
        )

        try:
            response = super().create(request, *args, **kwargs)
            logger.info(f"✅ CREATE CLIENT - Éxito: {response.data}")
            return response
        except Exception as e:
            logger.error(f"❌ CREATE CLIENT - Error: {str(e)}", exc_info=True)
            # También log el traceback completo
            import traceback

            logger.error(f"❌ CREATE CLIENT - Traceback: {traceback.format_exc()}")
            raise

    def perform_destroy(self, instance):
        """Soft delete"""
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Búsqueda rápida para autocompletado"""
        query = request.query_params.get("q", "").strip()
        limit = int(request.query_params.get("limit", 10))

        if not query:
            return Response(
                {"error": _('Parámetro de búsqueda "q" requerido')},
                status=status.HTTP_400_BAD_REQUEST,
            )

        clients = self.get_queryset().filter(
            Q(name__icontains=query)
            | Q(document_number__icontains=query)
            | Q(email__icontains=query)
        )[:limit]

        serializer = ClientListSerializer(clients, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Estadísticas básicas de clientes"""
        queryset = self.get_queryset()

        stats = {
            "total_clients": queryset.count(),
            "by_type": {
                "individual": queryset.filter(
                    client_type=Client.ClientType.INDIVIDUAL
                ).count(),
                "company": queryset.filter(
                    client_type=Client.ClientType.COMPANY
                ).count(),
            },
            "taxpayers": queryset.filter(is_taxpayer=True).count(),
        }

        return Response(stats)

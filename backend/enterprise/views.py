import logging
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from .models import Client, Enterprise
from .serializers import (
    ClientSerializer,
    ClientListSerializer,
    ClientCreateSerializer,
    EnterpriseSerializer,
)

logger = logging.getLogger(__name__)


class EnterpriseViewSet(viewsets.ModelViewSet):
    """ViewSet para que usuarios ENTERPRISE gestionen su empresa"""

    permission_classes = [IsAuthenticated]
    serializer_class = EnterpriseSerializer
    http_method_names = ["get", "put", "patch"]  # Solo permitir edición, no creación

    def get_queryset(self):
        """Un usuario ENTERPRISE solo puede ver/editar su propia empresa"""
        user = self.request.user
        if user.plan_type == "ENTERPRISE" and hasattr(user, "enterprise"):
            return Enterprise.objects.filter(id=user.enterprise.id)
        return Enterprise.objects.none()

    def get_object(self):
        """Siempre retorna la empresa del usuario"""
        return self.request.user.enterprise


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
        """Solo clientes de la empresa del usuario ENTERPRISE"""
        user = self.request.user
        if (
            user.plan_type == "ENTERPRISE"
            and hasattr(user, "enterprise")
            and user.enterprise
        ):
            return Client.objects.filter(
                enterprise=user.enterprise, is_active=True
            ).select_related("created_by", "enterprise")
        return Client.objects.none()

    def get_serializer_class(self):
        """Serializer específico por acción"""
        if self.action == "list":
            return ClientListSerializer
        elif self.action == "create":
            return ClientCreateSerializer
        return ClientSerializer

    def create(self, request, *args, **kwargs):
        """Sobrescribir create para agregar logging y validaciones"""
        logger.info(f"📥 CREATE CLIENT - Usuario: {request.user.email}")
        logger.info(f"📥 CREATE CLIENT - Plan: {request.user.plan_type}")
        logger.info(
            f"📥 CREATE CLIENT - Tiene empresa: {hasattr(request.user, 'enterprise')}"
        )

        if hasattr(request.user, "enterprise"):
            logger.info(f"📥 CREATE CLIENT - Empresa: {request.user.enterprise.name}")

        logger.info(f"📥 CREATE CLIENT - Datos: {request.data}")

        # Validar que el usuario es ENTERPRISE
        if request.user.plan_type != "ENTERPRISE":
            return Response(
                {"error": _("Tu plan no incluye la gestión de clientes empresariales")},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            response = super().create(request, *args, **kwargs)
            logger.info(f"✅ CREATE CLIENT - Éxito: {response.data}")
            return response
        except Exception as e:
            logger.error(f"❌ CREATE CLIENT - Error: {str(e)}", exc_info=True)
            raise

    def perform_destroy(self, instance):
        """Soft delete"""
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Búsqueda rápida para autocompletado"""
        # Validar plan
        if request.user.plan_type != "ENTERPRISE":
            return Response(
                {"error": _("Acceso no autorizado")}, status=status.HTTP_403_FORBIDDEN
            )

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
        # Validar plan
        if request.user.plan_type != "ENTERPRISE":
            return Response(
                {"error": _("Acceso no autorizado")}, status=status.HTTP_403_FORBIDDEN
            )

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

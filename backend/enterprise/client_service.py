# /root/DIMBOX/backend/enterprise/services/client_service.py
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from ..models import Client


class ClientService:
    """Servicio para lógica de negocio de clientes"""

    @staticmethod
    @transaction.atomic
    def create_client(enterprise, user, client_data):
        """
        Crear cliente con validaciones
        """
        # Verificar duplicados
        existing_client = Client.objects.filter(
            enterprise=enterprise,
            document_number=client_data["document_number"].strip(),
            is_active=True,
        ).first()

        if existing_client:
            raise ValidationError(
                {"document_number": _("Ya existe un cliente con este documento")}
            )

        # Crear cliente
        client = Client(enterprise=enterprise, created_by=user, **client_data)

        client.full_clean()
        client.save()

        return client

    @staticmethod
    def search_clients(enterprise, search_term, limit=10):
        """
        Búsqueda avanzada
        """
        from django.db.models import Q

        return Client.objects.filter(enterprise=enterprise, is_active=True).filter(
            Q(name__icontains=search_term)
            | Q(document_number__icontains=search_term)
            | Q(email__icontains=search_term)
        )[:limit]

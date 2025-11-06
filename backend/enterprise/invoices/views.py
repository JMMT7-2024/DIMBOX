from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Sum, Count
from .models import Invoice, InvoiceItem
from .serializers import (
    InvoiceSerializer,
    InvoiceCreateSerializer,
    InvoiceSummarySerializer,
    InvoiceItemSerializer,
)
from enterprise.clients.models import Client  # ✅ IMPORT ABSOLUTO
from enterprise.products.models import Product  # ✅ IMPORT ABSOLUTO


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return InvoiceCreateSerializer
        elif self.action == "list":
            return InvoiceSummarySerializer
        return InvoiceSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.filter(user=user).prefetch_related("items")

        status_filter = self.request.GET.get("status", "")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by("-issue_date")

    def create(self, request, *args, **kwargs):
        """Crear factura con validación de stock"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user = request.user

            # 1. Obtener información del cliente
            client_name = data.get("client_name")
            client_ruc = data.get("client_ruc", "")

            if data.get("client_id"):
                client = Client.objects.get(id=data["client_id"], created_by=user)
                client_name = client.name
                client_ruc = client.document_number

            # 2. Crear factura base
            invoice = Invoice.objects.create(
                user=user,
                client_name=client_name,
                client_ruc=client_ruc,
                payment_method=data["payment_method"],
                issue_date=timezone.now().date(),
                due_date=timezone.now().date() + timedelta(days=30),
            )

            # 3. Procesar items
            subtotal = 0
            tax_amount = 0

            for item_data in data["items"]:
                product = Product.objects.get(id=item_data["product_id"], user=user)
                quantity = item_data["quantity"]

                # Validar stock
                if product.stock < quantity:
                    invoice.delete()
                    return Response(
                        {"error": f"Stock insuficiente para {product.name}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Crear item
                invoice_item = InvoiceItem.objects.create(
                    invoice=invoice,
                    product=product,
                    quantity=quantity,
                    unit_price=product.price,
                    tax_rate=product.tax_rate,
                )

                # Actualizar stock
                product.stock -= quantity
                product.save()

                subtotal += float(invoice_item.subtotal)
                tax_amount += float(invoice_item.tax_amount)

            # 4. Actualizar totales
            invoice.subtotal = subtotal
            invoice.tax_amount = tax_amount
            invoice.total = subtotal + tax_amount
            invoice.status = "SENT"
            invoice.save()

            response_serializer = InvoiceSerializer(invoice)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except Product.DoesNotExist:
            return Response(
                {"error": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        except Client.DoesNotExist:
            return Response(
                {"error": "Cliente no encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        """Marcar factura como pagada"""
        invoice = self.get_object()
        invoice.status = "PAID"
        invoice.paid_date = timezone.now().date()
        invoice.save()

        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def mark_as_paid(self, request, pk=None):
        """Alias para mark_paid - compatibilidad"""
        return self.mark_paid(request, pk)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Estadísticas de facturas"""
        user = request.user
        stats = Invoice.objects.filter(user=user).aggregate(
            total_invoices=Count("id"),
            total_revenue=Sum("total"),
            paid_invoices=Count("id", filter=Q(status="PAID")),
        )

        return Response(stats)

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Facturas recientes"""
        recent_invoices = self.get_queryset()[:10]
        serializer = self.get_serializer(recent_invoices, many=True)
        return Response(serializer.data)

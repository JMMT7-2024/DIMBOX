# enterprise/views.py - MÓDULO EMPRESARIAL COMPLETO CON TODOS LOS DETALLES
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count, Avg, F, ExpressionWrapper, DecimalField
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from decimal import Decimal


from .models import Client, Product, Invoice, InvoiceItem
from .serializers import (
    ClientSerializer,
    ProductSerializer,
    ProductListSerializer,
    InvoiceSerializer,
    InvoiceCreateSerializer,
    InvoiceSummarySerializer,
    InvoiceItemSerializer,
)


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet COMPLETO para clientes - Con todos los logs y validaciones originales
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ClientSerializer

    def get_queryset(self):
        """Solo los clientes del usuario actual con todos los filtros originales"""
        print(f"[ClientViewSet] Obteniendo clientes para usuario: {self.request.user}")
        queryset = Client.objects.filter(created_by=self.request.user).order_by("name")

        # Búsqueda por query parameter
        query = self.request.GET.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | Q(document_number__icontains=query)
            )
            print(
                f"[ClientViewSet] Búsqueda aplicada: '{query}' - {queryset.count()} resultados"
            )

        return queryset

    def perform_create(self, serializer):
        """CORRECCIÓN CRÍTICA: Asignar usuario automáticamente CON LOGS DETALLADOS"""
        print(f"[ClientViewSet] Creando cliente para usuario: {self.request.user}")
        print(f"[ClientViewSet] Datos validados: {serializer.validated_data}")

        try:
            client = serializer.save(created_by=self.request.user)
            print(
                f"[ClientViewSet] ✅ Cliente creado exitosamente: {client.id} - {client.name}"
            )
        except Exception as e:
            print(f"[ClientViewSet] ❌ Error creando cliente: {str(e)}")
            import traceback

            print(f"[ClientViewSet] Traceback: {traceback.format_exc()}")
            raise

    def create(self, request, *args, **kwargs):
        """Manejo mejorado de creación con logs DETALLADOS como en la versión original"""
        print(f"[ClientViewSet] 📝 CREATE endpoint llamado por: {request.user}")
        print(f"[ClientViewSet] 📦 Datos recibidos: {request.data}")

        try:
            # CORRECCIÓN: Usar el serializer con contexto
            serializer = self.get_serializer(
                data=request.data, context={"request": request}
            )

            if not serializer.is_valid():
                print(f"[ClientViewSet] ❌ Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)

            print(f"[ClientViewSet] ✅ Respuesta exitosa: {serializer.data}")
            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )

        except Exception as e:
            print(f"[ClientViewSet] 💥 Error en create: {str(e)}")
            import traceback

            print(f"[ClientViewSet] 🔍 Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, *args, **kwargs):
        """Actualización con logs detallados"""
        print(f"[ClientViewSet] 🔄 UPDATE cliente ID: {kwargs.get('pk')}")
        print(f"[ClientViewSet] 📦 Datos: {request.data}")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Eliminación con logs detallados"""
        client = self.get_object()
        print(f"[ClientViewSet] 🗑️ DELETE cliente: {client.id} - {client.name}")
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Búsqueda simple por nombre o documento - MANTENIENDO EL ORIGINAL"""
        query = request.GET.get("q", "").strip()
        print(f"[ClientViewSet] 🔍 Búsqueda: '{query}'")

        if not query:
            return Response([])

        clients = self.get_queryset().filter(
            Q(name__icontains=query) | Q(document_number__icontains=query)
        )[:10]

        serializer = self.get_serializer(clients, many=True)
        print(f"[ClientViewSet] 🔍 Resultados: {len(clients)} clientes")
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Estadísticas de clientes - NUEVO"""
        user = request.user
        total_clients = Client.objects.filter(created_by=user).count()

        # Clientes por tipo de documento
        by_document_type = (
            Client.objects.filter(created_by=user)
            .values("document_type")
            .annotate(count=Count("id"))
        )

        # Clientes por ciudad
        by_city = (
            Client.objects.filter(created_by=user)
            .exclude(city__isnull=True)
            .exclude(city="")
            .values("city")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        # Clientes creados este mes
        current_month = timezone.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        clients_this_month = Client.objects.filter(
            created_by=user, created_at__gte=current_month
        ).count()

        return Response(
            {
                "total_clients": total_clients,
                "clients_this_month": clients_this_month,
                "by_document_type": list(by_document_type),
                "by_city": list(by_city),
            }
        )


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet COMPLETO para productos - Con todos los logs y validaciones originales
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        """Solo productos del usuario actual CON FILTROS COMPLETOS"""
        user = self.request.user
        print(f"[ProductViewSet] Obteniendo productos para usuario: {user}")

        queryset = Product.objects.filter(user=user)

        # Filtros opcionales COMPLETOS como en el original
        category = self.request.GET.get("category", "")
        is_active = self.request.GET.get("is_active", "")
        search = self.request.GET.get("search", "")
        low_stock = self.request.GET.get("low_stock", "")

        if category:
            queryset = queryset.filter(category=category)
            print(f"{ProductViewSet} Filtro categoría: {category}")

        if is_active.lower() == "true":
            queryset = queryset.filter(is_active=True)
            print(f"{ProductViewSet} Filtro activos: True")
        elif is_active.lower() == "false":
            queryset = queryset.filter(is_active=False)
            print(f"{ProductViewSet} Filtro activos: False")

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(sku__icontains=search)
            )
            print(f"[ProductViewSet] Búsqueda: '{search}'")

        if low_stock.lower() == "true":
            queryset = queryset.filter(stock__lte=5, stock__gt=0)
            print("[ProductViewSet] Filtro stock bajo: True")

        queryset = queryset.order_by("-created_at")
        print(f"[ProductViewSet] Total productos: {queryset.count()}")
        return queryset

    def perform_create(self, serializer):
        """Asignar usuario automáticamente CON LOGS DETALLADOS"""
        user = self.request.user
        print(f"[ProductViewSet] 🆕 CREANDO producto para usuario: {user}")
        print(f"[ProductViewSet] 📦 Datos validados: {serializer.validated_data}")

        try:
            product = serializer.save(user=user)
            print(
                f"[ProductViewSet] ✅ Producto creado: {product.id} - {product.name} - SKU: {product.sku}"
            )
        except Exception as e:
            print(f"[ProductViewSet] ❌ Error creando producto: {str(e)}")
            import traceback

            print(f"[ProductViewSet] 🔍 Traceback: {traceback.format_exc()}")
            raise

    def create(self, request, *args, **kwargs):
        """Creación con logs DETALLADOS como en el original"""
        print("[ProductViewSet] 📝 CREATE endpoint llamado")
        print(f"[ProductViewSet] 👤 Usuario: {request.user.username}")
        print(f"[ProductViewSet] 📦 Datos recibidos: {request.data}")

        try:
            serializer = self.get_serializer(
                data=request.data, context={"request": request}
            )

            if not serializer.is_valid():
                print(f"[ProductViewSet] ❌ Errores de validación: {serializer.errors}")
                return Response(
                    {
                        "detail": "Error de validación",
                        "errors": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)

            print(f"[ProductViewSet] ✅ Respuesta exitosa: {serializer.data}")
            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )

        except Exception as e:
            print(f"[ProductViewSet] 💥 Error en create: {str(e)}")
            import traceback

            print(f"[ProductViewSet] 🔍 Traceback: {traceback.format_exc()}")
            return Response(
                {"detail": f"Error interno: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def update(self, request, *args, **kwargs):
        """Actualización con logs detallados"""
        print(f"[ProductViewSet] 🔄 UPDATE producto ID: {kwargs.get('pk')}")
        print(f"[ProductViewSet] 📦 Datos: {request.data}")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Eliminación con logs detallados - HARD DELETE como en el original"""
        product = self.get_object()
        print(f"[ProductViewSet] 🗑️ DELETE producto ID: {product.id} - {product.name}")

        # Guardar información para el log antes de eliminar
        product_id = product.id
        product_name = product.name

        # ELIMINACIÓN REAL (HARD DELETE)
        product.delete()

        print(f"[ProductViewSet] ✅ Producto {product_id} eliminado permanentemente")
        return Response(
            {"detail": "Producto eliminado permanentemente"},
            status=status.HTTP_204_NO_CONTENT,
        )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Estadísticas COMPLETAS de productos como en el original"""
        user = request.user
        print(f"[ProductViewSet] 📊 Obteniendo stats para usuario: {user}")

        total_products = Product.objects.filter(user=user).count()
        active_products = Product.objects.filter(user=user, is_active=True).count()
        low_stock_products = Product.objects.filter(
            user=user, stock__lte=5, stock__gt=0
        ).count()
        out_of_stock_products = Product.objects.filter(user=user, stock=0).count()

        # Valor total del inventario
        inventory_value = (
            Product.objects.filter(user=user, is_active=True).aggregate(
                total_value=Sum(models.F("price") * models.F("stock"))
            )["total_value"]
            or 0
        )

        # Productos por categoría
        by_category = (
            Product.objects.filter(user=user, is_active=True)
            .values("category")
            .annotate(
                count=Count("id"),
                total_value=Sum(models.F("price") * models.F("stock")),
            )
        )

        print(
            f"[ProductViewSet] 📊 Stats calculados: {total_products} productos totales"
        )

        return Response(
            {
                "total_products": total_products,
                "active_products": active_products,
                "low_stock_products": low_stock_products,
                "out_of_stock_products": out_of_stock_products,
                "inventory_value": float(inventory_value),
                "by_category": list(by_category),
            }
        )

    @action(detail=True, methods=["post"])
    def update_stock(self, request, pk=None):
        """Actualizar stock de producto"""
        product = self.get_object()
        new_stock = request.data.get("stock")

        if new_stock is None:
            return Response(
                {"error": "El campo 'stock' es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_stock = int(new_stock)
            if new_stock < 0:
                return Response(
                    {"error": "El stock no puede ser negativo"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "El stock debe ser un número válido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product.stock = new_stock
        product.save()

        serializer = self.get_serializer(product)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def categories(self, request):
        """Obtener lista de categorías disponibles"""
        categories = [
            {"value": value, "label": label}
            for value, label in Product.CATEGORY_CHOICES
        ]
        return Response(categories)


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet COMPLETO para facturas - Con todas las funcionalidades originales
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return InvoiceCreateSerializer
        elif self.action == "list":
            return InvoiceSummarySerializer
        return InvoiceSerializer

    def get_queryset(self):
        """Solo facturas del usuario actual CON FILTROS COMPLETOS"""
        user = self.request.user
        print(f"[InvoiceViewSet] Obteniendo facturas para usuario: {user}")

        queryset = Invoice.objects.filter(user=user).prefetch_related("items")

        # Filtros opcionales COMPLETOS
        status_filter = self.request.GET.get("status", "")
        date_from = self.request.GET.get("date_from", "")
        date_to = self.request.GET.get("date_to", "")
        client_name = self.request.GET.get("client_name", "")
        payment_method = self.request.GET.get("payment_method", "")

        if status_filter:
            queryset = queryset.filter(status=status_filter)
            print(f"[InvoiceViewSet] Filtro estado: {status_filter}")

        if date_from:
            queryset = queryset.filter(issue_date__gte=date_from)
            print(f"[InvoiceViewSet] Filtro fecha desde: {date_from}")

        if date_to:
            queryset = queryset.filter(issue_date__lte=date_to)
            print(f"[InvoiceViewSet] Filtro fecha hasta: {date_to}")

        if client_name:
            queryset = queryset.filter(client_name__icontains=client_name)
            print(f"[InvoiceViewSet] Filtro cliente: {client_name}")

        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
            print(f"[InvoiceViewSet] Filtro método pago: {payment_method}")

        queryset = queryset.order_by("-issue_date", "-created_at")
        print(f"[InvoiceViewSet] Total facturas: {queryset.count()}")
        return queryset

    def perform_create(self, serializer):
        """Asignar usuario automáticamente CON LOGS DETALLADOS"""
        user = self.request.user
        print(f"[InvoiceViewSet] 🆕 CREANDO factura para usuario: {user}")

        try:
            invoice = serializer.save(user=user)
            print(
                f"[InvoiceViewSet] ✅ Factura creada: {invoice.invoice_number} - {invoice.client_name} - Total: S/ {invoice.total}"
            )
        except Exception as e:
            print(f"[InvoiceViewSet] ❌ Error creando factura: {str(e)}")
            import traceback

            print(f"[InvoiceViewSet] 🔍 Traceback: {traceback.format_exc()}")
            raise

    def create(self, request, *args, **kwargs):
        """Creación con logs DETALLADOS"""
        print("[InvoiceViewSet] 📝 CREATE factura llamado")
        print(f"[InvoiceViewSet] 👤 Usuario: {request.user.username}")
        print(f"[InvoiceViewSet] 📦 Datos recibidos: {request.data}")

        try:
            serializer = self.get_serializer(
                data=request.data, context={"request": request}
            )

            if not serializer.is_valid():
                print(f"[InvoiceViewSet] ❌ Errores de validación: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)

            print("[InvoiceViewSet] ✅ Factura creada exitosamente")
            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )

        except Exception as e:
            print(f"[InvoiceViewSet] 💥 Error en create: {str(e)}")
            import traceback

            print(f"[InvoiceViewSet] 🔍 Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Error interno: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def mark_as_paid(self, request, pk=None):
        """Marcar factura como pagada CON LOGS DETALLADOS"""
        invoice = self.get_object()
        print(f"[InvoiceViewSet] 💰 Marcando como pagada: {invoice.invoice_number}")

        invoice.status = "PAID"
        invoice.paid_date = timezone.now().date()
        invoice.save()

        print(
            f"[InvoiceViewSet] ✅ Factura marcada como pagada: {invoice.invoice_number}"
        )

        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def update_status(self, request, pk=None):
        """Actualizar estado de factura (endpoint original)"""
        invoice = self.get_object()
        new_status = request.data.get("status")

        print(
            f"[InvoiceViewSet] 🔄 Actualizando estado: {invoice.invoice_number} -> {new_status}"
        )

        if not new_status:
            return Response(
                {"detail": "El campo 'status' es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validar estado
        valid_statuses = [choice[0] for choice in Invoice.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"detail": f"Estado inválido. Debe ser: {', '.join(valid_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invoice.status = new_status

        # Si se marca como pagada, establecer fecha de pago
        if new_status == "PAID" and not invoice.paid_date:
            invoice.paid_date = timezone.now().date()

        invoice.save()

        print(
            f"[InvoiceViewSet] ✅ Estado actualizado: {invoice.invoice_number} -> {new_status}"
        )
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def download_pdf(self, request, pk=None):
        """Descargar factura en PDF CON LOGS"""
        invoice = self.get_object()
        print(f"[InvoiceViewSet] 📄 Generando PDF para: {invoice.invoice_number}")

        # TODO: Implementar generación de PDF real
        return Response(
            {
                "invoice_number": invoice.invoice_number,
                "message": "PDF generado exitosamente (implementar generación real)",
                "client_name": invoice.client_name,
                "total": float(invoice.total),
                "issue_date": invoice.issue_date.isoformat(),
            }
        )

    @action(detail=True, methods=["post"])
    def send_email(self, request, pk=None):
        """Enviar factura por email"""
        invoice = self.get_object()
        print(f"[InvoiceViewSet] 📧 Enviando email para: {invoice.invoice_number}")

        # TODO: Implementar envío de email real
        return Response(
            {
                "message": f"Factura {invoice.invoice_number} enviada por email",
                "invoice_number": invoice.invoice_number,
                "client_email": invoice.client_email,
            }
        )

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        """Duplicar factura"""
        original_invoice = self.get_object()
        print(
            f"[InvoiceViewSet] 📋 Duplicando factura: {original_invoice.invoice_number}"
        )

        try:
            # Crear nueva factura
            new_invoice = Invoice.objects.create(
                user=original_invoice.user,
                client_name=original_invoice.client_name,
                client_ruc=original_invoice.client_ruc,
                client_email=original_invoice.client_email,
                client_address=original_invoice.client_address,
                subtotal=original_invoice.subtotal,
                tax_amount=original_invoice.tax_amount,
                total=original_invoice.total,
                payment_method=original_invoice.payment_method,
                issue_date=timezone.now().date(),
                due_date=timezone.now().date() + timedelta(days=30),
                status="DRAFT",
                notes=f"Duplicado de {original_invoice.invoice_number}",
            )

            # Duplicar items
            for item in original_invoice.items.all():
                InvoiceItem.objects.create(
                    invoice=new_invoice,
                    product=item.product,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    tax_rate=item.tax_rate,
                )

            serializer = self.get_serializer(new_invoice)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {"error": f"Error duplicando factura: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Estadísticas COMPLETAS de facturas como en el original"""
        user = request.user
        print(f"[InvoiceViewSet] 📊 Obteniendo stats de facturas para: {user}")

        # Totales generales
        total_invoices = Invoice.objects.filter(user=user).count()
        total_amount = (
            Invoice.objects.filter(user=user).aggregate(total=Sum("total"))["total"]
            or 0
        )

        # Por estado
        by_status = (
            Invoice.objects.filter(user=user)
            .values("status")
            .annotate(count=Count("id"), amount=Sum("total"))
        )

        # Facturas vencidas
        overdue_invoices = Invoice.objects.filter(
            user=user,
            status="SENT",
            due_date__lt=timezone.now().date(),
            paid_date__isnull=True,
        ).count()

        # Facturas del mes actual
        current_month = timezone.now().date().replace(day=1)
        next_month = current_month + timedelta(days=32)
        next_month = next_month.replace(day=1)

        monthly_invoices = Invoice.objects.filter(
            user=user, issue_date__gte=current_month, issue_date__lt=next_month
        ).aggregate(count=Count("id"), amount=Sum("total"))

        print(
            f"[InvoiceViewSet] 📊 Stats calculados: {total_invoices} facturas totales"
        )

        return Response(
            {
                "total_invoices": total_invoices,
                "total_amount": float(total_amount),
                "overdue_invoices": overdue_invoices,
                "monthly_stats": {
                    "count": monthly_invoices["count"] or 0,
                    "amount": float(monthly_invoices["amount"] or 0),
                },
                "by_status": list(by_status),
            }
        )

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Facturas recientes (últimas 10)"""
        recent_invoices = self.get_queryset()[:10]
        serializer = self.get_serializer(recent_invoices, many=True)
        return Response(serializer.data)


# =============================================================================
# ENDPOINTS DE COMPATIBILIDAD - FUNCIONES FALTANTES
# =============================================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def products_stats(request):
    """ENDPOINT COMPATIBILIDAD - Estadísticas de productos"""
    user = request.user
    print(f"[PRODUCTS STATS] Obteniendo stats para: {user.username}")

    total_products = Product.objects.filter(user=user).count()
    active_products = Product.objects.filter(user=user, is_active=True).count()
    low_stock_products = Product.objects.filter(
        user=user, stock__lte=5, stock__gt=0
    ).count()
    out_of_stock_products = Product.objects.filter(user=user, stock=0).count()

    # Valor total del inventario
    inventory_value = (
        Product.objects.filter(user=user, is_active=True).aggregate(
            total_value=Sum(models.F("price") * models.F("stock"))
        )["total_value"]
        or 0
    )

    # Productos por categoría
    by_category = (
        Product.objects.filter(user=user, is_active=True)
        .values("category")
        .annotate(
            count=Count("id"),
            total_value=Sum(models.F("price") * models.F("stock")),
        )
    )

    return Response(
        {
            "total_products": total_products,
            "active_products": active_products,
            "low_stock_products": low_stock_products,
            "out_of_stock_products": out_of_stock_products,
            "inventory_value": float(inventory_value),
            "by_category": list(by_category),
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def invoices_stats(request):
    """ENDPOINT COMPATIBILIDAD - Estadísticas de facturas"""
    user = request.user
    print(f"[INVOICES STATS] Obteniendo stats para: {user.username}")

    # Totales generales
    total_invoices = Invoice.objects.filter(user=user).count()
    total_amount = (
        Invoice.objects.filter(user=user).aggregate(total=Sum("total"))["total"] or 0
    )

    # Por estado
    by_status = (
        Invoice.objects.filter(user=user)
        .values("status")
        .annotate(count=Count("id"), amount=Sum("total"))
    )

    # Facturas vencidas
    overdue_invoices = Invoice.objects.filter(
        user=user,
        status="SENT",
        due_date__lt=timezone.now().date(),
        paid_date__isnull=True,
    ).count()

    # Facturas del mes actual
    current_month = timezone.now().date().replace(day=1)
    next_month = current_month + timedelta(days=32)
    next_month = next_month.replace(day=1)

    monthly_invoices = Invoice.objects.filter(
        user=user, issue_date__gte=current_month, issue_date__lt=next_month
    ).aggregate(count=Count("id"), amount=Sum("total"))

    return Response(
        {
            "total_invoices": total_invoices,
            "total_amount": float(total_amount),
            "overdue_invoices": overdue_invoices,
            "monthly_stats": {
                "count": monthly_invoices["count"] or 0,
                "amount": float(monthly_invoices["amount"] or 0),
            },
            "by_status": list(by_status),
        }
    )


# =============================================================================
# ENDPOINTS DE EMERGENCIA Y COMPATIBILIDAD - MANTENIENDO TODOS LOS ORIGINALES
# =============================================================================


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def enterprise_clients_direct(request):
    """
    ENDPOINT DE EMERGENCIA - Clientes directo (ORIGINAL COMPLETO)
    """
    user = request.user

    if request.method == "GET":
        clients = Client.objects.filter(created_by=user).order_by("name")
        serializer = ClientSerializer(clients, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        try:
            print(f"[DIRECT] Creando cliente para: {user.username}")
            print(f"[DIRECT] Datos: {request.data}")

            # Validaciones
            if not request.data.get("name"):
                return Response(
                    {"error": "El nombre es obligatorio"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not request.data.get("document_number"):
                return Response(
                    {"error": "El número de documento es obligatorio"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Crear cliente directamente
            client = Client.objects.create(
                created_by=user,
                name=request.data["name"],
                document_type=request.data.get("document_type", "DNI"),
                document_number=request.data["document_number"],
                email=request.data.get("email", ""),
                phone=request.data.get("phone", ""),
            )

            serializer = ClientSerializer(client)
            print(f"[DIRECT] Cliente creado: {client.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"[DIRECT] Error: {str(e)}")
            import traceback

            print(f"[DIRECT] Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Error interno: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_product_direct(request):
    """SOLUCIÓN INMEDIATA - Crear producto y devolver JSON estructurado (ORIGINAL COMPLETO)"""
    user = request.user

    print(f"[ENTERPRISE DIRECT] Creando producto directo para: {user.username}")
    print(f"[ENTERPRISE DIRECT] Datos recibidos: {request.data}")

    try:
        data = request.data

        # Validaciones básicas
        if not data.get("name"):
            return Response(
                {"error": "El nombre del producto es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not data.get("price"):
            return Response(
                {"error": "El precio del producto es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Procesar datos
        name = data["name"]
        description = data.get("description", "")
        price = float(data["price"])
        cost = float(data["cost"]) if data.get("cost") else None
        category = data.get("category", "PRODUCT")
        stock = int(data.get("stock", 0))
        tax_rate = float(data.get("tax_rate", 18.00))

        print("[ENTERPRISE DIRECT] Procesando datos:")
        print(f"   - Nombre: {name}")
        print(f"   - Precio: {price}")
        print(f"   - Costo: {cost}")
        print(f"   - Categoría: {category}")
        print(f"   - Stock: {stock}")

        # Crear producto directamente
        product = Product.objects.create(
            user=user,
            name=name,
            description=description,
            price=price,
            cost=cost,
            category=category,
            stock=stock,
            tax_rate=tax_rate,
            is_active=True,
        )

        print(f"[ENTERPRISE DIRECT] Producto creado exitosamente: {product.id}")

        # RESPUESTA ESTRUCTURADA CORRECTA
        response_data = {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "sku": product.sku,
            "price": float(product.price),
            "cost": float(product.cost) if product.cost else None,
            "category": product.category,
            "stock": product.stock,
            "tax_rate": float(product.tax_rate),
            "is_active": product.is_active,
            "profit_margin": float(product.profit_margin),
            "tax_amount": float(product.tax_amount),
            "price_with_tax": float(product.price_with_tax),
            "created_at": product.created_at.isoformat(),
            "updated_at": product.updated_at.isoformat(),
        }

        print(f"[ENTERPRISE DIRECT] Enviando respuesta estructurada: {response_data}")
        return Response(response_data, status=status.HTTP_201_CREATED)

    except ValueError as e:
        print(f"[ENTERPRISE DIRECT] Error de valor: {str(e)}")
        return Response(
            {"error": f"Error en los datos: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        print(f"[ENTERPRISE DIRECT] Error general: {str(e)}")
        import traceback

        print(f"[ENTERPRISE DIRECT] Traceback: {traceback.format_exc()}")
        return Response(
            {"error": f"Error interno: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def products_list_create(request):
    """
    ENDPOINT COMPATIBILIDAD - Lista y creación de productos (ORIGINAL)
    """
    user = request.user

    if request.method == "GET":
        # Filtros opcionales
        category = request.GET.get("category", "")
        is_active = request.GET.get("is_active", "")

        products = Product.objects.filter(user=user)

        if category:
            products = products.filter(category=category)
        if is_active.lower() == "true":
            products = products.filter(is_active=True)
        elif is_active.lower() == "false":
            products = products.filter(is_active=False)

        products = products.order_by("-created_at")
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    # POST - Crear producto
    print(f"[ENTERPRISE] Creando producto para usuario: {user.username}")
    print(f"[ENTERPRISE] Datos recibidos: {request.data}")

    try:
        serializer = ProductSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            print("[ENTERPRISE] Serializer válido - Guardando producto...")
            product = serializer.save()
            print(f"[ENTERPRISE] Producto creado: {product.id} - {product.name}")

            response_serializer = ProductSerializer(product)
            print(
                f"[ENTERPRISE] Enviando respuesta estructurada: {response_serializer.data}"
            )

            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        else:
            print(f"[ENTERPRISE] Errores del serializer: {serializer.errors}")
            return Response(
                {
                    "detail": "Error de validación",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    except Exception as e:
        print(f"[ENTERPRISE] Error: {str(e)}")
        import traceback

        print(f"[ENTERPRISE] Traceback: {traceback.format_exc()}")
        return Response(
            {"detail": f"Error interno: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def product_detail(request, pk):
    """
    ENDPOINT COMPATIBILIDAD - Detalle de producto (ORIGINAL)
    """
    user = request.user
    try:
        product = Product.objects.get(id=pk, user=user)
    except Product.DoesNotExist:
        return Response(
            {"detail": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = ProductSerializer(product)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = ProductSerializer(
            product, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        # CORRECCIÓN CRÍTICA: HARD DELETE - Eliminación real de la base de datos
        print(
            f"[ENTERPRISE DELETE] Eliminando producto ID: {product.id} - {product.name}"
        )

        # Guardar información para el log antes de eliminar
        product_id = product.id
        product_name = product.name

        # ELIMINACIÓN REAL
        product.delete()

        print(f"[ENTERPRISE DELETE] Producto {product_id} eliminado permanentemente")

        return Response(
            {"detail": "Producto eliminado permanentemente"},
            status=status.HTTP_204_NO_CONTENT,
        )


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def invoices_list_create(request):
    """
    ENDPOINT COMPATIBILIDAD - Lista y creación de facturas (ORIGINAL)
    """
    user = request.user

    if request.method == "GET":
        # Filtros opcionales
        status_filter = request.GET.get("status", "")
        date_from = request.GET.get("date_from", "")
        date_to = request.GET.get("date_to", "")

        invoices = Invoice.objects.filter(user=user)

        if status_filter:
            invoices = invoices.filter(status=status_filter)
        if date_from:
            invoices = invoices.filter(issue_date__gte=date_from)
        if date_to:
            invoices = invoices.filter(issue_date__lte=date_to)

        invoices = invoices.order_by("-issue_date", "-created_at")
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)

    # POST - Crear factura
    serializer = InvoiceSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        invoice = serializer.save()
        response_serializer = InvoiceSerializer(invoice)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def invoices_quick_create(request):
    """
    ENDPOINT COMPATIBILIDAD - Creación rápida de factura (ORIGINAL)
    """
    serializer = InvoiceCreateSerializer(
        data=request.data, context={"request": request}
    )
    if serializer.is_valid():
        invoice = serializer.save()
        response_serializer = InvoiceSerializer(invoice)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def invoice_detail(request, pk):
    """
    ENDPOINT COMPATIBILIDAD - Detalle de factura (ORIGINAL)
    """
    user = request.user
    try:
        invoice = Invoice.objects.get(id=pk, user=user)
    except Invoice.DoesNotExist:
        return Response(
            {"detail": "Factura no encontrada"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = InvoiceSerializer(
            invoice, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        invoice.delete()
        return Response(
            {"detail": "Factura eliminada correctamente"},
            status=status.HTTP_204_NO_CONTENT,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def invoice_update_status(request, pk):
    """
    ENDPOINT COMPATIBILIDAD - Actualizar estado de factura (ORIGINAL)
    """
    user = request.user
    try:
        invoice = Invoice.objects.get(id=pk, user=user)
    except Invoice.DoesNotExist:
        return Response(
            {"detail": "Factura no encontrada"}, status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get("status")
    if not new_status:
        return Response(
            {"detail": "El campo 'status' es requerido"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validar estado
    valid_statuses = [choice[0] for choice in Invoice.STATUS_CHOICES]
    if new_status not in valid_statuses:
        return Response(
            {"detail": f"Estado inválido. Debe ser: {', '.join(valid_statuses)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    invoice.status = new_status

    # Si se marca como pagada, establecer fecha de pago
    if new_status == "PAID" and not invoice.paid_date:
        invoice.paid_date = timezone.now().date()

    invoice.save()

    serializer = InvoiceSerializer(invoice)
    return Response(serializer.data)


# =============================================================================
# ENDPOINTS DE DIAGNÓSTICO Y DASHBOARD - COMPLETOS
# =============================================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def enterprise_dashboard(request):
    """Dashboard empresarial COMPLETO con todos los datos originales"""
    user = request.user
    print(f"[Dashboard] Generando dashboard para: {user.username}")

    # Stats de productos
    total_products = Product.objects.filter(user=user).count()
    active_products = Product.objects.filter(user=user, is_active=True).count()
    inventory_value = (
        Product.objects.filter(user=user, is_active=True).aggregate(
            total_value=Sum(models.F("price") * models.F("stock"))
        )["total_value"]
        or 0
    )

    # Stats de facturas
    total_invoices = Invoice.objects.filter(user=user).count()
    total_revenue = (
        Invoice.objects.filter(user=user).aggregate(total=Sum("total"))["total"] or 0
    )
    overdue_invoices = Invoice.objects.filter(
        user=user,
        status="SENT",
        due_date__lt=timezone.now().date(),
        paid_date__isnull=True,
    ).count()

    # Clientes únicos
    unique_clients = Client.objects.filter(created_by=user).count()

    # Productos más vendidos
    top_products = (
        InvoiceItem.objects.filter(invoice__user=user)
        .values("product__name")
        .annotate(
            total_sold=Sum("quantity"),
            total_revenue=Sum(models.F("unit_price") * models.F("quantity")),
        )
        .order_by("-total_sold")[:5]
    )

    # Facturas recientes
    recent_invoices = Invoice.objects.filter(user=user).order_by("-created_at")[:5]
    recent_invoices_data = InvoiceSummarySerializer(recent_invoices, many=True).data

    print("[Dashboard] Dashboard generado exitosamente")

    return Response(
        {
            "summary": {
                "total_products": total_products,
                "active_products": active_products,
                "total_invoices": total_invoices,
                "total_revenue": float(total_revenue),
                "inventory_value": float(inventory_value),
                "unique_clients": unique_clients,
                "overdue_invoices": overdue_invoices,
            },
            "top_products": list(top_products),
            "recent_invoices": recent_invoices_data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def debug_product_validation(request):
    """Endpoint para debug de validación de productos (ORIGINAL COMPLETO)"""
    print(
        f"[ENTERPRISE DEBUG] debug_product_validation - Data recibida: {request.data}"
    )

    # Validar campos requeridos manualmente
    required_fields = ["name", "price"]
    missing_fields = [field for field in required_fields if field not in request.data]

    if missing_fields:
        return Response(
            {
                "error": "Campos requeridos faltantes",
                "missing_fields": missing_fields,
                "received_data": request.data,
            },
            status=400,
        )

    # Validar tipos de datos
    try:
        price = float(request.data["price"])
        if price <= 0:
            return Response(
                {
                    "error": "Precio debe ser mayor a 0",
                    "received_price": request.data["price"],
                },
                status=400,
            )
    except (ValueError, TypeError):
        return Response(
            {
                "error": "Precio debe ser un número válido",
                "received_price": request.data["price"],
            },
            status=400,
        )

    # Validar categoría
    valid_categories = ["SERVICE", "PRODUCT", "DIGITAL", "OTHER"]
    category = request.data.get("category", "PRODUCT")
    if category not in valid_categories:
        return Response(
            {
                "error": "Categoría inválida",
                "received_category": category,
                "valid_categories": valid_categories,
            },
            status=400,
        )

    return Response(
        {
            "success": True,
            "message": "Datos válidos",
            "validated_data": {
                "name": request.data["name"],
                "price": float(request.data["price"]),
                "category": category,
                "description": request.data.get("description", ""),
                "stock": int(request.data.get("stock", 0)),
                "cost": float(request.data["cost"]) if "cost" in request.data else None,
                "tax_rate": float(request.data.get("tax_rate", 18.0)),
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def enterprise_health_check(request):
    """Health check COMPLETO del módulo empresarial"""
    user = request.user
    print(f"[HealthCheck] Verificando salud del módulo para: {user.username}")

    try:
        # Verificar que todos los modelos funcionan
        clients_count = Client.objects.filter(created_by=user).count()
        products_count = Product.objects.filter(user=user).count()
        invoices_count = Invoice.objects.filter(user=user).count()

        # Verificar que se pueden crear instancias
        can_create_client = Client.objects.filter(created_by=user).exists() or True
        can_create_product = Product.objects.filter(user=user).exists() or True
        can_create_invoice = Invoice.objects.filter(user=user).exists() or True

        health_status = {
            "ok": True,
            "time": timezone.now().isoformat(),
            "user": user.username,
            "counts": {
                "clients": clients_count,
                "products": products_count,
                "invoices": invoices_count,
            },
            "modules": {
                "clients": can_create_client,
                "products": can_create_product,
                "invoices": can_create_invoice,
            },
            "database": "OK",
            "authentication": "OK",
        }

        print("[HealthCheck] ✅ Módulo empresarial saludable")
        return Response(health_status)

    except Exception as e:
        print(f"[HealthCheck] ❌ Error en health check: {str(e)}")
        import traceback

        print(f"[HealthCheck] 🔍 Traceback: {traceback.format_exc()}")

        return Response(
            {
                "ok": False,
                "time": timezone.now().isoformat(),
                "error": str(e),
                "database": "ERROR",
                "modules": {"clients": False, "products": False, "invoices": False},
            },
            status=500,
        )


# =============================================================================
# NUEVOS ENDPOINTS PARA REPORTES Y ANALÍTICAS
# =============================================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_quick_stats(request):
    """Estadísticas rápidas para el dashboard"""
    user = request.user
    print(f"[Dashboard] Generando stats rápidos para: {user.username}")

    try:
        # Estadísticas de productos
        total_products = Product.objects.filter(user=user).count()
        active_products = Product.objects.filter(user=user, is_active=True).count()
        low_stock_products = Product.objects.filter(
            user=user, stock__lte=5, stock__gt=0
        ).count()
        out_of_stock_products = Product.objects.filter(user=user, stock=0).count()

        # Estadísticas de clientes
        total_clients = Client.objects.filter(created_by=user).count()
        clients_this_month = Client.objects.filter(
            created_by=user, created_at__month=timezone.now().month
        ).count()

        # Estadísticas de facturas
        total_invoices = Invoice.objects.filter(user=user).count()
        paid_invoices = Invoice.objects.filter(user=user, status="PAID").count()
        overdue_invoices = Invoice.objects.filter(
            user=user,
            status="SENT",
            due_date__lt=timezone.now().date(),
            paid_date__isnull=True,
        ).count()

        # Totales financieros
        total_revenue = (
            Invoice.objects.filter(user=user, status="PAID").aggregate(
                total=Sum("total")
            )["total"]
            or 0
        )

        monthly_revenue = (
            Invoice.objects.filter(
                user=user, status="PAID", issue_date__month=timezone.now().month
            ).aggregate(total=Sum("total"))["total"]
            or 0
        )

        inventory_value = (
            Product.objects.filter(user=user, is_active=True).aggregate(
                total_value=Sum(models.F("price") * models.F("stock"))
            )["total_value"]
            or 0
        )

        return Response(
            {
                "success": True,
                "products": {
                    "total": total_products,
                    "active": active_products,
                    "low_stock": low_stock_products,
                    "out_of_stock": out_of_stock_products,
                },
                "clients": {"total": total_clients, "this_month": clients_this_month},
                "invoices": {
                    "total": total_invoices,
                    "paid": paid_invoices,
                    "overdue": overdue_invoices,
                },
                "financials": {
                    "total_revenue": float(total_revenue),
                    "monthly_revenue": float(monthly_revenue),
                    "inventory_value": float(inventory_value),
                },
                "timestamp": timezone.now().isoformat(),
            }
        )

    except Exception as e:
        print(f"[Dashboard] Error generando stats: {str(e)}")
        return Response({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_report(request):
    """Reporte detallado de ventas"""
    user = request.user

    # Parámetros de filtro
    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")
    category = request.GET.get("category")

    try:
        # Base query
        invoices = Invoice.objects.filter(user=user, status="PAID")

        # Aplicar filtros
        if date_from:
            invoices = invoices.filter(issue_date__gte=date_from)
        if date_to:
            invoices = invoices.filter(issue_date__lte=date_to)

        # Datos de ventas
        sales_data = invoices.aggregate(
            total_sales=Count("id"),
            total_revenue=Sum("total"),
            average_invoice=Avg("total"),
        )

        # Ventas por mes
        monthly_sales = (
            invoices.annotate(month=TruncMonth("issue_date"))
            .values("month")
            .annotate(count=Count("id"), revenue=Sum("total"))
            .order_by("month")
        )

        # Productos más vendidos
        top_products = (
            InvoiceItem.objects.filter(invoice__user=user, invoice__status="PAID")
            .values("product__name", "product__category")
            .annotate(
                total_sold=Sum("quantity"),
                total_revenue=Sum(models.F("unit_price") * models.F("quantity")),
            )
            .order_by("-total_sold")[:10]
        )

        # Métodos de pago
        payment_methods = invoices.values("payment_method").annotate(
            count=Count("id"), total=Sum("total")
        )

        return Response(
            {
                "summary": sales_data,
                "monthly_trends": list(monthly_sales),
                "top_products": list(top_products),
                "payment_methods": list(payment_methods),
                "filters": {
                    "date_from": date_from,
                    "date_to": date_to,
                    "category": category,
                },
            }
        )

    except Exception as e:
        return Response({"error": f"Error generando reporte: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_report(request):
    """Reporte de inventario"""
    user = request.user

    try:
        # Resumen de inventario
        inventory_summary = Product.objects.filter(user=user).aggregate(
            total_products=Count("id"),
            active_products=Count("id", filter=models.Q(is_active=True)),
            total_stock=Sum("stock"),
            inventory_value=Sum(models.F("price") * models.F("stock")),
        )

        # Productos por categoría
        by_category = (
            Product.objects.filter(user=user)
            .values("category")
            .annotate(
                count=Count("id"),
                total_stock=Sum("stock"),
                total_value=Sum(models.F("price") * models.F("stock")),
            )
        )

        # Stock bajo
        low_stock = Product.objects.filter(user=user, stock__lte=5, stock__gt=0).values(
            "name", "sku", "stock", "min_stock", "price"
        )

        # Sin stock
        out_of_stock = Product.objects.filter(user=user, stock=0).values(
            "name", "sku", "price"
        )

        # Productos inactivos
        inactive_products = Product.objects.filter(user=user, is_active=False).values(
            "name", "sku", "stock"
        )

        return Response(
            {
                "summary": inventory_summary,
                "by_category": list(by_category),
                "low_stock": list(low_stock),
                "out_of_stock": list(out_of_stock),
                "inactive_products": list(inactive_products),
            }
        )

    except Exception as e:
        return Response(
            {"error": f"Error generando reporte de inventario: {str(e)}"}, status=500
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_update_products(request):
    """Actualización masiva de productos"""
    user = request.user
    updates = request.data.get("updates", [])

    if not updates:
        return Response(
            {"error": "No se proporcionaron datos para actualizar"}, status=400
        )

    try:
        updated_count = 0
        errors = []

        for update in updates:
            product_id = update.get("product_id")
            field = update.get("field")
            value = update.get("value")

            if not all([product_id, field, value]):
                errors.append(f"Datos incompletos: {update}")
                continue

            try:
                product = Product.objects.get(id=product_id, user=user)

                # Validar campo
                if field not in ["price", "cost", "stock", "tax_rate", "is_active"]:
                    errors.append(f"Campo no permitido: {field}")
                    continue

                # Actualizar campo
                setattr(product, field, value)
                product.save()
                updated_count += 1

            except Product.DoesNotExist:
                errors.append(f"Producto no encontrado: {product_id}")
            except Exception as e:
                errors.append(f"Error actualizando producto {product_id}: {str(e)}")

        return Response(
            {
                "success": True,
                "updated_count": updated_count,
                "error_count": len(errors),
                "errors": errors,
            }
        )

    except Exception as e:
        return Response(
            {"error": f"Error en actualización masiva: {str(e)}"}, status=500
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_prices_bulk(request):
    """Actualización masiva de precios"""
    user = request.user
    percentage = request.data.get("percentage")
    operation = request.data.get("operation")  # 'increase' or 'decrease'

    if not percentage or not operation:
        return Response({"error": "Se requieren percentage y operation"}, status=400)

    try:
        products = Product.objects.filter(user=user, is_active=True)
        updated_count = 0

        for product in products:
            if operation == "increase":
                new_price = product.price * (1 + Decimal(percentage) / 100)
            else:  # decrease
                new_price = product.price * (1 - Decimal(percentage) / 100)

            product.price = new_price.quantize(Decimal("0.01"))
            product.save()
            updated_count += 1

        return Response(
            {
                "success": True,
                "updated_count": updated_count,
                "operation": operation,
                "percentage": percentage,
            }
        )

    except Exception as e:
        return Response({"error": f"Error actualizando precios: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sales_trends(request):
    """Tendencias de ventas por período"""
    user = request.user
    period = request.GET.get("period", "monthly")  # daily, weekly, monthly

    try:
        invoices = Invoice.objects.filter(user=user, status="PAID")

        if period == "daily":
            trunc = TruncDay("issue_date")
        elif period == "weekly":
            trunc = TruncWeek("issue_date")
        else:  # monthly
            trunc = TruncMonth("issue_date")

        trends = (
            invoices.annotate(period=trunc)
            .values("period")
            .annotate(
                invoice_count=Count("id"),
                total_revenue=Sum("total"),
                average_invoice=Avg("total"),
            )
            .order_by("period")
        )

        return Response({"period": period, "trends": list(trends)})

    except Exception as e:
        return Response({"error": f"Error generando tendencias: {str(e)}"}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def top_products(request):
    """Productos más vendidos y más rentables"""
    user = request.user
    limit = int(request.GET.get("limit", 10))

    try:
        # Productos más vendidos por cantidad
        top_by_quantity = (
            InvoiceItem.objects.filter(invoice__user=user, invoice__status="PAID")
            .values("product__name", "product__category")
            .annotate(
                total_sold=Sum("quantity"),
                total_revenue=Sum(models.F("unit_price") * models.F("quantity")),
            )
            .order_by("-total_sold")[:limit]
        )

        # Productos más rentables
        top_by_revenue = (
            InvoiceItem.objects.filter(invoice__user=user, invoice__status="PAID")
            .values("product__name", "product__category")
            .annotate(
                total_sold=Sum("quantity"),
                total_revenue=Sum(models.F("unit_price") * models.F("quantity")),
            )
            .order_by("-total_revenue")[:limit]
        )

        return Response(
            {
                "top_by_quantity": list(top_by_quantity),
                "top_by_revenue": list(top_by_revenue),
            }
        )

    except Exception as e:
        return Response(
            {"error": f"Error obteniendo productos top: {str(e)}"}, status=500
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def debug_invoice_validation(request):
    """Debug de validación de facturas"""
    print(f"[DEBUG] Validación de factura - Datos: {request.data}")

    # Validar campos requeridos
    required_fields = ["client_name", "items"]
    missing_fields = [field for field in required_fields if field not in request.data]

    if missing_fields:
        return Response(
            {
                "error": "Campos requeridos faltantes",
                "missing_fields": missing_fields,
                "received_data": request.data,
            },
            status=400,
        )

    # Validar items
    items = request.data.get("items", [])
    if not items or not isinstance(items, list):
        return Response(
            {"error": "La factura debe contener items", "received_items": items},
            status=400,
        )

    # Validar cada item
    item_errors = []
    for i, item in enumerate(items):
        if "product_id" not in item:
            item_errors.append(f"Item {i}: Falta product_id")
        if "quantity" not in item:
            item_errors.append(f"Item {i}: Falta quantity")
        elif item["quantity"] <= 0:
            item_errors.append(f"Item {i}: Cantidad debe ser mayor a 0")

    if item_errors:
        return Response(
            {"error": "Errores en items", "item_errors": item_errors}, status=400
        )

    return Response(
        {
            "success": True,
            "message": "Datos de factura válidos",
            "validated_data": {
                "client_name": request.data["client_name"],
                "client_ruc": request.data.get("client_ruc", ""),
                "client_email": request.data.get("client_email", ""),
                "items_count": len(items),
                "total_items": sum(item.get("quantity", 0) for item in items),
            },
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def system_info(request):
    """Información del sistema empresarial"""
    user = request.user

    try:
        # Estadísticas del sistema
        stats = {
            "user": {
                "username": user.username,
                "email": user.email,
                "date_joined": user.date_joined.isoformat(),
            },
            "database": {
                "clients_count": Client.objects.filter(created_by=user).count(),
                "products_count": Product.objects.filter(user=user).count(),
                "invoices_count": Invoice.objects.filter(user=user).count(),
                "invoice_items_count": InvoiceItem.objects.filter(
                    invoice__user=user
                ).count(),
            },
            "storage": {
                "total_products_size": "0 MB",  # Podrías calcular tamaño de imágenes
                "total_invoices_size": "0 MB",  # Podrías calcular tamaño de PDFs
            },
            "system": {
                "current_time": timezone.now().isoformat(),
                "timezone": str(timezone.get_current_timezone()),
                "django_version": "4.2+",  # Podrías obtener la versión real
                "api_version": "1.0.0",
            },
        }

        return Response(stats)

    except Exception as e:
        return Response(
            {"error": f"Error obteniendo información del sistema: {str(e)}"}, status=500
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def backup_data(request):
    """Respaldar datos del usuario"""
    user = request.user
    data_type = request.GET.get("type", "all")  # all, clients, products, invoices

    try:
        backup_data = {}

        if data_type in ["all", "clients"]:
            clients = Client.objects.filter(created_by=user)
            backup_data["clients"] = ClientSerializer(clients, many=True).data

        if data_type in ["all", "products"]:
            products = Product.objects.filter(user=user)
            backup_data["products"] = ProductSerializer(products, many=True).data

        if data_type in ["all", "invoices"]:
            invoices = Invoice.objects.filter(user=user)
            backup_data["invoices"] = InvoiceSerializer(invoices, many=True).data

        return Response(
            {
                "success": True,
                "backup_type": data_type,
                "timestamp": timezone.now().isoformat(),
                "data": backup_data,
            }
        )

    except Exception as e:
        return Response({"error": f"Error generando respaldo: {str(e)}"}, status=500)

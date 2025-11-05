# enterprise/views.py - MÓDULO EMPRESARIAL COMPLETO Y CORREGIDO
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, Count
from django.db import models
from django.utils import timezone
from datetime import timedelta

from .models import Client, Product, Invoice, InvoiceItem
from .serializers import (
    ClientSerializer,
    ProductSerializer,
    ProductListSerializer,
    InvoiceSerializer,
    InvoiceCreateSerializer,
    InvoiceItemSerializer,
)


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet CORREGIDO para clientes - Compatible con frontend
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ClientSerializer

    def get_queryset(self):
        """Solo los clientes del usuario actual"""
        return Client.objects.filter(created_by=self.request.user).order_by("name")

    def perform_create(self, serializer):
        """CORRECCIÓN CRÍTICA: Asignar usuario automáticamente"""
        print(f"[ClientViewSet] Creando cliente para usuario: {self.request.user}")
        try:
            serializer.save(created_by=self.request.user)
            print("[ClientViewSet] Cliente creado exitosamente")
        except Exception as e:
            print(f"[ClientViewSet] Error creando cliente: {str(e)}")
            raise

    def create(self, request, *args, **kwargs):
        """Manejo mejorado de creación con logs detallados"""
        print(f"[ClientViewSet] CREATE endpoint llamado")
        print(f"[ClientViewSet] Datos: {request.data}")

        try:
            # CORRECCIÓN: Usar el serializer con contexto
            serializer = self.get_serializer(
                data=request.data, context={"request": request}
            )

            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)

            return Response(
                serializer.data, status=status.HTTP_201_CREATED, headers=headers
            )

        except Exception as e:
            print(f"[ClientViewSet] Error en create: {str(e)}")
            import traceback

            print(f"[ClientViewSet] Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Error interno del servidor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def search(self, request):
        """Búsqueda simple por nombre o documento"""
        query = request.GET.get("q", "").strip()

        if not query:
            return Response([])

        clients = self.get_queryset().filter(
            Q(name__icontains=query) | Q(document_number__icontains=query)
        )[:10]

        serializer = self.get_serializer(clients, many=True)
        return Response(serializer.data)


# ENDPOINT DE EMERGENCIA - CLIENTES DIRECTO
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def enterprise_clients_direct(request):
    """
    ENDPOINT DE EMERGENCIA - Clientes directo
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


# VISTAS DE PRODUCTOS - CORREGIDAS (MANTENER COMO ESTÁN)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def products_list_create(request):
    """
    GET: Lista todos los productos del usuario
    POST: Crea un nuevo producto - CORREGIDO
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

    # CORRECCIÓN: POST - Crear producto CON RESPUESTA ESTRUCTURADA
    print(f"[ENTERPRISE] Creando producto para usuario: {user.username}")
    print(f"[ENTERPRISE] Datos recibidos: {request.data}")

    try:
        serializer = ProductSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            print("[ENTERPRISE] Serializer válido - Guardando producto...")
            product = serializer.save()
            print(f"[ENTERPRISE] Producto creado: {product.id} - {product.name}")

            # CORRECCIÓN CRÍTICA: Devolver el producto serializado correctamente
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


# ENDPOINT DE EMERGENCIA - CREACIÓN DIRECTA DE PRODUCTO
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_product_direct(request):
    """SOLUCIÓN INMEDIATA - Crear producto y devolver JSON estructurado"""
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

        print(f"[ENTERPRISE DIRECT] Procesando datos:")
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


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def product_detail(request, pk):
    """
    GET: Obtener detalle de producto
    PUT: Actualizar producto
    DELETE: CORREGIDO - Eliminar producto (HARD DELETE)
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def products_stats(request):
    """Estadísticas de productos del usuario"""
    user = request.user
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


# VISTAS DE FACTURAS (INVOICES)
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def invoices_list_create(request):
    """
    GET: Lista todas las facturas del usuario
    POST: Crea una nueva factura
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
    Creación rápida de factura desde datos simplificados
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
    GET: Obtener detalle de factura
    PUT: Actualizar factura
    DELETE: Eliminar factura
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
    Actualizar estado de una factura
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def invoices_stats(request):
    """Estadísticas de facturas del usuario"""
    user = request.user

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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def enterprise_dashboard(request):
    """Dashboard empresarial con resumen de productos y facturas"""
    user = request.user

    # Obtener stats de productos
    products_stats_data = products_stats(request._request).data

    # Obtener stats de facturas
    invoices_stats_data = invoices_stats(request._request).data

    # Clientes únicos
    unique_clients = (
        Invoice.objects.filter(user=user).values("client_name").distinct().count()
    )

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

    return Response(
        {
            "products": products_stats_data,
            "invoices": invoices_stats_data,
            "unique_clients": unique_clients,
            "top_products": list(top_products),
            "summary": {
                "total_products": products_stats_data.get("total_products", 0),
                "total_invoices": invoices_stats_data.get("total_invoices", 0),
                "total_revenue": invoices_stats_data.get("total_amount", 0),
                "inventory_value": products_stats_data.get("inventory_value", 0),
            },
        }
    )


# ENDPOINT TEMPORAL PARA DEBUG DE VALIDACIÓN
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def debug_product_validation(request):
    """Endpoint para debug de validación de productos"""
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

# enterprise/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Client, Product, Invoice, InvoiceItem
from decimal import Decimal


# =============================================
# ADMIN DE CLIENTES - COMPLETO
# =============================================
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name_display",
        "document_info",
        "contact_info",
        "created_by",
        "created_at_display",
        "actions",
    ]

    list_display_links = ["id", "name_display"]

    list_filter = ["document_type", "created_at", "city", "created_by"]

    search_fields = [
        "name",
        "document_number",
        "email",
        "phone",
        "created_by__username",
        "created_by__email",
    ]

    readonly_fields = ["created_at", "updated_at", "full_address_display"]

    ordering = ["-created_at"]

    fieldsets = (
        (
            "INFORMACIÓN PERSONAL",
            {
                "fields": ("name", "document_type", "document_number"),
                "classes": ("collapse", "wide"),
            },
        ),
        (
            "INFORMACIÓN DE CONTACTO",
            {
                "fields": ("email", "phone", "address", "city", "country"),
                "classes": ("collapse", "wide"),
            },
        ),
        (
            "INFORMACIÓN DEL SISTEMA",
            {
                "fields": (
                    "created_by",
                    "full_address_display",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def name_display(self, obj):
        return format_html('<strong style="font-size: 14px;">{}</strong>', obj.name)

    name_display.short_description = "CLIENTE"
    name_display.admin_order_field = "name"

    def document_info(self, obj):
        doc_icons = {"DNI": "🆔", "RUC": "🏢", "CE": "🌎", "PASSPORT": "🛂"}
        icon = doc_icons.get(obj.document_type, "📄")
        return format_html(
            '{}<br><span style="color: #666; font-size: 12px;">{}: {}</span>',
            icon,
            obj.get_document_type_display(),
            obj.document_number,
        )

    document_info.short_description = "DOCUMENTO"
    document_info.admin_order_field = "document_type"

    def contact_info(self, obj):
        contact_parts = []
        if obj.email:
            contact_parts.append(f"📧 {obj.email}")
        if obj.phone:
            contact_parts.append(f"📞 {obj.phone}")

        if contact_parts:
            return format_html("<br>".join(contact_parts))
        return format_html('<span style="color: #999;">— Sin contacto —</span>')

    contact_info.short_description = "CONTACTO"

    def created_at_display(self, obj):
        return obj.created_at.strftime("%d/%m/%Y %H:%M")

    created_at_display.short_description = "FECHA CREACIÓN"
    created_at_display.admin_order_field = "created_at"

    def full_address_display(self, obj):
        return obj.full_address or "—"

    full_address_display.short_description = "DIRECCIÓN COMPLETA"

    def actions(self, obj):
        return format_html(
            '<a href="{}" class="button" style="background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px; text-decoration: none;">Ver</a>',
            reverse("admin:enterprise_client_change", args=[obj.id]),
        )

    actions.short_description = "ACCIONES"

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(created_by=request.user)


# =============================================
# INLINE PARA ITEMS DE FACTURA
# =============================================
class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    readonly_fields = [
        "subtotal_display",
        "tax_amount_display",
        "total_display",
        "profit_display",
    ]

    fields = (
        "product",
        "quantity",
        "unit_price",
        "tax_rate",
        "discount",
        "subtotal_display",
        "tax_amount_display",
        "total_display",
        "profit_display",
        "notes",
    )

    classes = ["collapse"]

    def subtotal_display(self, obj):
        return format_html("<strong>S/ {:,.2f}</strong>", float(obj.subtotal))

    subtotal_display.short_description = "SUBTOTAL"

    def tax_amount_display(self, obj):
        return format_html(
            '<span style="color: #E53E3E;">S/ {:,.2f}</span>', float(obj.tax_amount)
        )

    tax_amount_display.short_description = "IMPUESTO"

    def total_display(self, obj):
        return format_html(
            '<strong style="color: #2D3748;">S/ {:,.2f}</strong>', float(obj.total)
        )

    total_display.short_description = "TOTAL"

    def profit_display(self, obj):
        profit = obj.profit
        color = "green" if profit > 0 else "red" if profit < 0 else "gray"
        return format_html(
            '<span style="color: {}; font-weight: bold;">S/ {:,.2f}</span>',
            color,
            float(profit),
        )

    profit_display.short_description = "GANANCIA"


# =============================================
# ADMIN DE FACTURAS - COMPLETO
# =============================================
@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        "invoice_number",
        "client_info",
        "total_display",
        "status_display",
        "payment_method_display",
        "dates_info",
        "overdue_status",
        "actions",
    ]

    list_display_links = ["invoice_number", "client_info"]

    list_filter = [
        "status",
        "payment_method",
        "currency",
        "issue_date",
        "due_date",
        "user",
    ]

    search_fields = [
        "invoice_number",
        "client_name",
        "client_ruc",
        "client_email",
        "user__username",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
        "is_overdue_display",
        "days_until_due_display",
        "payment_status_display",
        "totals_summary",
        "items_count_display",
    ]

    inlines = [InvoiceItemInline]

    date_hierarchy = "issue_date"

    fieldsets = (
        (
            "INFORMACIÓN DE FACTURA",
            {
                "fields": (
                    "user",
                    "invoice_number",
                    "status",
                    "payment_method",
                    "currency",
                    "exchange_rate",
                )
            },
        ),
        (
            "INFORMACIÓN DEL CLIENTE",
            {
                "fields": (
                    "client_name",
                    "client_ruc",
                    "client_email",
                    "client_phone",
                    "client_address",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "FECHAS IMPORTANTES",
            {
                "fields": (
                    "issue_date",
                    "due_date",
                    "paid_date",
                    "days_until_due_display",
                )
            },
        ),
        (
            "TOTALES Y FINANZAS",
            {
                "fields": (
                    "subtotal",
                    "tax_amount",
                    "discount_amount",
                    "shipping_cost",
                    "total",
                    "totals_summary",
                )
            },
        ),
        (
            "INFORMACIÓN ADICIONAL",
            {
                "fields": ("notes", "terms_conditions", "payment_terms"),
                "classes": ("collapse",),
            },
        ),
        (
            "ESTADO Y METADATOS",
            {
                "fields": (
                    "payment_status_display",
                    "is_overdue_display",
                    "items_count_display",
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    def client_info(self, obj):
        return format_html(
            """
            <div style="min-width: 200px;">
                <strong>{}</strong><br>
                <span style="color: #666; font-size: 12px;">{}: {}</span><br>
                <span style="color: #888; font-size: 11px;">{}</span>
            </div>
            """,
            obj.client_name,
            "RUC" if len(obj.client_ruc or "") == 11 else "DNI",
            obj.client_ruc or "—",
            obj.client_email or "—",
        )

    client_info.short_description = "CLIENTE"
    client_info.admin_order_field = "client_name"

    def total_display(self, obj):
        currency_symbols = {"PEN": "S/", "USD": "$", "EUR": "€"}
        symbol = currency_symbols.get(obj.currency, "S/")
        return format_html(
            '<strong style="font-size: 14px; color: #2D3748;">{} {:,.2f}</strong>',
            symbol,
            float(obj.total),
        )

    total_display.short_description = "TOTAL"
    total_display.admin_order_field = "total"

    def status_display(self, obj):
        status_config = {
            "DRAFT": ("✏️", "Borrador", "#718096", "#EDF2F7"),
            "SENT": ("📤", "Enviada", "#4299E1", "#EBF8FF"),
            "PAID": ("✅", "Pagada", "#48BB78", "#F0FFF4"),
            "OVERDUE": ("⚠️", "Vencida", "#ED8936", "#FEF5E7"),
            "CANCELLED": ("❌", "Cancelada", "#F56565", "#FED7D7"),
            "REFUNDED": ("🔄", "Reembolsada", "#9F7AEA", "#FAF5FF"),
        }

        icon, text, color, bg_color = status_config.get(
            obj.status, ("📋", obj.status, "#A0AEC0", "#F7FAFC")
        )

        return format_html(
            """
            <div style="
                background: {}; 
                color: {}; 
                padding: 4px 8px; 
                border-radius: 12px; 
                font-size: 12px; 
                font-weight: bold; 
                text-align: center;
                min-width: 100px;
                border: 1px solid {};
            ">
                {} {}
            </div>
            """,
            bg_color,
            color,
            color,
            icon,
            text,
        )

    status_display.short_description = "ESTADO"
    status_display.admin_order_field = "status"

    def payment_method_display(self, obj):
        method_icons = {
            "CASH": "💵",
            "CARD": "💳",
            "TRANSFER": "🏦",
            "CHECK": "📄",
            "DIGITAL_WALLET": "📱",
            "OTHER": "📋",
        }
        icon = method_icons.get(obj.payment_method, "💳")
        return format_html(
            '{}<br><span style="color: #666; font-size: 11px;">{}</span>',
            icon,
            obj.get_payment_method_display(),
        )

    payment_method_display.short_description = "PAGO"
    payment_method_display.admin_order_field = "payment_method"

    def dates_info(self, obj):
        today = timezone.now().date()

        issue_date_html = obj.issue_date.strftime("%d/%m/%Y")

        if obj.due_date < today and not obj.paid_date:
            due_date_html = format_html(
                '<span style="color: red; font-weight: bold;">{} ⚠️</span>',
                obj.due_date.strftime("%d/%m/%Y"),
            )
        elif obj.due_date == today:
            due_date_html = format_html(
                '<span style="color: orange; font-weight: bold;">{} 🚨</span>',
                obj.due_date.strftime("%d/%m/%Y"),
            )
        else:
            due_date_html = obj.due_date.strftime("%d/%m/%Y")

        return format_html(
            """
            <div style="font-size: 11px; line-height: 1.3;">
                <div>📅 <strong>Emisión:</strong> {}</div>
                <div>⏰ <strong>Vence:</strong> {}</div>
            </div>
            """,
            issue_date_html,
            due_date_html,
        )

    dates_info.short_description = "FECHAS"

    def overdue_status(self, obj):
        if obj.is_overdue:
            return format_html(
                '<span style="color: red; font-weight: bold;">⚠️ VENCIDA</span>'
            )
        elif obj.status == "PAID":
            return format_html(
                '<span style="color: green; font-weight: bold;">✅ PAGADA</span>'
            )
        else:
            days = obj.days_until_due
            if days == 0:
                return format_html(
                    '<span style="color: orange; font-weight: bold;">⏰ HOY</span>'
                )
            elif days > 0:
                return format_html('<span style="color: blue;">📅 {} días</span>', days)
            else:
                return format_html('<span style="color: gray;">—</span>')

    overdue_status.short_description = "VENCIMIENTO"

    def actions(self, obj):
        view_url = reverse("admin:enterprise_invoice_change", args=[obj.id])
        return format_html(
            """
            <a href="{}" class="button" style="
                background: #4299E1; 
                color: white; 
                padding: 6px 12px; 
                border-radius: 4px; 
                text-decoration: none;
                font-size: 12px;
                font-weight: bold;
            ">
                👁️ Ver
            </a>
            """,
            view_url,
        )

    actions.short_description = "ACCIONES"

    def is_overdue_display(self, obj):
        if obj.is_overdue:
            return format_html(
                '<div style="color: red; font-weight: bold; font-size: 16px; padding: 10px; background: #FED7D7; border-radius: 5px;">'
                "⚠️ FACTURA VENCIDA - Se requiere acción inmediata"
                "</div>"
            )
        return format_html(
            '<div style="color: green; font-weight: bold;">✅ Factura al día</div>'
        )

    is_overdue_display.short_description = "ESTADO DE VENCIMIENTO"

    def days_until_due_display(self, obj):
        days = obj.days_until_due
        if days < 0:
            return format_html(
                '<span style="color: red; font-weight: bold;">Vencida hace {} días</span>',
                abs(days),
            )
        elif days == 0:
            return format_html(
                '<span style="color: orange; font-weight: bold;">VENCE HOY</span>'
            )
        else:
            return format_html(
                '<span style="color: green;">Vence en {} días</span>', days
            )

    days_until_due_display.short_description = "DÍAS HASTA VENCIMIENTO"

    def payment_status_display(self, obj):
        status = obj.payment_status
        config = {
            "paid": ("✅", "PAGADA", "green"),
            "overdue": ("⚠️", "VENCIDA", "red"),
            "pending": ("⏳", "PENDIENTE", "orange"),
            "draft": ("✏️", "BORRADOR", "gray"),
        }
        icon, text, color = config.get(status, ("📋", status, "gray"))
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} {}</span>',
            color,
            icon,
            text,
        )

    payment_status_display.short_description = "ESTADO DE PAGO"

    def totals_summary(self, obj):
        return format_html(
            """
            <div style="background: #f0fff4; padding: 15px; border-radius: 8px; border-left: 4px solid #48BB78;">
                <h4 style="margin: 0 0 10px 0; color: #2D3748;">🧮 RESUMEN FINANCIERO</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0;"><strong>Subtotal:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0; text-align: right;">S/ {:,.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0;"><strong>Impuesto:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0; text-align: right;">S/ {:,.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0;"><strong>Descuento:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0; text-align: right;">S/ {:,.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0;"><strong>Envío:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0; text-align: right;">S/ {:,.2f}</td>
                    </tr>
                    <tr style="background: #EBF8FF;">
                        <td style="padding: 8px; font-size: 16px;"><strong>TOTAL:</strong></td>
                        <td style="padding: 8px; font-size: 16px; text-align: right; font-weight: bold;">S/ {:,.2f}</td>
                    </tr>
                </table>
            </div>
            """,
            float(obj.subtotal),
            float(obj.tax_amount),
            float(obj.discount_amount),
            float(obj.shipping_cost),
            float(obj.total),
        )

    totals_summary.short_description = "DESGLOSE DE TOTALES"

    def items_count_display(self, obj):
        count = obj.items.count()
        return format_html(
            '<span style="font-weight: bold; color: #4299E1;">{} productos</span>',
            count,
        )

    items_count_display.short_description = "ITEMS EN FACTURA"

    actions = ["mark_as_paid", "mark_as_sent", "mark_as_cancelled", "mark_as_refunded"]

    def mark_as_paid(self, request, queryset):
        updated = queryset.update(status="PAID", paid_date=timezone.now().date())
        self.message_user(
            request,
            f"✅ {updated} factura(s) marcada(s) como pagadas correctamente",
            "success",
        )

    mark_as_paid.short_description = "✅ Marcar como PAGADAS"

    def mark_as_sent(self, request, queryset):
        updated = queryset.update(status="SENT")
        self.message_user(
            request, f"📤 {updated} factura(s) marcada(s) como enviadas", "success"
        )

    mark_as_sent.short_description = "📤 Marcar como ENVIADAS"

    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status="CANCELLED")
        self.message_user(
            request, f"❌ {updated} factura(s) marcada(s) como canceladas", "warning"
        )

    mark_as_cancelled.short_description = "❌ Marcar como CANCELADAS"

    def mark_as_refunded(self, request, queryset):
        updated = queryset.update(status="REFUNDED")
        self.message_user(
            request, f"🔄 {updated} factura(s) marcada(s) como reembolsadas", "info"
        )

    mark_as_refunded.short_description = "🔄 Marcar como REEMBOLSADAS"


# =============================================
# ADMIN DE PRODUCTOS - COMPLETO
# =============================================
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name_display",
        "price_info",
        "stock_status",
        "category_display",
        "user",
        "created_at_display",
        "product_actions",
    ]

    list_display_links = ["id", "name_display"]

    list_filter = ["category", "is_active", "created_at", "user", "stock"]

    search_fields = ["name", "sku", "barcode", "description", "user__username"]

    readonly_fields = [
        "created_at",
        "updated_at",
        "profit_margin_display",
        "tax_info_display",
        "stock_status_display",
        "sales_performance",
    ]

    fieldsets = (
        (
            "INFORMACIÓN BÁSICA",
            {"fields": ("user", "name", "description", "sku", "barcode", "is_active")},
        ),
        ("PRECIOS Y COSTOS", {"fields": ("price", "cost", "profit_margin_display")}),
        ("INVENTARIO", {"fields": ("stock", "min_stock", "stock_status_display")}),
        (
            "CATEGORÍA Y ESPECIFICACIONES",
            {
                "fields": ("category", "weight", "dimensions", "tax_rate"),
                "classes": ("collapse",),
            },
        ),
        (
            "INFORMACIÓN DE IMPUESTOS",
            {"fields": ("tax_info_display",), "classes": ("collapse",)},
        ),
        ("RENDIMIENTO", {"fields": ("sales_performance",), "classes": ("collapse",)}),
        ("IMAGEN", {"fields": ("image",), "classes": ("collapse",)}),
        (
            "METADATOS",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def name_display(self, obj):
        status_icon = "✅" if obj.is_active else "❌"
        return format_html(
            """
            <div style="min-width: 200px;">
                <strong>{}</strong> {}<br>
                <span style="color: #666; font-size: 12px;">SKU: {}</span>
            </div>
            """,
            obj.name,
            status_icon,
            obj.sku or "—",
        )

    name_display.short_description = "PRODUCTO"
    name_display.admin_order_field = "name"

    def price_info(self, obj):
        if obj.cost:
            margin_color = (
                "green"
                if obj.profit_margin > 30
                else "orange"
                if obj.profit_margin > 10
                else "red"
            )
            return format_html(
                """
                <div style="text-align: center;">
                    <strong style="color: #2D3748;">S/ {:,.2f}</strong><br>
                    <span style="color: {}; font-size: 11px;">{}% margen</span>
                </div>
                """,
                float(obj.price),
                margin_color,
                round(float(obj.profit_margin), 1),
            )
        return format_html(
            """
            <div style="text-align: center;">
                <strong style="color: #2D3748;">S/ {:,.2f}</strong><br>
                <span style="color: #999; font-size: 11px;">—</span>
            </div>
            """,
            float(obj.price),
        )

    price_info.short_description = "PRECIO"
    price_info.admin_order_field = "price"

    def stock_status(self, obj):
        if obj.is_out_of_stock:
            return format_html(
                '<span style="color: red; font-weight: bold;">❌ AGOTADO</span>'
            )
        elif obj.is_low_stock:
            return format_html(
                '<span style="color: orange; font-weight: bold;">⚠️ {} unidades</span>',
                obj.stock,
            )
        else:
            return format_html(
                '<span style="color: green;">✅ {} unidades</span>', obj.stock
            )

    stock_status.short_description = "STOCK"
    stock_status.admin_order_field = "stock"

    def category_display(self, obj):
        category_icons = {
            "PRODUCT": "📦",
            "SERVICE": "🛠️",
            "DIGITAL": "💻",
            "SUBSCRIPTION": "🔄",
            "OTHER": "📋",
        }
        icon = category_icons.get(obj.category, "📋")
        return format_html(
            '{}<br><span style="color: #666; font-size: 11px;">{}</span>',
            icon,
            obj.get_category_display(),
        )

    category_display.short_description = "CATEGORÍA"
    category_display.admin_order_field = "category"

    def created_at_display(self, obj):
        return obj.created_at.strftime("%d/%m/%Y")

    created_at_display.short_description = "CREADO"
    created_at_display.admin_order_field = "created_at"

    def product_actions(self, obj):
        return format_html(
            """
            <a href="{}" class="button" style="
                background: #4299E1; 
                color: white; 
                padding: 4px 8px; 
                border-radius: 3px; 
                text-decoration: none;
                font-size: 11px;
            ">
                Editar
            </a>
            """,
            reverse("admin:enterprise_product_change", args=[obj.id]),
        )

    product_actions.short_description = "ACCIONES"

    def profit_margin_display(self, obj):
        margin = obj.profit_margin
        if margin == 0:
            return format_html('<span style="color: #999;">—</span>')

        color = "green" if margin > 30 else "orange" if margin > 10 else "red"
        return format_html(
            """
            <div style="background: #f7fafc; padding: 10px; border-radius: 5px;">
                <strong>💰 Margen de Ganancia:</strong><br>
                <span style="color: {}; font-size: 18px; font-weight: bold;">{}%</span>
            </div>
            """,
            color,
            round(float(margin), 1),
        )

    profit_margin_display.short_description = "MARGEN DE GANANCIA"

    def tax_info_display(self, obj):
        return format_html(
            """
            <div style="background: #f0fff4; padding: 15px; border-radius: 5px;">
                <strong>💰 Información de Impuestos:</strong><br><br>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0;"><strong>Precio base:</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0; text-align: right;">S/ {:,.2f}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0;"><strong>IGV ({}%):</strong></td>
                        <td style="padding: 5px; border-bottom: 1px solid #E2E8F0; text-align: right;">S/ {:,.2f}</td>
                    </tr>
                    <tr style="background: #EBF8FF;">
                        <td style="padding: 8px;"><strong>Precio con IGV:</strong></td>
                        <td style="padding: 8px; text-align: right; font-weight: bold;">S/ {:,.2f}</td>
                    </tr>
                </table>
            </div>
            """,
            float(obj.price),
            float(obj.tax_rate),
            float(obj.tax_amount),
            float(obj.price_with_tax),
        )

    tax_info_display.short_description = "DESGLOSE DE IMPUESTOS"

    def stock_status_display(self, obj):
        status_config = {
            "out_of_stock": ("❌", "AGOTADO", "red", "#FED7D7"),
            "low_stock": ("⚠️", "STOCK BAJO", "orange", "#FEF5E7"),
            "in_stock": ("✅", "EN STOCK", "green", "#F0FFF4"),
        }

        icon, text, color, bg_color = status_config.get(
            obj.stock_status, ("📦", "DESCONOCIDO", "gray", "#F7FAFC")
        )

        return format_html(
            """
            <div style="
                background: {}; 
                color: {}; 
                padding: 10px; 
                border-radius: 5px; 
                text-align: center;
                border: 1px solid {};
            ">
                <div style="font-size: 24px;">{}</div>
                <div style="font-weight: bold; font-size: 16px;">{}</div>
                <div style="font-size: 14px; margin-top: 5px;">
                    <strong>Stock actual:</strong> {} unidades<br>
                    <strong>Stock mínimo:</strong> {} unidades
                </div>
            </div>
            """,
            bg_color,
            color,
            color,
            icon,
            text,
            obj.stock,
            obj.min_stock,
        )

    stock_status_display.short_description = "ESTADO DE INVENTARIO"

    def sales_performance(self, obj):
        # Aquí puedes agregar métricas reales de ventas
        return format_html(
            """
            <div style="background: #f7fafc; padding: 15px; border-radius: 5px;">
                <strong>📈 Rendimiento de Ventas</strong><br><br>
                <div style="color: #666;">
                    <div>• <strong>Total vendido:</strong> 0 unidades</div>
                    <div>• <strong>Ingresos totales:</strong> S/ 0.00</div>
                    <div>• <strong>Última venta:</strong> —</div>
                </div>
            </div>
            """
        )

    sales_performance.short_description = "RENDIMIENTO"

    actions = [
        "activate_products",
        "deactivate_products",
        "restock_products",
        "apply_10_percent_discount",
    ]

    def activate_products(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(
            request, f"✅ {updated} producto(s) activado(s) correctamente", "success"
        )

    activate_products.short_description = "✅ ACTIVAR productos seleccionados"

    def deactivate_products(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(
            request, f"✅ {updated} producto(s) desactivado(s)", "success"
        )

    deactivate_products.short_description = "❌ DESACTIVAR productos seleccionados"

    def restock_products(self, request, queryset):
        for product in queryset:
            product.stock += 10
            product.save()
        self.message_user(
            request,
            f"📦 Stock incrementado en 10 unidades para {queryset.count()} producto(s)",
            "success",
        )

    restock_products.short_description = "📦 Añadir 10 unidades de STOCK"

    def apply_10_percent_discount(self, request, queryset):
        for product in queryset:
            new_price = product.price * Decimal("0.9")  # 10% discount
            product.price = new_price.quantize(Decimal("0.01"))
            product.save()
        self.message_user(
            request,
            f"💰 Aplicado 10% de descuento a {queryset.count()} producto(s)",
            "success",
        )

    apply_10_percent_discount.short_description = "💰 Aplicar 10% de DESCUENTO"


# =============================================
# ADMIN DE ITEMS DE FACTURA - COMPLETO
# =============================================
@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "invoice_link",
        "product_link",
        "quantity",
        "unit_price_display",
        "total_display",
        "profit_display",
    ]

    list_display_links = ["id"]

    list_filter = ["invoice__status", "invoice__user", "created_at"]

    search_fields = ["product__name", "invoice__invoice_number", "invoice__client_name"]

    readonly_fields = [
        "subtotal_display",
        "tax_amount_display",
        "total_display",
        "profit_display",
        "created_at",
    ]

    def invoice_link(self, obj):
        return format_html(
            '<a href="{}">{}</a>',
            reverse("admin:enterprise_invoice_change", args=[obj.invoice.id]),
            obj.invoice.invoice_number,
        )

    invoice_link.short_description = "FACTURA"
    invoice_link.admin_order_field = "invoice"

    def product_link(self, obj):
        return format_html(
            '<a href="{}">{}</a>',
            reverse("admin:enterprise_product_change", args=[obj.product.id]),
            obj.product.name,
        )

    product_link.short_description = "PRODUCTO"
    product_link.admin_order_field = "product"

    def unit_price_display(self, obj):
        return format_html(
            '<span style="font-weight: bold;">S/ {:,.2f}</span>', float(obj.unit_price)
        )

    unit_price_display.short_description = "PRECIO UNIT."
    unit_price_display.admin_order_field = "unit_price"

    def total_display(self, obj):
        return format_html(
            '<span style="font-weight: bold; color: #2D3748;">S/ {:,.2f}</span>',
            float(obj.total),
        )

    total_display.short_description = "TOTAL"
    total_display.admin_order_field = "unit_price"

    def profit_display(self, obj):
        profit = obj.profit
        color = "green" if profit > 0 else "red" if profit < 0 else "gray"
        return format_html(
            '<span style="color: {}; font-weight: bold;">S/ {:,.2f}</span>',
            color,
            float(profit),
        )

    profit_display.short_description = "GANANCIA"
    profit_display.admin_order_field = "unit_price"

    def subtotal_display(self, obj):
        return f"S/ {obj.subtotal:,.2f}"

    subtotal_display.short_description = "SUBTOTAL"

    def tax_amount_display(self, obj):
        return f"S/ {obj.tax_amount:,.2f}"

    tax_amount_display.short_description = "IMPUESTO"


# =============================================
# CONFIGURACIÓN DEL SITIO ADMIN
# =============================================
admin.site.site_header = "DIMBOX - Sistema Empresarial"
admin.site.site_title = "DIMBOX Admin"
admin.site.index_title = "🏢 Administración del Módulo Empresarial"

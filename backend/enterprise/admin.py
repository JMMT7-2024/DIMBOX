# enterprise/admin.py - MÓDULO EMPRESARIAL COMPLETO
from django.contrib import admin
from django.utils.html import format_html
from .models import Client, Product, Invoice, InvoiceItem


# --- Admin de Clientes ---
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Admin simplificado para clientes"""

    list_display = [
        "name",
        "document_type",
        "document_number",
        "phone",
        "email",
        "created_by",
        "created_at",
    ]

    list_filter = ["document_type", "created_at"]
    search_fields = ["name", "document_number", "email", "phone"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "Información Personal",
            {"fields": ("name", "document_type", "document_number")},
        ),
        ("Información de Contacto", {"fields": ("phone", "email")}),
        ("Metadata", {"fields": ("created_by", "created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        """Asignar usuario automáticamente al crear"""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# --- Admin de Productos ---
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "user",
        "price_display",
        "cost_display",
        "profit_margin_display",
        "stock_display",
        "category_display",
        "is_active",
        "created_at",
    )
    list_filter = ("category", "is_active", "created_at", "user")
    search_fields = ("name", "sku", "description", "user__username")
    autocomplete_fields = ("user",)
    list_per_page = 25
    readonly_fields = (
        "created_at",
        "updated_at",
        "profit_margin_display",
        "tax_info_display",
    )

    fieldsets = (
        (
            "Información Básica",
            {"fields": ("user", "name", "description", "sku", "is_active")},
        ),
        ("Precios y Costos", {"fields": ("price", "cost", "profit_margin_display")}),
        ("Inventario", {"fields": ("stock", "category")}),
        (
            "Impuestos",
            {"fields": ("tax_rate", "tax_info_display"), "classes": ("collapse",)},
        ),
        ("Imagen", {"fields": ("image",), "classes": ("collapse",)}),
        (
            "Metadatos",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def price_display(self, obj):
        return format_html(
            '<span style="font-weight: bold; color: #2D3748;">S/ {:,.2f}</span>',
            float(obj.price),
        )

    price_display.short_description = "Precio"
    price_display.admin_order_field = "price"

    def cost_display(self, obj):
        if obj.cost:
            return format_html(
                '<span style="color: #718096;">S/ {:,.2f}</span>', float(obj.cost)
            )
        return format_html('<span style="color: #A0AEC0;">—</span>')

    cost_display.short_description = "Costo"
    cost_display.admin_order_field = "cost"

    def profit_margin_display(self, obj):
        margin = obj.profit_margin
        color = "green" if margin > 30 else "orange" if margin > 10 else "red"
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}%</span>',
            color,
            round(margin, 1),
        )

    profit_margin_display.short_description = "Margen"

    def stock_display(self, obj):
        if obj.stock == 0:
            return format_html(
                '<span style="color: red; font-weight: bold;">❌ AGOTADO</span>'
            )
        elif obj.stock <= 5:
            return format_html(
                '<span style="color: orange; font-weight: bold;">⚠️ {} unidades</span>',
                obj.stock,
            )
        else:
            return format_html(
                '<span style="color: green;">✅ {} unidades</span>', obj.stock
            )

    stock_display.short_description = "Stock"
    stock_display.admin_order_field = "stock"

    def category_display(self, obj):
        category_icons = {
            "SERVICE": "🛠️",
            "PRODUCT": "📦",
            "DIGITAL": "💻",
            "OTHER": "📋",
        }
        icon = category_icons.get(obj.category, "📋")
        return f"{icon} {obj.get_category_display()}"

    category_display.short_description = "Categoría"

    def tax_info_display(self, obj):
        return format_html(
            """
            <div style="background: #f0fff4; padding: 10px; border-radius: 5px;">
                <strong>💰 Información de Impuestos:</strong><br>
                • Precio base: S/ {:,.2f}<br>
                • IGV ({}%): S/ {:,.2f}<br>
                • Precio con IGV: S/ {:,.2f}
            </div>
            """,
            float(obj.price),
            float(obj.tax_rate),
            obj.tax_amount,
            obj.price_with_tax,
        )

    tax_info_display.short_description = "Desglose de Impuestos"

    actions = ["activate_products", "deactivate_products", "restock_products"]

    def activate_products(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"✅ {updated} productos activados")

    activate_products.short_description = "✅ Activar productos seleccionados"

    def deactivate_products(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"✅ {updated} productos desactivados")

    deactivate_products.short_description = "❌ Desactivar productos seleccionados"

    def restock_products(self, request, queryset):
        for product in queryset:
            product.stock += 10
            product.save()
        self.message_user(
            request,
            f"✅ Stock incrementado en 10 unidades para {queryset.count()} productos",
        )

    restock_products.short_description = "📦 Añadir 10 unidades de stock"


# --- Admin de Facturas ---
class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    readonly_fields = ("subtotal_display", "tax_amount_display", "total_display")
    fields = (
        "product",
        "quantity",
        "unit_price",
        "tax_rate",
        "subtotal_display",
        "tax_amount_display",
        "total_display",
    )

    def subtotal_display(self, obj):
        return f"S/ {obj.subtotal:,.2f}"

    subtotal_display.short_description = "Subtotal"

    def tax_amount_display(self, obj):
        return f"S/ {obj.tax_amount:,.2f}"

    tax_amount_display.short_description = "IGV"

    def total_display(self, obj):
        return f"S/ {obj.total:,.2f}"

    total_display.short_description = "Total"


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_number",
        "user",
        "client_name",
        "total_display",
        "status_display",
        "issue_date",
        "due_date_display",
        "is_overdue_display",
    )
    list_filter = ("status", "payment_method", "issue_date", "user")
    search_fields = ("invoice_number", "client_name", "client_ruc", "client_email")
    autocomplete_fields = ("user",)
    date_hierarchy = "issue_date"
    readonly_fields = (
        "created_at",
        "updated_at",
        "is_overdue_display",
        "totals_display",
        "days_until_due",
    )
    inlines = [InvoiceItemInline]

    fieldsets = (
        (
            "Información de Factura",
            {"fields": ("user", "invoice_number", "status", "payment_method")},
        ),
        (
            "Información del Cliente",
            {"fields": ("client_name", "client_ruc", "client_email", "client_address")},
        ),
        (
            "Fechas",
            {"fields": ("issue_date", "due_date", "paid_date", "days_until_due")},
        ),
        ("Totales", {"fields": ("subtotal", "tax_amount", "total", "totals_display")}),
        ("Estado", {"fields": ("is_overdue_display",), "classes": ("collapse",)}),
        (
            "Metadatos",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def total_display(self, obj):
        return format_html(
            '<span style="font-weight: bold; color: #2D3748;">S/ {:,.2f}</span>',
            float(obj.total),
        )

    total_display.short_description = "Total"
    total_display.admin_order_field = "total"

    def status_display(self, obj):
        status_config = {
            "DRAFT": ("✏️", "Borrador", "#718096"),
            "SENT": ("📤", "Enviada", "#4299E1"),
            "PAID": ("✅", "Pagada", "#48BB78"),
            "CANCELLED": ("❌", "Cancelada", "#F56565"),
        }
        icon, text, color = status_config.get(obj.status, ("📋", obj.status, "#A0AEC0"))
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} {}</span>',
            color,
            icon,
            text,
        )

    status_display.short_description = "Estado"
    status_display.admin_order_field = "status"

    def due_date_display(self, obj):
        from django.utils.timezone import now

        today = now().date()

        if obj.due_date < today:
            return format_html(
                '<span style="color: red; font-weight: bold;">{} ⚠️ VENCIDA</span>',
                obj.due_date.strftime("%d/%m/%Y"),
            )
        elif obj.due_date == today:
            return format_html(
                '<span style="color: orange; font-weight: bold;">{} 🚨 HOY</span>',
                obj.due_date.strftime("%d/%m/%Y"),
            )
        else:
            return obj.due_date.strftime("%d/%m/%Y")

    due_date_display.short_description = "Vence"

    def is_overdue_display(self, obj):
        if obj.is_overdue:
            return format_html(
                '<span style="color: red; font-weight: bold;">⚠️ FACTURA VENCIDA</span>'
            )
        return format_html('<span style="color: green;">✅ Al día</span>')

    is_overdue_display.short_description = "Estado de Vencimiento"

    def days_until_due(self, obj):
        from django.utils.timezone import now

        today = now().date()
        delta = obj.due_date - today
        days = delta.days

        if days < 0:
            return format_html(
                '<span style="color: red; font-weight: bold;">Hace {} días</span>',
                abs(days),
            )
        elif days == 0:
            return format_html(
                '<span style="color: orange; font-weight: bold;">Hoy</span>'
            )
        else:
            return format_html('<span style="color: green;">En {} días</span>', days)

    days_until_due.short_description = "Días hasta vencimiento"

    def totals_display(self, obj):
        return format_html(
            """
            <div style="background: #f0fff4; padding: 10px; border-radius: 5px;">
                <strong>🧮 Resumen de Totales:</strong><br>
                • Subtotal: S/ {:,.2f}<br>
                • IGV: S/ {:,.2f}<br>
                • <strong>Total: S/ {:,.2f}</strong>
            </div>
            """,
            float(obj.subtotal),
            float(obj.tax_amount),
            float(obj.total),
        )

    totals_display.short_description = "Desglose de Totales"

    actions = ["mark_as_paid", "mark_as_sent", "mark_as_cancelled"]

    def mark_as_paid(self, request, queryset):
        from django.utils.timezone import now

        updated = queryset.update(status="PAID", paid_date=now().date())
        self.message_user(request, f"✅ {updated} facturas marcadas como pagadas")

    mark_as_paid.short_description = "✅ Marcar como pagadas"

    def mark_as_sent(self, request, queryset):
        updated = queryset.update(status="SENT")
        self.message_user(request, f"✅ {updated} facturas marcadas como enviadas")

    mark_as_sent.short_description = "📤 Marcar como enviadas"

    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status="CANCELLED")
        self.message_user(request, f"✅ {updated} facturas marcadas como canceladas")

    mark_as_cancelled.short_description = "❌ Marcar como canceladas"


# --- Admin de Items de Factura ---
@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "invoice",
        "product",
        "quantity",
        "unit_price_display",
        "total_display",
    )
    list_filter = ("invoice__status", "invoice__user")
    search_fields = ("product__name", "invoice__invoice_number")
    autocomplete_fields = ("invoice", "product")
    readonly_fields = ("subtotal_display", "tax_amount_display", "total_display")

    def unit_price_display(self, obj):
        return f"S/ {obj.unit_price:,.2f}"

    unit_price_display.short_description = "Precio Unitario"

    def total_display(self, obj):
        return format_html(
            '<span style="font-weight: bold;">S/ {:,.2f}</span>', obj.total
        )

    total_display.short_description = "Total"
    total_display.admin_order_field = "unit_price"

    def subtotal_display(self, obj):
        return f"S/ {obj.subtotal:,.2f}"

    subtotal_display.short_description = "Subtotal"

    def tax_amount_display(self, obj):
        return f"S/ {obj.tax_amount:,.2f}"

    tax_amount_display.short_description = "IGV"

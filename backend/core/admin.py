# core/admin.py - VERSIÓN ACTUALIZADA CON MÓDULO EMPRESARIAL
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.html import format_html
from .models import User, Transaction, Product, Invoice, InvoiceItem


# --- Admin del usuario personalizado ---
@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = (
        "id",
        "username",
        "email",
        "name",
        "role",
        "subscription",
        "usage_display",  # ✅ NUEVO: Mostrar uso
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
    )
    list_filter = ("role", "subscription", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "name", "goal_name")
    ordering = ("id",)

    # ✅ NUEVO: Campos de solo lectura para estadísticas
    readonly_fields = (
        "record_count",
        "usage_stats_display",
        "effective_limits_display",
        "last_login",
        "date_joined",
    )

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Información personal", {"fields": ("email", "name")}),
        ("Meta de ahorro", {"fields": ("goal_name", "goal_amount")}),
        ("Gestión", {"fields": ("subscription", "role", "record_count")}),
        (
            "✅ Sistema de Límites",  # ✅ NUEVO: Sección para límites
            {
                "fields": (
                    "custom_limits",
                    "usage_stats_display",
                    "effective_limits_display",
                )
            },
        ),
        (
            "Permisos",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Fechas importantes", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "password1",
                    "password2",
                    "subscription",
                    "role",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )

    # ✅ NUEVO: Método para mostrar uso en listado
    def usage_display(self, obj):
        """Muestra el porcentaje de uso en la lista de usuarios"""
        usage_stats = obj.usage_stats
        percentage = usage_stats["usage_percentage"]
        transactions_count = usage_stats["transactions_count"]

        # Color según el porcentaje de uso
        if percentage >= 100:
            color = "red"
            status = "❌ EXCEDIDO"
        elif percentage >= 80:
            color = "orange"
            status = "⚠️ CERCA"
        else:
            color = "green"
            status = "✅ OK"

        return format_html(
            '<span style="color: {};">{} ({}/{} - {}%)</span>',
            color,
            status,
            transactions_count,
            obj.effective_limits.get("maxTransactions", 100),
            percentage,
        )

    usage_display.short_description = "Uso de Límites"
    usage_display.admin_order_field = "record_count"

    # ✅ NUEVO: Método para mostrar estadísticas de uso en detalle
    def usage_stats_display(self, obj):
        """Muestra estadísticas detalladas de uso"""
        usage_stats = obj.usage_stats
        limits = obj.effective_limits

        return format_html(
            """
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                <strong>📊 Estadísticas de Uso:</strong><br>
                • Transacciones: {count} / {max_tx} ({percentage}%)<br>
                • Monto total: S/ {amount:,.2f}<br>
                • Límite por transacción: S/ {max_amount:,.2f}<br>
                • Puede exportar: {can_export}<br>
                • Análisis avanzado: {can_analytics}
            </div>
            """,
            count=usage_stats["transactions_count"],
            max_tx=limits.get("maxTransactions", 100),
            percentage=usage_stats["usage_percentage"],
            amount=usage_stats["total_amount"],
            max_amount=limits.get("maxTransactionAmount", 10000),
            can_export="✅ Sí" if limits.get("canExport", False) else "❌ No",
            can_analytics="✅ Sí"
            if limits.get("canAdvancedAnalytics", False)
            else "❌ No",
        )

    usage_stats_display.short_description = "Estadísticas de Uso"

    # ✅ NUEVO: Método para mostrar límites efectivos
    def effective_limits_display(self, obj):
        """Muestra los límites efectivos del usuario"""
        limits = obj.effective_limits
        plan_type = "PREMIUM 🚀" if obj.subscription == "PREMIUM" else "FREE"
        limits_source = "Personalizados ⚙️" if obj.custom_limits else "Por defecto 📋"

        return format_html(
            """
            <div style="background: #e8f4fd; padding: 10px; border-radius: 5px;">
                <strong>🎯 Límites Efectivos:</strong><br>
                • Plan: {plan} ({source})<br>
                • Transacciones máx: {max_tx}<br>
                • Monto máx/transacción: S/ {max_amount:,.2f}<br>
                • Cuentas rápidas: {max_accounts}<br>
                • Categorías: {max_categories}<br>
                • Retención: {retention} meses<br>
                • Exportación: {export}<br>
                • Análisis avanzado: {analytics}
            </div>
            """,
            plan=plan_type,
            source=limits_source,
            max_tx=limits.get("maxTransactions", 100),
            max_amount=limits.get("maxTransactionAmount", 10000),
            max_accounts=limits.get("maxQuickAccounts", 3),
            max_categories=limits.get("maxCategories", 8),
            retention=limits.get("retentionMonths", 3),
            export="✅ Sí" if limits.get("canExport", False) else "❌ No",
            analytics="✅ Sí" if limits.get("canAdvancedAnalytics", False) else "❌ No",
        )

    effective_limits_display.short_description = "Límites Efectivos"

    # ✅ NUEVO: Acciones personalizadas
    actions = ["upgrade_to_premium", "downgrade_to_free", "reset_limits"]

    def upgrade_to_premium(self, request, queryset):
        """Actualizar usuarios seleccionados a Premium"""
        updated = queryset.update(subscription="PREMIUM")
        self.message_user(request, f"✅ {updated} usuarios actualizados a PREMIUM")

    upgrade_to_premium.short_description = "🔄 Actualizar a PREMIUM"

    def downgrade_to_free(self, request, queryset):
        """Actualizar usuarios seleccionados a Free"""
        updated = queryset.update(subscription="FREE")
        self.message_user(request, f"✅ {updated} usuarios actualizados a FREE")

    downgrade_to_free.short_description = "🔄 Actualizar a FREE"

    def reset_limits(self, request, queryset):
        """Restablecer límites personalizados a valores por defecto"""
        updated = queryset.update(custom_limits=None)
        self.message_user(request, f"✅ Límites restablecidos para {updated} usuarios")

    reset_limits.short_description = "🔄 Restablecer límites personalizados"


# --- Admin de transacciones ---
@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "transaction_type_display",  # ✅ MEJORADO: Con iconos
        "amount_display",  # ✅ MEJORADO: Formato moneda
        "category_display",  # ✅ MEJORADO: Con colores
        "date",
        "days_ago",  # ✅ NUEVO: Días desde la transacción
    )
    list_filter = ("transaction_type", "category", "date", "user")
    search_fields = ("description", "user__username", "user__email")
    autocomplete_fields = ("user",)
    date_hierarchy = "date"
    list_per_page = 50

    # ✅ NUEVO: Campos de solo lectura
    readonly_fields = ("created_at", "days_ago_display")

    fieldsets = (
        (None, {"fields": ("user", "transaction_type", "amount", "date")}),
        ("Detalles", {"fields": ("category", "description")}),
        (
            "Metadatos",
            {"fields": ("created_at", "days_ago_display"), "classes": ("collapse",)},
        ),
    )

    # ✅ NUEVO: Método para mostrar tipo de transacción con iconos
    def transaction_type_display(self, obj):
        if obj.transaction_type == "IN":
            return format_html('<span style="color: green;">📥 INGRESO</span>')
        else:
            return format_html('<span style="color: red;">📤 GASTO</span>')

    transaction_type_display.short_description = "Tipo"
    transaction_type_display.admin_order_field = "transaction_type"

    # ✅ NUEVO: Método para mostrar monto formateado
    def amount_display(self, obj):
        color = "green" if obj.transaction_type == "IN" else "red"
        return format_html(
            '<span style="color: {}; font-weight: bold;">S/ {:,.2f}</span>',
            color,
            float(obj.amount),
        )

    amount_display.short_description = "Monto"
    amount_display.admin_order_field = "amount"

    # ✅ NUEVO: Método para mostrar categoría con colores
    def category_display(self, obj):
        if not obj.category:
            return format_html('<span style="color: #666;">—</span>')

        category_colors = {
            "AL": "#48BB78",
            "TR": "#4299E1",
            "SE": "#ED8936",
            "VI": "#9F7AEA",
            "OC": "#F56565",
            "SA": "#38B2AC",
            "ED": "#ECC94B",
            "OT": "#A0AEC0",
        }

        category_names = {
            "AL": "Alimentación",
            "TR": "Transporte",
            "SE": "Servicios",
            "VI": "Vivienda",
            "OC": "Ocio",
            "SA": "Salud",
            "ED": "Educación",
            "OT": "Otros",
        }

        color = category_colors.get(obj.category, "#A0AEC0")
        name = category_names.get(obj.category, obj.category)

        return format_html(
            '<span style="color: {}; background: {}20; padding: 2px 6px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            color,
            name,
        )

    category_display.short_description = "Categoría"
    category_display.admin_order_field = "category"

    # ✅ NUEVO: Método para mostrar días desde la transacción
    def days_ago(self, obj):
        from django.utils.timezone import now

        delta = now().date() - obj.date
        days = delta.days

        if days == 0:
            return "Hoy"
        elif days == 1:
            return "Ayer"
        elif days < 7:
            return f"{days}d"
        elif days < 30:
            weeks = days // 7
            return f"{weeks}sem"
        else:
            months = days // 30
            return f"{months}m"

    days_ago.short_description = "Hace"
    days_ago.admin_order_field = "date"

    # ✅ NUEVO: Método para detalle
    def days_ago_display(self, obj):
        from django.utils.timezone import now

        delta = now().date() - obj.date
        return f"{delta.days} días ({obj.date})"

    days_ago_display.short_description = "Días desde transacción"


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


# ✅ NUEVO: Panel personalizado para el admin
class CustomAdminSite(admin.AdminSite):
    site_header = "🏦 DIMBOX - Administración"
    site_title = "DIMBOX Admin"
    index_title = "Dashboard de Administración"


# ✅ Registrar modelos con el admin site personalizado si es necesario
# admin_site = CustomAdminSite(name='custom_admin')
# admin_site.register(User, UserAdmin)
# admin_site.register(Transaction, TransactionAdmin)
# admin_site.register(Product, ProductAdmin)
# admin_site.register(Invoice, InvoiceAdmin)
# admin_site.register(InvoiceItem, InvoiceItemAdmin)

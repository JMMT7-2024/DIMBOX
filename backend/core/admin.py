# core/admin.py - VERSIÓN LIMPIA (SOLO CORE)
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.html import format_html
from .models import User, Transaction  # ✅ SOLO modelos de core


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
        "usage_display",
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
    )
    list_filter = ("role", "subscription", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "name", "goal_name")
    ordering = ("id",)

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
            "✅ Sistema de Límites",
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

    def usage_display(self, obj):
        """Muestra el porcentaje de uso en la lista de usuarios"""
        usage_stats = obj.usage_stats
        percentage = usage_stats["usage_percentage"]
        transactions_count = usage_stats["transactions_count"]

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
        "transaction_type_display",
        "amount_display",
        "category_display",
        "date",
        "days_ago",
    )
    list_filter = ("transaction_type", "category", "date", "user")
    search_fields = ("description", "user__username", "user__email")
    autocomplete_fields = ("user",)
    date_hierarchy = "date"
    list_per_page = 50

    readonly_fields = ("created_at", "days_ago_display")

    fieldsets = (
        (None, {"fields": ("user", "transaction_type", "amount", "date")}),
        ("Detalles", {"fields": ("category", "description")}),
        (
            "Metadatos",
            {"fields": ("created_at", "days_ago_display"), "classes": ("collapse",)},
        ),
    )

    def transaction_type_display(self, obj):
        if obj.transaction_type == "IN":
            return format_html('<span style="color: green;">📥 INGRESO</span>')
        else:
            return format_html('<span style="color: red;">📤 GASTO</span>')

    transaction_type_display.short_description = "Tipo"
    transaction_type_display.admin_order_field = "transaction_type"

    def amount_display(self, obj):
        color = "green" if obj.transaction_type == "IN" else "red"
        return format_html(
            '<span style="color: {}; font-weight: bold;">S/ {:,.2f}</span>',
            color,
            float(obj.amount),
        )

    amount_display.short_description = "Monto"
    amount_display.admin_order_field = "amount"

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

    def days_ago_display(self, obj):
        from django.utils.timezone import now

        delta = now().date() - obj.date
        return f"{delta.days} días ({obj.date})"

    days_ago_display.short_description = "Días desde transacción"

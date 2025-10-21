# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User, Transaction  # <-- solo estos dos


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
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
    )
    list_filter = ("role", "subscription", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "name", "goal_name")
    ordering = ("id",)

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Información personal", {"fields": ("email", "name")}),
        ("Meta de ahorro", {"fields": ("goal_name", "goal_amount")}),
        ("Gestión", {"fields": ("subscription", "role", "record_count")}),
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


# --- Admin de transacciones ---
@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "transaction_type",
        "amount",
        "category",
        "date",
        "created_at",
    )
    list_filter = ("transaction_type", "category", "date")
    search_fields = ("description", "user__username", "user__email")
    autocomplete_fields = ("user",)
    date_hierarchy = "date"

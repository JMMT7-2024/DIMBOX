# /root/DIMBOX/backend/enterprise/admin.py
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Admin para clientes"""

    list_display = [
        "name",
        "document_type",
        "document_number",
        "email",
        "is_active",
        "enterprise",
    ]
    list_filter = ["enterprise", "client_type", "document_type", "is_active"]
    search_fields = ["name", "document_number", "email"]
    readonly_fields = ["created_at", "updated_at"]

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

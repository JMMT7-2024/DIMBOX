from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import QuickAccount
from .serializers import QuickAccountSerializer, QuickAccountUpdateSerializer


class QuickAccountsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Obtener cuentas rápidas del usuario"""
        try:
            quick_account, created = QuickAccount.objects.get_or_create(
                user=request.user,
                defaults={
                    "title": "Mis Cuentas Rápidas",
                    "description": "Gestión rápida de ingresos y gastos",
                    "currency": "PEN",
                },
            )

            serializer = QuickAccountSerializer(quick_account)

            return Response(
                {
                    "success": True,
                    "data": serializer.data["complete_data"],
                    "created": created,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": f"Error al cargar cuentas rápidas: {str(e)}",
                    "data": self._get_default_structure(),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Crear o actualizar cuentas rápidas"""
        try:
            # Validar datos de entrada
            update_serializer = QuickAccountUpdateSerializer(data=request.data)
            if not update_serializer.is_valid():
                return Response(
                    {
                        "success": False,
                        "error": "Datos inválidos",
                        "details": update_serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            data = update_serializer.validated_data["data"]

            quick_account, created = QuickAccount.objects.get_or_create(
                user=request.user
            )

            # Actualizar datos usando el método del modelo
            quick_account.update_from_complete_data(data)

            serializer = QuickAccountSerializer(quick_account)

            return Response(
                {
                    "success": True,
                    "message": "Cuentas rápidas guardadas correctamente",
                    "data": serializer.data["complete_data"],
                    "created": created,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": f"Error al guardar cuentas rápidas: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request):
        """Actualizar cuentas rápidas (alias de POST)"""
        return self.post(request)

    def patch(self, request):
        """Actualización parcial de cuentas rápidas"""
        try:
            quick_account = get_object_or_404(QuickAccount, user=request.user)
            data = request.data.get("data", {})

            # Merge con datos existentes
            current_data = quick_account.get_complete_data()
            merged_data = self._merge_quick_accounts_data(current_data, data)

            quick_account.update_from_complete_data(merged_data)
            serializer = QuickAccountSerializer(quick_account)

            return Response(
                {
                    "success": True,
                    "message": "Cuentas rápidas actualizadas parcialmente",
                    "data": serializer.data["complete_data"],
                }
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": f"Error en actualización parcial: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request):
        """Eliminar todas las cuentas rápidas del usuario (reset)"""
        try:
            deleted_count, _ = QuickAccount.objects.filter(user=request.user).delete()

            message = (
                "Cuentas rápidas eliminadas correctamente"
                if deleted_count > 0
                else "No existían cuentas rápidas para eliminar"
            )

            return Response(
                {"success": True, "message": message, "deleted_count": deleted_count},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": f"Error al eliminar cuentas rápidas: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _get_default_structure(self):
        """Estructura por defecto para errores"""
        return {
            "quickAccount": {
                "title": "Mis Cuentas Rápidas",
                "description": "",
                "currency": "PEN",
            },
            "entries": [],
            "expenses": [],
            "lastModified": timezone.now().isoformat(),
        }

    def _merge_quick_accounts_data(self, current, updates):
        """Merge recursivo de datos de cuentas rápidas"""
        result = current.copy()

        for key, value in updates.items():
            if (
                key in result
                and isinstance(result[key], dict)
                and isinstance(value, dict)
            ):
                result[key] = self._merge_quick_accounts_data(result[key], value)
            else:
                result[key] = value

        return result

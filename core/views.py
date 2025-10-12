# core/views.py

from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import serializers

from .models import User, Transaction
from .serializers import TransactionSerializer
# core/views.py
import csv
from django.http import HttpResponse

# --- Serializers Específicos de Vistas ---
# Se definen aquí para mantener la lógica de usuario junta.

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer para el registro de nuevos usuarios.
    Maneja la creación segura de la contraseña.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'name']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', '')
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer para ver y actualizar el perfil del usuario.
    No expone campos sensibles como la contraseña.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'name', 'goal_name', 'goal_amount']
        read_only_fields = ['id', 'username', 'email'] # Campos que no se pueden cambiar desde el perfil

# --- Vistas de Autenticación y Perfil ---

class RegisterView(generics.CreateAPIView):
    """
    Endpoint para que nuevos usuarios se registren.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class ProfileView(APIView):
    """
    Endpoint para que un usuario autenticado vea y actualice su perfil.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Maneja peticiones GET para obtener los datos del perfil."""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        """Maneja peticiones PUT para actualizar el perfil."""
        user = request.user
        # partial=True permite actualizar solo algunos campos, no todos.
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- Vista para Transacciones ---

class TransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet que maneja todas las operaciones CRUD para las transacciones.
    (Crear, Leer, Actualizar, Borrar)
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Esta función asegura que un usuario solo pueda ver y manipular
        SUS PROPIAS transacciones. Es una medida de seguridad clave.
        """
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Esta función asigna automáticamente el usuario actual (obtenido del token)
        al crear una nueva transacción, previniendo que se asigne a otro usuario.
        """
        serializer.save(user=self.request.user)

# core/views.py

# ... (Tus otras vistas: RegisterView, ProfileView, TransactionViewSet) ...

# --- VISTA PARA EXPORTAR DATOS ---

class ExportCSVView(APIView):
    """
    Endpoint protegido que genera un archivo CSV con todas las
    transacciones del usuario que realiza la petición.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Prepara la respuesta HTTP como un archivo CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="movimientos.csv"'

        # 2. Crea un "escritor" de CSV que trabajará sobre la respuesta
        writer = csv.writer(response)

        # 3. Escribe la fila de encabezados
        writer.writerow(['ID', 'Fecha', 'Tipo', 'Monto', 'Categoría', 'Descripción'])

        # 4. Obtiene todas las transacciones del usuario, ordenadas por fecha
        transactions = Transaction.objects.filter(user=request.user).order_by('date')

        # 5. Escribe cada transacción como una fila en el archivo
        for tx in transactions:
            # Mapeamos la abreviatura de la categoría a su nombre completo para claridad
            category_map = {'AL': 'Alimentación', 'TR': 'Transporte', 'SE': 'Servicios', 'VI': 'Vivienda', 'OC': 'Ocio', 'SA': 'Salud', 'ED': 'Educación', 'OT': 'Otros'}
            category_name = category_map.get(tx.category, '') if tx.category else ''

            writer.writerow([
                tx.id,
                tx.date,
                'Ingreso' if tx.transaction_type == 'IN' else 'Gasto',
                tx.amount,
                category_name,
                tx.description
            ])

        # 6. Devuelve el archivo CSV completo
        return response
# core/views.py
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import User, Transaction
from .serializers import UserSerializer, TransactionSerializer

# generics.CreateAPIView nos da la funcionalidad para crear un objeto.
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        # isValid() revisa si los datos son correctos (ej. email válido)
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        else:
            # Si los datos no son válidos, devolvemos los errores.
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
class ProfileView(APIView):
    # Esta línea es la magia. Automáticamente revisará el token.
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 'request.user' es el usuario autenticado gracias al token.
        user = request.user
        # Usamos el mismo serializer que para el registro, pero solo para leer datos.
        serializer = UserSerializer(user)
        return Response(serializer.data)
        
class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated] # Protegemos todas las acciones

    # Esta función asegura que un usuario SOLO pueda ver SUS propias transacciones.
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    # Esta función asigna automáticamente el usuario actual al crear una nueva transacción.
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

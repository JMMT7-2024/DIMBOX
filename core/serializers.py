# core/serializers.py
from rest_framework import serializers
from .models import User
from .models import User, Transaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Estos son los campos que pediremos al registrar un usuario
        fields = ['id', 'username', 'email', 'password', 'name']
        # Hacemos que la contraseña sea de solo escritura (no se podrá leer)
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Usamos el método create_user para que la contraseña se guarde
        # de forma segura (encriptada) y no como texto plano.
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', '')
        )
        return user
    
class TransactionSerializer(serializers.ModelSerializer):
    # Hacemos que el campo 'user' sea de solo lectura.
    # Lo asignaremos automáticamente desde el token, no desde los datos que envía el usuario.
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Transaction
        # Definimos todos los campos que nuestra API manejará
        fields = ['id', 'user', 'transaction_type', 'amount', 'date', 'description', 'category']
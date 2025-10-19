# core/serializers.py
from rest_framework import serializers
from .models import User, Transaction

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id','username','email','password','name',
            'subscription','role','record_count','goal_name','goal_amount','is_active'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'subscription': {'read_only': True},
            'role': {'read_only': True},
            'record_count': {'read_only': True},
            'is_active': {'read_only': True},
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data.get('name', '')
        )
        # por defecto FREE, is_active=True (permitimos iniciar sesión)
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name','goal_name','goal_amount']


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['subscription','role','is_active']


class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    class Meta:
        model = Transaction
        fields = ['id','user','transaction_type','amount','date','description','category']



class AdminUserSerializer(serializers.ModelSerializer):
    record_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "name",
            "subscription", "role", "is_active", "record_count",
            "date_joined", "last_login",
        )


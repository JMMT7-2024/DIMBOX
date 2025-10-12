# core/urls.py

from django.urls import path,include
from .views import RegisterView
# 👇 Importamos las vistas que nos da la librería JWT
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import RegisterView, ProfileView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter
from .views import RegisterView, ProfileView, TransactionViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Creamos un router
router = DefaultRouter()
# Registramos nuestro ViewSet. Django creará las URLs automáticamente.
# El prefijo será 'transactions' (ej: /api/transactions/)
router.register('transactions', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    # 👇 Esta URL recibirá el username y password, y devolverá los tokens
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # 👇 Esta URL recibirá un "refresh token" para generar un nuevo "access token"
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    # 👇 Añadimos las URLs generadas por el router a nuestra lista
    path('', include(router.urls)),
]

# Creamos un router
router = DefaultRouter()
# Registramos nuestro ViewSet. Django creará las URLs automáticamente.
# El prefijo será 'transactions' (ej: /api/transactions/)
router.register('transactions', TransactionViewSet, basename='transaction')

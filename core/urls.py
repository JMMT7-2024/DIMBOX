from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from .views import RegisterView, MeView, TransactionListCreateView, TransactionDetailView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),           # <-- aquí
    path('me/', MeView.as_view(), name='me'),

    path('transactions/', TransactionListCreateView.as_view(), name='tx-list'),
    path('transactions/<int:pk>/', TransactionDetailView.as_view(), name='tx-detail'),

    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]

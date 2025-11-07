from django.urls import path
from . import views

app_name = "social_auth"

urlpatterns = [
    # Mantener Google temporalmente
    path("google/login/", views.GoogleLoginView.as_view(), name="google-login"),
    # ✅ NUEVO: Firebase endpoint
    path("firebase/login/", views.FirebaseLoginView.as_view(), name="firebase-login"),
    path("health/", views.SocialAuthHealthView.as_view(), name="auth-health"),
]

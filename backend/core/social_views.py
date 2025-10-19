# core/social_views.py
from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse
from django.views import View
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.microsoft.views import MicrosoftGraphOAuth2Adapter
from allauth.socialaccount.helpers import complete_social_login
from allauth.socialaccount.models import SocialApp
from allauth.socialaccount import providers
from allauth.account.utils import perform_login
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login as django_login

# 1) Botón "Iniciar con Google/Microsoft" -> redirigimos a /accounts/<provider>/login/
class GoogleStart(View):
    def get(self, request):
        return redirect('/accounts/google/login/')

class MicrosoftStart(View):
    def get(self, request):
        return redirect('/accounts/microsoft/login/')

# 2) Tras el callback del proveedor, Allauth terminará autenticando al usuario.
#    Configuramos LOGIN_REDIRECT_URL para caer aquí y emitir JWT:
class SocialCompleteView(View):
    def get(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            # Algo falló en OAuth
            return redirect(f"{settings.SOCIAL_SUCCESS_REDIRECT}?error=social_login_failed")

        # Generar SimpleJWT
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh = str(refresh)

        # Redirigir al frontend: login.html recogerá y guardará los tokens en localStorage
        url = f"{settings.SOCIAL_SUCCESS_REDIRECT}?access={access}&refresh={refresh}"
        return redirect(url)

import requests
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


class GoogleAuthService:
    """
    Servicio independiente para manejar autenticación con Google
    """

    @staticmethod
    def validate_google_token(access_token):
        """
        Valida el token de Google y obtiene información del usuario
        """
        try:
            response = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                params={"access_token": access_token},
                timeout=10,
            )

            if response.status_code != 200:
                return None, "Token de Google inválido o expirado"

            user_data = response.json()

            # Validar datos esenciales
            if not user_data.get("email"):
                return None, "Email no proporcionado por Google"

            return user_data, None

        except requests.Timeout:
            return None, "Timeout al validar con Google"
        except requests.RequestException:
            return None, "Error de conexión con Google"
        except Exception as e:
            return None, f"Error inesperado: {str(e)}"

    @staticmethod
    def get_or_create_user(google_user_data):
        """
        Crea o obtiene usuario basado en datos de Google
        """
        email = google_user_data["email"]

        try:
            # Buscar usuario existente
            user = User.objects.filter(email=email).first()

            if user:
                # Usuario existe, actualizar información si es necesario
                updated = False
                if not user.name and google_user_data.get("name"):
                    user.name = google_user_data.get("name")
                    updated = True

                if not user.username and google_user_data.get("email"):
                    user.username = google_user_data.get("email")
                    updated = True

                if updated:
                    user.save()

                return user, False  # Usuario existente

            else:
                # Crear nuevo usuario
                user = User.objects.create(
                    email=email,
                    username=email,  # Email como username
                    name=google_user_data.get("name", ""),
                    is_active=True,
                    # Otros campos por defecto si es necesario
                )
                return user, True  # Nuevo usuario

        except Exception as e:
            return None, f"Error creando usuario: {str(e)}"

    @staticmethod
    def format_user_response(user, is_new_user=False):
        """
        Formatea la respuesta del usuario para el frontend
        """
        from social_auth.serializers import UserSerializer

        return UserSerializer(user).data

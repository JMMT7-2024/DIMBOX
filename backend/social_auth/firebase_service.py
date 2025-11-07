import firebase_admin
from firebase_admin import auth, credentials
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import json
import logging

logger = logging.getLogger("social_auth")

User = get_user_model()


class FirebaseAuthService:
    """
    Servicio para autenticación con Firebase
    """

    _initialized = False

    @classmethod
    def initialize_firebase(cls):
        """Inicializar Firebase Admin SDK una sola vez"""
        if not cls._initialized:
            try:
                # Opción 1: Desde variable de entorno con JSON string
                if (
                    hasattr(settings, "FIREBASE_CREDENTIALS_JSON")
                    and settings.FIREBASE_CREDENTIALS_JSON
                ):
                    cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                    cred = credentials.Certificate(cred_dict)
                # Opción 2: Desde archivo (para desarrollo)
                else:
                    cred_path = getattr(settings, "FIREBASE_CREDENTIALS_PATH", None)
                    if cred_path:
                        cred = credentials.Certificate(cred_path)
                    else:
                        # Fallback: intentar con variable de entorno genérica
                        import os

                        firebase_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
                        if firebase_json:
                            cred_dict = json.loads(firebase_json)
                            cred = credentials.Certificate(cred_dict)
                        else:
                            raise ValueError("Firebase credentials not configured")

                firebase_admin.initialize_app(cred)
                cls._initialized = True
                logger.info("✅ Firebase Admin SDK inicializado correctamente")
            except Exception as e:
                logger.error(f"❌ Error inicializando Firebase: {str(e)}")
                # No lanzar excepción para no romper el servidor
                # raise

    @classmethod
    def verify_firebase_token(cls, id_token):
        """
        Verifica el token de Firebase y devuelve los datos del usuario
        """
        try:
            cls.initialize_firebase()

            # Verificar token con Firebase Admin
            decoded_token = auth.verify_id_token(id_token)

            # Extraer información del usuario
            user_data = {
                "uid": decoded_token["uid"],
                "email": decoded_token.get("email"),
                "name": decoded_token.get("name", ""),
                "picture": decoded_token.get("picture", ""),
                "email_verified": decoded_token.get("email_verified", False),
            }

            logger.info(f"✅ Token verificado para: {user_data['email']}")
            return user_data, None

        except auth.InvalidIdTokenError:
            return None, "Token de Firebase inválido"
        except auth.ExpiredIdTokenError:
            return None, "Token de Firebase expirado"
        except auth.RevokedIdTokenError:
            return None, "Token de Firebase revocado"
        except Exception as e:
            logger.error(f"❌ Error verificando token: {str(e)}")
            return None, f"Error del servidor: {str(e)}"

    @classmethod
    def get_or_create_user(cls, firebase_user_data):
        """
        Crea o obtiene usuario basado en datos de Firebase
        """
        email = firebase_user_data["email"]

        try:
            # Buscar usuario por email
            user = User.objects.filter(email=email).first()

            if user:
                # Usuario existe, actualizar información si es necesario
                updated = False
                if not user.name and firebase_user_data.get("name"):
                    user.name = firebase_user_data.get("name")
                    updated = True

                if not user.username and email:
                    user.username = email
                    updated = True

                if updated:
                    user.save()

                logger.info(f"✅ Usuario existente: {email}")
                return user, False  # Usuario existente

            else:
                # Crear nuevo usuario
                user = User.objects.create(
                    email=email,
                    username=email,
                    name=firebase_user_data.get("name", ""),
                    is_active=True,
                )
                logger.info(f"✅ Nuevo usuario creado: {email}")
                return user, True  # Nuevo usuario

        except Exception as e:
            logger.error(f"❌ Error creando usuario: {str(e)}")
            return None, f"Error creando usuario: {str(e)}"

    @classmethod
    def get_jwt_tokens_for_user(cls, user):
        """
        Genera tokens JWT para el usuario (tu sistema actual)
        """
        refresh = RefreshToken.for_user(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

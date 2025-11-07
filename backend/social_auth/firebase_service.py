# social_auth/firebase_service.py - VERSIÓN COMPATIBLE CON TU MODELO
import firebase_admin
from firebase_admin import auth, credentials
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import json
import logging
import os

logger = logging.getLogger("social_auth")

User = get_user_model()


class FirebaseAuthService:
    """
    Servicio para autenticación con Firebase - COMPATIBLE CON TU MODELO USER
    """

    _initialized = False

    @classmethod
    def initialize_firebase(cls):
        """Inicializar Firebase Admin SDK una sola vez - CORREGIDO"""
        if cls._initialized:
            return True

        try:
            logger.info("🔄 Inicializando Firebase Admin SDK...")

            # ✅ OPCIÓN 1: Desde variable de entorno (RENDER)
            firebase_json_env = os.environ.get("FIREBASE_CREDENTIALS")
            if firebase_json_env:
                logger.info("📁 Usando credenciales de variable de entorno")
                cred_dict = json.loads(firebase_json_env)
                cred = credentials.Certificate(cred_dict)

            # ✅ OPCIÓN 2: Desde settings (alternativa)
            elif (
                hasattr(settings, "FIREBASE_CREDENTIALS_JSON")
                and settings.FIREBASE_CREDENTIALS_JSON
            ):
                logger.info("📁 Usando credenciales de settings")
                cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
                cred = credentials.Certificate(cred_dict)

            # ✅ OPCIÓN 3: Desde archivo (desarrollo)
            elif (
                hasattr(settings, "FIREBASE_CREDENTIALS_PATH")
                and settings.FIREBASE_CREDENTIALS_PATH
            ):
                logger.info("📁 Usando credenciales de archivo")
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)

            else:
                logger.error("❌ No se encontraron credenciales de Firebase")
                logger.info("💡 Configura FIREBASE_CREDENTIALS en variables de entorno")
                return False

            # ✅ INICIALIZAR solo si no está inicializado
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
                logger.info("✅ Firebase Admin SDK inicializado correctamente")
            else:
                logger.info("✅ Firebase ya estaba inicializado")

            cls._initialized = True
            return True

        except json.JSONDecodeError as e:
            logger.error(f"❌ Error parseando JSON de Firebase: {e}")
            return False
        except ValueError as e:
            logger.error(f"❌ Error en credenciales de Firebase: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Error crítico inicializando Firebase: {str(e)}")
            return False

    @classmethod
    def verify_firebase_token(cls, id_token):
        """
        Verifica el token de Firebase y devuelve los datos del usuario - CORREGIDO
        """
        # ✅ Asegurar que Firebase esté inicializado PRIMERO
        if not cls.initialize_firebase():
            return None, "Firebase no configurado en el servidor"

        try:
            logger.info("🔐 Verificando token Firebase...")

            # ✅ Verificar token con Firebase Admin
            decoded_token = auth.verify_id_token(id_token)

            # ✅ Extraer información completa del usuario
            firebase_uid = decoded_token["uid"]
            email = decoded_token.get("email")

            if not email:
                return None, "El token de Firebase no contiene email"

            user_data = {
                "firebase_uid": firebase_uid,
                "email": email,
                "name": decoded_token.get("name", ""),
                "picture": decoded_token.get("picture", ""),
                "email_verified": decoded_token.get("email_verified", False),
                "phone_number": decoded_token.get("phone_number", ""),
            }

            logger.info(f"✅ Token verificado para: {email} (UID: {firebase_uid})")
            return user_data, None

        except auth.InvalidIdTokenError as e:
            logger.error(f"❌ Token inválido: {e}")
            return None, "Token de Firebase inválido"
        except auth.ExpiredIdTokenError as e:
            logger.error(f"❌ Token expirado: {e}")
            return None, "Token de Firebase expirado"
        except auth.RevokedIdTokenError as e:
            logger.error(f"❌ Token revocado: {e}")
            return None, "Token de Firebase revocado"
        except Exception as e:
            logger.error(f"❌ Error verificando token: {str(e)}")
            return None, f"Error del servidor: {str(e)}"

    @classmethod
    def get_or_create_user(cls, firebase_user_data):
        """
        Crea o obtiene usuario - COMPATIBLE CON TU MODELO USER
        """
        try:
            email = firebase_user_data["email"]
            firebase_uid = firebase_user_data["firebase_uid"]
            firebase_name = firebase_user_data.get("name", "")

            logger.info(f"🔍 Buscando usuario por email: {email}")

            # ✅ Buscar usuario existente por email
            user = User.objects.filter(email=email).first()

            if user:
                logger.info(f"✅ Usuario existente encontrado: {email}")

                # ✅ Actualizar name si está vacío y tenemos datos de Firebase
                if not user.name and firebase_name:
                    user.name = firebase_name
                    user.save()
                    logger.info(
                        f"✅ Nombre actualizado desde Firebase: {firebase_name}"
                    )

                return user, False

            # ✅ CREAR NUEVO USUARIO - COMPATIBLE CON TU MODELO
            logger.info(f"👤 Creando nuevo usuario para: {email}")

            # Generar username único (igual que tu registro normal)
            base_username = email.split("@")[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # ✅ DATOS COMPATIBLES CON TU MODELO USER
            # Tu modelo NO tiene first_name/last_name, pero SÍ tiene name
            user_data = {
                "username": username,
                "email": email,
                "name": firebase_name,  # ✅ Usar el campo 'name' de tu modelo
                "is_active": True,
                # Tu UserSerializer espera password, pero para usuarios sociales podemos usar una por defecto
                "password": "firebase_social_user_temp_password_123",
            }

            logger.info(f"📝 Datos para crear usuario: {user_data}")

            # ✅ CREAR USUARIO USANDO create_user (igual que tu registro normal)
            try:
                user = User.objects.create_user(**user_data)
                logger.info(f"✅ Usuario creado exitosamente con create_user: {email}")

            except Exception as e:
                logger.error(f"❌ Error con create_user: {e}")

                # ✅ FALLBACK: Intentar con create si create_user falla
                try:
                    # Remover password para el fallback
                    user_data_fallback = user_data.copy()
                    user_data_fallback.pop("password", None)

                    user = User.objects.create(**user_data_fallback)

                    # Establecer password por separado si es necesario
                    if hasattr(user, "set_password"):
                        user.set_password("firebase_social_user_temp_password_123")
                        user.save()

                    logger.info(f"✅ Usuario creado con create (fallback): {email}")

                except Exception as e2:
                    logger.error(f"❌ Error crítico con create también: {e2}")
                    return None, f"Error creando usuario: {str(e2)}"

            logger.info(
                f"✅ Nuevo usuario creado exitosamente: {email} (Username: {username})"
            )
            return user, True

        except Exception as e:
            logger.error(f"❌ Error crítico en get_or_create_user: {str(e)}")
            return None, f"Error creando usuario: {str(e)}"

    @classmethod
    def get_jwt_tokens_for_user(cls, user):
        """
        Genera tokens JWT para el usuario - CORREGIDO
        """
        try:
            refresh = RefreshToken.for_user(user)
            tokens = {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
            logger.info(f"✅ Tokens JWT generados para: {user.email}")
            return tokens
        except Exception as e:
            logger.error(f"❌ Error generando tokens JWT: {str(e)}")
            return None

    @classmethod
    def health_check(cls):
        """Verificar estado del servicio Firebase"""
        try:
            if cls.initialize_firebase():
                return {
                    "status": "healthy",
                    "initialized": True,
                    "message": "Firebase Admin SDK funcionando correctamente",
                }
            else:
                return {
                    "status": "unhealthy",
                    "initialized": False,
                    "message": "Firebase Admin SDK no pudo inicializarse",
                }
        except Exception as e:
            return {
                "status": "error",
                "initialized": False,
                "message": f"Error en health check: {str(e)}",
            }

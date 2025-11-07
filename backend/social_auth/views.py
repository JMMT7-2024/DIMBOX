import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .serializers import GoogleAuthSerializer, FirebaseAuthSerializer, UserSerializer

# from .google_service import GoogleAuthService
from .firebase_service import FirebaseAuthService  # ✅ NUEVO


@method_decorator(csrf_exempt, name="dispatch")
class GoogleLoginView(APIView):
    """Vista para login con Google directo (mantener temporalmente)"""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        try:
            data = json.loads(request.body)
            access_token = data.get("access_token")

            if not access_token:
                return Response(
                    {"success": False, "error": "Token de acceso requerido"}, status=400
                )

            user_info, error = GoogleAuthService.validate_google_token(access_token)
            if error:
                return Response({"success": False, "error": error}, status=400)

            user, is_new_user = GoogleAuthService.get_or_create_user(user_info)
            if not user:
                return Response({"success": False, "error": is_new_user}, status=400)

            tokens = GoogleAuthService.get_jwt_tokens_for_user(user)

            return Response(
                {
                    "success": True,
                    "tokens": tokens,
                    "user": UserSerializer(user).data,
                    "is_new_user": is_new_user,
                    "message": "Usuario registrado exitosamente"
                    if is_new_user
                    else "Login exitoso",
                }
            )

        except json.JSONDecodeError:
            return Response({"success": False, "error": "JSON inválido"}, status=400)
        except Exception as e:
            return Response(
                {"success": False, "error": f"Error del servidor: {str(e)}"}, status=500
            )


@method_decorator(csrf_exempt, name="dispatch")
class FirebaseLoginView(APIView):
    """✅ NUEVO: Vista para login con Firebase"""

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        # Validar datos de entrada
        serializer = FirebaseAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "error": "Datos inválidos",
                    "details": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        id_token = serializer.validated_data["id_token"]

        # Verificar token con Firebase
        firebase_user_data, error = FirebaseAuthService.verify_firebase_token(id_token)
        if error:
            return Response(
                {"success": False, "error": error}, status=status.HTTP_401_UNAUTHORIZED
            )

        # Obtener o crear usuario
        user, is_new_user = FirebaseAuthService.get_or_create_user(firebase_user_data)
        if not user:
            return Response(
                {"success": False, "error": is_new_user},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Generar tokens JWT de TU sistema
        tokens = FirebaseAuthService.get_jwt_tokens_for_user(user)

        # Preparar respuesta
        response_data = {
            "success": True,
            "tokens": tokens,
            "user": UserSerializer(user).data,
            "is_new_user": is_new_user,
            "message": "Usuario registrado exitosamente"
            if is_new_user
            else "Login exitoso",
        }

        return Response(response_data, status=status.HTTP_200_OK)


class SocialAuthHealthView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response(
            {
                "status": "active",
                "service": "social_auth",
                "endpoints": {
                    "google": "/api/auth/social/google/login/",
                    "firebase": "/api/auth/social/firebase/login/",
                    "health": "/api/auth/social/health/",
                },
                "message": "Módulo de autenticación social funcionando correctamente",
            }
        )

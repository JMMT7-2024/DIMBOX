# backend/backend/settings.py - ACTUALIZADO CON SOCIAL AUTH
import os
from pathlib import Path
import dj_database_url  # Make sure this is imported
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --------- Environment Configuration (Important!) ----------
# DEBUG will be read from an environment variable, defaults to False (Production)
DEBUG = os.environ.get("DJANGO_DEBUG", "False").lower() == "true"

# SECRET_KEY is read from an environment variable.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if DEBUG:
        # Insecure development key
        SECRET_KEY = "dev-insecure-use-only-locally"
    else:
        # NEVER run in production without a secret key defined in the environment
        raise RuntimeError("DJANGO_SECRET_KEY is not defined in production.")

# Define your allowed hosts in an environment variable, comma-separated
# Example: 'localhost,127.0.0.1,my-api.onrender.com,my-frontend.web.app'
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",")


# --------- Applications (Defined ONCE) ----------
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",  # Needed for staticfiles
    # 3rd party
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt",
    "django_filters",  # ✅ AGREGADO: Para filtros en API empresarial
    # Own Apps
    "core",
    "quick_accounts",
    "enterprise",  # ✅ NUEVA APP: Módulo empresarial
    "social_auth",  # ✅ NUEVA APP: Autenticación Social
]

# --------- Middleware (Ordered and Corrected!) ----------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # 1. CORS
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # 2. WhiteNoise (for static files)
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            BASE_DIR / "templates",  # ✅ AGREGADO: Para templates de email
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# --------- Database (Updated to Neon POOLER!) ----------
# Use the Neon POOLER URL (port 6543) that worked
DATABASE_URL = "postgresql://neondb_owner:npg_GyC9kH7bTjrS@ep-little-moon-aciuzzth-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"

DATABASES = {
    "default": dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,  # Optional: Keep connections alive longer
        ssl_require=True,  # Neon requires SSL!
    )
}

# --------- DRF / Auth ----------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    # ✅ CONFIGURACIÓN ADICIONAL PARA CUENTAS RÁPIDAS
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    # ✅ AGREGADO: Configuración de paginación global
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    # ✅ AGREGADO: Filtros para módulo empresarial
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

# ✅ CONFIGURACIÓN JWT MEJORADA
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER": None,
    "JWK_URL": None,
    "LEEWAY": 0,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    "JTI_CLAIM": "jti",
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=5),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),
}

AUTH_USER_MODEL = "core.User"
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
AUTHENTICATION_BACKENDS = ["django.contrib.auth.backends.ModelBackend"]

# --------- Internationalization (i18n) ----------
LANGUAGE_CODE = "es-pe"  # Spanish (Peru)
TIME_ZONE = "America/Lima"
USE_I18N = True
USE_TZ = True

# --------- Static Files ----------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"  # Directory where collectstatic gathers files
STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"  # For production serving
)

# ✅ AGREGADO: Directorios adicionales para archivos estáticos
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# ✅ AGREGADO: Configuración para archivos multimedia
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
APPEND_SLASH = True


# --------- Production Security (if DEBUG=False) ----------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    USE_X_FORWARDED_HOST = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# --------- CORS / CSRF (Clean Configuration!) ----------

# BEST PRACTICE: Allow all in development (DEBUG=True), use whitelist in production (DEBUG=False)
CORS_ALLOW_ALL_ORIGINS = False

# PRODUCTION WHITELIST!
# Put the URL Firebase will give your frontend here.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://prueba-diovic.web.app",
    "https://prueba-diovic.firebaseapp.com",
    "https://dimbox-app.web.app",  # ✅ AGREGADO: Posible futuro dominio
    "https://dimbox-app.firebaseapp.com",  # ✅ AGREGADO: Posible futuro dominio
]

# (Your CSRF_TRUSTED_ORIGINS and CORS_ALLOW_HEADERS looked fine)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://prueba-diovic.web.app",
    "https://prueba-diovic.firebaseapp.com",
    "https://dimbox.onrender.com",
    "https://dimbox-app.web.app",  # ✅ AGREGADO
    "https://dimbox-app.firebaseapp.com",  # ✅ AGREGADO
]

# ✅ CORREGIDO: Agregar x-request-id a los headers permitidos
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "cache-control",
    "x-request-id",  # ✅ CORRECCIÓN: Este header estaba faltando
]

# ✅ CONFIGURACIÓN ADICIONAL CORS PARA CUENTAS RÁPIDAS
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_EXPOSE_HEADERS = [
    "content-type",
    "x-csrftoken",
]

# ✅ AGREGADO: Configuración CORS adicional para credenciales
CORS_ALLOW_CREDENTIALS = True

# --------- Logging ----------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose" if DEBUG else "simple",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG" if DEBUG else "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.request": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "WARNING",
            "propagate": False,
        },
        "core": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
        "enterprise": {  # ✅ AGREGADO: Logger específico para módulo empresarial
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
        "social_auth": {  # ✅ NUEVO: Logger para autenticación social
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}

# --------- Email ----------
if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    # Para desarrollo, también puedes usar file-based email
    # EMAIL_BACKEND = "django.core.mail.backends.filebased.EmailBackend"
    # EMAIL_FILE_PATH = BASE_DIR / "sent_emails"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.environ.get("EMAIL_HOST", "smtp.gmail.com")
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
    EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
    EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
    EMAIL_USE_TLS = True
    EMAIL_USE_SSL = False

DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "no-reply@dimbox.com")
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# ✅ AGREGADO: Configuración adicional de email
EMAIL_TIMEOUT = 30  # segundos
EMAIL_SUBJECT_PREFIX = "[DIMBOX] "

# ✅ AGREGADO: Configuración para password reset
PASSWORD_RESET_TIMEOUT = 86400  # 24 horas en segundos

# ✅ AGREGADO: Configuración de sesiones (opcional pero recomendado)
SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_AGE = 1209600  # 2 semanas en segundos
SESSION_SAVE_EVERY_REQUEST = False

# ✅ AGREGADO: Configuración de cache (para producción)
if not DEBUG:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": os.environ.get("REDIS_URL", "redis://127.0.0.1:6379"),
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "unique-snowflake",
        }
    }

# ✅ AGREGADO: Configuración de seguridad adicional
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

# ✅ AGREGADO: Configuración para archivos subidos
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# ✅ NUEVO: Configuración para Google OAuth (variables de entorno)
GOOGLE_OAUTH_CLIENT_ID = os.environ.get("GOOGLE_OAUTH_CLIENT_ID", "")
GOOGLE_OAUTH_CLIENT_SECRET = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET", "")

FIREBASE_CREDENTIALS_JSON = os.environ.get("FIREBASE_CREDENTIALS_JSON", "")

print(f"✅ DIMBOX Settings Loaded - DEBUG: {DEBUG}")
print(f"✅ Allowed Hosts: {ALLOWED_HOSTS}")
print(f"✅ Database: {DATABASES['default']['ENGINE']}")
print(f"✅ CORS Allowed Origins: {CORS_ALLOWED_ORIGINS}")
print(
    f"✅ Apps Installed: {[app for app in INSTALLED_APPS if not app.startswith('django')]}"
)
print("✅ Enterprise Module: ACTIVE")
print("✅ Social Auth Module: ACTIVE")  # ✅ NUEVO: Confirmación del módulo

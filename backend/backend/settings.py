# backend/settings.py
import os
from pathlib import Path
import dj_database_url  # Make sure this is imported

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
    # Own App
    "core",
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
        "DIRS": [],
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

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
APPEND_SLASH = True


# --------- Production Security (if DEBUG=False) ----------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    USE_X_FORWARDED_HOST = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# --------- CORS / CSRF (Clean Configuration!) ----------

# BEST PRACTICE: Allow all in development (DEBUG=True), use whitelist in production (DEBUG=False)
CORS_ALLOW_ALL_ORIGINS = False


# PRODUCTION WHITELIST!
# Put the URL Firebase will give your frontend here.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://prueba-diovic.web.app",
    "https://prueba-diovic.firebaseapp.com",
]

# (Your CSRF_TRUSTED_ORIGINS and CORS_ALLOW_HEADERS looked fine)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://prueba-diovic.web.app",
    "https://prueba-diovic.firebaseapp.com",
    "https://dimbox.onrender.com",  # dominio del backend
]

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]


# --------- Logging ----------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO" if not DEBUG else "DEBUG"},
}

# --------- Email ----------
if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
    EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
    EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
    EMAIL_USE_TLS = True

DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "no-reply@dimbox.com")

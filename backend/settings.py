# backend/settings.py

import os
import dj_database_url
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- CONFIGURACIÓN DE SEGURIDAD PARA PRODUCCIÓN ---

# Lee la SECRET_KEY desde las variables de entorno de Cloud Run (Secret Manager).
# Si no la encuentra, usa una clave insegura solo para desarrollo local.
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-fallback-key-for-local-dev')

# DEBUG se establece a False a menos que la variable de entorno DEBUG sea 'True'
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# --- CONFIGURACIÓN DE HOSTS PERMITIDOS (ALLOWED_HOSTS) ---

# Lee los hosts permitidos desde una variable de entorno.
# En producción, Google Cloud Run nos da una URL que debemos añadir aquí.
ALLOWED_HOSTS = []
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Añadimos la URL de Cloud Run si está disponible
GCP_HOSTNAME = os.environ.get('GCP_HOSTNAME')
if GCP_HOSTNAME:
    ALLOWED_HOSTS.append(GCP_HOSTNAME)

# --- APLICACIONES ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'
TEMPLATES = [ /* ... (Esta sección no cambia) ... */ ]
WSGI_APPLICATION = 'backend.wsgi.application'

# --- BASE DE DATOS ---
# Lee la URL de la base de datos desde Secret Manager a través de una variable de entorno.
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600
    )
}

# --- VALIDACIÓN DE CONTRASEÑAS Y OTROS ---
AUTH_PASSWORD_VALIDATORS = [ /* ... (Esta sección no cambia) ... */ ]
LANGUAGE_CODE = 'es-es'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- ARCHIVOS ESTÁTICOS (CONFIGURACIÓN DE WHITENOISE) ---
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# --- CONFIGURACIÓN DE DJANGO REST FRAMEWORK Y CORS ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',)
}

# --- CONFIGURACIÓN DE CORS (LA MÁS IMPORTANTE) ---
CORS_ALLOWED_ORIGINS_str = os.environ.get('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_str.split(',') if CORS_ALLOWED_ORIGINS_str else []

# Si no se definen orígenes específicos, por seguridad, no se permite ninguno.
# Para desarrollo local, podrías añadir:
# if DEBUG:
#     CORS_ALLOWED_ORIGINS.extend(['http://127.0.0.1:5500', 'http://localhost:5500'])

# --- MODELO DE USUARIO PERSONALIZADO ---
AUTH_USER_MODEL = 'core.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
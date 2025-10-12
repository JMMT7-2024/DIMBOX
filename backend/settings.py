# backend/settings.py

import os
import dj_database_url
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- CONFIGURACIÓN DE SEGURIDAD PARA PRODUCCIÓN ---

# Lee la SECRET_KEY desde las variables de entorno de Cloud Run.
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'default-secret-key-for-local-dev')

# DEBUG se establece a False a menos que definamos una variable de entorno DEBUG=True
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Lee los hosts permitidos desde una variable de entorno.
# El valor será la URL que nos da Cloud Run.
ALLOWED_HOSTS_str = os.environ.get('DJANGO_ALLOWED_HOSTS', '')
ALLOWED_HOSTS = ALLOWED_HOSTS_str.split(',') if ALLOWED_HOSTS_str else []

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
    'whitenoise.middleware.WhiteNoise', # Corregido: Whitenoise no va en INSTALLED_APPS, sino en MIDDLEWARE
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Aquí es donde debe estar WhiteNoise
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# --- BASE DE DATOS ---
# Lee la URL de la base de datos desde la variable de entorno de Cloud Run.
DATABASES = {
    'default': dj_database_url.config(conn_max_age=600, ssl_require=False)
}

# --- VALIDACIÓN DE CONTRASEÑAS ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# --- INTERNACIONALIZACIÓN ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- ARCHIVOS ESTÁTICOS ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# --- CONFIGURACIÓN DE DJANGO REST FRAMEWORK ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',)
}

# --- CONFIGURACIÓN DE CORS ---
CORS_ALLOWED_ORIGINS_str = os.environ.get('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = CORS_ALLOWED_ORIGINS_str.split(',') if CORS_ALLOWED_ORIGINS_str else []

# --- MODELO DE USUARIO PERSONALIZADO ---
AUTH_USER_MODEL = 'core.User'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# Dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Dependencias del sistema para psycopg2/gevent/greenlet
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala deps primero para aprovechar la cache
COPY requirements.txt /app/
RUN python -m pip install --upgrade pip && \
    pip install -r requirements.txt

# Copia el proyecto
COPY . /app/

# Variables mínimas para collectstatic en build (sin tocar tus secrets reales)
ENV DJANGO_SETTINGS_MODULE=backend.settings \
    DJANGO_SECRET_KEY=dummy-build-secret \
    DJANGO_DEBUG=False

# Genera estáticos (WhiteNoise sirve los precompilados)
RUN python manage.py collectstatic --noinput || true

# Usuario no-root
RUN useradd -m appuser
USER appuser

# Cloud Run inyecta $PORT; Gunicorn lo respeta
# Si quieres usar gevent: añade --worker-class gevent
CMD ["bash", "-lc", "gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8080} --workers 2 --timeout 120"]

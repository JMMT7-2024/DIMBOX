# Usa una imagen oficial de Python como base
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc

COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

# ▼▼▼ AÑADE ESTA LÍNEA ▼▼▼
# Este comando reúne todos los archivos estáticos en la carpeta STATIC_ROOT
RUN python manage.py collectstatic --noinput

# Expone el puerto que Cloud Run usará
EXPOSE 8000

# Comando para iniciar el servidor de producción
CMD gunicorn --bind 0.0.0.0:$PORT --workers 2 backend.wsgi
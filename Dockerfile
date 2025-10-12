# Usa una imagen oficial de Python como base
FROM python:3.11-slim

# Establece variables de entorno para un entorno de producción
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instala dependencias del sistema necesarias para PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev gcc

# Copia solo el archivo de requerimientos para optimizar la caché de Docker
COPY requirements.txt /app/

# Instala las librerías de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo el código del proyecto al contenedor
COPY . /app/

# Expone el puerto que usará Gunicorn
EXPOSE 8000

# Comando para iniciar el servidor de producción
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "backend.wsgi"]
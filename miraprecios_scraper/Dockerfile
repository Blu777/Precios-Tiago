FROM python:3.11-slim

# Evitar que Python genere archivos .pyc y forzar stdout en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar bash (por si usamos la imagen base ultra slim)
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

# Instalar requerimientos (Scrapy)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el proyecto
COPY . .

# El entrypoint es el demonio en Python
ENTRYPOINT ["python", "daemon.py"]

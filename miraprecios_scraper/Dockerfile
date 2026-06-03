FROM python:3.11-slim

# Evitar que Python genere archivos .pyc y forzar stdout en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar bash y gosu para el manejo seguro de permisos
RUN apt-get update && apt-get install -y bash gosu && rm -rf /var/lib/apt/lists/*

# Instalar requerimientos (Scrapy)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el proyecto
COPY . .

# Usar el script de inicialización
ENTRYPOINT ["./entrypoint.sh"]

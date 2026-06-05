#!/bin/sh

# Directorio de datos compartido (montado desde el docker-compose)
DATA_DIR="/app/data"
DB_FILE="$DATA_DIR/miraprecios.sqlite"
INIT_SQL="/app/infra/init-db.sql"

echo "=== Iniciando configuración de infraestructura de MiraPrecios ==="

# 1. Asegurar que el directorio exista
mkdir -p "$DATA_DIR"

# 2. Inicializar la base de datos si no existe
if [ ! -f "$DB_FILE" ]; then
    echo "Base de datos no encontrada. Creando $DB_FILE e inicializando esquema..."
    sqlite3 "$DB_FILE" < "$INIT_SQL"
    echo "Esquema creado correctamente."
else
    echo "La base de datos ya existe en $DB_FILE."
    echo "Aplicando IF NOT EXISTS para asegurar la integridad de las tablas..."
    sqlite3 "$DB_FILE" < "$INIT_SQL"
fi

# 3. Aplicar permisos estrictos
# PUID y PGID pueden inyectarse desde variables de entorno, default a 1000:1000
TARGET_PUID=${PUID:-1000}
TARGET_PGID=${PGID:-1000}

echo "Ajustando permisos del directorio $DATA_DIR a $TARGET_PUID:$TARGET_PGID..."
chown -R "$TARGET_PUID:$TARGET_PGID" "$DATA_DIR"

# Dar permisos de lectura/escritura al grupo (775)
chmod -R 775 "$DATA_DIR"

# Es fundamental para SQLite WAL que el directorio padre también tenga permisos
# porque SQLite crea archivos temporales (.db-wal y .db-shm) en la misma carpeta.

echo "=== Configuración finalizada ==="

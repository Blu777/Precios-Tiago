#!/bin/bash
set -e

PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Si estamos corriendo como root (por defecto), arreglamos permisos y luego bajamos privilegios
if [ "$(id -u)" = "0" ]; then
    echo "[*] Ajustando permisos de /app/data para UID=$PUID, GID=$PGID"
    
    # Crear grupo y usuario si no existen
    if ! getent group abc >/dev/null; then
        groupadd -g "$PGID" abc
    fi
    
    if ! getent passwd abc >/dev/null; then
        useradd -u "$PUID" -g "$PGID" -s /bin/bash -m abc
    fi

    mkdir -p /app/data
    chown -R abc:abc /app/data
    chown -R abc:abc /app

    echo "[*] Cambiando a usuario no root (abc)..."
    exec gosu abc python daemon.py
else
    # Si ya se nos pasó un usuario vía docker-compose, corremos directamente
    echo "[*] Ejecutando como usuario actual (UID=$(id -u))..."
    exec python daemon.py
fi

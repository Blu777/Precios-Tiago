#!/bin/bash
set -e

echo "[+] Iniciando extracción de datos con Scrapy..."
# Correr el spider específico (Asegurarse de estar en el mismo dir que scrapy.cfg)
scrapy crawl vtex_base

# Obtener la fecha en formato YYYY_MM_DD
FECHA=$(date +"%Y_%m_%d")
ARCHIVO_TEMP="data/temp_results.json"
ARCHIVO_DESTINO="data/precios_${FECHA}.json"

echo "[+] Extracción finalizada. Procesando archivo JSON..."

# Renombrar/mover el archivo al nombre final con fecha
if [ -f "$ARCHIVO_TEMP" ]; then
    mv "$ARCHIVO_TEMP" "$ARCHIVO_DESTINO"
    echo "[✔] Proceso exitoso. Resultados guardados en $ARCHIVO_DESTINO"
else
    echo "[!] Error: No se encontró el archivo temporal $ARCHIVO_TEMP"
    exit 1
fi

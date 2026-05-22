#!/bin/bash
set -e

echo "[+] Iniciando extracción de datos VTEX con Scrapy..."
FECHA=$(date +"%Y_%m_%d")

# 1. Ejecutar extracción para Dia
echo "[+] Raspando supermercados Dia..."
scrapy crawl vtex_dinamico -a tienda=dia
if [ -f "data/temp_results.json" ]; then
    mv "data/temp_results.json" "data/precios_dia_${FECHA}.json"
    echo "[✔] Dia completado exitosamente."
else
    echo "[!] Error guardando el archivo temporal de Dia."
fi

echo "---------------------------------------------------"

# 2. Ejecutar extracción para ChangoMás
echo "[+] Raspando supermercados ChangoMás..."
scrapy crawl vtex_dinamico -a tienda=changomas
if [ -f "data/temp_results.json" ]; then
    mv "data/temp_results.json" "data/precios_changomas_${FECHA}.json"
    echo "[✔] ChangoMás completado exitosamente."
else
    echo "[!] Error guardando el archivo temporal de ChangoMás."
fi

echo "[+] Tarea finalizada. Revisa la carpeta /data."

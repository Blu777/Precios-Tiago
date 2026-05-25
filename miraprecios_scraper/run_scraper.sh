#!/bin/bash
set -e

echo "[+] Iniciando modo Demonio de extracción de datos VTEX con Scrapy..."

while true; do
    FECHA=$(date +"%Y_%m_%d")
    echo "[+] Empezando ciclo de scraping para el día ${FECHA}..."

    # Array de tiendas a iterar
    TIENDAS=("dia" "changomas" "jumbo" "vea")

    for TIENDA in "${TIENDAS[@]}"; do
        echo "---------------------------------------------------"
        echo "[+] Raspando supermercados ${TIENDA}..."
        scrapy crawl vtex_dinamico -a tienda=${TIENDA} || true
        
        if [ -f "data/temp_results.json" ]; then
            mv "data/temp_results.json" "data/precios_${TIENDA}_${FECHA}.json"
            echo "[✔] ${TIENDA} completado exitosamente."
        else
            echo "[!] Error guardando el archivo temporal de ${TIENDA}."
        fi
    done

    echo "---------------------------------------------------"
    echo "[+] Ciclo diario finalizado. Revisa la carpeta /data."
    echo "[zZz] Durmiendo por 24 horas..."
    sleep 86400
done

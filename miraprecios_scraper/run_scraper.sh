#!/bin/bash
set -e

echo "[+] Iniciando modo Demonio de extracción de datos VTEX con Scrapy..."

while true; do
    FECHA=$(date +"%Y_%m_%d")
    echo "[+] Empezando ciclo de scraping para el día ${FECHA}..."

    echo "---------------------------------------------------"
    echo "[+] Paso 1/2: Ingesta de dataset base oficial de SEPA..."
    python3 src/data/sepa_downloader.py || echo "[!] Advertencia: Falló descarga SEPA, continuando con crawler."
    python3 src/data/sepa_ingestor.py || echo "[!] Advertencia: Falló ingesta SEPA, continuando con crawler."
    
    echo "---------------------------------------------------"
    echo "[+] Paso 2/2: Trabajo fino de recolección de URLs e Imágenes en VTEX..."

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
    
    # Calcular los segundos faltantes hasta las 10:00 AM
    SLEEP_SECONDS=$(python3 -c "import datetime; now=datetime.datetime.now(); target=now.replace(hour=10, minute=0, second=0, microsecond=0); target = target + datetime.timedelta(days=1) if now >= target else target; print(int((target - now).total_seconds()))")
    
    echo "[zZz] Durmiendo por ${SLEEP_SECONDS} segundos hasta las 10:00 AM..."
    sleep ${SLEEP_SECONDS}
done

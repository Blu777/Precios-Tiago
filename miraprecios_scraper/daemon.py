import os
import sys
import subprocess
import logging
import json
import shutil
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("MiraPreciosDaemon")

STATE_FILE = "/app/data/last_run.json"
TEMP_DB = "/tmp/miraprecios_temp.db"
FINAL_DB = "/app/data/miraprecios.db"

def check_if_already_run_today():
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, "r") as f:
                data = json.load(f)
                last_run = data.get("last_run_date")
                if last_run == datetime.now().strftime('%Y-%m-%d'):
                    return True
    except Exception as e:
        logger.warning(f"[!] Error leyendo state file: {e}")
    return False

def mark_run_today():
    try:
        os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
        with open(STATE_FILE, "w") as f:
            json.dump({"last_run_date": datetime.now().strftime('%Y-%m-%d')}, f)
    except Exception as e:
        logger.error(f"[!] Error guardando state file: {e}")

def run_scraper_cycle(force=False):
    if not force and check_if_already_run_today():
        logger.info("[*] El ciclo diario ya se ejecutó hoy. Esperando al próximo.")
        return

    logger.info("===================================================")
    logger.info(f"[*] Iniciando ciclo de scraping para el día {datetime.now().strftime('%Y-%m-%d')}")
    
    # Trabajar con base de datos temporal
    os.environ['DB_PATH'] = TEMP_DB
    
    # Opcional: copiar la BD existente si existe para no empezar desde cero (para mantener historial de precios)
    if os.path.exists(FINAL_DB):
        logger.info(f"[*] Copiando base de datos existente a temporal ({TEMP_DB})...")
        shutil.copy2(FINAL_DB, TEMP_DB)
    else:
        logger.info(f"[*] Iniciando con base de datos vacía ({TEMP_DB}).")

    logger.info("[*] Paso 1/3: Ingesta de dataset base oficial de SEPA...")
    
    try:
        subprocess.run(["python3", "src/data/sepa_downloader.py"], check=True)
    except subprocess.CalledProcessError as e:
        logger.warning(f"[!] Falló descarga SEPA (Código: {e.returncode}). Continuando con crawler.")
        
    try:
        subprocess.run(["python3", "src/data/sepa_ingestor.py"], check=True)
    except subprocess.CalledProcessError as e:
        logger.warning(f"[!] Falló ingesta SEPA (Código: {e.returncode}). Continuando con crawler.")
        
    logger.info("---------------------------------------------------")
    logger.info("[*] Paso 2/3: Recolección de URLs e Imágenes en VTEX...")
    
    tiendas = ["dia", "changomas", "jumbo", "vea", "disco", "carrefour"]
    
    for tienda in tiendas:
        logger.info("---------------------------------------------------")
        logger.info(f"[*] Raspando supermercados {tienda}...")
        try:
            subprocess.run(["scrapy", "crawl", "vtex_dinamico", "-a", f"tienda={tienda}"], check=True, timeout=7200)
            logger.info(f"[✔] {tienda} completado exitosamente.")
        except subprocess.CalledProcessError as e:
            logger.error(f"[!] Error ejecutando Scrapy para {tienda} (Código: {e.returncode})")
        except subprocess.TimeoutExpired:
            logger.error(f"[!] Timeout: El proceso de Scrapy para {tienda} tardó demasiado y fue cancelado.")
            
    logger.info("---------------------------------------------------")
    logger.info("[*] Paso 3/3: Clustering Fuzzy pre-calculado...")
    try:
        subprocess.run(["python3", "src/data/clusterizador.py"], check=True)
        logger.info("[✔] Clustering completado exitosamente.")
    except subprocess.CalledProcessError as e:
        logger.error(f"[!] Error ejecutando clusterizador (Código: {e.returncode})")

    # Mover la BD temporal a producción
    logger.info(f"[*] Reemplazando base de datos de producción atómicamente...")
    try:
        os.makedirs(os.path.dirname(FINAL_DB), exist_ok=True)
        # Movemos la BD usando un nombre intermedio para atomicidad
        shutil.copy2(TEMP_DB, FINAL_DB + ".tmp")
        os.rename(FINAL_DB + ".tmp", FINAL_DB)
        
        # Mover también los archivos WAL si existen (importante para SQLite WAL mode)
        for ext in ['-wal', '-shm']:
            if os.path.exists(TEMP_DB + ext):
                shutil.copy2(TEMP_DB + ext, FINAL_DB + ext + ".tmp")
                os.rename(FINAL_DB + ext + ".tmp", FINAL_DB + ext)
                
        logger.info("[✔] Base de datos de producción actualizada.")
    except Exception as e:
        logger.error(f"[!] Error al reemplazar BD de producción: {e}")

    mark_run_today()
    logger.info("===================================================")
    logger.info("[+] Ciclo diario finalizado.")

if __name__ == "__main__":
    logger.info("[+] Iniciando Demonio de extracción de MiraPrecios...")
    
    # Run at startup if needed
    logger.info("[*] Comprobando si se requiere ciclo inicial...")
    run_scraper_cycle(force=False)
    
    scheduler = BlockingScheduler()
    
    logger.info("[*] Programando ciclo diario a las 10:00 AM (America/Argentina/Buenos_Aires)...")
    trigger = CronTrigger(hour=10, minute=0, timezone="America/Argentina/Buenos_Aires")
    scheduler.add_job(run_scraper_cycle, trigger, args=[True])
    
    try:
        logger.info("[zZz] Entrando en modo suspensión, esperando próximos trabajos...")
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("[!] Demonio detenido manualmente.")

import os
import sys
import subprocess
import logging
from datetime import datetime
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger("MiraPreciosDaemon")

def run_scraper_cycle():
    logger.info("===================================================")
    logger.info(f"[*] Iniciando ciclo de scraping para el día {datetime.now().strftime('%Y-%m-%d')}")
    
    logger.info("[*] Paso 1/2: Ingesta de dataset base oficial de SEPA...")
    
    try:
        subprocess.run(["python3", "src/data/sepa_downloader.py"], check=True)
    except subprocess.CalledProcessError as e:
        logger.warning(f"[!] Falló descarga SEPA (Código: {e.returncode}). Continuando con crawler.")
        
    try:
        subprocess.run(["python3", "src/data/sepa_ingestor.py"], check=True)
    except subprocess.CalledProcessError as e:
        logger.warning(f"[!] Falló ingesta SEPA (Código: {e.returncode}). Continuando con crawler.")
        
    logger.info("---------------------------------------------------")
    logger.info("[*] Paso 2/2: Trabajo fino de recolección de URLs e Imágenes en VTEX...")
    
    tiendas = ["dia", "changomas", "jumbo", "vea", "disco", "carrefour"]
    
    for tienda in tiendas:
        logger.info("---------------------------------------------------")
        logger.info(f"[*] Raspando supermercados {tienda}...")
        try:
            # Run scrapy. Timeout just in case it hangs
            subprocess.run(["scrapy", "crawl", "vtex_dinamico", "-a", f"tienda={tienda}"], check=True, timeout=7200)
            logger.info(f"[✔] {tienda} completado exitosamente.")
        except subprocess.CalledProcessError as e:
            logger.error(f"[!] Error ejecutando Scrapy para {tienda} (Código: {e.returncode})")
        except subprocess.TimeoutExpired:
            logger.error(f"[!] Timeout: El proceso de Scrapy para {tienda} tardó demasiado y fue cancelado.")
            
    logger.info("===================================================")
    logger.info("[+] Ciclo diario finalizado.")


if __name__ == "__main__":
    logger.info("[+] Iniciando Demonio de extracción de MiraPrecios...")
    
    # Run once at startup
    logger.info("[*] Ejecutando ciclo inicial de arranque...")
    run_scraper_cycle()
    
    scheduler = BlockingScheduler()
    
    # Schedule to run every day at 10:00 AM
    logger.info("[*] Programando ciclo diario a las 10:00 AM (America/Argentina/Buenos_Aires)...")
    trigger = CronTrigger(hour=10, minute=0, timezone="America/Argentina/Buenos_Aires")
    scheduler.add_job(run_scraper_cycle, trigger)
    
    try:
        logger.info("[zZz] Entrando en modo suspensión, esperando próximos trabajos...")
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("[!] Demonio detenido manualmente.")

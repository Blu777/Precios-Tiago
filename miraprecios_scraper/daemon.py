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

def sync_temp_to_final():
    logger.info(f"[*] Reemplazando base de datos de producción atómicamente...")
    try:
        os.makedirs(os.path.dirname(FINAL_DB), exist_ok=True)
        if not os.path.exists(FINAL_DB):
            logger.info("[*] Creando base de datos final por primera vez...")
            shutil.copy2(TEMP_DB, FINAL_DB)
            os.chmod(FINAL_DB, 0o666)
        else:
            import sqlite3
            logger.info("[*] Sincronizando datos a producción atómicamente (WAL-friendly)...")
            conn = sqlite3.connect(FINAL_DB, isolation_level=None)
            try:
                conn.execute("PRAGMA journal_mode=WAL;")
                conn.execute("PRAGMA synchronous=NORMAL;")
                conn.execute("BEGIN EXCLUSIVE;")
                conn.execute(f"ATTACH DATABASE '{TEMP_DB}' AS temp_db;")
                
                conn.execute("DELETE FROM ProductoMaestro;")
                conn.execute("DELETE FROM SucursalPrecio;")
                
                conn.execute("INSERT INTO ProductoMaestro SELECT * FROM temp_db.ProductoMaestro;")
                conn.execute("INSERT INTO SucursalPrecio SELECT * FROM temp_db.SucursalPrecio;")
                
                conn.execute("COMMIT;")
                conn.execute("DETACH DATABASE temp_db;")
                logger.info("[✔] Base de datos de producción actualizada (Transacción completada).")
            except Exception as e:
                logger.error(f"[!] Error durante la transacción SQLite: {e}")
                conn.execute("ROLLBACK;")
            finally:
                conn.close()
    except Exception as e:
        logger.error(f"[!] Error crítico al reemplazar BD de producción: {e}")

def run_scraper_cycle(force=False):
    if not force and check_if_already_run_today():
        logger.info("[*] El ciclo diario ya se ejecutó hoy. Esperando al próximo.")
        return

    logger.info("===================================================")
    logger.info(f"[*] Iniciando ciclo de scraping para el día {datetime.now().strftime('%Y-%m-%d')}")
    
    usando_turso = bool(os.environ.get('TURSO_DATABASE_URL'))
    
    if usando_turso:
        logger.info("[*] Modo Turso detectado. Se escribirá directamente a la nube y se omitirá la DB temporal.")
    else:
        # Trabajar con base de datos temporal
        os.environ['DB_PATH'] = TEMP_DB
        
        # Opcional: copiar la BD existente si existe para no empezar desde cero (para mantener historial de precios)
        if os.path.exists(FINAL_DB):
            logger.info(f"[*] Copiando base de datos existente a temporal ({TEMP_DB})...")
            shutil.copy2(FINAL_DB, TEMP_DB)
        else:
            logger.info(f"[*] Iniciando con base de datos vacía ({TEMP_DB}).")

        # Limpiar la tabla de precios para que solo queden los frescos del día, manteniendo ProductoMaestro
        if os.path.exists(TEMP_DB):
            import sqlite3
            try:
                logger.info("[*] Limpiando tabla de precios antiguos (SucursalPrecio)...")
                conn = sqlite3.connect(TEMP_DB)
                conn.execute("DELETE FROM SucursalPrecio;")
                conn.commit()
                conn.close()
                logger.info("[✔] Tabla de precios limpia. Lista para recibir carga fresca.")
            except Exception as e:
                logger.warning(f"[!] Error limpiando tabla de precios: {e}")

    logger.info("[*] Paso 1/3: Ingesta de dataset base oficial de SEPA...")
    
    try:
        subprocess.run(["python3", "src/data/sepa_downloader.py"], check=True)
    except subprocess.CalledProcessError as e:
        logger.warning(f"[!] Falló descarga SEPA (Código: {e.returncode}). Continuando con crawler.")
        
    try:
        subprocess.run(["python3", "src/data/sepa_ingestor.py"], check=True)
    except subprocess.CalledProcessError as e:
        logger.warning(f"[!] Falló ingesta SEPA (Código: {e.returncode}). Continuando con crawler.")
        
    if not usando_turso:
        logger.info("[*] SEPA descargado. Sincronizando a producción (Live)...")
        sync_temp_to_final()
        # A partir de ahora el scraper escribirá directamente en la base de datos en vivo.
        logger.info("[*] Cambiando DB_PATH a producción para que el Scraper escriba en vivo.")
        os.environ['DB_PATH'] = FINAL_DB

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

    if usando_turso:
        logger.info("[✔] Extracción completada. Los datos fueron sincronizados a Turso directamente.")
    else:
        logger.info("[✔] Extracción completada. Los datos ya fueron sincronizados en vivo.")

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

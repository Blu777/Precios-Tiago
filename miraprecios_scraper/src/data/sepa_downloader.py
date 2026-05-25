import os
import sys
import json
import urllib.request
import zipfile
import shutil
from datetime import datetime

# Spanish day names mapping
DAYS_ES = {
    0: "Lunes",
    1: "Martes",
    2: "Miércoles",
    3: "Jueves",
    4: "Viernes",
    5: "Sábado",
    6: "Domingo"
}

CKAN_API_URL = "https://datos.produccion.gob.ar/api/3/action/package_show?id=sepa-precios"

def get_today_resource_url():
    """Obtiene la URL del ZIP de SEPA correspondiente al día de la semana actual."""
    today_weekday = datetime.now().weekday()
    day_name = DAYS_ES[today_weekday]
    
    print(f"[*] Hoy es {day_name}. Consultando API de SEPA...")
    
    try:
        req = urllib.request.Request(CKAN_API_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            if not data.get('success'):
                print("[-] Error en la respuesta de la API CKAN.")
                return None
                
            resources = data['result']['resources']
            for res in resources:
                if res['name'].lower() == day_name.lower():
                    print(f"[+] Encontrado recurso para {day_name}: {res['url']}")
                    return res['url']
                    
            print(f"[-] No se encontró recurso para {day_name}.")
            return None
    except Exception as e:
        print(f"[-] Error obteniendo metadata: {e}")
        return None

def download_and_extract(url, base_dir):
    """Descarga el ZIP principal y extrae todos los sub-ZIPs."""
    os.makedirs(base_dir, exist_ok=True)
    zip_path = os.path.join(base_dir, "sepa_daily.zip")
    extract_path = os.path.join(base_dir, "extracted")
    
    print(f"[*] Descargando {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        print("[+] Descarga completada.")
    except Exception as e:
        print(f"[-] Error descargando: {e}")
        return False

    print("[*] Descomprimiendo ZIP principal...")
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
    except zipfile.BadZipFile:
        print("[-] Archivo ZIP corrupto.")
        return False
        
    # Encontrar el directorio con la fecha dentro del extract
    date_dirs = [d for d in os.listdir(extract_path) if os.path.isdir(os.path.join(extract_path, d))]
    if not date_dirs:
        print("[-] No se encontró el directorio de fecha dentro del ZIP.")
        return False
        
    date_dir = os.path.join(extract_path, date_dirs[0])
    
    # Extraer todos los sub-zips
    print("[*] Descomprimiendo sub-ZIPs...")
    sub_zips = [f for f in os.listdir(date_dir) if f.endswith('.zip')]
    
    final_output_dir = os.path.join(base_dir, "csvs")
    os.makedirs(final_output_dir, exist_ok=True)
    
    for sub_zip in sub_zips:
        sub_zip_path = os.path.join(date_dir, sub_zip)
        # We extract each inner zip into its own folder so we don't overwrite comercio.csv
        folder_name = sub_zip.replace('.zip', '')
        sub_extract_path = os.path.join(final_output_dir, folder_name)
        os.makedirs(sub_extract_path, exist_ok=True)
        
        try:
            with zipfile.ZipFile(sub_zip_path, 'r') as z:
                z.extractall(sub_extract_path)
        except zipfile.BadZipFile:
            print(f"[-] Error al extraer {sub_zip}")
            
    print(f"[+] Proceso completado. CSVs disponibles en {final_output_dir}")
    
    # Cleanup main zip and intermediate extracted dir
    os.remove(zip_path)
    shutil.rmtree(extract_path)
    
    return final_output_dir

if __name__ == "__main__":
    url = get_today_resource_url()
    if url:
        # Save in data/sepa_daily
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_dir = os.path.join(project_root, "data", "sepa_daily")
        
        # Clean previous downloads
        if os.path.exists(data_dir):
            shutil.rmtree(data_dir)
            
        csv_dir = download_and_extract(url, data_dir)
        if csv_dir:
            print("OK")
        else:
            sys.exit(1)
    else:
        sys.exit(1)

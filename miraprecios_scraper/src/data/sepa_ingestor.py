import os
import sys
import pandas as pd
import numpy as np
from sqlalchemy.dialects.sqlite import insert

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from miraprecios_scraper.database import get_session, ProductoMaestro, SucursalPrecio
from miraprecios_scraper.pipelines import DataNormalizationPipeline

TARGET_BANDERAS = {
    # Grupo Cencosud
    'jumbo': 'jumbo',
    'disco': 'disco',
    'vea': 'vea',
    # ChangoMás (GDN)
    'chango mas': 'changomas',
    'changomas': 'changomas',
    'hiperchangomas': 'changomas',
    'superchangomas': 'changomas',
    # Supermercados Día
    'dia': 'dia',
    # Carrefour Argentina
    'hipermercado carrefour': 'carrefour',
    'carrefour market': 'carrefour',
    'carrefour express': 'carrefour_express',
    'carrefour maxi': 'carrefour_maxi',
    'mini carrefour': 'carrefour',
    # Coto CICSA
    'coto': 'coto',
    # La Anónima
    'la anonima': 'la_anonima',
    'anonima': 'la_anonima',
}

def get_internal_supermarket_id(bandera_nombre):
    if not isinstance(bandera_nombre, str):
        return None
    nombre_lower = bandera_nombre.lower()
    for key, internal_id in TARGET_BANDERAS.items():
        if key in nombre_lower:
            return internal_id
    return None

def process_sepa_daily_dir(base_dir):
    print(f"[*] Iniciando ingesta de SEPA desde {base_dir}")
    if not os.path.exists(base_dir):
        print(f"[-] Error: No se encontró el directorio {base_dir}")
        return

    csvs_dir = os.path.join(base_dir, "csvs")
    if not os.path.exists(csvs_dir):
        print(f"[-] No se encontró la carpeta de extractos en {csvs_dir}")
        return

    pipeline = DataNormalizationPipeline()
    session = get_session()

    # Primero leer todos los comercios para mapear id_comercio -> internal_id
    comercio_map = {}
    print("[*] Leyendo catálogos de comercios...")
    
    for folder in os.listdir(csvs_dir):
        folder_path = os.path.join(csvs_dir, folder)
        if not os.path.isdir(folder_path):
            continue
            
        comercio_file = os.path.join(folder_path, "comercio.csv")
        if os.path.exists(comercio_file):
            try:
                df_com = pd.read_csv(comercio_file, sep='|', encoding='utf-8')
                for _, row in df_com.iterrows():
                    id_com = row.get('id_comercio')
                    bandera = row.get('comercio_bandera_nombre')
                    internal_id = get_internal_supermarket_id(bandera)
                    if internal_id:
                        comercio_map[id_com] = internal_id
            except Exception as e:
                print(f"[-] Error leyendo {comercio_file}: {e}")

    print(f"[+] Se mapearon {len(comercio_map)} comercios objetivo.")
    
    if not comercio_map:
        print("[-] No se encontraron comercios objetivo. Terminando ingesta.")
        session.close()
        return

    # Leer productos.csv de las carpetas que contengan comercios objetivo
    print("[*] Procesando productos...")
    all_products = []

    for folder in os.listdir(csvs_dir):
        folder_path = os.path.join(csvs_dir, folder)
        if not os.path.isdir(folder_path):
            continue
            
        prod_file = os.path.join(folder_path, "productos.csv")
        if os.path.exists(prod_file):
            try:
                df_prod = pd.read_csv(prod_file, sep='|', encoding='utf-8', low_memory=False)
                
                # Filtrar solo los id_comercio que nos interesan
                df_prod = df_prod[df_prod['id_comercio'].isin(comercio_map.keys())]
                
                if not df_prod.empty:
                    # Asignar internal_id
                    df_prod['internal_id'] = df_prod['id_comercio'].map(comercio_map)
                    all_products.append(df_prod)
            except Exception as e:
                print(f"[-] Error leyendo {prod_file}: {e}")

    if not all_products:
        print("[-] No se encontraron productos para los supermercados objetivo.")
        session.close()
        return

    # Consolidar todos los productos
    df_all = pd.concat(all_products, ignore_index=True)
    
    # Normalizar EAN en 3 pasos:
    # 1. Usar productos_ean si es válido
    # 2. Usar id_producto si es válido  
    # 3. Generar EAN sintético a partir de descripcion+marca (para productos sin código)
    df_all['productos_ean'] = df_all['productos_ean'].astype(str).str.strip()
    df_all['id_producto'] = df_all['id_producto'].astype(str).str.strip()
    
    INVALID_EAN = {'0', '0.0', '1', '1.0', 'nan', ''}
    
    # Paso 1: reemplazar EAN inválido con id_producto
    mask_ean_zero = df_all['productos_ean'].isin(INVALID_EAN)
    df_all.loc[mask_ean_zero, 'productos_ean'] = df_all.loc[mask_ean_zero, 'id_producto']
    
    # Paso 2: si id_producto también es inválido, generar EAN sintético por descripcion+marca
    import hashlib
    mask_still_zero = df_all['productos_ean'].isin(INVALID_EAN)
    desc = df_all.loc[mask_still_zero, 'productos_descripcion'].fillna('').str.upper().str.strip()
    marca = df_all.loc[mask_still_zero, 'productos_marca'].fillna('').str.upper().str.strip()
    contenido = df_all.loc[mask_still_zero, 'productos_cantidad_presentacion'].fillna('').astype(str)
    base = desc + '|' + marca + '|' + contenido
    df_all.loc[mask_still_zero, 'productos_ean'] = 'SYN-' + base.apply(
        lambda s: hashlib.md5(s.encode('utf-8')).hexdigest()[:12].upper()
    )
    
    # Eliminar los que aún sean inválidos (sin descripción)
    df_all = df_all[~df_all['productos_ean'].isin(['0', '0.0', 'nan', '', 'SYN-000000000000'])]
    
    # Deduplicar: un precio por EAN por cadena (el primero que aparezca)
    df_all = df_all.drop_duplicates(subset=['productos_ean', 'internal_id'])
    print(f"[*] Productos únicos tras deduplicación: {len(df_all)} ({df_all.groupby('internal_id').size().to_dict()})")
    
    records_maestro = []
    records_precio = []
    
    # Optimización: armar listas para el bulk insert
    for _, row in df_all.iterrows():
        ean = str(row.get('productos_ean', '')).strip()
        if not ean or ean == 'nan':
            continue
            
        raw_nombre = row.get('productos_descripcion', '')
        nombre_estandarizado = pipeline.normalize_text(raw_nombre)
        marca = pipeline.normalize_text(row.get('productos_marca', ''))
        
        contenido_neto = row.get('productos_cantidad_presentacion')
        unidad_medida = row.get('productos_unidad_medida_presentacion')
        
        precio = row.get('productos_precio_lista')
        if pd.isna(precio):
            continue
            
        supermercado_id = row.get('internal_id')

        # Si no viene contenido/unidad, se extrae del nombre
        if pd.isna(contenido_neto) or pd.isna(unidad_medida):
            mock_item = {'name': raw_nombre}
            extracted = pipeline.process_item(mock_item, None)
            contenido_neto = extracted.get('net_content')
            unidad_medida = extracted.get('unit')

        records_maestro.append({
            'ean': ean,
            'nombre_estandarizado': nombre_estandarizado,
            'marca': marca if marca else None,
            'contenido_neto': float(contenido_neto) if not pd.isna(contenido_neto) and contenido_neto and str(contenido_neto).lower() != 'nan' else 0.0,
            'unidad_medida': unidad_medida if not pd.isna(unidad_medida) and unidad_medida else None,
        })
        
        records_precio.append({
            'producto_ean': ean,
            'supermercado_id': supermercado_id,
            'precio_actual': float(precio),
            'precio_lista': float(precio),
            'url_imagen': None,
            'product_url': None
        })

    # Upsert Maestro en chunks
    if records_maestro:
        # Deduplicar maestro por ean
        maestro_df = pd.DataFrame(records_maestro).drop_duplicates(subset=['ean'])
        maestro_df['contenido_neto'] = maestro_df['contenido_neto'].fillna(0.0)
        maestro_df = maestro_df.replace({np.nan: None})
        maestro_dicts = maestro_df.to_dict('records')
        
        chunk_size = 1000
        exitos = 0
        for i in range(0, len(maestro_dicts), chunk_size):
            chunk = maestro_dicts[i:i+chunk_size]
            stmt_m = insert(ProductoMaestro).values(chunk)
            on_conflict_m = stmt_m.on_conflict_do_update(
                index_elements=['ean'],
                set_={
                    'nombre_estandarizado': stmt_m.excluded.nombre_estandarizado,
                    'marca': stmt_m.excluded.marca
                }
            )
            try:
                session.execute(on_conflict_m)
                session.commit()
                exitos += len(chunk)
            except Exception as e:
                session.rollback()
                print(f"[-] Error en ProductoMaestro chunk {i}: {e}")
        print(f"[+] Upsert exitoso de {exitos} registros en ProductoMaestro.")

    # Upsert Precio en chunks
    if records_precio:
        # Deduplicar precio por ean y supermercado (por si acaso)
        precio_df = pd.DataFrame(records_precio).drop_duplicates(subset=['producto_ean', 'supermercado_id'])
        precio_df['precio_actual'] = precio_df['precio_actual'].fillna(0.0)
        precio_df['precio_lista'] = precio_df['precio_lista'].fillna(0.0)
        precio_df = precio_df.replace({np.nan: None})
        precio_dicts = precio_df.to_dict('records')
        
        chunk_size = 1000
        exitos = 0
        for i in range(0, len(precio_dicts), chunk_size):
            chunk = precio_dicts[i:i+chunk_size]
            stmt_p = insert(SucursalPrecio).values(chunk)
            on_conflict_p = stmt_p.on_conflict_do_update(
                index_elements=['producto_ean', 'supermercado_id'],
                set_={
                    'precio_actual': stmt_p.excluded.precio_actual,
                    'precio_lista': stmt_p.excluded.precio_lista
                }
            )
            try:
                session.execute(on_conflict_p)
                session.commit()
                exitos += len(chunk)
            except Exception as e:
                session.rollback()
                print(f"[-] Error en SucursalPrecio chunk {i}: {e}")
        print(f"[+] Upsert exitoso de {exitos} registros en SucursalPrecio.")

    session.close()

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    data_dir = os.path.join(project_root, "data", "sepa_daily")
    process_sepa_daily_dir(data_dir)

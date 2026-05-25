import os
import sys
import pandas as pd
from sqlalchemy.dialects.sqlite import insert

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from miraprecios_scraper.database import get_session, ProductoMaestro
from miraprecios_scraper.pipelines import DataNormalizationPipeline

def process_sepa_file(filepath):
    """
    Lee un CSV del SEPA, normaliza los datos y hace un upsert en la base de datos local SQLite.
    """
    print(f"Iniciando ingesta de SEPA desde {filepath}")
    if not os.path.exists(filepath):
        print(f"Error: No se encontró el archivo {filepath}")
        # Creando datos mockeados si no existe el archivo para propósitos de prueba
        print("Usando datos mockeados para la prueba de humo.")
        data = [
            {'ean': '7790040001001', 'nombre': 'Aceite de Girasol', 'marca': 'Marolio', 'contenido': 1.5, 'unidad': 'L'},
            {'ean': '7790040001002', 'nombre': 'Leche Entera', 'marca': 'La Serenisima', 'contenido': 1.0, 'unidad': 'L'},
        ]
        df = pd.DataFrame(data)
    else:
        # Aquí mapearemos las columnas exactas del dataset del SEPA
        # Ajustar los nombres de las columnas según el CSV real
        try:
            df = pd.read_csv(filepath)
            # Ejemplo de mapeo (ajustar luego):
            # df.rename(columns={'codigo_barras': 'ean', 'producto': 'nombre'}, inplace=True)
        except Exception as e:
            print(f"Error al leer CSV: {e}")
            return

    session = get_session()
    pipeline = DataNormalizationPipeline()

    records_to_upsert = []

    for index, row in df.iterrows():
        ean = str(row.get('ean', '')).strip()
        if not ean:
            continue

        raw_nombre = row.get('nombre', '')
        nombre_estandarizado = pipeline.normalize_text(raw_nombre)
        marca = pipeline.normalize_text(row.get('marca', ''))
        
        # En el dataset real de SEPA, el contenido y la unidad a veces ya vienen separados
        contenido_neto = row.get('contenido')
        unidad_medida = row.get('unidad')

        # Si no, usamos la misma lógica del pipeline para extraer de ser necesario
        if pd.isna(contenido_neto) or pd.isna(unidad_medida):
            # Extracción del pipeline
            mock_item = {'name': raw_nombre}
            extracted = pipeline.process_item(mock_item, None)
            contenido_neto = extracted.get('net_content')
            unidad_medida = extracted.get('unit')

        records_to_upsert.append({
            'ean': ean,
            'nombre_estandarizado': nombre_estandarizado,
            'marca': marca if marca else None,
            'contenido_neto': float(contenido_neto) if not pd.isna(contenido_neto) and contenido_neto else None,
            'unidad_medida': unidad_medida if not pd.isna(unidad_medida) and unidad_medida else None,
            'categoria_id': None # Por definir según dataset
        })

    if not records_to_upsert:
        print("No hay registros válidos para insertar.")
        return

    # Usar SQLite dialect para upsert
    stmt = insert(ProductoMaestro).values(records_to_upsert)
    
    # Si hay conflicto en 'ean', actualizamos los datos
    update_dict = {
        'nombre_estandarizado': stmt.excluded.nombre_estandarizado,
        'marca': stmt.excluded.marca,
        'contenido_neto': stmt.excluded.contenido_neto,
        'unidad_medida': stmt.excluded.unidad_medida
    }
    
    on_conflict_stmt = stmt.on_conflict_do_update(
        index_elements=['ean'],
        set_=update_dict
    )

    try:
        session.execute(on_conflict_stmt)
        session.commit()
        print(f"Upsert exitoso de {len(records_to_upsert)} registros maestros.")
    except Exception as e:
        session.rollback()
        print(f"Error durante el upsert: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'sepa_dataset.csv'
    process_sepa_file(filepath)

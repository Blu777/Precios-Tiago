import os
import sys
import uuid
from sqlalchemy.orm import sessionmaker
import re

# Add parent directory to path to import database module
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from miraprecios_scraper.database import get_engine, ProductoMaestro

MUST_MATCH_WORDS = {'ZERO', 'LIGHT', 'AZUCAR', 'LIVIANO', 'DIET', 'DESCREMADA', 'ENTERA', 'CLASICA'}

def tokenize(name):
    if not name:
        return set()
    s = str(name).upper().replace(',', ' ').replace('.', ' ').replace('-', ' ')
    s = re.sub(r'\bLTS\b', 'L', s)
    s = re.sub(r'\bLT\b', 'L', s)
    s = re.sub(r'\bCM3\b', 'CC', s)
    s = re.sub(r'\bML\b', 'CC', s)
    s = re.sub(r'\b2\s*25\s*L\b', '2250 CC', s)
    s = re.sub(r'\b1\s*5\s*L\b', '1500 CC', s)
    s = re.sub(r'\b1\s*75\s*L\b', '1750 CC', s)
    s = re.sub(r'\b2\s*5\s*L\b', '2500 CC', s)
    s = re.sub(r'\b3\s*L\b', '3000 CC', s)
    
    words = []
    for w in s.split():
        if len(w) > 2 or any(c.isdigit() for c in w):
            words.append(w)
    return set(words)

def calculate_similarity(set1, set2):
    for w in MUST_MATCH_WORDS:
        if (w in set1) != (w in set2):
            return 0.0
            
    nums1 = sorted([w for w in set1 if w.isdigit()])
    nums2 = sorted([w for w in set2 if w.isdigit()])
    
    if nums1 and nums2:
        if nums1 != nums2:
            return 0.0
            
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    
    return intersection / union if union > 0 else 0.0

def run_clustering():
    print("[*] Iniciando clustering de productos...")
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        productos = session.query(ProductoMaestro).all()
        print(f"[*] {len(productos)} productos leídos de la base de datos.")

        grupos = []
        updates = []

        for prod in productos:
            tokens = tokenize(prod.nombre_estandarizado)
            merged = False

            for grupo in grupos:
                sim = calculate_similarity(tokens, grupo['tokens'])
                if sim >= 0.50:
                    prod.grupo_id = grupo['id']
                    updates.append(prod)
                    # Expandir tokens del grupo (opcional)
                    # grupo['tokens'] = grupo['tokens'].union(tokens)
                    merged = True
                    break

            if not merged:
                nuevo_grupo_id = str(uuid.uuid4())
                prod.grupo_id = nuevo_grupo_id
                grupos.append({
                    'id': nuevo_grupo_id,
                    'tokens': tokens
                })
                updates.append(prod)

        print(f"[*] Clustering finalizado. Encontrados {len(grupos)} grupos únicos.")
        print("[*] Guardando grupo_id en la base de datos...")
        
        # Commitear los cambios masivamente
        session.commit()
        print("[+] Base de datos actualizada con los grupos de similitud.")

    except Exception as e:
        session.rollback()
        print(f"[-] Error durante el clustering: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    run_clustering()

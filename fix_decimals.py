import sqlite3

def fix_decimals(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Obtener todos los EANs con .0
    c.execute("SELECT ean FROM ProductoMaestro WHERE ean LIKE '%.0'")
    bad_eans = [row[0] for row in c.fetchall()]
    
    print(f"Encontrados {len(bad_eans)} productos con '.0'")
    
    for bad_ean in bad_eans:
        clean_ean = bad_ean[:-2]
        
        # 1. Arreglar SucursalPrecio
        c.execute("SELECT id, supermercado_id FROM SucursalPrecio WHERE producto_ean = ?", (bad_ean,))
        precios = c.fetchall()
        
        for p_id, super_id in precios:
            try:
                # Intentar mover el precio al EAN limpio
                c.execute("UPDATE SucursalPrecio SET producto_ean = ? WHERE id = ?", (clean_ean, p_id))
            except sqlite3.IntegrityError:
                # Si ya existe un precio para ese supermercado en el EAN limpio, borramos el duplicado
                c.execute("DELETE FROM SucursalPrecio WHERE id = ?", (p_id,))
                
        # 2. Arreglar ProductoMaestro
        try:
            # Intentar renombrar el EAN malo al limpio
            c.execute("UPDATE ProductoMaestro SET ean = ? WHERE ean = ?", (clean_ean, bad_ean))
        except sqlite3.IntegrityError:
            # Si el EAN limpio ya existe en Maestro, borramos el malo (huérfano)
            c.execute("DELETE FROM ProductoMaestro WHERE ean = ?", (bad_ean,))
            
    conn.commit()
    conn.close()
    print("¡Base de datos limpiada con éxito!")

if __name__ == '__main__':
    fix_decimals('miraprecios.db')

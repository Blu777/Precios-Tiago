import sqlite3

db_path = "miraprecios(2).db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

query = """
SELECT pm.ean, pm.nombre_estandarizado, sp.supermercado_id, sp.precio_actual
FROM ProductoMaestro pm
JOIN SucursalPrecio sp ON pm.ean = sp.producto_ean
WHERE (pm.nombre_estandarizado LIKE '%COCA%' OR pm.marca LIKE '%COCA%')
AND (pm.nombre_estandarizado LIKE '%3 L%' OR pm.nombre_estandarizado LIKE '%3L%')
"""

cursor.execute(query)
rows = cursor.fetchall()
for r in rows:
    print(r)

conn.close()

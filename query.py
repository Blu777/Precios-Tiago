import sqlite3
import json

conn = sqlite3.connect('miraprecios.db')
cursor = conn.cursor()
cursor.execute("SELECT p.ean, p.nombre_estandarizado, s.supermercado_id, s.precio_actual, s.product_url, s.ultima_actualizacion FROM ProductoMaestro p JOIN SucursalPrecio s ON p.ean = s.producto_ean WHERE p.nombre_estandarizado = 'GASEOSA CUNNINGTON TONICA BOTELLA 1.5 L' OR p.nombre_estandarizado = 'GASEOSA CUNNINGTON TONICA SUAVE 2.25LT';")
rows = cursor.fetchall()
print(json.dumps(rows, indent=2))

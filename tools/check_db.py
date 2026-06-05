import sqlite3

conn = sqlite3.connect('miraprecios(1).db')
c = conn.cursor()

c.execute("SELECT ean, nombre_estandarizado, marca FROM ProductoMaestro WHERE nombre_estandarizado LIKE '%COCA COLA%' AND nombre_estandarizado LIKE '%600%';")
print("Productos Maestro:")
for row in c.fetchall():
    print(row)

c.execute("""
SELECT sp.producto_ean, sp.supermercado_id, sp.precio_actual 
FROM SucursalPrecio sp 
JOIN ProductoMaestro pm ON sp.producto_ean = pm.ean 
WHERE pm.nombre_estandarizado LIKE '%COCA COLA%' AND pm.nombre_estandarizado LIKE '%600%';
""")
print("\nPrecios:")
for row in c.fetchall():
    print(row)

conn.close()

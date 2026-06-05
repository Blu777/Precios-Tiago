import sqlite3, re
conn = sqlite3.connect('miraprecios.db')
c = conn.cursor()
res = c.execute("SELECT ean, nombre_estandarizado FROM ProductoMaestro").fetchall()
eans = [r for r in res if '.' in r[0]]
for r in eans[:20]: print(r)
print(f'Total: {len(eans)}')

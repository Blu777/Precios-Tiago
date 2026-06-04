import sqlite3
import re

def auto_categorize():
    db_path = '/home/tiagonatale/Documentos/Precios-Tiago/preciostiago.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT ean, nombre_estandarizado, categoria_id FROM ProductoMaestro")
    productos = cur.fetchall()

    categories = {
        'bebidas': ['gaseosa', 'agua', 'jugo', 'cerveza', 'vino', 'fernet', 'soda', 'energizante', 'licor', 'whisky'],
        'almacen': ['fideo', 'arroz', 'aceite', 'harina', 'azucar', 'yerba', 'galletita', 'pan', 'mermelada', 'mayonesa', 'pure de tomate', 'sal', 'polenta', 'ketchup', 'mostaza', 'cafe', 'te', 'mate', 'cacao', 'atun', 'arveja', 'caldo', 'sopa', 'aderezo', 'vinagre'],
        'lacteos': ['leche', 'queso', 'yogurt', 'manteca', 'crema', 'dulce de leche', 'postre', 'flan', 'margarina'],
        'carnes': ['carne', 'pollo', 'cerdo', 'asado', 'picada', 'bife', 'milanesa', 'chorizo', 'salchicha', 'hamburguesa de carne', 'roast beef', 'vacio', 'matambre'],
        'limpieza': ['lavandina', 'detergente', 'jabon', 'desodorante ambiente', 'papel higienico', 'rollo', 'limpiador', 'suavizante', 'esponja', 'escoba', 'balde', 'trapo', 'cera'],
        'perfumeria': ['shampoo', 'acondicionador', 'crema corporal', 'crema facial', 'jabon tocador', 'desodorante', 'pasta dental', 'pañal', 'toallita', 'tampon', 'maquillaje', 'perfume', 'colonia', 'cepillo', 'afeitadora', 'espuma'],
        'congelados': ['hamburguesa', 'pizza', 'papa frita', 'helado', 'nugget', 'medallon', 'rebozado', 'chipa congelado', 'empanada']
    }

    updates = []
    
    for p in productos:
        if p['categoria_id']:
            continue # already has category
            
        nombre = str(p['nombre_estandarizado']).lower()
        # Normalizar un poco (quitar plurales simples)
        nombre = nombre.replace('fideos', 'fideo').replace('galletitas', 'galletita').replace('pañales', 'pañal')
        
        assigned = False
        
        for cat, keywords in categories.items():
            for kw in keywords:
                if re.search(r'\b' + kw + r'\b', nombre):
                    updates.append((cat, p['ean']))
                    assigned = True
                    break
            if assigned:
                break
                
        if not assigned:
            updates.append(('otros', p['ean']))

    print(f"Categorizing {len(updates)} products...")
    
    cur.execute("BEGIN TRANSACTION")
    cur.executemany("UPDATE ProductoMaestro SET categoria_id = ? WHERE ean = ?", updates)
    conn.commit()
    print("Categories updated successfully.")

if __name__ == '__main__':
    auto_categorize()

import sqlite3
import re

def auto_categorize():
    db_path = 'miraprecios.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT ean, nombre_estandarizado, categoria_id FROM ProductoMaestro")
    productos = cur.fetchall()

    categories = {
        'bebidas': ['gaseosa', 'agua', 'jugo', 'cerveza', 'vino', 'fernet', 'soda', 'energizante', 'licor', 'whisky', 'coca cola', 'sprite', 'fanta', 'pepsi', '7up', 'amargo obrero', 'aperitivo', 'champagne', 'espumante', 'champana', 'champaña'],
        'almacen': ['fideo', 'arroz', 'aceite', 'harina', 'azucar', 'yerba', 'galletita', 'pan', 'mermelada', 'mayonesa', 'pure de tomate', 'sal', 'polenta', 'ketchup', 'mostaza', 'cafe', 'te', 'mate', 'cacao', 'atun', 'arveja', 'caldo', 'sopa', 'aderezo', 'vinagre', 'lentejas', 'porotos', 'garbanzos', 'choclo', 'salsa', 'pimienta', 'chocolate', 'alfajor', 'vainilla', 'caramelo', 'snack', 'chicle', 'mani'],
        'lacteos': ['leche', 'queso', 'yogurt', 'yogur', 'bebible', 'descremado', 'entero', 'manteca', 'crema', 'dulce de leche', 'postre', 'flan', 'margarina', 'ricota'],
        'carnes': ['carne', 'pollo', 'cerdo', 'asado', 'picada', 'bife', 'milanesa', 'chorizo', 'salchicha', 'hamburguesa de carne', 'roast beef', 'vacio', 'matambre', 'pescado', 'merluza', 'salmon'],
        'limpieza': ['lavandina', 'detergente', 'jabon', 'desodorante ambiente', 'papel higienico', 'rollo', 'limpiador', 'suavizante', 'esponja', 'escoba', 'balde', 'trapo', 'cera', 'insecticida', 'repelente', 'aromatizante', 'repuesto'],
        'perfumeria': ['shampoo', 'acondicionador', 'crema corporal', 'crema facial', 'jabon tocador', 'desodorante', 'antitranspirante', 'pasta dental', 'pañal', 'panal', 'panales', 'toallita', 'tampon', 'maquillaje', 'perfume', 'colonia', 'cepillo', 'afeitadora', 'espuma', 'preservativos', 'coloracion', 'tintura', 'esmalte'],
        'congelados': ['hamburguesa', 'pizza', 'papa frita', 'helado', 'nugget', 'medallon', 'rebozado', 'chipa congelado', 'empanada', 'verdura congelada'],
        'indumentaria': ['remera', 'buzo', 'campera', 'pantalon', 'pantalón', 'short', 'estampada', 'liso', 'medias', 'calzoncillo', 'bombacha', 'corpiño', 'zapatillas'],
        'hogar': ['vaso', 'mesa', 'toalla', 'silla', 'sabana', 'sábana', 'frazada', 'sillon', 'sillón', 'plato', 'olla', 'sarten', 'almohada', 'cubiertos'],
        'tecnologia': ['smart', 'celular', 'tv', 'televisor', 'notebook', 'tablet', 'auricular', 'cable', 'cargador'],
        'deportes_y_juguetes': ['juego', 'pelota', 'bicicleta', 'monopatin', 'muñeca', 'auto'],
        'electrodomesticos': ['heladera', 'lavarropas', 'microondas', 'ventilador', 'licuadora', 'batidora', 'pava electrica', 'aire acondicionado'],
        'frutas_y_verduras': ['manzana', 'banana', 'naranja', 'pera', 'uva', 'papa', 'cebolla', 'tomate', 'lechuga', 'zanahoria', 'zapallo', 'limon'],
        'mascotas': ['perro', 'gato', 'mascota', 'alimento balanceado', 'dogui', 'pedigree', 'whiskas', 'cat chow']
    }

    updates = []
    
    for p in productos:
        cat_actual = str(p['categoria_id'] or '').lower()
        if cat_actual and not cat_actual.startswith('catv') and cat_actual != 'otros':
            continue # already has a valid category
            
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

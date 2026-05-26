import sqlite3
import re
import os

def clean_name(name):
    if not name:
        return name
        
    # Remove weights and sizes (e.g., 400g, 400 G, 1L, 1.5 L, 500 cc, X3, X 3, etc)
    name = re.sub(r'(?i)\b\d+([.,]\d+)?\s*(g|gr|gramos|kg|kilos|l|lt|litro|litros|cc|ml)\b', '', name)
    name = re.sub(r'(?i)\bx\s*\d+\b', '', name)
    
    # Remove descriptive packaging words
    packaging_words = ['bolsa', 'botella', 'caja', 'doypack', 'paquete', 'pouch', 'lata', 'frasco', 'sachet', 'brik', 'tetra', 'pack']
    for word in packaging_words:
        name = re.sub(rf'(?i)\b{word}\b', '', name)
        
    # Clean up multiple spaces and title case
    name = re.sub(r'\s+', ' ', name).strip()
    
    # Title case but keep some uppercase if it makes sense? Simple title is better.
    # Convert to lower first to handle ALL CAPS properly, then title.
    # Exception for some small words:
    words = name.lower().split()
    small_words = {'de', 'la', 'el', 'los', 'las', 'y', 'en', 'con', 'sin', 'sabor'}
    
    capitalized_words = []
    for i, w in enumerate(words):
        if i > 0 and w in small_words:
            capitalized_words.append(w)
        else:
            capitalized_words.append(w.capitalize())
            
    return ' '.join(capitalized_words)

def main():
    # Detect db path
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, 'miraprecios_web', 'data', 'miraprecios.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
        
    print(f"Connecting to DB at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT ean, nombre_estandarizado FROM ProductoMaestro")
    products = cursor.fetchall()
    
    print(f"Found {len(products)} products. Cleaning names...")
    
    updates = []
    for ean, name in products:
        cleaned = clean_name(name)
        if cleaned != name:
            updates.append((cleaned, ean))
            
    if updates:
        cursor.executemany("UPDATE ProductoMaestro SET nombre_estandarizado = ? WHERE ean = ?", updates)
        conn.commit()
        print(f"Updated {len(updates)} product names.")
    else:
        print("No names needed cleaning.")
        
    conn.close()

if __name__ == '__main__':
    main()

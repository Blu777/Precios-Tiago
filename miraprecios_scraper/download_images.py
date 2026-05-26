import sqlite3
import os
import urllib.request
import urllib.error
import ssl

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    db_path = os.path.join(base_dir, 'miraprecios_web', 'data', 'miraprecios.db')
    public_img_dir = os.path.join(base_dir, 'miraprecios_web', 'public', 'products')
    
    os.makedirs(public_img_dir, exist_ok=True)
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # We want to pick one valid url_imagen from SucursalPrecio for each ProductoMaestro
    cursor.execute("""
        SELECT p.ean, p.url_imagen, 
               (SELECT s.url_imagen FROM SucursalPrecio s WHERE s.producto_ean = p.ean AND s.url_imagen IS NOT NULL AND s.url_imagen != '' LIMIT 1) as best_img
        FROM ProductoMaestro p
    """)
    products = cursor.fetchall()
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    print(f"Checking {len(products)} products for images...")
    
    updated_count = 0
    for ean, current_url, best_img in products:
        local_path = f"/products/{ean}.jpg"
        full_local_path = os.path.join(public_img_dir, f"{ean}.jpg")
        
        # If it already has a local image that exists, skip
        if os.path.exists(full_local_path) and current_url == local_path:
            continue
            
        if not best_img:
            continue
            
        # Try to download best_img
        try:
            req = urllib.request.Request(best_img, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
            with urllib.request.urlopen(req, context=ctx, timeout=10) as response, open(full_local_path, 'wb') as out_file:
                out_file.write(response.read())
                
            # Update DB
            cursor.execute("UPDATE ProductoMaestro SET url_imagen = ? WHERE ean = ?", (local_path, ean))
            updated_count += 1
            print(f"Downloaded image for {ean}")
        except Exception as e:
            print(f"Failed to download {best_img} for {ean}: {e}")
            
    if updated_count > 0:
        conn.commit()
        print(f"Successfully downloaded and linked {updated_count} images.")
    else:
        print("No new images downloaded.")
        
    conn.close()

if __name__ == '__main__':
    main()

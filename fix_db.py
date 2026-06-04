import os
from sqlalchemy import create_engine, text

def main():
    turso_url = os.environ.get('TURSO_DATABASE_URL')
    turso_token = os.environ.get('TURSO_AUTH_TOKEN')
    
    if not turso_url or not turso_token:
        print("Error: Configura las variables TURSO_DATABASE_URL y TURSO_AUTH_TOKEN primero.")
        return

    if turso_url.startswith("libsql://"):
        db_url = turso_url.replace("libsql://", "sqlite+libsql://", 1)
    else:
        db_url = f"sqlite+libsql://{turso_url.replace('https://', '')}"
        
    url = f"{db_url}/?secure=true"
    print(f"Conectando a {turso_url}...")
    engine = create_engine(url, connect_args={'auth_token': turso_token})
    
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE ProductoMaestro ADD COLUMN grupo_id TEXT;"))
            conn.commit()
            print("¡Éxito! Columna 'grupo_id' añadida a ProductoMaestro.")
        except Exception as e:
            print(f"Error (la columna podría ya existir): {e}")

if __name__ == '__main__':
    main()

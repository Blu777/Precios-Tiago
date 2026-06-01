import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Add the scraper to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'miraprecios_scraper'))

from miraprecios_scraper.database import get_engine, get_session, ProductoMaestro
from sqlalchemy import text

def test_connection():
    print("Testing Turso connection...")
    engine = get_engine()
    
    with engine.connect() as conn:
        # Check if tables were created
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
        tables = [row[0] for row in result]
        print(f"Tables in database: {tables}")
        
    print("Connection successful! Tables are created.")

if __name__ == '__main__':
    test_connection()

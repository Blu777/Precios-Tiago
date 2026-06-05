import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Float, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func

load_dotenv()

Base = declarative_base()

class ProductoMaestro(Base):
    __tablename__ = 'ProductoMaestro'

    ean = Column(String, primary_key=True)
    nombre_estandarizado = Column(String, nullable=False)
    marca = Column(String, nullable=True)
    contenido_neto = Column(Float, nullable=True)
    unidad_medida = Column(String, nullable=True)
    categoria_id = Column(String, nullable=True)
    url_imagen = Column(String, nullable=True)
    grupo_id = Column(String, nullable=True)

class SucursalPrecio(Base):
    __tablename__ = 'SucursalPrecio'

    id = Column(Integer, primary_key=True, autoincrement=True)
    producto_ean = Column(String, ForeignKey('ProductoMaestro.ean', ondelete='CASCADE'), nullable=False)
    supermercado_id = Column(String, nullable=False)
    precio_actual = Column(Float, nullable=False)
    precio_lista = Column(Float, nullable=True)
    promocion = Column(String, nullable=True)
    disponible_online = Column(Boolean, default=True)
    url_imagen = Column(String, nullable=True)
    product_url = Column(String, nullable=True)
    ultima_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('producto_ean', 'supermercado_id', name='_producto_ean_supermercado_id_uc'),
    )

def get_engine():
    turso_url = os.getenv('TURSO_DATABASE_URL')
    turso_token = os.getenv('TURSO_AUTH_TOKEN')
    
    if turso_url and turso_token:
        if turso_url.startswith("libsql://"):
            db_url = turso_url.replace("libsql://", "sqlite+libsql://", 1)
        else:
            db_url = f"sqlite+libsql://{turso_url.replace('https://', '')}"
            
        url = f"{db_url}/?secure=true"
        engine = create_engine(url, connect_args={'auth_token': turso_token})
        Base.metadata.create_all(engine)
        return engine

    # Allow override via environment variable
    db_path = os.getenv('DB_PATH')
    if not db_path:
        # Check if we are running inside the Docker container
        if os.path.exists('/app/data') or os.environ.get('DOCKER_CONTAINER'):
            db_path = '/app/data/miraprecios.db'
        else:
            # Fallback to local development path
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            db_path = os.path.join(base_dir, 'miraprecios_web', 'data', 'miraprecios.db')
            
    # Ensure the directory exists before trying to open the SQLite file
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Enable WAL mode for concurrency
    engine = create_engine(f'sqlite:///{db_path}', connect_args={'check_same_thread': False})
    
    # Execute PRAGMA for WAL mode
    with engine.connect() as conn:
        conn.execute(text("PRAGMA journal_mode=WAL"))
        conn.execute(text("PRAGMA synchronous=NORMAL"))
        conn.execute(text("PRAGMA busy_timeout=5000"))
        
    Base.metadata.create_all(engine)
    return engine

def get_session(engine=None):
    if engine is None:
        engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()

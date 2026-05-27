import sqlite3
import os
import logging
from itemadapter import ItemAdapter

class SQLitePipeline:
    def __init__(self):
        # La ruta al volumen compartido en Docker
        self.db_path = os.environ.get('DATABASE_PATH', '/app/data/miraprecios.sqlite')
        self.conn = None
        self.cursor = None
        
        # Búfer en memoria para Bulk Inserts
        self.buffer = []
        self.buffer_size = 500 # Flush cada 500 items para optimizar I/O
        
        self.logger = logging.getLogger(__name__)

    def open_spider(self, spider):
        self.logger.info(f"Conectando a base de datos SQLite en: {self.db_path}")
        
        # Asegurarnos de que el directorio base exista si estamos corriendo localmente o si Docker no lo armó a tiempo
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        self.conn = sqlite3.connect(self.db_path)
        # Habilitar WAL explícitamente en la conexión
        self.conn.execute("PRAGMA journal_mode=WAL;")
        self.conn.execute("PRAGMA synchronous=NORMAL;")
        self.cursor = self.conn.cursor()

    def close_spider(self, spider):
        # Vaciar cualquier item restante en el búfer al finalizar el scraping
        if self.buffer:
            self._flush_buffer()
        
        if self.conn:
            self.conn.close()
            self.logger.info("Conexión a SQLite cerrada correctamente.")

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        
        # Validar que tengamos los campos mínimos de consistencia
        if not adapter.get('ean') or not adapter.get('price'):
            self.logger.warning(f"Item ignorado por falta de EAN o precio: {item}")
            return item
            
        self.buffer.append(adapter.asdict())
        
        # Si llegamos al límite del búfer, volcamos a disco
        if len(self.buffer) >= self.buffer_size:
            self._flush_buffer()
            
        return item

    def _flush_buffer(self):
        if not self.buffer:
            return
            
        self.logger.info(f"Ejecutando Bulk Insert de {len(self.buffer)} items...")
        
        try:
            # Iniciamos transacción explícita para evitar que cada INSERT bloquee la db
            self.conn.execute("BEGIN TRANSACTION;")
            
            for item in self.buffer:
                # 1. Insertar o actualizar la información maestra del Producto
                self.cursor.execute("""
                    INSERT OR REPLACE INTO products (ean, name, brand, image_url)
                    VALUES (?, ?, ?, ?)
                """, (
                    item.get('ean'),
                    item.get('name', ''),
                    item.get('brand', ''),
                    item.get('image_url', '')
                ))
                
                # 2. Insertar o actualizar el Precio Actual para esa Sucursal
                self.cursor.execute("""
                    INSERT OR REPLACE INTO prices (product_ean, store_id, price, list_price)
                    VALUES (?, ?, ?, ?)
                """, (
                    item.get('ean'),
                    item.get('store_id'),
                    item.get('price'),
                    item.get('list_price', item.get('price')) # Default list_price si no está presente
                ))
                
            self.conn.commit()
            self.logger.info(f"Se insertaron/actualizaron {len(self.buffer)} items en la base de datos.")
            
        except sqlite3.Error as e:
            self.conn.rollback()
            self.logger.error(f"Error de base de datos durante Bulk Insert. Rollback ejecutado: {e}")
        finally:
            self.buffer.clear()

import re
import unicodedata
import hashlib
from sqlalchemy.dialects.sqlite import insert
from .database import get_session, ProductoMaestro, SucursalPrecio

class DataNormalizationPipeline:
    """
    Pipeline encargado de:
    1. Normalizar textos (mayúsculas, sin tildes, sin espacios extra).
    2. Extraer Contenido Neto y Unidad de Medida (UOM) vía Regex.
    3. Castear precios a Float para seguridad matemática.
    """
    UOM_PATTERN = re.compile(r'(\d+(?:[.,]\d+)?)\s*(kg|g|gr|l|ml|cc)\b', re.IGNORECASE)

    def normalize_text(self, text):
        if not text:
            return ""
        text = str(text).upper()
        text = ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def process_item(self, item, spider):
        raw_name = item.get('name', '')
        
        item['name'] = self.normalize_text(raw_name)
        if item.get('brand'):
            item['brand'] = self.normalize_text(item['brand'])

        item['net_content'] = None
        item['unit'] = None
        
        if raw_name:
            match = self.UOM_PATTERN.search(raw_name)
            if match:
                value_str = match.group(1).replace(',', '.')
                unit_str = match.group(2).upper()
                
                if unit_str == 'GR':
                    unit_str = 'G'
                elif unit_str == 'CC':
                    unit_str = 'ML'
                    
                try:
                    item['net_content'] = float(value_str)
                    item['unit'] = unit_str
                except ValueError:
                    pass

        for field in ['precio_actual', 'precio_lista', 'price']:
            if item.get(field) is not None:
                try:
                    item[field] = float(item[field])
                except (ValueError, TypeError):
                    item[field] = None

        return item


class SQLitePipeline:
    """
    Pipeline que guarda los items normalizados en la base de datos SQLite.
    Genera un EAN sintético si no existe, y realiza upserts en ProductoMaestro y SucursalPrecio.
    """
    BATCH_SIZE = 50

    def __init__(self):
        self.session = None
        self._pending_maestro = []
        self._pending_precio = []

    def open_spider(self, spider):
        self.session = get_session()

    def close_spider(self, spider):
        self._flush(spider)
        if self.session:
            self.session.close()

    def generate_synthetic_ean(self, name, brand):
        """Genera un EAN sintético basado en un hash del nombre y marca"""
        base_string = f"{name or ''}|{brand or ''}".strip().lower()
        hash_obj = hashlib.md5(base_string.encode('utf-8'))
        # Prefix 'SYN-' to identify synthetic EANs
        return f"SYN-{hash_obj.hexdigest()[:10].upper()}"

    def process_item(self, item, spider):
        ean = item.get('barcode') or item.get('ean')
        
        # Generar EAN sintético si no viene
        if not ean:
            ean = self.generate_synthetic_ean(item.get('name'), item.get('brand'))
        else:
            ean = str(ean).strip()
            if ean.endswith('.0'):
                ean = ean[:-2]

        supermarket_id = item.get('supermarket', getattr(spider, 'name', 'unknown')).lower()
        
        # 1. Upsert en ProductoMaestro (para asegurar la FK)
        stmt_maestro = insert(ProductoMaestro).values(
            ean=ean,
            nombre_estandarizado=item.get('name', ''),
            marca=item.get('brand'),
            contenido_neto=float(item.get('net_content')) if item.get('net_content') is not None else 0.0,
            unidad_medida=item.get('unit'),
        )
        
        # Si ya existe (especialmente EANs reales), tal vez no queremos sobreescribir todo,
        # pero para simplificar, actualizamos con lo último scrapeado si faltan datos
        on_conflict_maestro = stmt_maestro.on_conflict_do_update(
            index_elements=['ean'],
            set_={
                'nombre_estandarizado': stmt_maestro.excluded.nombre_estandarizado,
                'marca': stmt_maestro.excluded.marca
            }
        )
        
        precio_actual = item.get('precio_actual') or item.get('price')
        
        if precio_actual is None:
            # No podemos guardar un producto sin precio
            return item

        # 2. Upsert en SucursalPrecio
        stmt_precio = insert(SucursalPrecio).values(
            producto_ean=ean,
            supermercado_id=supermarket_id,
            precio_actual=precio_actual,
            precio_lista=float(item.get('precio_lista')) if item.get('precio_lista') is not None else float(precio_actual),
            url_imagen=item.get('image_url'),
            product_url=item.get('product_url'),
            disponible_online=item.get('disponible_online', True)
        )
        
        # UniqueConstraint: [producto_ean, supermercado_id]
        on_conflict_precio = stmt_precio.on_conflict_do_update(
            index_elements=['producto_ean', 'supermercado_id'],
            set_={
                'precio_actual': stmt_precio.excluded.precio_actual,
                'precio_lista': stmt_precio.excluded.precio_lista,
                'url_imagen': stmt_precio.excluded.url_imagen,
                'product_url': stmt_precio.excluded.product_url,
                'disponible_online': stmt_precio.excluded.disponible_online,
                'ultima_actualizacion': stmt_precio.excluded.ultima_actualizacion
            }
        )

        self._pending_maestro.append(on_conflict_maestro)
        self._pending_precio.append(on_conflict_precio)

        if len(self._pending_precio) >= self.BATCH_SIZE:
            self._flush(spider)

        return item

    def _flush(self, spider=None):
        if not self._pending_maestro and not self._pending_precio:
            return
            
        try:
            for stmt in self._pending_maestro:
                self.session.execute(stmt)
            for stmt in self._pending_precio:
                self.session.execute(stmt)
            self.session.commit()
        except Exception as e:
            self.session.rollback()
            if spider:
                spider.logger.error(f"Error insertando batch en DB: {e}")
        finally:
            self._pending_maestro.clear()
            self._pending_precio.clear()

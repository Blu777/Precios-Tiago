import scrapy
import json
from datetime import datetime
from miraprecios_scraper.items import ProductoItem

class EjemploSuperSpider(scrapy.Spider):
    name = 'ejemplo_super'
    allowed_domains = ['ejemplo-supermercado.com.ar']
    
    # Endpoint de la API. Asumimos una arquitectura tipo VTEX, muy común en supermercados argentinos (ej. Disco, Jumbo, Vea)
    api_url = 'https://www.ejemplo-supermercado.com.ar/api/catalog_system/pub/products/search'

    def start_requests(self):
        # Categorías iniciales o department IDs
        categories = ['almacen', 'bebidas']
        
        # IMPORTANTE: Manejo de Sucursal y Código Postal en Argentina.
        # Muchos supermercados requieren que definas la sucursal o CP 
        # antes de consultar precios, de lo contrario devuelve null o error.
        
        # 1. Vía Cookies (Ejemplo: VTEX suele usar vtex_segment)
        cookies_sucursal = {
            'vtex_segment': 'eyJjYW1wYWlnbnNTZXJ2ZXJRdWVyeSI6IiIsImNoYW5uZWwiOiIxIiwiY29tcGFueUlkIj...', 
            'storeId': '123'
        }
        
        # 2. Vía Headers customizados
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            # 'x-sucursal-id': '104' 
        }

        for category in categories:
            # Paginación inicial (ej: VTEX usa _from y _to)
            _from = 0
            _to = 49
            
            # Construimos la URL de búsqueda
            url = f"{self.api_url}?fq=C:/{category}/&_from={_from}&_to={_to}"
            
            yield scrapy.Request(
                url=url,
                method='GET', # A veces las APIs custom usan POST, cambiar según sea necesario
                headers=headers,
                cookies=cookies_sucursal,
                callback=self.parse,
                # Pasamos metadatos para mantener el contexto de la paginación
                meta={'category': category, 'from': _from, 'to': _to, 'cookies_sucursal': cookies_sucursal, 'headers': headers}
            )

    def parse(self, response):
        try:
            # Parseamos el JSON directo, sin tocar BeautifulSoup o XPATH
            data = json.loads(response.body)
        except json.JSONDecodeError:
            self.logger.error("Error al decodificar JSON")
            return

        # Condición de corte para la paginación (si el array viene vacío)
        if not data:
            self.logger.info(f"No hay más resultados para la categoría {response.meta['category']}")
            return

        # Iterar sobre los productos devueltos por la API
        for product in data:
            item = ProductoItem()
            
            # Extracción basada en un JSON típico de VTEX
            item['name'] = product.get('productName')
            item['brand'] = product.get('brand')
            item['supermarket'] = 'EjemploSuper'
            item['timestamp'] = datetime.utcnow().isoformat()
            
            # URL del producto
            link_text = product.get('linkText')
            item['product_url'] = f"https://www.ejemplo-supermercado.com.ar/{link_text}/p" if link_text else response.url
            
            # Para precio, imagen y SKU hay que meterse en los "items" (variantes/SKUs)
            skus = product.get('items', [])
            if skus:
                first_sku = skus[0]
                item['sku'] = first_sku.get('itemId')
                
                # Imágenes
                images = first_sku.get('images', [])
                if images:
                    item['image_url'] = images[0].get('imageUrl')
                
                # Precio (suele estar en sellers -> commertialOffer)
                sellers = first_sku.get('sellers', [])
                if sellers:
                    offer = sellers[0].get('commertialOffer', {})
                    item['price'] = offer.get('Price')
            
            yield item

        # Procesar siguiente página de resultados
        _from = response.meta['from']
        _to = response.meta['to']
        
        # Aumentamos los índices. VTEX suele traer hasta 50 ítems por request.
        next_from = _to + 1
        next_to = next_from + 49
        
        category = response.meta['category']
        next_url = f"{self.api_url}?fq=C:/{category}/&_from={next_from}&_to={next_to}"
        
        yield scrapy.Request(
            url=next_url,
            method='GET',
            headers=response.meta['headers'],
            cookies=response.meta['cookies_sucursal'],
            callback=self.parse,
            meta={
                'category': category, 
                'from': next_from, 
                'to': next_to, 
                'cookies_sucursal': response.meta['cookies_sucursal'], 
                'headers': response.meta['headers']
            }
        )

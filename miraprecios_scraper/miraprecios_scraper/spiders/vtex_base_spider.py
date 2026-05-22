import scrapy
import json
from datetime import datetime
from miraprecios_scraper.items import ProductoItem

class VtexBaseSpider(scrapy.Spider):
    name = 'vtex_base'
    allowed_domains = ['supermercado.com.ar']
    
    # URL típica de la API pública de VTEX
    api_url = 'https://www.supermercado.com.ar/api/catalog_system/pub/products/search'

    def start_requests(self):
        # Departamentos o categorías principales a mapear
        categories = ['almacen', 'bebidas', 'limpieza', 'frescos']
        
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        # En VTEX, la tienda específica (y sus precios correspondientes) 
        # suele configurarse por la cookie storeId o vtex_segment
        cookies = {
            'storeId': '1' 
        }

        for category in categories:
            _from = 0
            _to = 49
            
            url = f"{self.api_url}?fq=C:/{category}/&_from={_from}&_to={_to}"
            
            yield scrapy.Request(
                url=url,
                method='GET',
                headers=headers,
                cookies=cookies,
                callback=self.parse,
                meta={'category': category, 'from': _from, 'to': _to, 'cookies': cookies, 'headers': headers}
            )

    def parse(self, response):
        try:
            data = json.loads(response.body)
        except json.JSONDecodeError:
            self.logger.error("Error al decodificar la respuesta JSON")
            return

        # Condición de corte para la paginación (si no quedan más resultados)
        if not data:
            self.logger.info(f"Paginación finalizada para {response.meta['category']}")
            return

        for product in data:
            item = ProductoItem()
            item['name'] = product.get('productName')
            item['brand'] = product.get('brand')
            item['supermarket'] = 'VTEX_Super'
            item['timestamp'] = datetime.utcnow().isoformat()
            
            link_text = product.get('linkText')
            item['product_url'] = f"https://www.supermercado.com.ar/{link_text}/p" if link_text else response.url
            
            # Navegar por los items (SKUs) para encontrar precio y fotos
            skus = product.get('items', [])
            if skus:
                first_sku = skus[0]
                item['sku'] = first_sku.get('itemId')
                
                images = first_sku.get('images', [])
                if images:
                    item['image_url'] = images[0].get('imageUrl')
                
                sellers = first_sku.get('sellers', [])
                if sellers:
                    offer = sellers[0].get('commertialOffer', {})
                    item['price'] = offer.get('Price')
            
            yield item

        # Procesar siguiente página de esta categoría
        _from = response.meta['from']
        _to = response.meta['to']
        
        next_from = _to + 1
        next_to = next_from + 49
        
        category = response.meta['category']
        next_url = f"{self.api_url}?fq=C:/{category}/&_from={next_from}&_to={next_to}"
        
        yield scrapy.Request(
            url=next_url,
            method='GET',
            headers=response.meta['headers'],
            cookies=response.meta['cookies'],
            callback=self.parse,
            meta={
                'category': category, 
                'from': next_from, 
                'to': next_to, 
                'cookies': response.meta['cookies'], 
                'headers': response.meta['headers']
            }
        )

import scrapy
import json
import logging

class BaseVtexSpider(scrapy.Spider):
    """
    Spider base para cualquier supermercado que utilice el ecosistema VTEX en Argentina.
    Maneja la paginación nativa y el parseo del catálogo estándar de forma resiliente.
    """
    name = "base_vtex"
    
    # Estos atributos DEBEN ser sobreescritos por las clases hijas
    domain = None
    store_id = None
    chain_name = None
    
    # Tamaño del bloque de paginación VTEX
    batch_size = 50

    def start_requests(self):
        if not all([self.domain, self.store_id, self.chain_name]):
            raise ValueError("Faltan definir atributos requeridos (domain, store_id, chain_name) en la clase hija.")
            
        base_url = f"https://{self.domain}/api/catalog_system/pub/products/search"
        
        # Agregamos '_from' y '_to' para la paginación inicial (0 a 49)
        from_idx = 0
        to_idx = self.batch_size - 1
        
        url = f"{base_url}?_from={from_idx}&_to={to_idx}&sc={self.store_id}"
        
        yield scrapy.Request(
            url=url,
            callback=self.parse_vtex,
            meta={'from_idx': from_idx, 'to_idx': to_idx, 'base_url': base_url}
        )

    def parse_vtex(self, response):
        try:
            data = json.loads(response.body)
        except json.JSONDecodeError as e:
            self.logger.error(f"Error crítico al decodificar JSON de {response.url}: {e}")
            return
            
        # Condición de salida limpia: si la API devuelve un array vacío, llegamos al final del catálogo
        if not data:
            self.logger.info(f"Fin de paginación alcanzado en el índice {response.meta['from_idx']}.")
            return
            
        items_extracted = 0
            
        for product in data:
            try:
                # EAN puede venir en distintas keys según la implementación VTEX particular
                ean = product.get('productReference') or product.get('productId')
                
                # Extracción segura de la jerarquía de precios
                items = product.get('items', [])
                if not items:
                    continue
                    
                sellers = items[0].get('sellers', [])
                if not sellers:
                    continue
                    
                offer = sellers[0].get('commertialOffer', {})
                price = offer.get('Price')
                list_price = offer.get('ListPrice', price)
                
                # Descartamos basura o productos sin stock cuyo precio es cero
                if not price or price <= 0:
                    continue
                    
                image_url = ""
                images = items[0].get('images', [])
                if images:
                    image_url = images[0].get('imageUrl', '')

                yield {
                    'ean': str(ean),
                    'name': product.get('productName', ''),
                    'brand': product.get('brand', ''),
                    'image_url': image_url,
                    'price': float(price),
                    'list_price': float(list_price),
                    'store_id': str(self.store_id),
                    'chain': self.chain_name
                }
                items_extracted += 1
                
            except Exception as e:
                self.logger.debug(f"Error parseando producto individual (ignorado): {e}")
                continue
                
        self.logger.info(f"Se extrajeron {items_extracted} productos válidos en el bloque [{response.meta['from_idx']}-{response.meta['to_idx']}].")
        
        # Calcular los siguientes índices para el próximo bloque (recursión)
        next_from = response.meta['to_idx'] + 1
        next_to = next_from + self.batch_size - 1
        
        next_url = f"{response.meta['base_url']}?_from={next_from}&_to={next_to}&sc={self.store_id}"
        
        yield scrapy.Request(
            url=next_url,
            callback=self.parse_vtex,
            meta={'from_idx': next_from, 'to_idx': next_to, 'base_url': response.meta['base_url']}
        )

import scrapy
import json
import urllib.parse
from datetime import datetime

class CotoSpider(scrapy.Spider):
    name = 'coto'
    allowed_domains = []
    
    api_key = "key_r6xzz4IAoTWcipni"
    base_url = "https://ac.cnstrc.com/browse/group_id"
    
    # Categorías excluidas, mismas que VTEX
    CATEGORIAS_EXCLUIDAS = [
        'electro', 'tecnologia', 'tecnología', 'tv', 'audio', 'video',
        'celulares', 'informatica', 'informática', 'climatizacion', 'climatización',
        'hogar', 'bazar', 'muebles', 'decó', 'deco', 'decoracion', 'decoración',
        'blanco', 'colchones', 'sommiers', 'iluminacion', 'iluminación',
        'indumentaria', 'ropa', 'calzado', 'deportes', 'textil', 'tiempo libre',
        'valijas', 'mochilas',
        'ferreteria', 'ferretería', 'herramientas', 'pintureria', 'pinturería',
        'jardin', 'jardín', 'neumaticos', 'neumáticos', 'automotor', 'construccion', 'construcción',
        'camping', 'piletas',
        'juguetes', 'jugueteria', 'juguetería', 'libreria', 'librería', 'rodados', 'bicicletas',
        'navidad', 'fiestas'
    ]
    
    start_urls = [
        f"https://ac.cnstrc.com/browse/group_id/categoria?key=key_r6xzz4IAoTWcipni&i=miraprecios_bot&s=1&page=1&num_results_per_page=1"
    ]

    def parse(self, response):
        return self.parse_root_categories(response)

    def parse_root_categories(self, response):
        data = json.loads(response.body)
        
        groups = data.get('response', {}).get('groups', [])
        
        category_options = []
        if groups:
            # En Constructor.io de Coto, el root tiene un grupo principal con 'children'
            first_group = groups[0]
            category_options = first_group.get('children', [])
                
        self.logger.info(f"Encontradas {len(category_options)} categorías principales.")
        
        for opt in category_options:
            name = opt.get('display_name', '').lower()
            if any(excluida in name for excluida in self.CATEGORIAS_EXCLUIDAS):
                self.logger.info(f"Saltando categoría excluida: {name}")
                continue
                
            group_id = opt.get('group_id')  # Es group_id en children de groups
            if not group_id:
                group_id = opt.get('value') # Fallback por si viene en value
            if not group_id:
                continue
                
            # Codificar group_id por si tiene caracteres especiales
            encoded_group = urllib.parse.quote(group_id)
            url = f"{self.base_url}/{encoded_group}?key={self.api_key}&i=miraprecios_bot&s=1&page=1&num_results_per_page=100"
            yield scrapy.Request(
                url, 
                callback=self.parse_products,
                meta={'group_id': group_id, 'page': 1}
            )

    def parse_products(self, response):
        try:
            data = json.loads(response.body)
        except json.JSONDecodeError:
            self.logger.error("Error decodificando JSON en Constructor API.")
            return
            
        response_data = data.get('response', {})
        results = response_data.get('results', [])
        
        for item in results:
            data_field = item.get('data', {})
            
            # Filtrar productos fantasma/sin stock en coto (store_availability vacio)
            store_availability = data_field.get('store_availability', [])
            if not store_availability:
                continue
            
            sku_id = data_field.get('sku_id') or item.get('value')
            
            # Limpieza y conversión de EAN/Barcode
            barcode = data_field.get('product_main_ean')
            if barcode is not None:
                barcode = str(barcode).strip()
            if not barcode or barcode in ('0', '', 'None'):
                barcode = None
                
            name = data_field.get('sku_display_name') or item.get('value')
            brand = data_field.get('product_brand')
            
            # Obtener precios. Usamos product_list_price base.
            precio_actual = data_field.get('product_list_price')
            precio_lista = data_field.get('product_list_price')
            
            if precio_actual is None:
                continue
                
            image_url = data_field.get('product_large_image_url')
            if not image_url:
                image_url = data_field.get('image_url')
                
            # URL de producto genérica
            product_url = f"https://www.cotodigital.com.ar/sitios/cdigi/nuevositio/producto/{sku_id}"
            
            # Intento de extraer texto de promoción (puede variar según la API)
            promocion_text = data_field.get('promo_desc') or data_field.get('promocion') or data_field.get('discount_badge')

            yield {
                'sku': sku_id,
                'barcode': barcode,
                'name': name,
                'brand': brand,
                'precio_actual': float(precio_actual) if precio_actual is not None else None,
                'precio_lista': float(precio_lista) if precio_lista is not None else None,
                'promocion': promocion_text,
                'image_url': image_url,
                'product_url': product_url,
                'categoria_id': response.meta['group_id'],
                'timestamp': datetime.utcnow().isoformat(),
                'supermarket': 'coto'
            }

        # Paginación
        total_results = response_data.get('total_num_results', 0)
        current_page = response.meta['page']
        
        if current_page * 100 < total_results:
            next_page = current_page + 1
            group_id = response.meta['group_id']
            encoded_group = urllib.parse.quote(group_id)
            url = f"{self.base_url}/{encoded_group}?key={self.api_key}&i=miraprecios_bot&s=1&page={next_page}&num_results_per_page=100"
            yield scrapy.Request(
                url, 
                callback=self.parse_products,
                meta={'group_id': group_id, 'page': next_page}
            )

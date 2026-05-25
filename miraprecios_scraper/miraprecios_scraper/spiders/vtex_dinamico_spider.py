import scrapy
import json
from datetime import datetime

class VtexDinamicoSpider(scrapy.Spider):
    name = 'vtex_dinamico'

    TIENDAS = {
        'dia': {
            'domain': 'supermercadosdia.com.ar',
            'base_url': 'https://diaonline.supermercadosdia.com.ar',
            'name': 'Dia'
        },
        'changomas': {
            'domain': 'masonline.com.ar',
            'base_url': 'https://www.masonline.com.ar',
            'name': 'ChangoMas'
        },
        'jumbo': {
            'domain': 'jumbo.com.ar',
            'base_url': 'https://www.jumbo.com.ar',
            'name': 'Jumbo'
        },
        'vea': {
            'domain': 'vea.com.ar',
            'base_url': 'https://www.vea.com.ar',
            'name': 'Vea'
        }
    }

    def __init__(self, tienda=None, *args, **kwargs):
        if tienda:
            kwargs['tienda'] = tienda
        super(VtexDinamicoSpider, self).__init__(*args, **kwargs)
        
        # Validar el argumento que llega por línea de comandos
        if not tienda or tienda.lower() not in self.TIENDAS:
            opciones = ", ".join(self.TIENDAS.keys())
            raise ValueError(f"Debes especificar una tienda válida (-a tienda=...). Opciones: {opciones}")
            
        config = self.TIENDAS[tienda.lower()]
        self.allowed_domains = [config['domain']]
        self.base_url = config['base_url']
        self.supermercado_name = config['name']

    async def start(self):
        self.logger.info(f"Iniciando start para {self.supermercado_name} (Base: {self.base_url})")
        tree_url = f"{self.base_url}/api/catalog_system/pub/category/tree/3/"
        
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        req = scrapy.Request(
            url=tree_url,
            method='GET',
            headers=headers,
            callback=self.parse_category_tree,
            meta={'headers': headers},
            dont_filter=True
        )
        self.logger.info(f"Generado Request inicial: {req.url}")
        yield req

    def parse_category_tree(self, response):
        try:
            categories = json.loads(response.body)
        except json.JSONDecodeError:
            self.logger.error(f"Error al decodificar el árbol JSON de {self.supermercado_name}")
            return

        leaf_paths = self._get_leaf_categories(categories)
        self.logger.info(f"Se encontraron {len(leaf_paths)} subcategorías en {self.supermercado_name}.")

        for path_subcategoria in leaf_paths:
            _from = 0
            _to = 49
            
            search_url = f"{self.base_url}/api/catalog_system/pub/products/search{path_subcategoria}?_from={_from}&_to={_to}"
            
            yield scrapy.Request(
                url=search_url,
                method='GET',
                headers=response.meta['headers'],
                callback=self.parse_products,
                meta={
                    'path_subcategoria': path_subcategoria,
                    'from': _from,
                    'to': _to,
                    'headers': response.meta['headers']
                }
            )

    def _get_leaf_categories(self, category_nodes):
        paths = []
        for node in category_nodes:
            children = node.get('children', [])
            if not children:
                url = node.get('url', '')
                path = url.replace(self.base_url, "")
                if not path.startswith('/'):
                    path = '/' + path
                paths.append(path)
            else:
                paths.extend(self._get_leaf_categories(children))
        return paths

    def parse_products(self, response):
        try:
            data = json.loads(response.body)
        except json.JSONDecodeError:
            self.logger.error(f"Error JSON en {response.url}")
            return

        if not data:
            return

        for product in data:
            nombre = product.get('productName', '')
            marca = product.get('brand', '')
            link = product.get('link', '')

            skus = product.get('items', [])
            if not skus:
                continue

            first_sku = skus[0]
            sku_id = first_sku.get('itemId')
            
            url_imagen = None
            images = first_sku.get('images', [])
            if images:
                url_imagen = images[0].get('imageUrl')

            sellers = first_sku.get('sellers', [])
            if not sellers:
                continue
                
            active_seller = None
            for seller in sellers:
                offer = seller.get('commertialOffer', {})
                
                # 3. Robustez añadida para compatibilidad entre ambas tiendas
                # En algunos marketplaces/tiendas, el quantity puede venir como None
                qty = offer.get('AvailableQuantity', 0)
                if qty is None:
                    qty = 0
                    
                if qty > 0:
                    active_seller = offer
                    break
            
            if not active_seller:
                continue
                
            precio_actual = active_seller.get('Price')
            precio_lista = active_seller.get('ListPrice')
            
            # Robustez extra: Si ListPrice no existe o es 0, solemos clonar el Price
            if not precio_lista or precio_lista == 0:
                precio_lista = precio_actual
            
            url_producto = link
            if url_producto and not url_producto.startswith('http'):
                url_producto = f"{self.base_url}{url_producto}"
            elif not url_producto:
                link_text = product.get('linkText')
                url_producto = f"{self.base_url}/{link_text}/p" if link_text else response.url

            yield {
                'sku': sku_id,
                'name': nombre,
                'brand': marca,
                'precio_actual': float(precio_actual) if precio_actual is not None else None,
                'precio_lista': float(precio_lista) if precio_lista is not None else None,
                'image_url': url_imagen,
                'product_url': url_producto,
                'timestamp': datetime.utcnow().isoformat(),
                'supermarket': self.supermercado_name
            }

        cantidad_solicitada = (response.meta['to'] - response.meta['from']) + 1
        
        if len(data) == cantidad_solicitada:
            _from = response.meta['from']
            _to = response.meta['to']
            
            next_from = _to + 1
            next_to = next_from + 49
            
            if next_to >= 2500:
                self.logger.warning(f"Límite de VTEX alcanzado en {response.meta['path_subcategoria']}")
                return
                
            path_subcategoria = response.meta['path_subcategoria']
            next_url = f"{self.base_url}/api/catalog_system/pub/products/search{path_subcategoria}?_from={next_from}&_to={next_to}"
            
            yield scrapy.Request(
                url=next_url,
                method='GET',
                headers=response.meta['headers'],
                callback=self.parse_products,
                meta={
                    'path_subcategoria': path_subcategoria,
                    'from': next_from,
                    'to': next_to,
                    'headers': response.meta['headers']
                }
            )

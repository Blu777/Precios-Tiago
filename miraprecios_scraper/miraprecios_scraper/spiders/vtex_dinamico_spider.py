import scrapy
import json
from datetime import datetime

class VtexDinamicoSpider(scrapy.Spider):
    name = 'vtex_dinamico'

    TIENDAS = {
        'dia': {
            'domain': 'supermercadosdia.com.ar',
            'base_url': 'https://diaonline.supermercadosdia.com.ar',
            'name': 'dia'
        },
        'changomas': {
            'domain': 'masonline.com.ar',
            'base_url': 'https://www.masonline.com.ar',
            'name': 'changomas'
        },
        'jumbo': {
            'domain': 'jumbo.com.ar',
            'base_url': 'https://www.jumbo.com.ar',
            'name': 'jumbo'
        },
        'vea': {
            'domain': 'vea.com.ar',
            'base_url': 'https://www.vea.com.ar',
            'name': 'vea'
        },
        'disco': {
            'domain': 'disco.com.ar',
            'base_url': 'https://www.disco.com.ar',
            'name': 'disco'
        },
        'carrefour': {
            'domain': 'carrefour.com.ar',
            'base_url': 'https://www.carrefour.com.ar',
            'name': 'carrefour'
        },
    }

    CATEGORIAS_EXCLUIDAS = [
        # Electro y Tecnología
        'electro', 'tecnologia', 'tecnología', 'tv', 'audio', 'video',
        'celulares', 'informatica', 'informática', 'climatizacion', 'climatización',
        
        # Hogar, Muebles y Deco
        'hogar', 'bazar', 'muebles', 'decó', 'deco', 'decoracion', 'decoración',
        'blanco', 'colchones', 'sommiers', 'iluminacion', 'iluminación',
        
        # Indumentaria y Deportes
        'indumentaria', 'ropa', 'calzado', 'deportes', 'textil', 'tiempo libre',
        'valijas', 'mochilas',
        
        # Herramientas, Auto y Jardín
        'ferreteria', 'ferretería', 'herramientas', 'pintureria', 'pinturería',
        'jardin', 'jardín', 'neumaticos', 'neumáticos', 'automotor', 'construccion', 'construcción',
        'camping', 'piletas',
        
        # Ocio y Otros
        'juguetes', 'jugueteria', 'juguetería', 'libreria', 'librería', 'rodados', 'bicicletas',
        'navidad', 'fiestas'
    ]


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
            'Content-Type': 'application/json',
            'Referer': self.base_url + '/',
            'Origin': self.base_url,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7'
        }
        
        req = scrapy.Request(
            url=tree_url,
            method='GET',
            headers=headers,
            callback=self.parse_category_tree,
            meta={
                'headers': headers,
                'dont_proxy': True,
                'download_timeout': 10
            },
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
                    'headers': response.meta['headers'],
                    'order': None
                }
            )

    def _get_leaf_categories(self, category_nodes):
        paths = []
        for node in category_nodes:
            name = node.get('name', '').lower()
            
            # Si el nombre de la categoría contiene alguna palabra excluida, la saltamos a ella y a todos sus hijos
            if any(excluida in name for excluida in self.CATEGORIAS_EXCLUIDAS):
                self.logger.info(f"Saltando categoría no de supermercado: {node.get('name')}")
                continue

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

            # --- FIX 1.A: Extraer EAN/GTIN real desde referenceId ---
            barcode = None
            reference_ids = first_sku.get('referenceId', [])
            
            # Buscamos primero EAN o GTIN explícito
            for ref in reference_ids:
                if ref.get('Key', '').upper() in ('EAN', 'GTIN', 'BARCODE'):
                    val = str(ref.get('Value', '')).strip()
                    if val and val not in ('0', '', 'None'):
                        barcode = val
                        break
                        
            # Fallback a campo directo EAN
            if not barcode:
                ean_field = first_sku.get('ean') or first_sku.get('EAN') or first_sku.get('gtin')
                if ean_field:
                    val = str(ean_field).strip()
                    if val and val not in ('0', '', 'None'):
                        barcode = val
                        
            # Fallback final a RefId si no hay nada más
            if not barcode:
                for ref in reference_ids:
                    if ref.get('Key', '').upper() == 'REFID':
                        val = str(ref.get('Value', '')).strip()
                        if val and val not in ('0', '', 'None'):
                            barcode = val
                            break
            
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
            elif precio_actual and precio_lista > precio_actual * 10:
                # Cencosud VTEX a veces devuelve el ListPrice (Base Price sin IVA) multiplicado por 100
                precio_lista = precio_lista / 100.0
                
            promocion_text = None
            teasers = active_seller.get('Teasers', [])
            if teasers and len(teasers) > 0:
                # Extraemos el primer teaser disponible (frecuentemente es "<name>2x1</name>")
                # En algunas tiendas VTEX la estructura del teaser es {"<name>": "2x1", "id": "..."}
                primer_teaser = teasers[0]
                if '<name>' in primer_teaser:
                    promocion_text = primer_teaser.get('<name>')
                elif 'name' in primer_teaser:
                    promocion_text = primer_teaser.get('name')

            # Fallback a productClusters si la promo es a nivel general del producto
            if not promocion_text:
                clusters = product.get('productClusters', {})
                promo_kws = ['2x1', '3x2', '4x2', '50%', '60%', '70%', '80%', '2do', '2da', 'segunda unidad', 'lleva 3', 'llevá 3']
                for c_val in clusters.values():
                    if isinstance(c_val, str) and any(kw in c_val.lower() for kw in promo_kws):
                        promocion_text = c_val
                        break
            
            url_producto = link
            if url_producto and not url_producto.startswith('http'):
                url_producto = f"{self.base_url}{url_producto}"
            elif not url_producto:
                link_text = product.get('linkText')
                url_producto = f"{self.base_url}/{link_text}/p" if link_text else response.url

            path_subcategoria = response.meta.get('path_subcategoria', '')
            segments = [s for s in path_subcategoria.split('/') if s]
            categoria_id = segments[0].lower().replace('-', ' ') if segments else None

            yield {
                'sku': sku_id,
                'barcode': barcode,   # FIX 1.A: EAN real (o None si no lo expone la tienda)
                'name': nombre,
                'brand': marca,
                'precio_actual': float(precio_actual) if precio_actual is not None else None,
                'precio_lista': float(precio_lista) if precio_lista is not None else None,
                'promocion': promocion_text,
                'image_url': url_imagen,
                'product_url': url_producto,
                'categoria_id': categoria_id,
                'timestamp': datetime.utcnow().isoformat(),
                'supermarket': self.supermercado_name
            }

        cantidad_solicitada = (response.meta['to'] - response.meta['from']) + 1
        
        if len(data) == cantidad_solicitada:
            _from = response.meta['from']
            _to = response.meta['to']
            order = response.meta.get('order')
            path_subcategoria = response.meta['path_subcategoria']
            
            # Paso 4: Bypass Inteligente del Límite de 2500 ítems (Sub-split)
            if _from == 0 and order is None:
                # Extraemos el total de productos del header 'resources' (Ej: "0-49/3200")
                resources = response.headers.get('resources', b'').decode('utf-8')
                if resources and '/' in resources:
                    try:
                        total_items = int(resources.split('/')[1])
                        if total_items > 2500:
                            self.logger.info(f"⚡ Sub-split activado en {path_subcategoria} ({total_items} ítems exceden límite VTEX)")
                            
                            # Ramificamos en ASC y DESC para raspar hasta 5000 productos
                            for new_order in ['OrderByPriceASC', 'OrderByPriceDESC']:
                                next_url = f"{self.base_url}/api/catalog_system/pub/products/search{path_subcategoria}?_from=0&_to=49&O={new_order}"
                                yield scrapy.Request(
                                    url=next_url,
                                    method='GET',
                                    headers=response.meta['headers'],
                                    callback=self.parse_products,
                                    meta={
                                        'path_subcategoria': path_subcategoria,
                                        'from': 0,
                                        'to': 49,
                                        'headers': response.meta['headers'],
                                        'order': new_order
                                    },
                                    dont_filter=True
                                )
                            # Cortamos la rama normal (None) para redirigir el flujo a las sub-ramas ordenadas
                            return
                    except Exception as e:
                        self.logger.warning(f"No se pudo extraer total de ítems del header resources: {e}")
            
            next_from = _to + 1
            next_to = next_from + 49
            
            if next_to >= 2500:
                self.logger.info(f"Límite de 2500 alcanzado en la rama order={order} para {path_subcategoria}")
                return
                
            next_url = f"{self.base_url}/api/catalog_system/pub/products/search{path_subcategoria}?_from={next_from}&_to={next_to}"
            if order:
                next_url += f"&O={order}"
            
            yield scrapy.Request(
                url=next_url,
                method='GET',
                headers=response.meta['headers'],
                callback=self.parse_products,
                meta={
                    'path_subcategoria': path_subcategoria,
                    'from': next_from,
                    'to': next_to,
                    'headers': response.meta['headers'],
                    'order': order
                }
            )

from miraprecios_scraper.spiders.base_vtex import BaseVtexSpider

class DiaSpider(BaseVtexSpider):
    """
    Spider para Supermercados Día.
    
    Hereda de BaseVtexSpider por lo que toda la lógica de parseo y paginación
    ya está resuelta. Únicamente se inyectan las variables de negocio pertinentes.
    """
    name = "dia"
    
    # Mapeo de negocio VTEX para Día
    domain = "www.diaonline.com.ar"
    store_id = "1"
    chain_name = "Día"
    
    # Configuraciones específicas para no saturar al servidor
    custom_settings = {
        'CONCURRENT_REQUESTS_PER_DOMAIN': 4,
        'DOWNLOAD_DELAY': 0.5, # Medio segundo entre peticiones
        'ITEM_PIPELINES': {
            'miraprecios_scraper.pipelines.SQLitePipeline': 300,
        }
    }

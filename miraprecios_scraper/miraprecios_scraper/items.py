import scrapy

class ProductoItem(scrapy.Item):
    """
    Define los campos estándar que extraemos de los supermercados.
    """
    name = scrapy.Field()
    brand = scrapy.Field()
    price = scrapy.Field()
    precio_actual = scrapy.Field()
    precio_lista = scrapy.Field()
    net_content = scrapy.Field()
    unit = scrapy.Field()
    image_url = scrapy.Field()
    product_url = scrapy.Field()
    supermarket = scrapy.Field()
    sku = scrapy.Field()
    timestamp = scrapy.Field()

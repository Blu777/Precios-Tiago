import scrapy

class ProductoItem(scrapy.Item):
    """
    Define los campos estándar que extraemos de los supermercados.
    """
    name = scrapy.Field()
    brand = scrapy.Field()
    price = scrapy.Field()
    image_url = scrapy.Field()
    product_url = scrapy.Field()
    supermarket = scrapy.Field()
    sku = scrapy.Field()
    timestamp = scrapy.Field()

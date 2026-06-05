import scrapy

class Coto2Spider(scrapy.Spider):
    name = 'coto2'
    
    def start_requests(self):
        self.logger.info("COTO2 START REQUESTS CALLED")
        yield scrapy.Request("http://httpbin.org/get", callback=self.parse)
        
    def parse(self, response):
        self.logger.info("COTO2 PARSE CALLED")
        yield {"success": True}

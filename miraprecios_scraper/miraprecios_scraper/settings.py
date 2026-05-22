BOT_NAME = 'miraprecios_scraper'

SPIDER_MODULES = ['miraprecios_scraper.spiders']
NEWSPIDER_MODULE = 'miraprecios_scraper.spiders'

# Simular un navegador real
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# Obey robots.txt rules (A menudo se desactiva si el robots.txt bloquea APIs que necesitamos)
ROBOTSTXT_OBEY = False

# Configurar un retraso (DOWNLOAD_DELAY) para evitar bloqueos
DOWNLOAD_DELAY = 1
CONCURRENT_REQUESTS_PER_DOMAIN = 8

# Las cookies suelen ser críticas para el manejo de sucursales
COOKIES_ENABLED = True

# Deshabilitar consola telnet
TELNETCONSOLE_ENABLED = False

# Activar pipelines
ITEM_PIPELINES = {
   'miraprecios_scraper.pipelines.PriceSanitizationPipeline': 300,
   'miraprecios_scraper.pipelines.JsonWriterPipeline': 400,
}

# Configuraciones por defecto modernas
REQUEST_FINGERPRINTER_IMPLEMENTATION = '2.7'
# TWISTED_REACTOR = 'twisted.internet.asyncioreactor.AsyncioSelectorReactor'
FEED_EXPORT_ENCODING = 'utf-8'

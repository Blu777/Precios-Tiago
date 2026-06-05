BOT_NAME = 'miraprecios_scraper'

SPIDER_MODULES = ['miraprecios_scraper.spiders']
NEWSPIDER_MODULE = 'miraprecios_scraper.spiders'

# Simular un navegador real (Comentado porque usaremos rotación dinámica)
# USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# Obey robots.txt rules (A menudo se desactiva si el robots.txt bloquea APIs que necesitamos)
ROBOTSTXT_OBEY = False

# Configurar un retraso (DOWNLOAD_DELAY) para evitar bloqueos
# Reducimos el delay estático porque usaremos AutoThrottle
DOWNLOAD_DELAY = 0.5
CONCURRENT_REQUESTS_PER_DOMAIN = 16

# Las cookies suelen ser críticas para el manejo de sucursales
COOKIES_ENABLED = True

# Deshabilitar consola telnet
TELNETCONSOLE_ENABLED = False

# -----------------------------------------------------------------------------
# CONFIGURACIÓN DE MIDDLEWARES (ANTI-BOT)
# -----------------------------------------------------------------------------
DOWNLOADER_MIDDLEWARES = {
    # 1. Rotación de User-Agents
    'scrapy.downloadermiddlewares.useragent.UserAgentMiddleware': None,
    'scrapy_user_agents.middlewares.RandomUserAgentMiddleware': 400,

    # 2. Reintentos Avanzados (Exponential Backoff Custom)
    'scrapy.downloadermiddlewares.retry.RetryMiddleware': None,
    'miraprecios_scraper.middlewares.MiraPreciosRetryMiddleware': 500,

    # 3. Rotación de Proxies (Requiere scrapy-rotating-proxies)
    # 'rotating_proxies.middlewares.RotatingProxyMiddleware': 610,
    # 'rotating_proxies.middlewares.BanDetectionMiddleware': 620,
    
    # 4. Bypass de proxy para peticiones críticas iniciales
    'miraprecios_scraper.middlewares.BypassProxyMiddleware': 650,
}

# Configuración del Custom Retry
RETRY_ENABLED = True
RETRY_TIMES = 10
RETRY_HTTP_CODES = [403, 429, 500, 502, 503, 504]
# Exponential backoff parameters
RETRY_PRIORITY_ADJUST = -1
# Usar AutoThrottle en lugar de delay fijo largo
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 0.5
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 3.0
RANDOMIZE_DOWNLOAD_DELAY = True


# -----------------------------------------------------------------------------
# ROTACIÓN DE PROXIES
# -----------------------------------------------------------------------------
# Aquí configuras tu pool de proxies. Pueden ser IPs públicas o proxies de pago
# (Residenciales/Datacenter) con autenticación.
ROTATING_PROXY_LIST = [
    # 'ip:puerto',
    # 'usuario:password@ip:puerto',
    # 'proxy1.ejemplo.com:8000',
    # 'proxy2.ejemplo.com:8031',
    # 'john_doe:secretpass@192.168.1.100:3128',
]

# (Opcional) Si la lista de proxies es inmensa y prefieres leerla desde un archivo
# ROTATING_PROXY_LIST_PATH = '/path/to/proxies.txt'

# Tiempo en que un proxy penalizado (baneado o caído) tarda en volver a intentar (segundos)
ROTATING_PROXY_PAGE_RETRY_TIMES = 5

# Activar pipelines
ITEM_PIPELINES = {
   'miraprecios_scraper.pipelines.DataNormalizationPipeline': 300,
   'miraprecios_scraper.pipelines.SQLitePipeline': 400,
}

# Configuración de exportación nativa de Scrapy (Deshabilitada, ahora usamos SQLite)
# FEEDS = {
#     'data/temp_results.json': {
#         'format': 'json',
#         'overwrite': True,
#         'encoding': 'utf8',
#         'indent': 4,
#     }
# }

# Configuraciones por defecto modernas
REQUEST_FINGERPRINTER_IMPLEMENTATION = '2.7'
TWISTED_REACTOR = 'twisted.internet.asyncioreactor.AsyncioSelectorReactor'
FEED_EXPORT_ENCODING = 'utf-8'

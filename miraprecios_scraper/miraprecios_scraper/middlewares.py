import logging
from scrapy.downloadermiddlewares.retry import RetryMiddleware
from scrapy.utils.response import response_status_message
from twisted.internet.task import deferLater

logger = logging.getLogger(__name__)

class MiraPreciosRetryMiddleware(RetryMiddleware):
    """
    Middleware personalizado para manejar errores HTTP (403, 429, 50x)
    con Exponential Backoff asíncrono y rotación forzada de proxies.
    """
    def __init__(self, settings):
        super(MiraPreciosRetryMiddleware, self).__init__(settings)
        # Códigos que gatillan reintento (ej: 403 Cloudflare, 429 Too Many Requests)
        self.retry_http_codes = set(int(x) for x in settings.getlist('RETRY_HTTP_CODES'))
        # Factor base de espera en segundos para el backoff
        self.base_delay = 2 

    def process_request(self, request, spider):
        if hasattr(super(MiraPreciosRetryMiddleware, self), 'process_request'):
            return super(MiraPreciosRetryMiddleware, self).process_request(request, spider)
        return None

    def process_response(self, request, response, spider):
        if request.meta.get('dont_retry', False):
            return response

        if response.status in self.retry_http_codes:
            reason = response_status_message(response.status)
            # Reintentar y devolver un Deferred (pausa asíncrona) o el Response original si superó el límite
            return self._retry_with_backoff(request, reason, spider) or response

        return response

    def process_exception(self, request, exception, spider):
        if isinstance(exception, self.EXCEPTIONS_TO_RETRY) and not request.meta.get('dont_retry', False):
            return self._retry_with_backoff(request, exception, spider)

    def _retry_with_backoff(self, request, reason, spider):
        retries = request.meta.get('retry_times', 0) + 1
        
        if retries <= self.max_retry_times:
            # Cálculo del Exponential Backoff (2s, 4s, 8s, 16s...)
            delay = self.base_delay * (2 ** (retries - 1))
            
            logger.warning(
                f"[RETRY] Servidor saturado/protegido (Status: {reason}). "
                f"Pausando {delay}s antes del reintento {retries}/{self.max_retry_times}. URL: {request.url}"
            )
            
            retryreq = request.copy()
            retryreq.meta['retry_times'] = retries
            retryreq.dont_filter = True
            
            # Limpiar el proxy actual de la meta para obligar al RotatingProxyMiddleware a asignar una IP nueva
            if 'proxy' in retryreq.meta:
                del retryreq.meta['proxy']
            
            # IMPORTANTE: En lugar de usar time.sleep() que bloquearía todo el scraper (reactor de Twisted),
            # usamos deferLater para pausar solo esta petición asíncronamente y devolver el Request luego del delay.
            from twisted.internet import reactor
            return deferLater(reactor, delay, lambda: retryreq)
        else:
            logger.error(f"[GIVE UP] Máximo de reintentos ({self.max_retry_times}) superado para {request.url}")
            return None

class BypassProxyMiddleware:
    """
    Middleware para ignorar el proxy si el request tiene dont_proxy=True en su meta.
    Debe ejecutarse DESPUÉS de RotatingProxyMiddleware pero ANTES que HttpProxyMiddleware.
    """
    def process_request(self, request, spider):
        if request.meta.get('dont_proxy', False):
            # Limpiamos el proxy asignado por middlewares anteriores
            request.meta['proxy'] = None

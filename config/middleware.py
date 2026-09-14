import time
import logging

logger = logging.getLogger('chuttee.request')

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.time()
        response = self.get_response(request)
        duration = time.time() - start
        logger.info(f"{request.method} {request.path} -> {response.status_code} ({duration:.3f}s)")
        return response
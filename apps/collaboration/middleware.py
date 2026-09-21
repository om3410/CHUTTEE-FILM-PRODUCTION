from .models import AuditLog


class AuditLogMiddleware:
    """Log every POST/PUT/PATCH/DELETE on /api/ paths."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        try:
            if (request.path.startswith('/api/')
                    and request.method in ('POST', 'PUT', 'PATCH', 'DELETE')
                    and getattr(request, 'user', None)
                    and request.user.is_authenticated):
                AuditLog.objects.create(
                    user=request.user,
                    action=request.method,
                    resource=request.path,
                    ip_address=self._get_ip(request),
                )
        except Exception:
            pass
        return response

    @staticmethod
    def _get_ip(request):
        xff = request.META.get('HTTP_X_FORWARDED_FOR')
        return xff.split(',')[0] if xff else request.META.get('REMOTE_ADDR')
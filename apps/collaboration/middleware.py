import logging

logger = logging.getLogger(__name__)


class AuditLogMiddleware:
    """Logs write operations for audit purposes."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (
            request.user.is_authenticated
            and request.method in ('POST', 'PUT', 'PATCH', 'DELETE')
        ):
            logger.info(
                f"AUDIT user={request.user.username} "
                f"method={request.method} path={request.path} "
                f"status={response.status_code}"
            )

        return response
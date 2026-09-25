import logging

from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)


# Paths that would otherwise flood the log with login attempts, docs, etc.
AUDIT_SKIP_PREFIXES = (
    '/api/token/',
    '/api/schema/',
    '/api/docs/',
    '/api/redoc/',
    '/admin/',
)


class AuditLogMiddleware:
    """
    Creates an AuditLog row for every authenticated write operation.

    Django middleware runs BEFORE DRF authentication, so request.user is
    AnonymousUser at this point for JWT-authenticated requests. We resolve
    the user ourselves from the Authorization header.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self._jwt_auth = JWTAuthentication()

    def __call__(self, request):
        response = self.get_response(request)

        # Only log write operations
        if request.method not in ('POST', 'PUT', 'PATCH', 'DELETE'):
            return response

        # Skip noise
        if request.path.startswith(AUDIT_SKIP_PREFIXES):
            return response

        user = self._resolve_user(request)

        # Import here to avoid AppRegistryNotReady at import time
        from .models import AuditLog
        try:
            # Savepoint isolates failures so a missing/unavailable audit table
            # doesn't poison the surrounding transaction (important in tests).
            with transaction.atomic():
                AuditLog.objects.create(
                    user=user,
                    action=request.method,
                    resource=request.path,
                    resource_id=str(
                        getattr(request, 'resolver_match', None).kwargs.get('pk', '')
                    ) if getattr(request, 'resolver_match', None) else '',
                    changes={},
                    ip_address=self._client_ip(request),
                    timestamp=timezone.now(),
                )
        except Exception as exc:
            # Never break the request because audit logging failed
            logger.warning(f"[AUDIT] failed to write log: {exc}")

        return response

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _resolve_user(self, request):
        """
        Try (in order):
          1. Session-authenticated user (Django admin, browser)
          2. DRF's JWT from the Authorization header
        Return None if neither works.
        """
        # 1) Session auth (Django's AuthenticationMiddleware already ran)
        user = getattr(request, 'user', None)
        if user is not None and user.is_authenticated:
            return user

        # 2) JWT from header
        try:
            result = self._jwt_auth.authenticate(request)
        except (InvalidToken, TokenError):
            return None

        if result is None:
            return None

        user, _token = result
        return user

    def _client_ip(self, request):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
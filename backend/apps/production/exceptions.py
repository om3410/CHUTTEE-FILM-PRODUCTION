# apps/production/exceptions.py
from django.db import IntegrityError
from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """
    Wrap DRF's default handler to also turn DB IntegrityErrors
    into clean 400 responses instead of 500 stack traces.
    """
    response = exception_handler(exc, context)

    if response is None and isinstance(exc, IntegrityError):
        return Response(
            {
                "detail": "Database constraint violation.",
                "code": "integrity_error",
            },
            status=400,
        )

    return response
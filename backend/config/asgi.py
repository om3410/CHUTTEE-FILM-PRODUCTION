"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

# config/asgi.py
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django ASGI application early to ensure AppRegistry is populated
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

# If you have websocket URL patterns, import them here.
# Example: from apps.collaboration.routing import websocket_urlpatterns
try:
    from apps.collaboration.routing import websocket_urlpatterns
    ws_router = AuthMiddlewareStack(URLRouter(websocket_urlpatterns))
except ImportError:
    # No routing module yet — fall back to closing all websockets
    from channels.routing import NoRouteFoundError
    ws_router = URLRouter([])

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(ws_router),
})
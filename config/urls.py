from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions


schema_view = get_schema_view(
    openapi.Info(
        title="Chuttee Film Production API",
        default_version='v1',
        description="Django backend over existing PostgreSQL schema",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)


urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT token endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Authentication: HTML pages (/, /login/, /register/, /logout/)
    #                and API endpoints (/api/auth/register/, /api/auth/me/, ...)
    path('', include('apps.authentication.urls')),

    # Other app APIs
    path('api/production/', include('apps.production.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/ml/', include('apps.ml_engine.urls')),
    path('api/billing/', include('apps.billing.urls')),

    # API docs
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
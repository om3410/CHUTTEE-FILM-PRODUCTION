from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/production/', include('apps.production.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/ml/', include('apps.ml_engine.urls')),
    path('api/inbox/', include('apps.notifications.urls')),
    path('api/exports/', include('apps.exports.urls')),
    path('api/collaboration/', include('apps.collaboration.urls')),
    path('api/security/', include('apps.security_extras.urls')),
    path('', include('apps.authentication.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

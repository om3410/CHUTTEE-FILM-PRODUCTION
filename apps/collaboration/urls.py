from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CommentViewSet, AuditLogViewSet

router = DefaultRouter()
router.register(r'comments', CommentViewSet)
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = [path('', include(router.urls))]
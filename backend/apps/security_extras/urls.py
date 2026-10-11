from django.urls import path
from .views import Setup2FAView, Verify2FAView, QRCodeTextView

urlpatterns = [
    path('2fa/setup/', Setup2FAView.as_view()),
    path('2fa/verify/', Verify2FAView.as_view()),
    path('qr/generate/', QRCodeTextView.as_view()),
]
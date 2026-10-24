from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from . import views

urlpatterns = [
    # HTML pages (browser)
    path('', views.HomeView.as_view(), name='home'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('html-login/', views.LoginView.as_view(), name='html-login'),   # ← RENAMED (was 'login/')
    path('logout/', views.LogoutView.as_view(), name='logout'),

    # JWT auth endpoints (for React frontend)
    path('login/', TokenObtainPairView.as_view(), name='api-login'),      # → /api/auth/login/
    path('refresh/', TokenRefreshView.as_view(), name='api-refresh'),     # → /api/auth/refresh/
    path('verify/', TokenVerifyView.as_view(), name='api-verify'),        # → /api/auth/verify/

    # Auth API endpoints (DRF, for curl/React)
    path('api/register/', views.RegisterAPIView.as_view(), name='api-register'),
    path('api/account-recovery/', views.AccountRecoveryAPIView.as_view(), name='api-account-recovery'),
    path('api/password-reset/confirm/', views.PasswordResetConfirmAPIView.as_view(), name='api-password-reset-confirm'),
    path('api/me/', views.MeView.as_view(), name='api-me'),
    path('api/session-login/', views.SessionLoginView.as_view(), name='api-session-login'),
    path('api/session-logout/', views.SessionLogoutView.as_view(), name='api-session-logout'),
]
from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

from . import views

urlpatterns = [
    # HTML pages
    path("", views.HomeView.as_view(), name="home"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("html-login/", views.LoginView.as_view(), name="html-login"),
    path("html-logout/", views.LogoutView.as_view(), name="html-logout"),

    # JWT auth (relative — outer include supplies 'api/auth/')
    path("login/", views.JWTLoginView.as_view(), name="jwt-login"),
    path("refresh/", views.JWTRefreshView.as_view(), name="jwt-refresh"),
    path("verify/", TokenVerifyView.as_view(), name="jwt-verify"),
    path("logout/", views.JWTLogoutView.as_view(), name="jwt-logout"),
    path("logout-all/", views.JWTLogoutAllView.as_view(), name="jwt-logout-all"),
    path("sessions/", views.SessionListView.as_view(), name="jwt-sessions"),
    path(
        "sessions/<uuid:session_id>/revoke/",
        views.SessionRevokeView.as_view(),
        name="jwt-session-revoke",
    ),

    # Other APIs (relative)
    path("register-api/", views.RegisterAPIView.as_view(), name="api-register"),
    path("account-recovery/", views.AccountRecoveryAPIView.as_view(), name="api-account-recovery"),
    path("password-reset/confirm/", views.PasswordResetConfirmAPIView.as_view(), name="api-password-reset-confirm"),
    path("me/", views.MeView.as_view(), name="api-me"),
    path("session-login/", views.SessionLoginView.as_view(), name="api-session-login"),
    path("session-logout/", views.SessionLogoutView.as_view(), name="api-session-logout"),
]

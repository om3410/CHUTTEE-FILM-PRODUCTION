from django.urls import path
from . import views

urlpatterns = [
    # HTML pages (browser)
    path('', views.HomeView.as_view(), name='home'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),

    # Auth API endpoints (DRF, for curl/React)
    path('api/auth/register/', views.RegisterAPIView.as_view(), name='api-register'),
    path('api/auth/me/', views.MeView.as_view(), name='api-me'),
    path('api/auth/session-login/', views.SessionLoginView.as_view(), name='api-session-login'),
    path('api/auth/session-logout/', views.SessionLogoutView.as_view(), name='api-session-logout'),
]
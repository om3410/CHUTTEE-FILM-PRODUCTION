from django.urls import path
from . import views

urlpatterns = [
    # HTML pages (browser)
    path('', views.HomeView.as_view(), name='home'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),

    # Auth API endpoints (DRF, for curl/React)
    path('api/register/', views.RegisterAPIView.as_view(), name='api-register'),
    path('api/me/', views.MeView.as_view(), name='api-me'),
    path('api/session-login/', views.SessionLoginView.as_view(), name='api-session-login'),
    path('api/session-logout/', views.SessionLogoutView.as_view(), name='api-session-logout'),
]
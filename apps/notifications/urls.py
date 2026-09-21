from django.urls import path
from .views import SendTestEmailView, RunBudgetCheckView

urlpatterns = [
    path('test-email/', SendTestEmailView.as_view()),
    path('check-budget/', RunBudgetCheckView.as_view()),
]
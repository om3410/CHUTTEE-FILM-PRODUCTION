from django.urls import path
from .views import (
    BudgetByCategoryAPIView,
    DailyBurnRateAPIView,
    BudgetSummaryAPIView,
    RiskMatrixAPIView,
    FestivalStatusAPIView,
    CrewAvailabilityAPIView,
    UpcomingFestivalsAPIView,
)

urlpatterns = [
    path('budget/', BudgetByCategoryAPIView.as_view()),
    path('daily-burn-rate/', DailyBurnRateAPIView.as_view()),
    path('budget-summary/', BudgetSummaryAPIView.as_view()),
    path('risk-matrix/', RiskMatrixAPIView.as_view()),
    path('festival-status/', FestivalStatusAPIView.as_view()),
    path('crew-availability/', CrewAvailabilityAPIView.as_view()),
    path('upcoming-festivals/', UpcomingFestivalsAPIView.as_view()),
]
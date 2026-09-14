from django.urls import path
from .views import (
  BudgetByCategoryAPIView, DailyBurnRateAPIView, BudgetSummarAPIView, RiskMatrixAPIView, FestivalStatusAPIView, CrewAvailabilityAPIview, UpcomingFestivalAPIView,
)

urlpatterns = [
  path('budget/', BudgetByCategoryAPIView.as_view()),
  path('daily-burn-rate/', DailyBurnRateAPIView.as_view()),
  path('budget-summary/', BudgetSummarAPIView.as_view()),
  path('risk-matrix/', RiskMatrixAPIView.as_view()),
  path('festival-status/', FestivalStatusAPIView.as_view()),
  path('crew-availability/', CrewAvailabilityAPIview.as_view()),
  path('upcoming-festivals/', UpcomingFestivalAPIView.as_view()),
]

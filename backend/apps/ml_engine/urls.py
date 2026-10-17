from django.urls import path
from .views import (
    FestivalPredictionView, BudgetForecastView,
    AIScriptSentimentView, AISceneDurationView, AIBudgetAnomaliesView,
    AICastRecommendationView, AIRiskForecastView, AIFestivalWinView,
    AILocationRecommendationView, AIDailyInsightsView,
    MLPingView, ScriptAnalyzeView, NLQueryView,
    ScriptSummarizeView, ScriptMoodView,
)

urlpatterns = [
    # --- existing ---
    path("predict/festival/", FestivalPredictionView.as_view()),
    path("forecast/budget/", BudgetForecastView.as_view()),
    path("ai/script-sentiment/", AIScriptSentimentView.as_view()),
    path("ai/scene-duration/", AISceneDurationView.as_view()),
    path("ai/budget-anomalies/", AIBudgetAnomaliesView.as_view()),
    path("ai/cast-recommendation/", AICastRecommendationView.as_view()),
    path("ai/risk-forecast/", AIRiskForecastView.as_view()),
    path("ai/festival-win/", AIFestivalWinView.as_view()),
    path("ai/location-recommendation/", AILocationRecommendationView.as_view()),
    path("ai/daily-insights/", AIDailyInsightsView.as_view()),

    # --- A1 + B11 ---
    path("ping/", MLPingView.as_view(), name="ml-ping"),
    path("script/analyze/", ScriptAnalyzeView.as_view(), name="ml-script-analyze"),
    path("query/sql/", NLQueryView.as_view(), name="ml-query-sql"),

    # --- A2 + A3 ---
    path("script/summarize/", ScriptSummarizeView.as_view(), name="ml-script-summarize"),
    path("script/mood/", ScriptMoodView.as_view(), name="ml-script-mood"),
]

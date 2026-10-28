from django.urls import path
from .views import (
    FestivalPredictionView, BudgetForecastView,
    AIScriptSentimentView, AISceneDurationView, AIBudgetAnomaliesView,
    AICastRecommendationView, AIRiskForecastView, AIFestivalWinView,
    AILocationRecommendationView, AIDailyInsightsView,
    MLPingView, ScriptAnalyzeView, NLQueryView,
    ScriptSummarizeView, ScriptMoodView, DubMasterView,
    DailyReportView, ContractRiskView, LegalQAView, MeetingMinutesView,
    ProducerCopilotView, NLAnalyticsView,
    TrailerNarrationView, PosterContentView, StoryboardView,
    DialogueRewriteView,
    MemoryRememberView, MemoryRecallView,
    GenerateImageView,
)

urlpatterns = [
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

    path("ping/", MLPingView.as_view()),
    path("script/analyze/", ScriptAnalyzeView.as_view()),
    path("script/summarize/", ScriptSummarizeView.as_view()),
    path("script/dub/", DubMasterView.as_view()),
    path("script/mood/", ScriptMoodView.as_view()),
    path("query/sql/", NLQueryView.as_view()),

    path("report/daily/", DailyReportView.as_view()),
    path("contract/risk/", ContractRiskView.as_view()),
    path("legal/qa/", LegalQAView.as_view()),
    path("meeting/minutes/", MeetingMinutesView.as_view()),
    path("copilot/producer/", ProducerCopilotView.as_view()),
    path("analytics/nl/", NLAnalyticsView.as_view()),
    path("script/trailer/", TrailerNarrationView.as_view()),
    path("marketing/poster/", PosterContentView.as_view()),
    path("script/storyboard/", StoryboardView.as_view()),
    path("script/dialogue-rewrite/", DialogueRewriteView.as_view()),
    path("memory/remember/", MemoryRememberView.as_view()),
    path("memory/recall/", MemoryRecallView.as_view()),

    # ─── NEW ─── AI Image Generation
    path("media/generate-image/", GenerateImageView.as_view()),
]
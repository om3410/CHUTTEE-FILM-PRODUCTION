from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FilmProjectViewSet, CrewMemberViewSet, CastMemberViewSet,
    SceneViewSet, SceneActorViewSet, EquipmentViewSet,
    EquipmentUsageViewSet, ShootDayViewSet, ShootDaySceneViewSet,
    BudgetTransactionViewSet, ScriptDialogueViewSet,
    SentimentAnalysisViewSet, ProductionRiskViewSet,
    FestivalSubmissionViewSet, AnalyticsDailyViewSet, MLPredictionViewSet,
    FilmAssetViewSet,
)

router = DefaultRouter()

# Register all routes
router.register(r'projects', FilmProjectViewSet, basename='film-projects')
router.register(r'crew', CrewMemberViewSet, basename='crew-members')
router.register(r'cast', CastMemberViewSet, basename='cast-members')
router.register(r'scenes', SceneViewSet, basename='scenes')
router.register(r'scene-actors', SceneActorViewSet, basename='scene-actors')
router.register(r'equipment', EquipmentViewSet, basename='equipment')
router.register(r'equipment-usage', EquipmentUsageViewSet, basename='equipment-usage')
router.register(r'shoot-days', ShootDayViewSet, basename='shoot-days')
router.register(r'shoot-day-scenes', ShootDaySceneViewSet, basename='shoot-day-scenes')
router.register(r'budget-transactions', BudgetTransactionViewSet, basename='budget-transactions')
router.register(r'script-dialogues', ScriptDialogueViewSet, basename='script-dialogues')
router.register(r'sentiment-analysis', SentimentAnalysisViewSet, basename='sentiment-analysis')
router.register(r'production-risks', ProductionRiskViewSet, basename='production-risks')
router.register(r'festival-submissions', FestivalSubmissionViewSet, basename='festival-submissions')
router.register(r'analytics-daily', AnalyticsDailyViewSet, basename='analytics-daily')
router.register(r'ml-predictions', MLPredictionViewSet, basename='ml-predictions')

# Media Assets Route
router.register(r'assets', FilmAssetViewSet, basename='film-assets')

urlpatterns = [
    path('', include(router.urls)),
]
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FilmProjectViewSet, CrewMemberViewSet, CastMemberViewSet, SceneViewSet,
    SceneActorViewSet, EquipmentViewSet, EquipmentUsageViewSet,
    ShootDayViewSet, ShootDaySceneViewSet, BudgetTransactionViewSet,
    ScriptDialogueViewSet, SentimentAnalysisViewSet, ProductionRiskViewSet,
    FestivalSubmissionViewSet, AnalyticsDailyViewSet, MLPredictionViewSet,
)

router = DefaultRouter()
router.register(r'projects', FilmProjectViewSet)
router.register(r'crew', CrewMemberViewSet)
router.register(r'cast', CastMemberViewSet)
router.register(r'scenes', SceneViewSet)
router.register(r'scene-actors', SceneActorViewSet)
router.register(r'equipment', EquipmentViewSet)
router.register(r'equipment-usage', EquipmentUsageViewSet)
router.register(r'shoot-days', ShootDayViewSet)
router.register(r'shoot-day-scenes', ShootDaySceneViewSet)
router.register(r'budget', BudgetTransactionViewSet)
router.register(r'dialogues', ScriptDialogueViewSet)
router.register(r'sentiment-analysis', SentimentAnalysisViewSet)
router.register(r'risks', ProductionRiskViewSet)
router.register(r'festivals', FestivalSubmissionViewSet)
router.register(r'analytics-daily', AnalyticsDailyViewSet)
router.register(r'ml-predictions', MLPredictionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
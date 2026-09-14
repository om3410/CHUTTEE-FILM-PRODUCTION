from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import (
    FilmProject, CrewMember, CastMember, Scene, SceneActor,
    Equipment, EquipmentUsage, ShootDay, ShootDayScene,
    BudgetTransaction, ScriptDialogue, SentimentAnalysis,
    ProductionRisk, FestivalSubmission, AnalyticsDaily, MLPrediction,
    FilmAsset,
)
from .serializers import (
    FilmProjectSerializer, CrewMemberSerializer, CastMemberSerializer,
    SceneSerializer, SceneActorSerializer, EquipmentSerializer,
    EquipmentUsageSerializer, ShootDaySerializer, ShootDaySceneSerializer,
    BudgetTransactionSerializer, ScriptDialogueSerializer,
    SentimentAnalysisSerializer, ProductionRiskSerializer,
    FestivalSubmissionSerializer, AnalyticsDailySerializer, MLPredictionSerializer,
    FilmAssetSerializer,
)
from .permissions import IsCrewMember, IsCrewOrReadOnly

# --- General Film Data (Users can view, Crew can edit) ---
class FilmProjectViewSet(viewsets.ModelViewSet):
    queryset = FilmProject.objects.all()
    serializer_class = FilmProjectSerializer
    permission_classes = [IsCrewOrReadOnly]
    search_fields = ['title', 'director']
    filterset_fields = ['status', 'genre']

class CrewMemberViewSet(viewsets.ModelViewSet):
    queryset = CrewMember.objects.all()
    serializer_class = CrewMemberSerializer
    permission_classes = [IsCrewOrReadOnly]
    search_fields = ['full_name', 'role']
    filterset_fields = ['department', 'role']

class CastMemberViewSet(viewsets.ModelViewSet):
    queryset = CastMember.objects.all()
    serializer_class = CastMemberSerializer
    permission_classes = [IsCrewOrReadOnly]
    search_fields = ['full_name', 'character_name']

class SceneViewSet(viewsets.ModelViewSet):
    queryset = Scene.objects.all()
    serializer_class = SceneSerializer
    permission_classes = [IsCrewOrReadOnly]
    filterset_fields = ['status', 'location']

class SceneActorViewSet(viewsets.ModelViewSet):
    queryset = SceneActor.objects.all()
    serializer_class = SceneActorSerializer
    permission_classes = [IsCrewOrReadOnly]

class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsCrewOrReadOnly]
    filterset_fields = ['category', 'is_available']

class EquipmentUsageViewSet(viewsets.ModelViewSet):
    queryset = EquipmentUsage.objects.all()
    serializer_class = EquipmentUsageSerializer
    permission_classes = [IsCrewOrReadOnly]

class ShootDayViewSet(viewsets.ModelViewSet):
    queryset = ShootDay.objects.all()
    serializer_class = ShootDaySerializer
    permission_classes = [IsCrewOrReadOnly]
    filterset_fields = ['status', 'shoot_date']

class ShootDaySceneViewSet(viewsets.ModelViewSet):
    queryset = ShootDayScene.objects.all()
    serializer_class = ShootDaySceneSerializer
    permission_classes = [IsCrewOrReadOnly]

# --- Sensitive Data (Only Crew Members can access) ---
class BudgetTransactionViewSet(viewsets.ModelViewSet):
    queryset = BudgetTransaction.objects.all()
    serializer_class = BudgetTransactionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category']

class ScriptDialogueViewSet(viewsets.ModelViewSet):
    queryset = ScriptDialogue.objects.all()
    serializer_class = ScriptDialogueSerializer
    permission_classes = [IsCrewMember] 
    search_fields = ['character_name', 'emotion_tag']

class SentimentAnalysisViewSet(viewsets.ModelViewSet):
    queryset = SentimentAnalysis.objects.all()
    serializer_class = SentimentAnalysisSerializer
    permission_classes = [IsCrewMember]

class ProductionRiskViewSet(viewsets.ModelViewSet):
    queryset = ProductionRisk.objects.all()
    serializer_class = ProductionRiskSerializer
    permission_classes = [IsCrewMember] 
    filterset_fields = ['severity', 'status']

class FestivalSubmissionViewSet(viewsets.ModelViewSet):
    queryset = FestivalSubmission.objects.all()
    serializer_class = FestivalSubmissionSerializer
    permission_classes = [IsCrewOrReadOnly]
    filterset_fields = ['status']

class AnalyticsDailyViewSet(viewsets.ModelViewSet):
    queryset = AnalyticsDaily.objects.all()
    serializer_class = AnalyticsDailySerializer
    permission_classes = [IsCrewMember]

class MLPredictionViewSet(viewsets.ModelViewSet):
    queryset = MLPrediction.objects.all()
    serializer_class = MLPredictionSerializer
    permission_classes = [IsCrewMember]

# --- Media Assets (Chuttee Posters, Headshots, BTS) ---
class FilmAssetViewSet(viewsets.ModelViewSet):
    queryset = FilmAsset.objects.all().order_by('-uploaded_at')
    serializer_class = FilmAssetSerializer
    permission_classes = [IsCrewOrReadOnly]
    filterset_fields = ['category']
    search_fields = ['title']
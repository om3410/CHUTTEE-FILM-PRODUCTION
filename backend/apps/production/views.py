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
from .permissions import IsCrewMember, IsCrewOrReadOnly, IsAuthenticatedForSceneUpdates


# --- General Film Data ---
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
    permission_classes = [IsAuthenticatedForSceneUpdates]
    filterset_fields = ['status', 'location']


class SceneActorViewSet(viewsets.ModelViewSet):
    queryset = SceneActor.objects.all()
    serializer_class = SceneActorSerializer
    permission_classes = [IsCrewOrReadOnly]


class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category', 'is_available']
    ordering = ['-created_at', 'id']

class EquipmentUsageViewSet(viewsets.ModelViewSet):
    queryset = EquipmentUsage.objects.all()
    serializer_class = EquipmentUsageSerializer
    permission_classes = [IsCrewOrReadOnly]


class ShootDayViewSet(viewsets.ModelViewSet):
    queryset = ShootDay.objects.all()
    serializer_class = ShootDaySerializer
    permission_classes = [IsCrewOrReadOnly]
    filterset_fields = ['status', 'shoot_date']
    search_fields = ['location']
    ordering_fields = ['shoot_date', 'day_number']


class ShootDaySceneViewSet(viewsets.ModelViewSet):
    queryset = ShootDayScene.objects.all()
    serializer_class = ShootDaySceneSerializer
    permission_classes = [IsCrewOrReadOnly]


# --- Sensitive Data ---
class BudgetTransactionViewSet(viewsets.ModelViewSet):
    queryset = BudgetTransaction.objects.all()
    serializer_class = BudgetTransactionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category']


class ScriptDialogueViewSet(viewsets.ModelViewSet):
    queryset = ScriptDialogue.objects.all()
    serializer_class = ScriptDialogueSerializer
    permission_classes = [IsAuthenticated]     # FIXED: was IsCrewMember
    search_fields = ['character_name', 'emotion_tag']


class SentimentAnalysisViewSet(viewsets.ModelViewSet):
    queryset = SentimentAnalysis.objects.all()
    serializer_class = SentimentAnalysisSerializer
    permission_classes = [IsAuthenticated]     # FIXED: was IsCrewMember


class ProductionRiskViewSet(viewsets.ModelViewSet):
    queryset = ProductionRisk.objects.all()
    serializer_class = ProductionRiskSerializer
    permission_classes = [IsAuthenticated]     # FIXED: was IsCrewMember
    filterset_fields = ['severity', 'status']


class FestivalSubmissionViewSet(viewsets.ModelViewSet):
    queryset = FestivalSubmission.objects.all()
    serializer_class = FestivalSubmissionSerializer
    permission_classes = [IsCrewOrReadOnly]
    filterset_fields = ['status']


class AnalyticsDailyViewSet(viewsets.ModelViewSet):
    queryset = AnalyticsDaily.objects.all()
    serializer_class = AnalyticsDailySerializer
    permission_classes = [IsAuthenticated]     # FIXED: was IsCrewMember


class MLPredictionViewSet(viewsets.ModelViewSet):
    queryset = MLPrediction.objects.all()
    serializer_class = MLPredictionSerializer
    permission_classes = [IsAuthenticated]     # FIXED: was IsCrewMember


# --- Media Assets ---
class FilmAssetViewSet(viewsets.ModelViewSet):
    queryset = FilmAsset.objects.all().order_by('-uploaded_at')
    serializer_class = FilmAssetSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category']
    search_fields = ['title']

# --- Aggregates ---
from rest_framework.decorators import api_view, permission_classes as drf_permission_classes
from rest_framework.response import Response
from django.db.models import Sum


@api_view(['GET'])
@drf_permission_classes([IsAuthenticated])
def budget_by_category(request):
    rows = (
        BudgetTransaction.objects
        .values('category')
        .annotate(actual=Sum('amount'))
        .order_by('-actual')
    )
    data = [
        {"name": row["category"] or "Uncategorized", "actual": float(row["actual"] or 0)}
        for row in rows
    ]
    return Response({"results": data, "count": len(data)})

# --- Activity feed (from AuditLog) ---
@api_view(['GET'])
@drf_permission_classes([IsAuthenticated])
def recent_activity(request):
    from apps.collaboration.models import AuditLog

    def friendly(log):
        # Map HTTP verb + path to a human sentence
        verb = (log.action or '').upper()
        path = (log.resource or '').strip('/')
        who = log.user.username if log.user else 'Someone'

        # Extract the resource segment
        parts = [p for p in path.split('/') if p]
        noun = 'record'
        for candidate in ('scenes', 'crew', 'cast', 'projects', 'budget',
                          'shoot-days', 'equipment', 'film-assets',
                          'risks', 'dialogues'):
            if candidate in parts:
                noun = candidate.replace('-', ' ').rstrip('s')
                break

        verb_word = {
            'POST': 'Created',
            'PATCH': 'Updated',
            'PUT': 'Updated',
            'DELETE': 'Deleted',
        }.get(verb, verb.title())

        return f"{verb_word} {noun}"

    # Skip auth noise and read-only traffic
    exclude_paths = ('/api/login/', '/api/refresh/', '/api/logout/',
                     '/api/token/', '/api/admin/')
    qs = (
        AuditLog.objects
        .select_related('user')
        .exclude(action__in=['GET', 'HEAD', 'OPTIONS'])
        .order_by('-timestamp')
    )
    for path in exclude_paths:
        qs = qs.exclude(resource__startswith=path)

    entries = []
    seen = set()
    for log in qs[:50]:
        # Dedupe within the same second for the same resource
        key = (log.resource_id, log.action, log.timestamp.replace(microsecond=0))
        if key in seen:
            continue
        seen.add(key)

        entries.append({
            "id": str(log.id),
            "message": f"{friendly(log)} - {log.user.username if log.user else 'someone'}",
            "timestamp": _friendly_time(log.timestamp),
        })
        if len(entries) >= 15:
            break

    return Response({"results": entries, "count": len(entries)})

def _friendly_time(dt):
    from django.utils import timezone
    if not dt:
        return ""
    seconds = int((timezone.now() - dt).total_seconds())
    if seconds < 60:
        return str(seconds) + "s ago"
    if seconds < 3600:
        return str(seconds // 60) + "m ago"
    if seconds < 86400:
        return str(seconds // 3600) + "h ago"
    return str(seconds // 86400) + "d ago"
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from decimal import Decimal as _Decimal

from apps.production.models import (
    BudgetTransaction, FilmProject, MLPrediction, Scene, CastMember, ProductionRisk,
)
from .services import (
    MLService, ScriptSentimentService, SceneDurationService, BudgetAnomalyService,
    CastRecommendationService, RiskForecastService, FestivalWinService,
    LocationRecommendationService,
)
from .serializers import (
    FestivalPredictionSerializer, ScriptSentimentInputSerializer,
    SceneDurationInputSerializer, CastRecommendationInputSerializer,
    FestivalWinInputSerializer, LocationRecommendationInputSerializer,
)
from .models import (
    AIScriptAnalysis, AISceneDurationPrediction, AIBudgetAnomaly,
    AICastRecommendation, AIRiskForecast, AIFestivalWin, AILocationRecommendation,
)

ml_services = MLService()


# ============================================================
# Helper: convert Decimals, dates, UUIDs to JSON-safe types
# ============================================================
def _to_primitive(obj):
    if obj is None:
        return None
    if isinstance(obj, bool):
        return obj
    if isinstance(obj, (int, float, str)):
        return obj
    if isinstance(obj, _Decimal):
        return float(obj)
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _to_primitive(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_to_primitive(x) for x in obj]
    return str(obj)


# ============================================================
# Helper: resolve project from request (fallback to first)
# ============================================================
def _resolve_project(request):
    pid = request.data.get('project_id') or request.query_params.get('project_id')
    if pid:
        try:
            return FilmProject.objects.filter(pk=pid).first()
        except Exception:
            pass
    return FilmProject.objects.first()


# ============================================================
# EXISTING ENDPOINTS
# ============================================================
class FestivalPredictionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FestivalPredictionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        features = serializer.validated_data

        result = ml_services.predict_festival(features)

        if 'error' not in result:
            try:
                project = _resolve_project(request)
                if project:
                    MLPrediction.objects.create(
                        project=project,
                        model_type='RandomForest',
                        prediction_data=_to_primitive({'features': features, 'result': result}),
                        prediction_score=result.get('confidence'),
                    )
            except Exception:
                pass

        return Response(result)

class BudgetForecastView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = BudgetTransaction.objects.all().order_by('transaction_date')[:5]
        historical = [float(t.amount or 0) for t in transactions]
        if not historical:
            return Response({'forecast': []})
        from sklearn.linear_model import LinearRegression
        import numpy as np
        X = np.arange(len(historical)).reshape(-1, 1)
        y = np.array(historical)
        model = LinearRegression().fit(X, y)
        next_X = np.array([[len(historical)], [len(historical) + 1], [len(historical) + 2]])
        return Response({'forecast': model.predict(next_X).tolist()})


# ============================================================
# AI ENDPOINTS
# ============================================================
class AIScriptSentimentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = ScriptSentimentInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        result = ScriptSentimentService.analyze(s.validated_data['dialogue_text'])
        try:
            AIScriptAnalysis.objects.create(
                project=_resolve_project(request),
                character_name=s.validated_data.get('character_name', ''),
                dialogue_excerpt=s.validated_data['dialogue_text'][:500],
                polarity=result['polarity'],
                subjectivity=result['subjectivity'],
                dominant_emotion=result['dominant_emotion'],
                emotion_confidence=result['emotion_confidence'],
                intensity_level=result['intensity_level'],
                pacing_suggestion=result['pacing_suggestion'],
            )
        except Exception:
            pass
        return Response(result)


class AISceneDurationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = SceneDurationInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        result = SceneDurationService.predict(s.validated_data)
        try:
            scene = Scene.objects.filter(scene_number=s.validated_data['scene_number']).first()
            if scene:
                AISceneDurationPrediction.objects.create(
                    scene=scene,
                    predicted_minutes=result['predicted_minutes'],
                    confidence=result['confidence'],
                    complexity_factor=result['complexity_factor'],
                    recommendation=result['recommendation'],
                )
        except Exception:
            pass
        return Response(result)


class AIBudgetAnomaliesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project = _resolve_project(request)

        qs = BudgetTransaction.objects.all()
        txns = list(qs.values('id', 'amount', 'transaction_date', 'category'))
        if not txns:
            return Response({'anomalies': [], 'message': 'No transactions found'})
        result = BudgetAnomalyService.detect(txns)

        try:
            # Scoped delete â€” only this project's anomalies
            if project:
                AIBudgetAnomaly.objects.filter(project=project).delete()
            for a in result.get('anomalies', []):
                AIBudgetAnomaly.objects.create(
                    transaction_id=a.get('transaction_id'),
                    project=project,
                    amount=a.get('amount'),
                    category=a.get('category'),
                    anomaly_score=a.get('anomaly_score'),
                    severity=a.get('severity'),
                    explanation=a.get('explanation'),
                )
        except Exception:
            pass
        return Response(result)


class AICastRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = CastRecommendationInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        cast = list(CastMember.objects.all().values(
            'id', 'full_name', 'character_name', 'role_type',
            'experience_years', 'special_skills',
        ))
        results = CastRecommendationService.recommend(
            s.validated_data['role_description'],
            s.validated_data.get('required_skills', []),
            s.validated_data.get('min_experience', 0),
            cast,
        )
        # FIXED: persist results to AICastRecommendation like other views do
        try:
            project = _resolve_project(request)
            for r in results:
                AICastRecommendation.objects.create(
                    project=project,
                    role_description=s.validated_data['role_description'],
                    recommended_cast_id=r.get('cast_id') or r.get('id'),
                    match_score=r.get('match_score'),
                    reason=r.get('reason', ''),
                )
        except Exception:
            pass
        return Response({'recommendations': results})


class AIRiskForecastView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        risks = list(ProductionRisk.objects.all().values(
            'risk_type', 'severity', 'probability', 'impact', 'status',
        ))
        forecasts = RiskForecastService.forecast(risks)
        cleaned = [{
            'risk_type': f.get('risk_type'),
            'predicted_probability': float(f.get('predicted_probability') or 0),
            'predicted_impact': float(f.get('predicted_impact') or 0),
            'rationale': f.get('rationale'),
            'preventive_action': f.get('preventive_action'),
        } for f in forecasts]

        try:
            project = _resolve_project(request)
            # Scoped delete â€” only this project's forecasts
            if project:
                AIRiskForecast.objects.filter(project=project).delete()
            for f in cleaned:
                AIRiskForecast.objects.create(
                    project=project,
                    forecast_date=timezone.now().date(),
                    risk_type=f['risk_type'],
                    predicted_probability=f['predicted_probability'],
                    predicted_impact=f['predicted_impact'],
                    rationale=f['rationale'],
                    preventive_action=f['preventive_action'],
                )
        except Exception:
            pass

        return Response({'forecasts': cleaned})


class AIFestivalWinView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = FestivalWinInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        result = FestivalWinService.predict(
            s.validated_data['festival_name'],
            s.validated_data['festival_tier'],
            s.validated_data['submission_fee'],
            s.validated_data['film_duration'],
            s.validated_data['film_genre'],
        )
        try:
            AIFestivalWin.objects.create(
                project=_resolve_project(request),
                festival_name=s.validated_data['festival_name'],
                win_probability=result['win_probability'],
                tier=result.get('tier', 'unknown'),   # FIXED: protected
                factors=result.get('factors', {}),
                recommendation=result.get('recommendation', ''),
            )
        except Exception:
            pass
        return Response(result)


class AILocationRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        s = LocationRecommendationInputSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        results = LocationRecommendationService.recommend(
            s.validated_data['scene_number'],
            s.validated_data.get('emotional_tone', ''),
            s.validated_data.get('time_of_day', ''),
            s.validated_data.get('is_indoor', True),
        )
        try:
            scene = Scene.objects.filter(scene_number=s.validated_data['scene_number']).first()
            project = _resolve_project(request)
            for r in results:
                AILocationRecommendation.objects.create(
                    project=project,
                    scene=scene,
                    recommended_location=r['recommended_location'],
                    match_score=r['match_score'],
                    reasoning=r['reasoning'],
                )
        except Exception:
            pass
        return Response({"recommendations": results})


# ============================================================
# AIDailyInsightsView
# ============================================================
class AIDailyInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        recent_sentiments = list(
            AIScriptAnalysis.objects.all().order_by('-created_at')[:5]
            .values('dominant_emotion', 'polarity', 'intensity_level')
        )
        risk_forecasts = list(
            AIRiskForecast.objects.all().order_by('-created_at')[:5]
            .values('risk_type', 'predicted_probability', 'preventive_action')
        )
        anomalies = list(
            AIBudgetAnomaly.objects.all().order_by('-detected_at')[:5]
            .values('amount', 'severity', 'explanation')
        )
        festivals = list(
            AIFestivalWin.objects.all().order_by('-created_at')[:5]
            .values('festival_name', 'win_probability', 'recommendation')
        )

        return Response(_to_primitive({
            'generated_at': timezone.now().isoformat(),
            'sentiment_highlights': recent_sentiments,
            'risk_forecasts': risk_forecasts,
            'budget_anomalies': anomalies,
            'festival_predictions': festivals,
            'total_ai_records': int(
                AIScriptAnalysis.objects.count()
                + AIBudgetAnomaly.objects.count()
                + AIRiskForecast.objects.count()
                + AIFestivalWin.objects.count()
                + AILocationRecommendation.objects.count()
                + AISceneDurationPrediction.objects.count()
            ),
        }))

# ============================================================
# NEW: Script analysis (A1) + Text-to-SQL (B11)
# Appended - does not modify any existing view.
# ============================================================
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from .nlp.script_analyzer import ScriptAnalyzer
from .text2sql.agent import ask as ask_sql


class MLPingView(APIView):
    """Health check - no auth required."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok", "app": "ml_engine", "version": "1.0"})


class ScriptAnalyzeView(APIView):
    """A1 - upload a screenplay, return characters / scenes / locations."""
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        f = request.FILES.get("file")
        if f:
            text = f.read().decode("utf-8", errors="ignore")
        else:
            text = request.data.get("text", "")
        if not text:
            return Response(
                {"error": 'Provide either a "file" upload or "text" field'},
                status=400,
            )
        return Response(ScriptAnalyzer(text).analyze())


class NLQueryView(APIView):
    """B11 - natural language to SQL against the real schema."""
    permission_classes = [AllowAny]

    def post(self, request):
        q = (request.data.get("question") or "").strip()
        if not q:
            return Response({"error": "question required"}, status=400)
        return Response(ask_sql(q))


# ============================================================


# ============================================================
# NEW: A2 Summarization + A3 Mood/genre classification
# ============================================================
from .llm.client import generate, generate_json


def _extract_text(request):
    """Robust text extraction — handles str, dict, nested dict, and list."""
    data = request.data
    if isinstance(data, str):
        return data.strip()
    if not isinstance(data, dict):
        return ""
    text = data.get("text", "")
    # Handle malformed nested input like {"text": {"value": "...", "Count": 1}}
    while isinstance(text, dict):
        text = text.get("text") or text.get("value") or text.get("content") or ""
    if isinstance(text, list):
        text = "\n".join(str(x) for x in text if x)
    elif not isinstance(text, str):
        text = "" if text is None else str(text)
    return text.strip()


class ScriptSummarizeView(APIView):
    """A2 - summarize a screenplay (short / scene / producer / marketing)."""
    permission_classes = [AllowAny]

    def post(self, request):
        text = _extract_text(request)
        style = request.data.get("style", "short") if isinstance(request.data, dict) else "short"
        if not text:
            return Response({"error": "text required"}, status=400)

        prompts = {
            "short":     "Summarize this screenplay in 3 sentences.",
            "scene":     "Summarize this screenplay scene by scene (1 sentence per scene).",
            "producer":  "Write a producer-facing summary: budget sensibility, cast load, risks.",
            "marketing": "Write a marketing synopsis suitable for a poster blurb.",
        }
        prompt = prompts.get(style, prompts["short"])

        try:
            summary = generate(f"{prompt}\n\n{text[:15000]}")
            return Response({"summary": summary, "style": style})
        except Exception as e:
            return Response({"error": f"LLM failed: {e}"}, status=500)


class ScriptMoodView(APIView):
    """A3 - classify genre / mood from screenplay dialogue."""
    permission_classes = [AllowAny]

    def post(self, request):
        text = _extract_text(request)
        if not text:
            return Response({"error": "text required"}, status=400)

        dialogues = ScriptAnalyzer(text).dialogues()
        if not dialogues:
            return Response({"error": "no dialogue found in script"}, status=400)

        sample = "\n".join(
            f"{d['character']}: {d['text']}" for d in dialogues[:100]
        )
        prompt = (
            "Classify this screenplay's genre mix by percentage (must sum to 100). "
            'Return JSON: {"genres": [{"name": str, "percent": int}], '
            '"dominant": str, "reasoning": str}\n\n'
            f"Dialogue sample:\n{sample}"
        )
        try:
            result = generate_json(
                prompt,
                system="You are a film genre classifier. Return only JSON.",
            )
            return Response(result)
        except Exception as e:
            return Response({"error": f"LLM failed: {e}"}, status=500)

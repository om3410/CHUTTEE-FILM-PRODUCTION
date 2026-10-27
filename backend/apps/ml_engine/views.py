from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status, permissions
from django.utils import timezone
from decimal import Decimal as _Decimal
import base64
import os
import urllib.parse
import requests

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
from .genai import script_intel, actor_crew, finance, scheduling, document_intel
from .genai import executive, multimedia, multi_agent, memory

from .nlp.script_analyzer import ScriptAnalyzer
from .text2sql.agent import ask as ask_sql
from .llm.client import generate, generate_json

ml_services = MLService()


# ============================================================
# Helpers
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


def _resolve_project(request):
    try:
        data = request.data if hasattr(request, 'data') else {}
    except Exception:
        data = {}
    try:
        params = request.query_params if hasattr(request, 'query_params') else {}
    except Exception:
        params = {}

    pid = None
    if isinstance(data, dict):
        pid = data.get('project_id')
    if not pid and hasattr(params, 'get'):
        pid = params.get('project_id')

    if pid:
        try:
            return FilmProject.objects.filter(pk=pid).first()
        except Exception:
            pass
    return FilmProject.objects.first()


def _extract_text(request):
    try:
        data = request.data
    except Exception:
        return ''
    if isinstance(data, str):
        return data.strip()
    if not isinstance(data, dict):
        return ''
    text = data.get('text', '')
    while isinstance(text, dict):
        text = text.get('text') or text.get('value') or text.get('content') or ''
    if isinstance(text, list):
        text = '\n'.join(str(x) for x in text if x)
    elif not isinstance(text, str):
        text = '' if text is None else str(text)
    return text.strip()


# ============================================================
# Inline AI Image Generation providers
# ============================================================

def _generate_pollinations(prompt: str, width: int = 1024, height: int = 768) -> bytes:
    """Free, no API key required. Retries with alternate endpoints."""
    import time

    encoded = urllib.parse.quote(prompt)
    seed = abs(hash(prompt)) % 1000000

    urls = [
        f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&nologo=true&seed={seed}&model=flux",
        f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&nologo=true&seed={seed}",
        f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&seed={seed}",
    ]

    last_error = None
    for attempt, url in enumerate(urls, start=1):
        try:
            response = requests.get(
                url,
                timeout=45,
                headers={"User-Agent": "CHUTTEE/1.0"},
            )
            response.raise_for_status()

            content_type = response.headers.get("Content-Type", "")
            if not content_type.startswith("image/"):
                raise RuntimeError(f"Non-image response: {content_type}")

            if len(response.content) < 5000:
                raise RuntimeError(f"Image too small ({len(response.content)} bytes)")

            return response.content

        except Exception as exc:
            last_error = exc
            if attempt < len(urls):
                time.sleep(1)
            continue

    raise RuntimeError(f"Pollinations failed after {len(urls)} attempts: {last_error}")


def _generate_stability(prompt: str, width: int = 1024, height: int = 768) -> bytes:
    """Requires STABILITY_API_KEY env var."""
    api_key = os.environ.get("STABILITY_API_KEY")
    if not api_key:
        raise RuntimeError("STABILITY_API_KEY not set")
    response = requests.post(
        "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "image/png",
        },
        json={
            "text_prompts": [{"text": prompt, "weight": 1}],
            "width": min(width, 1024),
            "height": min(height, 1024),
            "steps": 30,
            "cfg_scale": 7,
        },
        timeout=90,
    )
    response.raise_for_status()
    return response.content


def _generate_huggingface(prompt: str) -> bytes:
    """Requires HUGGINGFACE_API_KEY env var."""
    api_key = os.environ.get("HUGGINGFACE_API_KEY")
    if not api_key:
        raise RuntimeError("HUGGINGFACE_API_KEY not set")
    response = requests.post(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"inputs": prompt},
        timeout=90,
    )
    response.raise_for_status()
    return response.content


def _generate_placeholder(prompt: str, width: int = 1024, height: int = 768) -> bytes:
    """Ultra-reliable fallback — returns a real photo from picsum.photos.
    Not AI-generated but always works, so the feature never hard-fails."""
    seed = abs(hash(prompt)) % 1000
    url = f"https://picsum.photos/seed/{seed}/{width}/{height}"
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.content


def _generate_image(prompt: str, width: int = 1024, height: int = 768) -> dict:
    """Try providers in order. The placeholder provider guarantees success."""
    providers = [
        ("pollinations", lambda: _generate_pollinations(prompt, width, height)),
        ("stability",    lambda: _generate_stability(prompt, width, height)),
        ("huggingface",  lambda: _generate_huggingface(prompt)),
        ("placeholder",  lambda: _generate_placeholder(prompt, width, height)),
    ]
    errors = []
    for name, fn in providers:
        try:
            data = fn()
            if data and len(data) > 1000:
                return {"success": True, "data": data, "provider": name, "prompt": prompt}
            errors.append(f"{name}: too small ({len(data) if data else 0} bytes)")
        except Exception as exc:
            errors.append(f"{name}: {type(exc).__name__}: {exc}")
            continue

    # Log all errors for backend debugging
    import logging
    logging.getLogger(__name__).error(
        "All image providers failed. Prompt: %s. Errors: %s",
        prompt[:100],
        "; ".join(errors),
    )
    raise RuntimeError("; ".join(errors))


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
                tier=result.get('tier', 'unknown'),
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
# Health check
# ============================================================
class MLPingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok", "app": "ml_engine", "version": "1.0"})


# ============================================================
# Script analysis + Text-to-SQL
# ============================================================
class ScriptAnalyzeView(APIView):
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
    permission_classes = [AllowAny]

    def post(self, request):
        q = (request.data.get("question") or "").strip()
        if not q:
            return Response({"error": "question required"}, status=400)
        return Response(ask_sql(q))


# ============================================================
# Summarization + Mood/genre
# ============================================================
class ScriptSummarizeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        text = _extract_text(request)
        style = request.data.get("style", "short") if isinstance(request.data, dict) else "short"
        if not text:
            return Response({"error": "text required"}, status=400)

        prompts = {
            # Original keys (kept for backwards compatibility)
            "short":         "Summarize this screenplay in 3 sentences.",
            "scene":         "Summarize this screenplay scene by scene (1 sentence per scene).",
            "producer":      "Write a producer-facing summary: budget sensibility, cast load, risks.",
            "marketing":     "Write a marketing synopsis suitable for a poster blurb.",

            # Frontend style keys (match ROUTES in GenAI.jsx)
            "scene-outline": (
                "Write a scene-by-scene outline for this screenplay. "
                "Number each scene (SCENE 1, SCENE 2, ...). For each scene, give a slug line "
                "(e.g. 'INT. TRAIN STATION - NIGHT') followed by a one-paragraph description "
                "of the action and what the scene accomplishes in the story."
            ),
            "character-bios": (
                "If the input is a full screenplay or scene, extract every named character. "
                "If the input is a premise or logline, invent a plausible ensemble cast. "
                "For each character produce: NAME, one-paragraph biography, their character "
                "arc (where they start vs where they end), and a bullet list of their "
                "relationships to other characters."
            ),
            "logline": (
                "Write three loglines for this screenplay: "
                "(1) one sentence, (2) two sentences with genre context, (3) an elevator pitch. "
                "After the loglines, write a one-paragraph synopsis."
            ),
            "coverage": (
                "Write a reader's coverage report for this screenplay. Include: "
                "LOGLINE, SYNOPSIS (one paragraph), 3 STRENGTHS, 3 WEAKNESSES, "
                "MARKETABILITY SCORE (1-10 with reasoning), and a RECOMMENDATION "
                "(Recommend / Consider / Pass)."
            ),
            "tagline": (
                "Write 10 taglines for this film, ranging from dramatic to punchy. "
                "Then write 3 social-media captions."
            ),
            "press-kit": (
                "Write a press kit for this film: a 3-paragraph synopsis, 5 cast/crew bios "
                "(use placeholder names if needed), 3 pull quotes, and a one-line sell "
                "suitable for a film market."
            ),
        }
        prompt = prompts.get(style, prompts["short"])

        try:
            summary = generate(f"{prompt}\n\n{text[:15000]}")
            return Response({"summary": summary, "style": style})
        except Exception as e:
            return Response({"error": f"LLM failed: {e}"}, status=500)


class ScriptMoodView(APIView):
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


# ============================================================
# Scheduling, Documents, Executive, Multimedia, Memory
# ============================================================
class DailyReportView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        pid = request.data.get("project_id") if isinstance(request.data, dict) else None
        if not pid:
            return Response({"error": "project_id required"}, status=400)
        try:
            if hasattr(scheduling, 'daily_report'):
                return Response(scheduling.daily_report(int(pid)))
            return Response({"error": "daily_report not implemented in scheduling module"}, status=501)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class ContractRiskView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        text = request.data.get("text", "") if isinstance(request.data, dict) else ""
        try:
            return Response(document_intel.contract_risk(text))
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class LegalQAView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        q = request.data.get("question", "") if isinstance(request.data, dict) else ""
        try:
            return Response(document_intel.legal_qa(q))
        except RuntimeError as e:
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class MeetingMinutesView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        text = request.data.get("transcript", "") if isinstance(request.data, dict) else ""
        try:
            if hasattr(document_intel, 'meeting_minutes'):
                return Response(document_intel.meeting_minutes(text))
            return Response({"error": "meeting_minutes not implemented"}, status=501)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class ProducerCopilotView(APIView):
    permission_classes = [AllowAny]

    STYLE_PROMPTS = {
        "beats": (
            "Write a Save-the-Cat beat sheet for the following film premise. "
            "Use exactly these 15 beats, numbered, each 1-2 sentences:\n"
            "1. Opening Image\n"
            "2. Theme Stated\n"
            "3. Set-Up\n"
            "4. Catalyst\n"
            "5. Debate\n"
            "6. Break into Two\n"
            "7. B Story\n"
            "8. Fun and Games\n"
            "9. Midpoint\n"
            "10. Bad Guys Close In\n"
            "11. All Is Lost\n"
            "12. Dark Night of the Soul\n"
            "13. Break into Three\n"
            "14. Finale\n"
            "15. Final Image\n\n"
            "Premise:\n{text}"
        ),
        "shotlist": (
            "Write a professional shot list for the opening sequence of the "
            "following film. For each shot give: SHOT #, SHOT TYPE "
            "(WS/MS/CU/OTS/POV), MOVEMENT (static/pan/dolly/handheld/crane), "
            "DESCRIPTION, DURATION. Aim for 20-30 shots covering the first "
            "two scenes.\n\nPremise:\n{text}"
        ),
        "schedule": (
            "Write an optimized shooting schedule for the following film. "
            "Break down by shoot day with: DAY #, LOCATION(S), SCENES "
            "(numbered), CAST NEEDED, KEY PROPS, ESTIMATED HOURS. Aim for "
            "15-20 shooting days. Group scenes by location to minimize moves."
            "\n\nPremise:\n{text}"
        ),
    }

    def post(self, request):
        data = request.data if isinstance(request.data, dict) else {}
        q = (
            data.get("question")
            or data.get("text")
            or data.get("prompt")
            or ""
        )
        style = (data.get("style") or "producer").strip()
        prompt_template = self.STYLE_PROMPTS.get(style)

        try:
            if prompt_template:
                prompt = prompt_template.replace("{text}", q[:8000])
                answer = generate(
                    prompt,
                    system="You are a film production expert. Return only the requested structured output.",
                )
                return Response({"answer": answer, "style": style})

            # Fall back to existing behavior for producer/default/unknown styles
            return Response(executive.producer_copilot(q))
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class NLAnalyticsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        q = request.data.get("question", "") if isinstance(request.data, dict) else ""
        try:
            return Response(executive.nl_analytics(q))
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class TrailerNarrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        text = request.data.get("text", "") if isinstance(request.data, dict) else ""
        try:
            return Response(multimedia.trailer_narration(text))
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class PosterContentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        text = request.data.get("text", "") if isinstance(request.data, dict) else ""
        genre = request.data.get("genre", "") if isinstance(request.data, dict) else ""
        try:
            return Response(multimedia.poster_content(text, genre))
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class StoryboardView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        text = _extract_text(request)
        if not text:
            return Response({"error": "text required"}, status=400)
        try:
            if not hasattr(multimedia, 'storyboard_prompts'):
                return Response({"error": "storyboard_prompts not implemented"}, status=501)
            return Response(multimedia.storyboard_prompts(text))
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class DialogueRewriteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        text = request.data.get("text", "") if isinstance(request.data, dict) else ""
        if not text:
            text = _extract_text(request)
        if not text:
            return Response({"error": "text required"}, status=400)
        prompt = (
            "Rewrite the following request into the target voice described "
            "inside it. Preserve meaning, subtext and character intent. "
            "Return only the rewritten dialogue lines, no commentary.\n\n"
            f"{text[:8000]}"
        )
        try:
            rewritten = generate(prompt, system="You are a screenwriter. Return only dialogue.")
            return Response({"rewritten": rewritten})
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class MemoryRememberView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        text = request.data.get("text", "") if isinstance(request.data, dict) else ""
        meta = request.data.get("metadata", {}) if isinstance(request.data, dict) else {}
        try:
            memory.remember(text, meta)
            return Response({"ok": True})
        except RuntimeError as e:
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class MemoryRecallView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        q = request.data.get("question", "") if isinstance(request.data, dict) else ""
        try:
            return Response(memory.recall(q))
        except RuntimeError as e:
            return Response({"error": str(e)}, status=503)
        except Exception as e:
            import traceback
            return Response({"error": str(e), "traceback": traceback.format_exc()}, status=500)


# ============================================================
# AI Image Generation (Film Assets)
# ============================================================
class GenerateImageView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        prompt = (request.data.get("prompt") or "").strip()
        if not prompt:
            return Response(
                {"detail": "prompt is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(prompt) > 1000:
            return Response(
                {"detail": "prompt too long (max 1000 chars)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            width = int(request.data.get("width") or 1024)
            height = int(request.data.get("height") or 768)
        except (TypeError, ValueError):
            width, height = 1024, 768

        width = max(256, min(width, 1024))
        height = max(256, min(height, 768))

        try:
            result = _generate_image(prompt, width=width, height=height)
            encoded = base64.b64encode(result["data"]).decode("utf-8")
            return Response({
                "success": True,
                "image": f"data:image/png;base64,{encoded}",
                "provider": result["provider"],
                "prompt": result["prompt"],
            })
        except Exception as exc:
            return Response(
                {"detail": f"Could not generate image: {exc}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
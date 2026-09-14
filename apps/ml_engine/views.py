from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from apps.production.models import (
  BudgetTransaction, FilmProject, MLPrediction, Scene, CastMember, ProductionRisk,
)
from .services import (
  MLService, ScriptSentimentService, SceneDurationService,BudgetAnomalyService, CastRecommendationService,RiskForecastService, FestivalWinService, LocationRecommendationService,
)
from .serializers import (
  FestivalPredictionSerializer, ScriptSentimentInputSerializer,SceneDurationInputSerializer, CastRecommendationInputSerializer,FestivalWinInputSerializer, LocationRecommendationInputSerializer,
)
from .models import (
    AIScriptAnalysis,AISceneDurationPrediction, AIBudgetAnomaly,AIRiskForecast, AIFestivalWin, AILocationRecommendation,
)

ml_services = MLService()

class FestivalPredictionView(APIView):
  permission_classes = [IsAuthenticated]
  def post(self, request):
    serializer = FestivalPredictionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    features = serializer.validated_data
    result = ml_services.predict_festival(features)
    if 'error' not in result:
      try:
        MLPrediction.objects.create(
          project=FilmProject.objects.first(),
          model_type='RandomForest',
          prediction_data={'features': features, 'result': result},
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
      return Response({'forecast':[]})
    from sklearn.linear_model import LinearRegression
    import numpy as np
    X = np.arange(len(historical)).reshape(-1, 1)
    y = np.array(historical)
    model = LinearRegression().fit(X, y)
    next_X = np.array([[len(historical)], [len(historical) + 1], [len(historical) + 2]])
    return Response({'forecast': model.predict(next_X).tolist()})
  
class AIScriptSentimentView(APIView):
  permission_classes = [IsAuthenticated]
  def post(self, request):
    s = ScriptSentimentInputSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    result = ScriptSentimentInputSerializer.analyze(s.validated_data['dialogue_text'])
    try:
      AIScriptAnalysis.objects.create(
        project=FilmProject.objects.first(),
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
          recommendation=result['recommendation']
        )
    except Exception:
      pass
    return Response(result)
  
class AIBudgetAnomaliesView(APIView):
  permission_classes = [IsAuthenticated]
  def get(self, request):
    txns = list(BudgetTransaction.objects.all().values('id', 'amount', 'transaction_date', 'category'))
    if not txns:
      return Response({'anomalies': [], 'message': 'No transactions found'})
    result = BudgetAnomalyService.detect(txns)
    try:
      AIBudgetAnomaly.objects.all().delete()
      for a in result.get('anomalies', []):
        AIBudgetAnomaly.objects.create(
          transaction_id=a['transaction_id'],
          project=FilmProject.objects.first(),
          amount=a['amount'],
          category=a['category'],
          anomaly_score=a['anomaly_score'],
          severity=a['severity'],
          explanation=a['explanation'],
        )
    except Exception:
      pass
    return Response(result)
  
class AICastRecommendationView(APIView):
  permission_classes  = [IsAuthenticated]
  def post(self, request):
    s = CastRecommendationInputSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    cast = list(CastMember.objects.all().values(
      'id', 'full_name', 'character_name', 'role_type', 'experience_years', 'special_skills',
    ))
    results = CastRecommendationService.recommend(
      s.validated_data['role_description'],
      s.validated_data.get('required_skills', []),
      s.validated_data.get('min_experience', 0),
      cast,
    )
    return Response({'recommendations': results})

class AIRiskForecastView(APIView):
  permission_classes = [IsAuthenticated]
  def get(self, request):
    risks = list(ProductionRisk.objects.all().values(
      'risk_type', 'serverity', 'probability', 'impact', 'status',
    ))
    forecasts = RiskForecastService.forecast(risks)
    try:
      AIRiskForecast.objects.all().delete()
      for f in forecasts:
        AIRiskForecast.objects.create(
          project=FilmProject.objects.first(),
          forecast_date=timezone.now().date(),
          risk_type=f['risk_type'],
          predicted_probability=f['predicted_probability'],
          predicted_impact=f['predicted_impact'],
          rationale=f['rationale'],
          preventive_action=f['preventive_action'],
        )
    except Exception:
      pass
    return Response({'forecasts': forecasts})
  
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
        project=FilmProject.objects.first(),
        festival_name=s.validated_data['festival_name'],
        win_probability=result['win_probability'],
        tier=s.validated_data['tier'],
        factors=result['factors'],
        recommendation=result['recommendation'],
      )
    except Exception:
      pass
    return Response(result)

class AILocationRecommendationView(APIView):
  permission_classes = [IsAuthenticated]
  def post(self, request):
    s = LocationRecommendationInputSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    result = LocationRecommendationService.recommend(
      s.validated_data['scene_number'],
      s.validated_data.get('emotional_tone', ''),
      s.validated_data.get('time_of_day', ''),
      s.validated_data.get('is_indoor', True),
    )
    try:
      scene = Scene.objects.filter(scene_number=s.validated_data['scene_number']).first()
      for r in result:
        AILocationRecommendation.objects.create(
          project=FilmProject.objects.first(),
          scene=scene,
          recommended_location=r['recommended_location'],
          match_score=r['match_score'],
          reasoning=r['reasoning'],
        )
    except Exception:
      pass
    return Response({"Recommendations": result})
    
class AIDailyAnalyticsView(APIView):
  permission_classes = [IsAuthenticated]
  def get(self, request):
    recent_sentiments = list(AIScriptAnalysis.objects.all().order_by('-created_at')[:5].values('dominant_emotion', 'polarity', 'intensity_level'))
    risk_forecasts = list(AIRiskForecast.objects.all().order_by('-created_at')[:5].values('risk_type', 'predicted_probability', 'preventive_action'))
    anamalies = list(AIBudgetAnomaly.objects.all().order_by('-detected_at')[:5].values('amount', 'servity', 'explanation'))
    festival = list(
      AIFestivalWin.objects.all().order_by('-created_at')[:5].values('festival_name', 'win_probability', 'recommendation')
    )
    return Response({
      'generated_at': timezone.now().isoformat(),
      'sentiment_highlights': recent_sentiments,
      'risk_forecasts': risk_forecasts,
      'budget_anomalies': anamalies,
      'festival_predictions': festival,
      'total_ai_records': (
        AIScriptAnalysis.objects.count() +
        AIBudgetAnomaly.objects.count() +
        AIRiskForecast.objects.count() +
        AIFestivalWin.objects.count() +
        AILocationRecommendation.objects.count() +
        AISceneDurationPrediction.objects.count()
      ),
    })
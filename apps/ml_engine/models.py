# ============================================================
# apps/ml_engine/models.py
#
# NOTE: The MLPrediction model lives in apps/production/models.py
# because it maps to an existing SQL table (ml_predictions).
# We import it here only for backward compatibility so any old
# `from apps.ml_engine.models import MLPrediction` still works.
# ============================================================

from django.db import models
from apps.production.models import FilmProject, Scene, CastMember
from apps.production.models import MLPrediction  # noqa: F401  (re-export)
import uuid


# ============================================================
# NEW AI MODELS (Django-managed tables)
# ============================================================

class AIScriptAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        FilmProject, on_delete=models.DO_NOTHING,
        db_column='project_id', related_name='ai_script_analyses',
        blank=True, null=True,
    )
    scene = models.ForeignKey(
        Scene, on_delete=models.DO_NOTHING,
        db_column='scene_id', related_name='ai_analyses',
        blank=True, null=True,
    )
    character_name = models.CharField(max_length=100, blank=True, null=True)
    dialogue_excerpt = models.TextField(blank=True, null=True)
    polarity = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    subjectivity = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    dominant_emotion = models.CharField(max_length=50, blank=True, null=True)
    emotion_confidence = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    intensity_level = models.CharField(max_length=20, blank=True, null=True)
    pacing_suggestion = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_script_analysis'

    def __str__(self):
        return f"{self.character_name or 'Unknown'} - {self.dominant_emotion}"


class AISceneDurationPrediction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scene = models.ForeignKey(
        Scene, on_delete=models.DO_NOTHING,
        db_column='scene_id', related_name='ai_duration_predictions',
        blank=True, null=True,
    )
    predicted_minutes = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    actual_minutes = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
    confidence = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    complexity_factor = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    recommendation = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_scene_duration_predictions'

    def __str__(self):
        return f"Scene {self.scene_id} - {self.predicted_minutes} min"


class AIBudgetAnomaly(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction_id = models.UUIDField(blank=True, null=True)
    project = models.ForeignKey(
        FilmProject, on_delete=models.DO_NOTHING,
        db_column='project_id', related_name='ai_budget_anomalies',
        blank=True, null=True,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    anomaly_score = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    severity = models.CharField(max_length=20, blank=True, null=True)
    explanation = models.TextField(blank=True, null=True)
    detected_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_budget_anomalies'

    def __str__(self):
        return f"{self.severity} - {self.category} - {self.amount}"


class AICastRecommendation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        FilmProject, on_delete=models.DO_NOTHING,
        db_column='project_id', related_name='ai_cast_recommendations',
        blank=True, null=True,
    )
    role_description = models.CharField(max_length=200, blank=True, null=True)
    recommended_cast = models.ForeignKey(
        CastMember, on_delete=models.DO_NOTHING,
        db_column='cast_id', blank=True, null=True,
    )
    match_score = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_cast_recommendations'

    def __str__(self):
        return f"{self.role_description} -> {self.recommended_cast}"


class AIRiskForecast(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        FilmProject, on_delete=models.DO_NOTHING,
        db_column='project_id', related_name='ai_risk_forecasts',
        blank=True, null=True,
    )
    forecast_date = models.DateField(blank=True, null=True)
    risk_type = models.CharField(max_length=50, blank=True, null=True)
    predicted_probability = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    predicted_impact = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    rationale = models.TextField(blank=True, null=True)
    preventive_action = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_risk_forecasts'

    def __str__(self):
        return f"{self.risk_type} - {self.predicted_probability}"


class AIFestivalWin(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        FilmProject, on_delete=models.DO_NOTHING,
        db_column='project_id', related_name='ai_festival_wins',
        blank=True, null=True,
    )
    festival_name = models.CharField(max_length=100, blank=True, null=True)
    win_probability = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    tier = models.CharField(max_length=20, blank=True, null=True)
    factors = models.JSONField(blank=True, null=True)
    recommendation = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_festival_wins'

    def __str__(self):
        return f"{self.festival_name} - {self.tier}"


class AILocationRecommendation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        FilmProject, on_delete=models.DO_NOTHING,
        db_column='project_id', related_name='ai_location_recommendations',
        blank=True, null=True,
    )
    scene = models.ForeignKey(
        Scene, on_delete=models.DO_NOTHING,
        db_column='scene_id', related_name='ai_location_recommendations',
        blank=True, null=True,
    )
    recommended_location = models.CharField(max_length=200, blank=True, null=True)
    match_score = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    reasoning = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_location_recommendations'

    def __str__(self):
        return f"{self.recommended_location} ({self.match_score})"
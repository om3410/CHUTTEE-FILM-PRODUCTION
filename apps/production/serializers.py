from django.utils import timezone
from rest_framework import serializers

from .models import (
    FilmProject, CrewMember, CastMember, Scene, SceneActor,
    Equipment, EquipmentUsage, ShootDay, ShootDayScene,
    BudgetTransaction, ScriptDialogue, SentimentAnalysis,
    ProductionRisk, FestivalSubmission, AnalyticsDaily,
    MLPrediction, FilmAsset,
)


class TimestampedSerializerMixin:
    """
    Sets created_at / updated_at explicitly on create and update.
    Needed because the models are `managed = False` and the DB
    has no DEFAULT now() on those columns.
    """
    def create(self, validated_data):
        now = timezone.now()
        if hasattr(self.Meta.model, 'created_at'):
            validated_data.setdefault('created_at', now)
        if hasattr(self.Meta.model, 'updated_at'):
            validated_data['updated_at'] = now
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if hasattr(self.Meta.model, 'updated_at'):
            validated_data['updated_at'] = timezone.now()
        return super().update(instance, validated_data)


class FilmProjectSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = FilmProject
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CrewMemberSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = CrewMember
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class CastMemberSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = CastMember
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SceneSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Scene
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SceneActorSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = SceneActor
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class EquipmentSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
  class Meta:
    model = Equipment
    fields = '__all__'
    read_only_fields = ['id', 'created_at', 'updated_at']

  def validate_condition_status(self, value):
    if value is None:
      return value
    allowed = {'Excellent', 'Good', 'Fair', 'Poor'}
    if value not in allowed:
      raise serializers.ValidationError(
        f"condition_status must be one of: {', '.join(sorted(allowed))}"
      )
    return value
class EquipmentUsageSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = EquipmentUsage
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ShootDaySerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = ShootDay
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ShootDaySceneSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = ShootDayScene
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class BudgetTransactionSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = BudgetTransaction
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ScriptDialogueSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = ScriptDialogue
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SentimentAnalysisSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = SentimentAnalysis
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductionRiskSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = ProductionRisk
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class FestivalSubmissionSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = FestivalSubmission
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AnalyticsDailySerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = AnalyticsDaily
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class MLPredictionSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = MLPrediction
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class FilmAssetSerializer(TimestampedSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = FilmAsset
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
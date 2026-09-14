from rest_framework import serializers
from .models import (
  FilmProject, CrewMember, CastMember, Scene, SceneActor, Equipment, EquipmentUsage, ShootDay, ShootDayScene, BudgetTransaction, ScriptDialogue, SentimentAnalysis, ProductionRisk, FestivalSubmission, AnalyticsDaily, MLPrediction, FilmAsset,
)

class FilmProjectSerializer(serializers.ModelSerializer):
  class Meta:
    model = FilmProject
    fields = '__all__'
    
class CrewMemberSerializer(serializers.ModelSerializer):
  class Meta:
    model = CrewMember
    fields = '__all__'
    
class CastMemberSerializer(serializers.ModelSerializer):
  class Meta:
    model = CastMember
    fields = '__all__'
    
class SceneSerializer(serializers.ModelSerializer):
  class Meta:
    model = Scene
    fields = '__all__'
    
class SceneActorSerializer(serializers.ModelSerializer):
  class Meta:
    model = SceneActor
    fields = '__all__'
    
class EquipmentSerializer(serializers.ModelSerializer):
  class Meta:
    model = Equipment
    fields = '__all__'
    
class EquipmentUsageSerializer(serializers.ModelSerializer):
  class Meta:
    model = EquipmentUsage
    fields = '__all__'
    
class ShootDaySerializer(serializers.ModelSerializer):
  class Meta:
    model = ShootDay
    fields = '__all__'
    
class ShootDaySceneSerializer(serializers.ModelSerializer):
  class Meta:
    model = ShootDayScene
    fields = '__all__'
    
class BudgetTransactionSerializer(serializers.ModelSerializer):
  class Meta:
    model = BudgetTransaction
    fields = '__all__'
    
class ScriptDialogueSerializer(serializers.ModelSerializer):
  class Meta:
    model = ScriptDialogue
    fields = '__all__'
    
class SentimentAnalysisSerializer(serializers.ModelSerializer):
  class Meta:
    model = SentimentAnalysis
    fields = '__all__'
  
class ProductionRiskSerializer(serializers.ModelSerializer):
  class Meta:
    model = ProductionRisk
    fields = '__all__'
  
class FestivalSubmissionSerializer(serializers.ModelSerializer):
  class Meta:
    model = FestivalSubmission
    fields = '__all__'
  
class AnalyticsDailySerializer(serializers.ModelSerializer):
  class Meta:
    model = AnalyticsDaily
    fields = '__all__'
  

class MLPredictionSerializer(serializers.ModelSerializer):
  class Meta:
    model = MLPrediction
    fields = '__all__'
    
class FilmAssetSerializer(serializers.ModelSerializer):
  class Meta:
    model = FilmAsset
    fields = '__all__'
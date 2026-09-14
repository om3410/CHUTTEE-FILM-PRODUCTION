from django.contrib import admin
from .models import (
    FilmProject, CrewMember, CastMember, Scene, SceneActor,
    Equipment, EquipmentUsage, ShootDay, ShootDayScene,
    BudgetTransaction, ScriptDialogue, SentimentAnalysis,
    ProductionRisk, FestivalSubmission, AnalyticsDaily, MLPrediction,
    FilmAsset,
)


@admin.register(FilmAsset)
class FilmAssetAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'uploaded_at')
    list_filter = ('category',)
    search_fields = ('title',)


@admin.register(FilmProject)
class FilmProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'director', 'status')
    search_fields = ('title', 'director')
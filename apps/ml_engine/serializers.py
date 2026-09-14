from rest_framework import serializers


class FestivalPredictionSerializer(serializers.Serializer):
    submission_fee = serializers.FloatField()
    competition_level = serializers.IntegerField(min_value=0, max_value=2)
    duration_minutes = serializers.IntegerField(default=20)
    budget = serializers.FloatField(default=250000)


class ScriptSentimentInputSerializer(serializers.Serializer):
    dialogue_text = serializers.CharField()
    character_name = serializers.CharField(required=False, allow_blank=True)


class SceneDurationInputSerializer(serializers.Serializer):
    scene_number = serializers.IntegerField()
    location = serializers.CharField(required=False, allow_blank=True)
    time_of_day = serializers.CharField(required=False, allow_blank=True)
    emotional_tone = serializers.CharField(required=False, allow_blank=True)
    complexity_score = serializers.FloatField(default=0.5)
    duration_estimate_minutes = serializers.IntegerField(default=30)
    is_indoor = serializers.BooleanField(default=True)


class CastRecommendationInputSerializer(serializers.Serializer):
    role_description = serializers.CharField()
    required_skills = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    min_experience = serializers.FloatField(default=0)


class FestivalWinInputSerializer(serializers.Serializer):
    festival_name = serializers.CharField()
    festival_tier = serializers.ChoiceField(
        choices=['indie', 'regional', 'national', 'international'],
        default='regional'
    )
    submission_fee = serializers.FloatField(default=50)
    film_duration = serializers.IntegerField(default=20)
    film_genre = serializers.CharField(default='Drama')


class LocationRecommendationInputSerializer(serializers.Serializer):
    scene_number = serializers.IntegerField()
    emotional_tone = serializers.CharField(required=False, allow_blank=True)
    time_of_day = serializers.CharField(required=False, allow_blank=True)
    is_indoor = serializers.BooleanField(default=True)
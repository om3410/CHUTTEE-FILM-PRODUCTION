import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField


class FilmProject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='project_id')
    title = models.CharField(max_length=200)
    director = models.CharField(max_length=100)
    logline = models.TextField(blank=True, null=True)
    genre = models.CharField(max_length=50, blank=True, null=True)
    duration_minutes = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=50, blank=True, null=True)
    total_budget = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    currency = models.CharField(max_length=10, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    tags = ArrayField(models.CharField(max_length=100), blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        managed = False
        db_table = 'film_projects'

    def __str__(self):
        return self.title


class CrewMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='crew_id')
    project = models.ForeignKey(
        FilmProject, on_delete=models.DO_NOTHING,
        db_column='project_id', related_name='crew', blank=True, null=True,
    )
    full_name = models.CharField(max_length=100)
    role = models.CharField(max_length=50, blank=True, null=True)
    department = models.CharField(max_length=50, blank=True, null=True)
    experience_years = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_available = models.BooleanField(blank=True, null=True)
    joined_date = models.DateField(blank=True, null=True)
    skills = ArrayField(models.CharField(max_length=100), blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'crew_members'

    def __str__(self):
        return self.full_name


class CastMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='cast_id')
    project = models.ForeignKey(FilmProject, on_delete=models.DO_NOTHING, db_column='project_id', related_name='cast', blank=True, null=True)
    full_name = models.CharField(max_length=100)
    character_name = models.CharField(max_length=100, blank=True, null=True)
    role_type = models.CharField(max_length=20, blank=True, null=True)
    experience_years = models.DecimalField(max_digits=3, decimal_places=1, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_available = models.BooleanField(blank=True, null=True)
    joined_date = models.DateField(blank=True, null=True)
    physical_attributes = models.JSONField(blank=True, null=True)
    special_skills = ArrayField(models.CharField(max_length=100), blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'cast_members'

    def __str__(self):
        return self.full_name


class Scene(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='scene_id')
    project = models.ForeignKey(FilmProject, on_delete=models.DO_NOTHING, db_column='project_id', related_name='scenes', blank=True, null=True)
    scene_number = models.IntegerField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    time_of_day = models.CharField(max_length=20, blank=True, null=True)
    complexity_score = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    emotional_tone = models.CharField(max_length=50, blank=True, null=True)
    duration_estimate_minutes = models.IntegerField(blank=True, null=True)
    is_indoor = models.BooleanField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    props = ArrayField(models.CharField(max_length=100), blank=True, null=True)
    wardrobe = ArrayField(models.CharField(max_length=100), blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'scenes'

    def __str__(self):
        return f"Scene {self.scene_number} - {self.location}"


class SceneActor(models.Model):
    """
    Links a CastMember to a Scene.
    A scene can have many actors; a cast member can appear in many scenes.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='scene_actor_id')
    scene = models.ForeignKey(
        Scene,
        on_delete=models.DO_NOTHING,
        db_column='scene_id',
        related_name='cast_members',
    )
    cast = models.ForeignKey(
        CastMember,
        on_delete=models.DO_NOTHING,
        db_column='cast_id',
        related_name='scene_appearances',
    )
    lines_count = models.IntegerField(blank=True, null=True)
    screen_time_minutes = models.IntegerField(blank=True, null=True)
    rehearsal_hours = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    performance_notes = models.TextField(blank=True, null=True)
    is_stand_in = models.BooleanField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'scene_actors'
        unique_together = (('scene', 'cast'))

    def __str__(self):
        return f"Scene {self.scene_id} - Cast {self.cast_id}"


class Equipment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='equipment_id')
    project = models.ForeignKey(FilmProject, on_delete=models.DO_NOTHING, db_column='project_id', related_name='equipment', blank=True, null=True)
    name = models.CharField(max_length=100, blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    brand = models.CharField(max_length=50, blank=True, null=True)
    model = models.CharField(max_length=50, blank=True, null=True)
    serial_number = models.CharField(max_length=50, blank=True, null=True)
    condition_status = models.CharField(max_length=20, blank=True, null=True)
    daily_rental_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    purchased_date = models.DateField(blank=True, null=True)
    last_maintenance = models.DateField(blank=True, null=True)
    is_available = models.BooleanField(blank=True, null=True)
    specifications = models.JSONField(blank=True, null=True)
    maintenance_history = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'equipment'

    def __str__(self):
        return self.name or str(self.id)


class EquipmentUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='usage_id')
    equipment = models.ForeignKey(Equipment, on_delete=models.DO_NOTHING, db_column='equipment_id')
    scene = models.ForeignKey(Scene, on_delete=models.DO_NOTHING, db_column='scene_id')
    used_date = models.DateField(blank=True, null=True)
    hours_used = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    condition_after = models.CharField(max_length=20, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    issues = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'equipment_usage'


class ShootDay(models.Model):
    shoot_day_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='shoot_day_id')
    project = models.ForeignKey(
        FilmProject, on_delete=models.DO_NOTHING,
        db_column='project_id', related_name='shoot_days', blank=True, null=True,
    )
    shoot_date = models.DateField(blank=True, null=True, db_column='shoot_date')
    day_number = models.IntegerField(blank=True, null=True, db_column='day_number')
    location = models.CharField(max_length=100, blank=True, null=True, db_column='location')
    weather_condition = models.CharField(max_length=50, blank=True, null=True, db_column='weather_condition')
    temperature_celsius = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True, db_column='temperature_celsius')
    is_rained = models.BooleanField(blank=True, null=True, db_column='is_rained')
    crew_present = models.IntegerField(blank=True, null=True, db_column='crew_present')
    cast_present = models.IntegerField(blank=True, null=True, db_column='cast_present')
    start_time = models.TimeField(blank=True, null=True, db_column='start_time')
    end_time = models.TimeField(blank=True, null=True, db_column='end_time')
    total_hours = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True, db_column='total_hours')
    status = models.CharField(max_length=20, blank=True, null=True, db_column='status')
    notes = models.TextField(blank=True, null=True, db_column='notes')
    weather_data = models.JSONField(blank=True, null=True, db_column='weather_data')
    created_at = models.DateTimeField(blank=True, null=True, db_column='created_at')
    updated_at = models.DateTimeField(blank=True, null=True, db_column='updated_at')

    class Meta:
        managed = False
        db_table = 'shoot_days'

    def __str__(self):
        return f"Shoot Day {self.day_number} - {self.shoot_date}"


class ShootDayScene(models.Model):
    """
    Links a Scene to a ShootDay.
    One shoot day has many scenes; a scene can be shot across many days.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='shoot_day_scene_id')
    shoot_day = models.ForeignKey(
        ShootDay,
        on_delete=models.DO_NOTHING,
        db_column='shoot_day_id',
        related_name='scenes',              # ✅ shoot_day.scenes.all()
    )
    scene = models.ForeignKey(
        Scene,
        on_delete=models.DO_NOTHING,
        db_column='scene_id',
        related_name='shoot_days',          # ✅ scene.shoot_days.all()
    )
    shot_order = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    actual_time_taken_minutes = models.IntegerField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)   # ✅ auto
    updated_at = models.DateTimeField(auto_now=True)       # ✅ auto

    class Meta:
        managed = False
        db_table = 'shoot_day_scenes'
        ordering = ['shoot_day', 'shot_order']
        unique_together = (('shoot_day', 'scene'),)
        verbose_name = 'Shoot Day Scene'
        verbose_name_plural = 'Shoot Day Scenes'

    def __str__(self):
        return f"Scene {self.scene_id} on ShootDay {self.shoot_day_id}"


class BudgetTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='transaction_id')
    project = models.ForeignKey(FilmProject, on_delete=models.DO_NOTHING, db_column='project_id', related_name='budget', blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    transaction_date = models.DateField(blank=True, null=True)
    vendor_name = models.CharField(max_length=100, blank=True, null=True)
    receipt_number = models.CharField(max_length=50, blank=True, null=True)
    approved_by = models.CharField(max_length=100, blank=True, null=True)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'budget_transactions'


class ScriptDialogue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='dialogue_id')
    project = models.ForeignKey(FilmProject, on_delete=models.DO_NOTHING, db_column='project_id', related_name='dialogues', blank=True, null=True)
    scene = models.ForeignKey(Scene, on_delete=models.DO_NOTHING, db_column='scene_id', blank=True, null=True)
    character_name = models.CharField(max_length=100, blank=True, null=True)
    dialogue_text = models.TextField(blank=True, null=True)
    emotion_tag = models.CharField(max_length=50, blank=True, null=True)
    intensity_score = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    tone_category = models.CharField(max_length=50, blank=True, null=True)
    has_conflict = models.BooleanField(blank=True, null=True)
    has_romance = models.BooleanField(blank=True, null=True)
    word_count = models.IntegerField(blank=True, null=True)
    speech_duration_seconds = models.IntegerField(blank=True, null=True)
    context_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'script_dialogues'


class SentimentAnalysis(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='sentiment_id')
    project = models.ForeignKey(FilmProject, on_delete=models.DO_NOTHING, db_column='project_id', related_name='sentiments', blank=True, null=True)
    scene = models.ForeignKey(Scene, on_delete=models.DO_NOTHING, db_column='scene_id', blank=True, null=True)
    dialogue = models.ForeignKey(ScriptDialogue, on_delete=models.DO_NOTHING, db_column='dialogue_id', blank=True, null=True)
    polarity = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    subjectivity = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    emotional_label = models.CharField(max_length=50, blank=True, null=True)
    confidence = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    aspect_sentiment = models.JSONField(blank=True, null=True)
    analyzed_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sentiment_analysis'


class ProductionRisk(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='risk_id')
    project = models.ForeignKey(FilmProject, on_delete=models.DO_NOTHING, db_column='project_id', related_name='risks', blank=True, null=True)
    risk_date = models.DateField(blank=True, null=True)
    risk_type = models.CharField(max_length=50, blank=True, null=True)
    severity = models.CharField(max_length=20, blank=True, null=True)
    probability = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    impact = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    risk_score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    mitigation_plan = models.TextField(blank=True, null=True)
    owner = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    resolved_date = models.DateField(blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    triggers = models.CharField(max_length=50, blank=True, null=True)
    mitigation_steps = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'production_risks'


class FestivalSubmission(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='submission_id')
    project = models.ForeignKey(FilmProject, on_delete=models.DO_NOTHING, db_column='project_id', related_name='festival_submissions', blank=True, null=True)
    festival_name = models.CharField(max_length=100, blank=True, null=True)
    festival_category = models.CharField(max_length=100, blank=True, null=True)
    submission_date = models.DateField(blank=True, null=True)
    submission_fee = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    award_name = models.CharField(max_length=100, blank=True, null=True)
    selection_probability = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'festival_submissions'


class AnalyticsDaily(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='analytics_id')
    project = models.ForeignKey(FilmProject, on_delete=models.DO_NOTHING, db_column='project_id', related_name='analytics_daily', blank=True, null=True)
    cumulative_budget_spent = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    scenes_completed_today = models.IntegerField(blank=True, null=True)
    average_takes_today = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
    crew_attendance_rate = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    equipment_uptime_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    sentiment_score_today = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    risk_score_today = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    productivity_score = models.DecimalField(max_digits=3, decimal_places=2, blank=True, null=True)
    key_metrics = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'analytics_daily'


class MLPrediction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, db_column='prediction_id')
    project = models.ForeignKey(FilmProject, on_delete=models.DO_NOTHING, db_column='project_id', related_name='ml_predictions', blank=True, null=True)
    prediction_date = models.DateField(blank=True, null=True)
    model_type = models.CharField(max_length=50, blank=True, null=True)
    prediction_data = models.JSONField(blank=True, null=True)
    actual_outcome = models.JSONField(blank=True, null=True)
    accuracy = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    features_used = models.CharField(max_length=500, blank=True, null=True)
    prediction_score = models.DecimalField(max_digits=5, decimal_places=4, blank=True, null=True)
    recommended_action = models.TextField(blank=True, null=True)
    confidence_interval = models.JSONField(blank=True, null=True)
    model_version = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'ml_predictions'


class FilmAsset(models.Model):
    CATEGORY_CHOICES = [
        ('POSTER', 'Poster'),
        ('HEADSHOT', 'Cast & Crew Headshot'),
        ('COLOR_PALETTE', 'Color Palette'),
        ('BTS', 'Behind The Scenes'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    image = models.ImageField(upload_to='chuttee_assets/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = 'film_assets'

    def __str__(self):
        return f"{self.title} - {self.get_category_display()}"
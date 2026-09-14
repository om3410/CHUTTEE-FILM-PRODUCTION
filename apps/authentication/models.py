from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser


class FilmProject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    director = models.CharField(max_length=100)
    logline = models.TextField(blank=True)
    genre = models.CharField(max_length=50, blank=True)
    duration_minutes = models.IntegerField()
    status = models.CharField(max_length=50, choices=[
        ('Development', 'Development'),
        ('Pre-Production', 'Pre-Production'),
        ('Production', 'Production'),
        ('Completed', 'Completed'),
        ('Festival_Run', 'Festival_Run')
    ], default='Development')
    total_budget = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=10, default='INR')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    extra_metadata = models.JSONField(default=dict, blank=True)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'film_projects'

    def __str__(self):
        return self.title


class CrewMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(FilmProject, on_delete=models.CASCADE, related_name='crew')
    full_name = models.CharField(max_length=100)
    role = models.CharField(max_length=50)
    department = models.CharField(max_length=50)
    experience_years = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_available = models.BooleanField(default=True)
    joined_date = models.DateField(null=True, blank=True)
    skills = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'crew_members'

    def __str__(self):
        return self.full_name
    
class User(AbstractUser):
    ROLE_CHOICES = (
        ('CREW', 'CREW MEMBER'),
        ('USER', 'GENERAL USER'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='USER')
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'ADMIN'),
        ('CREW', 'CREW MEMBER'),
        ('USER', 'GENERAL USER'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='USER')

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ("ADMIN", "ADMIN"),
        ("CREW", "CREW MEMBER"),
        ("USER", "GENERAL USER"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="USER")

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class UserSecurity(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,          # FIX: AUTH_USER_MAODEL typo, settings import
        on_delete=models.CASCADE,
        related_name="security",
    )
    token_version = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def bump_version(self):
        self.token_version = (self.token_version or 0) + 1
        self.save(update_fields=["token_version", "updated_at"])
        return self.token_version

    def __str__(self):
        return f"Security({self.user_id}, v={self.token_version})"


class DeviceSession(models.Model):
    RISK_LOW, RISK_MEDIUM, RISK_HIGH = "low", "medium", "high"
    RISK_CHOICES = [
        (RISK_LOW, "Low"),
        (RISK_MEDIUM, "Medium"),
        (RISK_HIGH, "High"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="device_sessions",
    )
    session_id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True
    )
    refresh_jti = models.CharField(max_length=255, db_index=True, blank=True)

    device_id = models.CharField(max_length=128, blank=True)
    device_name = models.CharField(max_length=128, blank=True)
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    country = models.CharField(max_length=64, blank=True)

    risk_level = models.CharField(max_length=16, choices=RISK_CHOICES, default=RISK_LOW)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_reason = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ("-last_seen_at",)
        indexes = [models.Index(fields=["user", "is_active"])]

    def __str__(self):
        return f"{self.user_id} / {self.device_name or self.device_id or self.session_id}"

    def revoke(self, reason=""):
        if not self.is_active:
            return
        self.is_active = False
        self.revoked_at = timezone.now()
        self.revoked_reason = reason
        self.save(update_fields=["is_active", "revoked_at", "revoked_reason"])
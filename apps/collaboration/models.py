import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Comment(models.Model):
    """Matches existing collab_comments table."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    body = models.TextField()
    mentions = models.JSONField(default=list)
    created_at = models.DateTimeField(default=timezone.now)
    parent = models.ForeignKey(
        'self',
        on_delete=models.DO_NOTHING,
        db_column='parent_id',
        blank=True, null=True,
        related_name='replies',
    )
    risk = models.ForeignKey(
        'production.ProductionRisk',
        on_delete=models.DO_NOTHING,
        db_column='risk_id',
        blank=True, null=True,
        related_name='comments',
    )
    scene = models.ForeignKey(
        'production.Scene',
        on_delete=models.DO_NOTHING,
        db_column='scene_id',
        blank=True, null=True,
        related_name='comments',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='user_id',
        related_name='comments',
    )

    class Meta:
        managed = False
        db_table = 'collab_comments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment {self.id}"


class AuditLog(models.Model):
    """Matches existing collab_audit_logs table."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action = models.CharField(max_length=20)
    resource = models.CharField(max_length=200)
    resource_id = models.CharField(max_length=100)
    changes = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now) 
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.DO_NOTHING,
        db_column='user_id',
        blank=True, null=True,
        related_name='audit_logs',
    )

    class Meta:
        managed = False
        db_table = 'collab_audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} {self.resource}#{self.resource_id}"
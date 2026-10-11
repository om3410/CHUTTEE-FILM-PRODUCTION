from rest_framework import serializers
from .models import Comment, AuditLog


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Comment
        fields = (
            'id', 'user', 'user_name', 'body', 'mentions',
            'parent', 'risk', 'scene', 'created_at',
        )
        read_only_fields = ('id', 'user', 'created_at')


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = (
            'id', 'user', 'user_name', 'action', 'resource',
            'resource_id', 'changes', 'ip_address', 'timestamp',
        )
        read_only_fields = fields
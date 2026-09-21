from rest_framework import serializers
from .models import Comment, AuditLog


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'user_name', 'scene', 'risk', 'body',
                  'parent', 'mentions', 'created_at']
        read_only_fields = ['user', 'user_name', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'
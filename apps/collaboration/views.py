from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Comment, AuditLog
from .serializers import CommentSerializer, AuditLogSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def comments(request):
    if request.method == 'GET':
        base_qs = Comment.objects.select_related('user').all()
        count = base_qs.count()
        qs = base_qs[:100]
        return Response({
            'results': CommentSerializer(qs, many=True).data,
            'count': count,
        })

    data = request.data.copy()
    data.setdefault('mentions', [])
    serializer = CommentSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user, created_at=timezone.now())
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    is_admin = getattr(request.user, 'role', None) == 'ADMIN'
    if comment.user_id != request.user.id and not is_admin:
        return Response({'error': 'Forbidden'}, status=403)

    comment.delete()
    return Response(status=204)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_logs(request):
    base_qs = AuditLog.objects.select_related('user').all()
    count = base_qs.count()
    qs = base_qs[:100]
    return Response({
        'results': AuditLogSerializer(qs, many=True).data,
        'count': count,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_activity(request):
    qs = AuditLog.objects.select_related('user').all()[:20]
    return Response(AuditLogSerializer(qs, many=True).data)
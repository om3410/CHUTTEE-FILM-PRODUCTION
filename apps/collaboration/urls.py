from django.urls import path
from . import views

app_name = 'collaboration'

urlpatterns = [
    path('comments/', views.comments, name='comments'),
    path('comments/<uuid:comment_id>/', views.delete_comment, name='delete-comment'),
    path('audit-logs/', views.audit_logs, name='audit-logs'),
    path('activity/recent/', views.recent_activity, name='recent-activity'),
]
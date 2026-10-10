from django.urls import path
from .views import (
    CallSheetPDFView, CSVExportView, ExcelExportView, SRTGeneratorView,
)

urlpatterns = [
    path('call-sheet/<uuid:shoot_day_id>/', CallSheetPDFView.as_view()),
    path('csv/<str:table>/', CSVExportView.as_view()),
    path('excel/', ExcelExportView.as_view()),
    path('srt/<uuid:scene_id>/', SRTGeneratorView.as_view()),
]
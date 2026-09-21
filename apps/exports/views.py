from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from apps.production.models import (
    ShootDay, Scene, CrewMember, BudgetTransaction,
    ScriptDialogue, CastMember,
)
from .services import (
    generate_call_sheet_pdf, generate_csv,
    generate_excel, generate_srt,
)


class CallSheetPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, shoot_day_id):
        sd = get_object_or_404(ShootDay, pk=shoot_day_id)
        shoot_day = {
            'day_number': sd.day_number,
            'shoot_date': sd.shoot_date,
            'location': sd.location,
            'weather_condition': sd.weather_condition,
            'temperature_celsius': sd.temperature_celsius,
            'start_time': sd.start_time,
            'end_time': sd.end_time,
        }
        scenes = list(Scene.objects.all().values(
            'scene_number', 'location', 'time_of_day', 'duration_estimate_minutes'
        ))
        crew = list(CrewMember.objects.all().values(
            'full_name', 'role', 'department'
        ))
        buffer = generate_call_sheet_pdf(shoot_day, scenes, crew)
        response = HttpResponse(buffer.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="call_sheet_day_{sd.day_number}.pdf"'
        return response


class CSVExportView(APIView):
    permission_classes = [IsAuthenticated]

    TABLE_MAP = {
        'crew':   (CrewMember, ['full_name', 'role', 'department', 'daily_rate']),
        'cast':   (CastMember, ['full_name', 'character_name', 'role_type', 'daily_rate']),
        'budget': (BudgetTransaction, ['transaction_date', 'category', 'amount', 'vendor_name']),
        'scenes': (Scene, ['scene_number', 'location', 'time_of_day', 'status']),
    }

    def get(self, request, table):
        if table not in self.TABLE_MAP:
            return Response({'error': 'Unknown table'}, status=400)
        model, fields = self.TABLE_MAP[table]
        rows = list(model.objects.all().values(*fields))
        buffer = generate_csv(rows, fields)
        response = HttpResponse(buffer.read(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{table}_export.csv"'
        return response


class ExcelExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sheets = {
            'Crew':   {'headers': ['full_name', 'role', 'daily_rate'],
                       'rows':    list(CrewMember.objects.all().values('full_name', 'role', 'daily_rate'))},
            'Cast':   {'headers': ['full_name', 'character_name', 'daily_rate'],
                       'rows':    list(CastMember.objects.all().values('full_name', 'character_name', 'daily_rate'))},
            'Budget': {'headers': ['transaction_date', 'category', 'amount'],
                       'rows':    list(BudgetTransaction.objects.all().values('transaction_date', 'category', 'amount'))},
        }
        buffer = generate_excel(sheets)
        response = HttpResponse(
            buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="chuttee_full_export.xlsx"'
        return response


class SRTGeneratorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, scene_id):
        scene = get_object_or_404(Scene, pk=scene_id)
        dialogues = list(ScriptDialogue.objects.filter(scene=scene)
                         .order_by('dialogue_order')
                         .values('dialogue_order', 'character_name', 'dialogue_text'))
        parsed = [{
            'order': i + 1,
            'start_seconds': i * 3,
            'end_seconds': i * 3 + 2.5,
            'character_name': d['character_name'],
            'text': d['dialogue_text'],
        } for i, d in enumerate(dialogues)]
        srt = generate_srt(parsed)
        response = HttpResponse(srt, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="scene_{scene.scene_number}.srt"'
        return response
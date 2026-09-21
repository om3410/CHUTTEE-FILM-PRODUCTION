from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum

from apps.production.models import (
    BudgetTransaction, ProductionRisk, FestivalSubmission,
    CrewMember, FilmProject, ShootDay,
)


class BudgetByCategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = (
            BudgetTransaction.objects
            .values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        result = [
            {'category': row['category'], 'total': float(row['total'] or 0)}
            for row in data
        ]
        return Response(result)


class DailyBurnRateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cumulative = 0.0
        result = []
        for t in BudgetTransaction.objects.all().order_by('transaction_date'):
            amount = float(t.amount or 0)
            cumulative += amount
            result.append({
                'date': str(t.transaction_date) if t.transaction_date else None,
                'daily_spend': round(amount, 2),
                'cumulative_spend': round(cumulative, 2),
            })
        return Response(result)


class BudgetSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        project = FilmProject.objects.first()
        if not project:
            return Response({'error': 'No project found'}, status=404)
        spent = sum(float(t.amount or 0) for t in BudgetTransaction.objects.filter(project=project))
        total = float(project.total_budget or 0)
        return Response({
            'total_budget': total,
            'spent': spent,
            'remaining': total - spent,
            'percent_used': round((spent / total * 100) if total else 0, 2),
        })


class RiskMatrixAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        risks = ProductionRisk.objects.filter(probability__gt=0.6, impact__gt=0.7)
        return Response([{
            'risk_type': r.risk_type,
            'severity': r.severity,
            'probability': float(r.probability or 0),
            'impact': float(r.impact or 0),
            'risk_score': float(r.risk_score or 0),
        } for r in risks])


class FestivalStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        festivals = FestivalSubmission.objects.all().order_by('-selection_probability')
        return Response([{
            'festival_name': f.festival_name,
            'status': f.status,
            'selection_probability': float(f.selection_probability or 0),
            'rank': i + 1,
        } for i, f in enumerate(festivals)])


class CrewAvailabilityAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date = request.query_params.get('date')
        if not date:
            return Response({'error': 'Provide ?date=YYYY-MM-DD'}, status=400)
        busy_ids = ShootDay.objects.filter(shoot_date=date).values_list('crew_present', flat=True)
        available = CrewMember.objects.exclude(id__in=busy_ids)
        return Response(list(available.values('id', 'full_name', 'role')))


class UpcomingFestivalsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        upcoming = FestivalSubmission.objects.filter(
            submission_date__gte=today,
            submission_date__lte=today + timedelta(days=30),
        ).order_by('submission_date')
        return Response(list(upcoming.values('festival_name', 'submission_date', 'status')))
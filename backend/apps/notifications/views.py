from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .tasks import send_email_task, check_budget_threshold


class SendTestEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'email required'}, status=400)
        send_email_task.delay("Test from Chuttee", "Celery is working!", [email])
        return Response({'status': 'queued'})


class RunBudgetCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        check_budget_threshold.delay()
        return Response({'status': 'queued'})
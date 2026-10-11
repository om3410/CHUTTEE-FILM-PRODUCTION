from django.shortcuts import get_object_or_404, render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
import stripe

from .models import Plan
from .serializers import PlanSerializer, SubscriptionSerializer
from .services import create_checkout_session, handle_webhook_event

class PlanListView(APIView):
  permission_classes = [IsAuthenticated]
  def get(self, request):
    return Response(PlanSerializer(Plan.objects.all(), many=True).data)
  
class MySubscriptionView(APIView):
  permission_classes = [IsAuthenticated]
  def get(self, request):
    sub = getattr(request.user, 'subscription', None)
    if not sub:
      return Response({"detail": "No active subscription."}, status=404)
    return Response(SubscriptionSerializer(sub).data)
  
class CreateCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
      plan_id = request.data.get('plan_id')
      plan = get_object_or_404(Plan, id=plan_id)
      session = create_checkout_session(
        request.user,
        plan.id,
        request.data.get('success_url', 'http://localhost:3000/success'),
        request.data.get('cancel_url', 'http://localhost:3000/cancel'),
      )
      return Response({'checkout_url': session.url})

class StripeWebhookView(APIView):
  permission_classes = [AllowAny]
  def post(self, request):
    try:
      event = stripe.Webhook.construct_event(
        request.body,
        request.META.get('HTTP_STRIPE_SIGNATURE'),
        settings.STRIPE_WEBHOOK_SECRET,
      )
      handle_webhook_event(event)
      return Response({"status": "success"})
    except Exception as e:
      return Response({"error": str(e)}, status=400)
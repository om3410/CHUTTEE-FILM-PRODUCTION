from django.urls import path
from .views import PlanListView, MySubscriptionView, CreateCheckoutSessionView, StripeWebhookView

urlpatterns = [
  path('plans/', PlanListView.as_view()),
  path('subscriptions/', MySubscriptionView.as_view()),
  path('create-checkout-session/', CreateCheckoutSessionView.as_view()),
  path('webhook/', StripeWebhookView.as_view()),
]
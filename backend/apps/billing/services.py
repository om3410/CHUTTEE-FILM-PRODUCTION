import stripe
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Plan, Subscription, Payment

User = get_user_model()

def create_checkout_session(user, plan_id, success_url, cancel_url):
  stripe.api_key = settings.STRIPE_SECRET_KEY
  plan = Plan.objects.get(id=plan_id)
  if not plan.stripe_price_id:
    raise ValueError("Plan has no Stripe price ID")
  return stripe.checkout.Session.create(
    customer_email=user.email,
    payment_method_types=['card'],
    line_items=[{'price': plan.stripe_price_id, 'quantity': 1}],
    mode='subscription',
    success_url=success_url,
    cancel_url=cancel_url,
    metadata={'user_id': str(user.id), 'plan_id': str(plan.id)},
  )

def handle_webhook_event(event):
  if event['type'] == 'checkout.session.completed':
    session = event['data']['object']
    user = User.objects.get(id=session['metadata']['user_id'])
    plan = Plan.objects.get(id=session['metadata']['plan_id'])
    Subscription.objects.update_or_create(
      user=user,
      defaults={
        'plan': plan,
        'stripe_subscription_id': session['subscription'],
        'status': 'active',
      },
    )
    Payment.objects.create(
      user=user,
      stripe_payment_intent_id=session.get('payment_intent', ''),
      amount=plan.monthly_price,
      currency='usd',
      status='succeeded',
    )
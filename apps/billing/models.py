from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

class Plan(models.Model):
  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  name = models.CharField(max_length=50, unique=True)
  strip_price_id = models.CharField(max_length=255, blank=True, null=True)
  monthly_price = models.DecimalField(max_digits=10, decimal_places =2)
  max_analytics_per_day = models.IntegerField(default=10)
  max_prediction_per_day = models.IntegerField(default=5)
  has_advanced_analytics = models.BooleanField(default=False)
  has_ultimated_predictions = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)
  
  class Meta:
    db_table = 'billing_plans'
  
  def __str__(self):
    return self.name

class Subscription(models.Model):
  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
  plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
  stripe_subscription_id = models.CharField(max_length=100, blank=True, null=True)
  status = models.CharField(max_length=20, default='inactive')
  start_date = models.DateTimeField(auto_now_add=True)
  end_date = models.DateTimeField(null=True, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  
  class Meta:
    db_table = 'billing_subscriptions'
    
  def __str__(self):
    return f"{self.user.username} - {self.plan.name}"
  
class Payment(models.Model):
  id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  stripe_payment_intent_id = models.CharField(max_length=100, blank=True, null=True)
  amount = models.DecimalField(max_digits=10, decimal_places=2)
  currency = models.CharField(max_length=10, default='usd')
  status = models.CharField(max_length=20)
  payment_date = models.DateTimeField(auto_now_add=True)

  class Meta:
    db_table = 'billing_payments'
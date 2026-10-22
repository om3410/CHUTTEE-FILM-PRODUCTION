from rest_framework import serializers
from .models import Plan, Subscription, Payment

class PlanSerializer(serializers.ModelSerializer):
  class Meta:
    model = Plan
    fields = '__all__'
  
class SubscriptionSerializer(serializers.ModelSerializer):
  class Meta:
    model = Plan
    fields = ['id', 'plan', 'plan_details', 'status', 'start_date', 'end_date']
  

class PaymentSerializer(serializers.ModelSerializer):
  class Meta:
    model = Payment
    fields = '__all__'
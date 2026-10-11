from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.production.models import BudgetTransaction
from .tasks import send_email_task


@receiver(post_save, sender=BudgetTransaction)
def alert_on_large_transaction(sender, instance, created, **kwargs):
    if created and instance.amount and float(instance.amount) > 50000:
        send_email_task.delay(
            subject="[Chuttee] Large Budget Transaction",
            message=f"New spend: Rs.{instance.amount} in category {instance.category}.",
            recipient_list=["omrewaskar4@gmail.com"],
        )
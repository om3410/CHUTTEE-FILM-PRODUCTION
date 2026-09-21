from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from apps.production.models import BudgetTransaction


@shared_task
def send_email_task(subject, message, recipient_list):
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        recipient_list,
        fail_silently=False,
    )
    return f"Sent to {recipient_list}"


@shared_task
def check_budget_threshold():
    big = BudgetTransaction.objects.filter(amount__gt=100000)
    for t in big:
        send_email_task.delay(
            "Budget Alert",
            f"Large spend detected: {t.amount} in {t.category}",
            [settings.DEFAULT_FROM_EMAIL],
        )
    return f"Processed {big.count()} large transactions"
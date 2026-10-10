from django.core.mail import send_mail
from django.conf import settings

def send_email(subject, message, recipient_list, html_message=None):
    """Send email via SMTP (Gmail)."""
    return send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False,
    )
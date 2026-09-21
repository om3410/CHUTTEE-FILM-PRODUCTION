"""
Email helpers for the authentication app.

Sends:
  - Admin notification when a new user registers
  - Welcome email to the new user

Uses Django's configured SMTP backend (Gmail via .env).
"""
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def _get_admin_recipient():
    """Read ADMIN_NOTIFICATION_EMAIL from settings, with a safe fallback."""
    return getattr(
        settings,
        'ADMIN_NOTIFICATION_EMAIL',
        settings.EMAIL_HOST_USER,
    )


def send_admin_registration_notification(user):
    """
    Send an HTML + plain-text notification to the admin when a
    new user registers.

    Never raises — logs errors instead so registration never fails
    because of email problems.
    """
    try:
        subject = f"New Registration: {user.username}"

        context = {
            'user': user,
            'username': user.username,
            'email': user.email,
            'full_name': (f"{user.first_name} {user.last_name}").strip() or '-',
            'phone': getattr(user, 'phone', '-'),
            'role': getattr(user, 'role', '-'),
            'date_joined': user.date_joined,
            'admin_url': (
                f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}"
                f"/admin/authentication/user/{user.pk}/change/"
            ),
        }

        html_body = render_to_string('emails/new_registration.html', context)
        text_body = strip_tags(html_body)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[_get_admin_recipient()],
            reply_to=[user.email] if user.email else None,
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)

        logger.info("Admin notification sent for user %s", user.username)
        return True

    except Exception:
        logger.exception(
            "Failed to send admin notification for user %s", user.username
        )
        return False


def send_welcome_email(user):
    """
    Send a welcome email to the new user.
    Never raises — logs errors instead.
    """
    if not getattr(user, 'email', None):
        return False

    try:
        subject = "Welcome to Chuttee Film Production"

        context = {
            'user': user,
            'username': user.username,
            'first_name': user.first_name or user.username,
            'login_url': (
                f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')}"
                "/login"
            ),
        }

        html_body = render_to_string('emails/welcome.html', context)
        text_body = strip_tags(html_body)

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)

        logger.info("Welcome email sent to %s", user.email)
        return True

    except Exception:
        logger.exception("Failed to send welcome email to %s", user.email)
        return False


def notify_new_registration(user):
    """
    Convenience: send both admin notification and user welcome email.
    Call this from registration views.
    """
    send_admin_registration_notification(user)
    send_welcome_email(user)
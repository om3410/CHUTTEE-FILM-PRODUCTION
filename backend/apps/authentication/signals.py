from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserSecurity


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_security(sender, instance, created, **kwargs):
    if created:
        UserSecurity.objects.get_or_create(user=instance)

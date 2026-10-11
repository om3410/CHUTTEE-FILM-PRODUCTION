import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model

P, F = "PASS", "FAIL"
errors = 0


def check(label, condition, detail=""):
    global errors
    if not condition:
        errors += 1
    print(f"[{P if condition else F}] {label:45} {detail}")


print("\n=== SETTINGS ===")
check("SECRET_KEY length = 50", len(settings.SECRET_KEY) == 50, len(settings.SECRET_KEY))
check("EMAIL_HOST_USER set", bool(settings.EMAIL_HOST_USER), settings.EMAIL_HOST_USER)
check("EMAIL_HOST_PASSWORD len = 16",
      len(settings.EMAIL_HOST_PASSWORD or "") == 16,
      len(settings.EMAIL_HOST_PASSWORD or ""))
check("ADMIN_NOTIFICATION_EMAIL", bool(getattr(settings, "ADMIN_NOTIFICATION_EMAIL", None)))

print("\n=== DATABASE ===")
from django.db import connection
try:
    connection.ensure_connection()
    check("DB connection", True, connection.settings_dict['NAME'])
except Exception as e:
    check("DB connection", False, str(e)[:50])

print("\n=== AUTH ===")
User = get_user_model()
check("Custom User model", User.__module__.startswith("apps."), User.__module__)
check("Superuser exists", User.objects.filter(is_superuser=True).exists(),
      User.objects.filter(is_superuser=True).count())
check("Total users", True, User.objects.count())

print("\n=== EMAIL TEMPLATES ===")
from django.template.loader import get_template
for t in ["emails/new_registration.html", "emails/new_registration.txt",
          "emails/welcome.html", "emails/welcome.txt"]:
    try:
        get_template(t)
        check(f"template {t}", True)
    except Exception as e:
        check(f"template {t}", False, str(e)[:40])

print("\n=== URLS ===")
from django.urls import reverse, NoReverseMatch
for name in ["home", "register", "login", "logout"]:
    try:
        check(f"url {name}", True, reverse(name))
    except NoReverseMatch:
        check(f"url {name}", False, "NOT FOUND")

print("\n=== EMAIL HELPER ===")
try:
    from apps.authentication.emails import notify_new_registration
    check("notify_new_registration", True)
except Exception as e:
    check("notify_new_registration", False, str(e)[:50])

print("\n=== VIEWS ===")
from apps.authentication import views
import inspect
src = inspect.getsource(views)
check("RegisterView calls notify", "notify_new_registration" in src)
check("RegisterAPIView has perform_create", "perform_create" in src)

print("\n" + "=" * 55)
print(f"RESULT: {'ALL PASSED' if errors == 0 else f'{errors} FAILED'}")
print("=" * 55)
sys.exit(0 if errors == 0 else 1)
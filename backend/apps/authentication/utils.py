from datetime import timedelta

from django.utils import timezone

NEW_DEVICE_LOOKBACK_DAYS = 30


def get_client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def user_agent_summary(request):
    return (request.META.get("HTTP_USER_AGENT", "") or "")[:1000]


def assess_login_risk(user, device_id, ip_address, country=""):
    from .models import DeviceSession

    reasons = []
    risk = DeviceSession.RISK_LOW

    qs = DeviceSession.objects.filter(user=user)
    if not qs.exists():
        return risk, reasons

    cutoff = timezone.now() - timedelta(days=NEW_DEVICE_LOOKBACK_DAYS)
    recent = qs.filter(created_at__gte=cutoff)

    if device_id and not recent.filter(device_id=device_id).exists():
        reasons.append("new_device")
        risk = DeviceSession.RISK_MEDIUM

    if ip_address and not recent.filter(ip_address=ip_address).exists():
        reasons.append("new_ip")
        if risk == DeviceSession.RISK_LOW:
            risk = DeviceSession.RISK_MEDIUM

    if country and not recent.filter(country=country).exists():
        reasons.append("new_country")
        risk = DeviceSession.RISK_MEDIUM

    if len(reasons) >= 2:
        risk = DeviceSession.RISK_HIGH

    return risk, reasons


def blacklist_refresh_token(token_str):
    from rest_framework_simplejwt.tokens import RefreshToken
    from rest_framework_simplejwt.token_blacklist.models import (
        BlacklistedToken,
        OutstandingToken,
    )

    try:
        token = RefreshToken(token_str)
    except Exception:
        return False

    jti = token.get("jti")
    if not jti:
        return False

    ot, _ = OutstandingToken.objects.get_or_create(
        jti=jti,
        defaults={
            "user_id": token.get("user_id"),
            "created_at": token.current_time,
            "expires_at": None,
            "token": token_str,
        },
    )
    BlacklistedToken.objects.get_or_create(token=ot)
    return True


def revoke_all_user_sessions(user, reason="logout_all"):
    from rest_framework_simplejwt.token_blacklist.models import (
        BlacklistedToken,
        OutstandingToken,
    )
    from .models import DeviceSession, UserSecurity

    now = timezone.now()
    DeviceSession.objects.filter(user=user, is_active=True).update(
        is_active=False, revoked_at=now, revoked_reason=reason
    )

    security, _ = UserSecurity.objects.get_or_create(user=user)
    security.bump_version()

    for ot in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=ot)

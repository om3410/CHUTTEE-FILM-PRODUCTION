from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed

from .models import DeviceSession


class SessionAwareJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)

        security = getattr(user, "security", None)
        tv_claim = validated_token.get("token_version")
        if security is None or tv_claim is None or int(tv_claim) != security.token_version:
            raise AuthenticationFailed("Token revoked.", code="token_revoked")

        session_id = validated_token.get("session_id")
        if session_id:
            sess = DeviceSession.objects.filter(
                session_id=session_id, user=user
            ).only("is_active").first()
            if sess is None or not sess.is_active:
                raise AuthenticationFailed("Session revoked.", code="session_revoked")

        return user
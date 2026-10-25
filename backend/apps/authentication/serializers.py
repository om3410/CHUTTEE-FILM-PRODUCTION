from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import update_last_login
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import DeviceSession, UserSecurity
from .utils import (
    assess_login_risk,
    blacklist_refresh_token,
    get_client_ip,
    user_agent_summary,
)

User = get_user_model()

GOOGLE_DOMAINS = ("gmail.com", "googlemail.com")


# =========================================================================
# EXISTING SERIALIZERS (unchanged)
# =========================================================================
class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get(User.USERNAME_FIELD)
        if isinstance(username, str) and "@" in username:
            user = User.objects.filter(email__iexact=username).only("username").first()
            if user:
                attrs[User.USERNAME_FIELD] = user.get_username()
        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    """Serializer to return user data including role to React."""
    class Meta:
        model = User
        fields = [
            "id", "username", "email", "role", "is_superuser",
            "first_name", "last_name",
        ]
        read_only_fields = ["id", "username", "role", "is_superuser"]


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for API registration from React."""
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = [
            "username", "email", "password", "password2",
            "first_name", "last_name",
        ]

    def validate_email(self, value):
        domain = value.split("@")[-1].lower()
        if domain not in GOOGLE_DOMAINS:
            raise serializers.ValidationError("Only Google email addresses are allowed.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            role="USER",
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )


class AccountRecoverySerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=1)
    password2 = serializers.CharField(write_only=True, min_length=1)

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords didn't match."})
        return attrs


# =========================================================================
# NEW: JWT login / refresh / device session serializers
# =========================================================================
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    device_id = serializers.CharField(required=False, allow_blank=True, default="")
    device_name = serializers.CharField(required=False, allow_blank=True, default="")
    country = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        request = self.context.get("request")
        user = authenticate(
            request=request,
            username=attrs["username"],
            password=attrs["password"],
        )
        if user is None or not user.is_active:
            raise AuthenticationFailed(
                "Invalid credentials.", code="no_active_account"
            )

        if jwt_settings.UPDATE_LAST_LOGIN:
            update_last_login(None, user)

        ip = get_client_ip(request) if request else None
        ua = user_agent_summary(request) if request else ""

        risk, reasons = assess_login_risk(
            user=user,
            device_id=attrs.get("device_id", ""),
            ip_address=ip,
            country=attrs.get("country", ""),
        )

        security, _ = UserSecurity.objects.get_or_create(user=user)

        with transaction.atomic():
            session = DeviceSession.objects.create(
                user=user,
                device_id=attrs.get("device_id", ""),
                device_name=attrs.get("device_name", ""),
                user_agent=ua,
                ip_address=ip,
                country=attrs.get("country", ""),
                risk_level=risk,
            )

            refresh = RefreshToken.for_user(user)
            refresh["session_id"] = str(session.session_id)
            refresh["token_version"] = security.token_version
            refresh["risk_level"] = risk

            access = refresh.access_token

            session.refresh_jti = refresh["jti"]
            session.save(update_fields=["refresh_jti"])

        return {
            "access": str(access),
            "refresh": str(refresh),
            "session_id": str(session.session_id),
            "risk_level": risk,
            "risk_reasons": reasons,
        }


class RefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        try:
            old = RefreshToken(attrs["refresh"])
        except Exception:
            raise serializers.ValidationError(
                {"refresh": "Invalid or expired token."}
            )

        session_id = old.get("session_id")
        if not session_id:
            raise serializers.ValidationError(
                {"refresh": "Missing session claim."}
            )

        session = (
            DeviceSession.objects.select_related("user")
            .filter(session_id=session_id)
            .first()
        )
        if session is None or not session.is_active:
            raise serializers.ValidationError({"refresh": "Session revoked."})

        user = session.user
        security, _ = UserSecurity.objects.get_or_create(user=user)
        if int(old.get("token_version", -1)) != security.token_version:
            raise serializers.ValidationError({"refresh": "Token revoked."})

        # Rotate: blacklist old refresh, issue new one bound to same session.
        blacklist_refresh_token(attrs["refresh"])

        new_refresh = RefreshToken.for_user(user)
        new_refresh["session_id"] = str(session.session_id)
        new_refresh["token_version"] = security.token_version
        new_access = new_refresh.access_token

        session.refresh_jti = new_refresh["jti"]
        session.last_seen_at = timezone.now()
        session.save(update_fields=["refresh_jti", "last_seen_at"])

        return {"access": str(new_access), "refresh": str(new_refresh)}


class DeviceSessionSerializer(serializers.ModelSerializer):
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = DeviceSession
        fields = (
            "id", "session_id", "device_id", "device_name",
            "user_agent", "ip_address", "country", "risk_level",
            "is_active", "is_current", "created_at", "last_seen_at",
            "revoked_at", "revoked_reason",
        )
        read_only_fields = fields

    def get_is_current(self, obj):
        request = self.context.get("request")
        if not request or not request.auth:
            return False
        return str(request.auth.get("session_id")) == str(obj.session_id)
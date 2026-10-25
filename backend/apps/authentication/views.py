import logging

from django.conf import settings
from django.contrib.auth import (
    authenticate, get_user_model, login, logout,
)
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.shortcuts import redirect, render
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .emails import notify_new_registration
from .forms import CustomUserCreationForm, LoginForm
from .models import DeviceSession
from .serializers import (
    AccountRecoverySerializer,
    DeviceSessionSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    RefreshSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .utils import (
    blacklist_refresh_token,
    revoke_all_user_sessions,
)

logger = logging.getLogger(__name__)
User = get_user_model()


# =========================================================================
# HTML VIEWS
# =========================================================================
class HomeView(View):
    def get(self, request):
        return render(request, "home.html")


class RegisterView(View):
    def get(self, request):
        return render(
            request, "registration/register.html",
            {"form": CustomUserCreationForm()},
        )

    def post(self, request):
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            notify_new_registration(user)
            return redirect("home")
        return render(request, "registration/register.html", {"form": form})


class LoginView(View):
    def get(self, request):
        return render(request, "registration/login.html", {"form": LoginForm()})

    def post(self, request):
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect("home")
        return render(request, "registration/login.html", {"form": form})


class LogoutView(View):
    def post(self, request):
        logout(request)
        return redirect("home")

    def get(self, request):
        logout(request)
        return redirect("home")


# =========================================================================
# EXISTING API VIEWS
# =========================================================================
class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def perform_create(self, serializer):
        user = serializer.save()
        notify_new_registration(user)


class AccountRecoveryAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = AccountRecoverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            message = (
                f"Your CHUTTEE username is: {user.get_username()}\n\n"
                f"To reset your password, open this link:\n{reset_url}\n\n"
                "If you did not request account recovery, you can ignore this email."
            )
            try:
                send_mail(
                    "CHUTTEE account recovery",
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception(
                    "Failed to send account recovery email for user %s", user.pk
                )

        return Response(
            {"detail": "If an active account exists for that email, recovery instructions have been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(
                urlsafe_base64_decode(serializer.validated_data["uid"])
            )
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": "This password reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(
            user, serializer.validated_data["token"]
        ):
            return Response(
                {"detail": "This password reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(serializer.validated_data["password"], user=user)
        except ValidationError as error:
            return Response(
                {"password": list(error.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])
        return Response(
            {"detail": "Your password has been reset. You can now sign in."},
            status=status.HTTP_200_OK,
        )


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


# =========================================================================
# SESSION-BASED (HTML flow)
# =========================================================================
@method_decorator(csrf_exempt, name="dispatch")
class SessionLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        user = authenticate(
            request,
            username=request.data.get("username"),
            password=request.data.get("password"),
        )
        if user:
            login(request, user)
            return Response(
                {"detail": "Logged in", "user": UserSerializer(user).data}
            )
        return Response(
            {"detail": "Invalid credentials"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@method_decorator(csrf_exempt, name="dispatch")
class SessionLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out"})


# =========================================================================
# JWT ENDPOINTS
# =========================================================================
@method_decorator(csrf_exempt, name="dispatch")
class JWTLoginView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class JWTRefreshView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_scope = "refresh"

    def post(self, request):
        serializer = RefreshSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class JWTLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response({"detail": "refresh required."}, status=400)

        blacklist_refresh_token(refresh)

        session_id = request.auth.get("session_id") if request.auth else None
        if session_id:
            DeviceSession.objects.filter(
                session_id=session_id, user=request.user, is_active=True
            ).update(
                is_active=False,
                revoked_at=timezone.now(),
                revoked_reason="logout",
            )
        return Response({"detail": "Logged out."}, status=200)


class JWTLogoutAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        revoke_all_user_sessions(request.user, reason="logout_all")
        return Response({"detail": "All sessions revoked."}, status=200)


class SessionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = DeviceSession.objects.filter(user=request.user).order_by("-last_seen_at")
        return Response(
            DeviceSessionSerializer(
                qs, many=True, context={"request": request}
            ).data,
            status=200,
        )


class SessionRevokeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        session = DeviceSession.objects.filter(
            session_id=session_id, user=request.user, is_active=True
        ).first()
        if session is None:
            return Response({"detail": "Session not found."}, status=404)
        session.revoke(reason="user_revoked")
        return Response({"detail": "Session revoked."}, status=200)

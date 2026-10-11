import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views import View
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import AccountRecoverySerializer, PasswordResetConfirmSerializer, UserSerializer, RegisterSerializer
from .forms import CustomUserCreationForm, LoginForm
from .emails import notify_new_registration

logger = logging.getLogger(__name__)
User = get_user_model()

# HTML Views
class HomeView(View):
    def get(self, request):
        return render(request, 'home.html')

class RegisterView(View):
    def get(self, request):
        return render(request, 'registration/register.html', {'form': CustomUserCreationForm()})

    def post(self, request):
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            notify_new_registration(user)
            return redirect('home')
        return render(request, 'registration/register.html', {'form': form})

class LoginView(View):
    def get(self, request):
        return render(request, 'registration/login.html', {'form': LoginForm()})

    def post(self, request):
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect('home')
        return render(request, 'registration/login.html', {'form': form})

class LogoutView(View):
    def post(self, request):
        logout(request)
        return redirect('login')

    def get(self, request):
        # Fallback for browsers that still link to GET /logout/.
        # Consider removing once the frontend switches to POST.
        logout(request)
        return redirect('login')

class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        notify_new_registration(user)

class AccountRecoveryAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AccountRecoverySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
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
                    'CHUTTEE account recovery',
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
            except Exception:
                logger.exception("Failed to send account recovery email for user %s", user.pk)

        return Response({
            'detail': 'If an active account exists for that email, recovery instructions have been sent.',
        }, status=status.HTTP_200_OK)

class PasswordResetConfirmAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_id = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'detail': 'This password reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, serializer.validated_data['token']):
            return Response({'detail': 'This password reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(serializer.validated_data['password'], user=user)
        except ValidationError as error:
            return Response({'password': list(error.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['password'])
        user.save(update_fields=['password'])
        return Response({'detail': 'Your password has been reset. You can now sign in.'}, status=status.HTTP_200_OK)

class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class SessionLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        user = authenticate(request, username=request.data.get('username'), password=request.data.get('password'))
        if user:
            login(request, user)
            return Response({"detail": "Logged in", "user":UserSerializer(user).data})
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

class SessionLogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out"})
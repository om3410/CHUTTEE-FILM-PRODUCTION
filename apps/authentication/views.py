from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.views import View
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer, RegisterSerializer
from .forms import CustomUserCreationForm, LoginForm
from .emails import notify_new_registration

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

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)

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
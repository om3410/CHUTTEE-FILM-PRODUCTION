from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

GOOGLE_DOMAINS = ('gmail.com', 'googlemail.com')


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get(User.USERNAME_FIELD)
        if isinstance(username, str) and '@' in username:
            user = User.objects.filter(email__iexact=username).only('username').first()
            if user:
                attrs[User.USERNAME_FIELD] = user.get_username()
        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    """Serializer to return user data including role to React."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_superuser', 'first_name', 'last_name']
        read_only_fields = ['id', 'username', 'role', 'is_superuser']


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
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name',
        ]   # 'role' removed — assigned server-side

    def validate_email(self, value):
        domain = value.split('@')[-1].lower()
        if domain not in GOOGLE_DOMAINS:
            raise serializers.ValidationError("Only Google email addresses are allowed.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role='USER',                     # forced — client can't override
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )


class AccountRecoverySerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=1)
    password2 = serializers.CharField(write_only=True, min_length=1)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords didn't match."})
        return attrs
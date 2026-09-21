import pyotp
import qrcode
import io
import base64
from .models import TwoFactorProfile


def get_or_create_2fa(user):
    profile, _ = TwoFactorProfile.objects.get_or_create(
        user=user,
        defaults={'secret': pyotp.random_base32()},
    )
    return profile


def get_qr_code_data_uri(user, issuer='Chuttee'):
    profile = get_or_create_2fa(user)
    uri = pyotp.totp.TOTP(profile.secret).provisioning_uri(
        name=user.username, issuer_name=issuer
    )
    img = qrcode.make(uri)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()


def verify_otp(user, otp):
    profile = get_or_create_2fa(user)
    return pyotp.TOTP(profile.secret).verify(otp, valid_window=1)


def generate_qr_for_text(text):
    img = qrcode.make(text)
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()
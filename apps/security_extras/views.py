from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import (
    get_qr_code_data_uri, verify_otp, generate_qr_for_text,
)
from .models import TwoFactorProfile


class Setup2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        uri = get_qr_code_data_uri(request.user)
        return Response({'qr_code': uri})


class Verify2FAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        otp = request.data.get('otp')
        if not otp:
            return Response({'error': 'otp required'}, status=400)
        if verify_otp(request.user, otp):
            profile = TwoFactorProfile.objects.get(user=request.user)
            profile.is_enabled = True
            profile.save()
            return Response({'status': 'enabled'})
        return Response({'error': 'invalid otp'}, status=400)


class QRCodeTextView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '')
        if not text:
            return Response({'error': 'text required'}, status=400)
        return Response({'qr_code': generate_qr_for_text(text)})
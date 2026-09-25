from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class EquipmentAPITests(APITestCase):
    """
    Equipment is managed=False, so its table isn't created in the test DB.
    These tests exercise the permission layer and the serializer validator,
    both of which run before any DB write — so they work without the table.
    """

    def setUp(self):
        self.crew = User.objects.create_user(
            username='crewuser',
            password='StrongPass!23',
            role='CREW',
        )
        self.normal = User.objects.create_user(
            username='normaluser',
            password='StrongPass!23',
            role='USER',
        )

    def test_anonymous_cannot_list(self):
        resp = self.client.get('/api/production/equipment/')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_cannot_create(self):
        resp = self.client.post('/api/production/equipment/', {})
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_non_crew_cannot_create(self):
        self.client.force_authenticate(self.normal)
        resp = self.client.post('/api/production/equipment/', {})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_superuser_can_bypass_role(self):
        # Superuser with role=USER. Sending an invalid condition_status
        # makes the serializer raise 400 — which proves the permission
        # check passed (otherwise we'd see 403 before validation runs).
        superuser = User.objects.create_user(
            username='superuser',
            password='StrongPass!23',
            role='USER',
            is_superuser=True,
        )
        self.client.force_authenticate(superuser)
        resp = self.client.post('/api/production/equipment/', {
            "condition_status": "Used",
        })
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
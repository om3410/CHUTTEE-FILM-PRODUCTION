from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class AuthTests(APITestCase):
    def setUp(self):
        self.password = "TestPass!23"
        self.user = User.objects.create_user(
            username="authtest",
            email="authtest@example.com",
            password=self.password,
        )

    # ---------- JWT ----------

    def test_jwt_login_success(self):
        resp = self.client.post("/api/token/", {
            "username": "authtest",
            "password": self.password,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)

    def test_jwt_login_bad_password(self):
        resp = self.client.post("/api/token/", {
            "username": "authtest",
            "password": "wrong-password",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    # ---------- Permission layer ----------

    def test_protected_endpoint_requires_auth(self):
        resp = self.client.get("/api/production/equipment/")
        self.assertIn(resp.status_code, (401, 403))

    # ---------- Registration security ----------

    def test_register_cannot_self_assign_crew(self):
        resp = self.client.post("/api/auth/api/register/", {
            "username": "escalator",
            "email": "escalator@gmail.com",     # Google domain required
            "password": "StrongPass!23",
            "password2": "StrongPass!23",
            "role": "CREW",                     # attempt to escalate
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="escalator")
        self.assertEqual(user.role, "USER")
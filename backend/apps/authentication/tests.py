from django.contrib.auth import get_user_model
from django.core import mail
from django.db import connection
from django.db.models.deletion import get_candidate_relations_to_delete
from django.test import TransactionTestCase, override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from unittest.mock import patch

from apps.authentication.models import DeviceSession, UserSecurity
from apps.collaboration.models import AuditLog, Comment

User = get_user_model()


# -------------------------------------------------------------------------
# Existing auth tests (URLs updated to match the current routing)
# -------------------------------------------------------------------------
@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="test@example.com",
    ADMIN_NOTIFICATION_EMAIL="admin@example.com",
    FRONTEND_URL="https://chuttee.example.com",
)
class AuthTests(APITestCase):
    def setUp(self):
        self.password = "TestPass!23"
        self.user = User.objects.create_user(
            username="authtest",
            email="authtest@example.com",
            password=self.password,
        )
        # Signal should create this automatically; belt-and-braces:
        UserSecurity.objects.get_or_create(user=self.user)

    # ---------- JWT login (new endpoint) ----------

    def test_jwt_login_success(self):
        resp = self.client.post(
            "/login/",
            {"username": "authtest", "password": self.password,
             "device_id": "test-dev", "device_name": "TestSuite"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertIn("session_id", resp.data)

    def test_jwt_login_bad_password(self):
        resp = self.client.post(
            "/login/",
            {"username": "authtest", "password": "wrong-password"},
            format="json",
        )
        self.assertIn(resp.status_code, (401, 403))

    def test_me_includes_read_only_superuser_status(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_superuser"])

        self.user.is_superuser = True
        self.user.save(update_fields=["is_superuser"])
        response = self.client.get("/me/")
        self.assertTrue(response.data["is_superuser"])

    # ---------- Permission layer ----------

    def test_protected_endpoint_requires_auth(self):
        resp = self.client.get("/api/production/equipment/")
        self.assertIn(resp.status_code, (401, 403))

    # ---------- Registration security ----------

    def test_register_cannot_self_assign_crew(self):
        resp = self.client.post(
            "/register-api/",
            {
                "username": "escalator",
                "email": "escalator@gmail.com",
                "password": "StrongPass!23",
                "password2": "StrongPass!23",
                "role": "CREW",
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="escalator")
        self.assertEqual(user.role, "USER")

        welcome_email = next(
            message for message in mail.outbox if message.to == [user.email]
        )
        self.assertEqual(welcome_email.subject, "Your CHUTTEE account is ready")
        self.assertIn("https://chuttee.example.com/login", welcome_email.body)
        self.assertEqual(len(welcome_email.alternatives), 1)
        self.assertIn(
            "Registration successful",
            welcome_email.alternatives[0][0],
        )


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="test@example.com",
    FRONTEND_URL="http://localhost:5173",
)
class AccountRecoveryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="recoveryuser",
            email="recovery@example.com",
            password="TestPass!23",
        )

    def test_recovery_sends_username_and_password_reset_link(self):
        response = self.client.post(
            "/account-recovery/",
            {"email": self.user.email.upper()},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.username, mail.outbox[0].body)
        self.assertIn("/reset-password/", mail.outbox[0].body)

        reset_link = mail.outbox[0].body.split("http://localhost:5173", 1)[1].split()[0]
        uid, token = reset_link.strip("/").split("/")[-2:]
        reset_response = self.client.post(
            "/password-reset/confirm/",
            {
                "uid": uid,
                "token": token,
                "password": "NewStrongPass!456",
                "password2": "NewStrongPass!456",
            },
            format="json",
        )

        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewStrongPass!456"))

    def test_recovery_response_does_not_disclose_unknown_email(self):
        response = self.client.post(
            "/account-recovery/",
            {"email": "unknown@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["detail"],
            "If an active account exists for that email, recovery instructions have been sent.",
        )
        self.assertEqual(len(mail.outbox), 0)


# -------------------------------------------------------------------------
# NEW: security feature tests
# -------------------------------------------------------------------------
class JWTSecurityFeatureTests(APITestCase):
    """
    Covers:
      - Refresh token rotation + blacklisting of old refresh
      - Token revocation (per-device logout)
      - Force logout-all (token_version bump)
      - Session listing
      - Suspicious login risk detection
    """

    password = "TestPass!23"

    def setUp(self):
        self.user = User.objects.create_user(
            username="sectest",
            email="sectest@example.com",
            password=self.password,
        )
        UserSecurity.objects.get_or_create(user=self.user)

    def _login(self, device_id="dev-A", country=None):
        payload = {
            "username": "sectest",
            "password": self.password,
            "device_id": device_id,
            "device_name": f"Device {device_id}",
        }
        if country is not None:
            payload["country"] = country
        return self.client.post("/login/", payload, format="json")

    # ---- Refresh rotation ----
    def test_refresh_rotation_issues_new_tokens(self):
        r = self._login()
        self.assertEqual(r.status_code, 200)
        old_access = r.data["access"]
        old_refresh = r.data["refresh"]

        r2 = self.client.post(
            "/refresh/", {"refresh": old_refresh}, format="json"
        )
        self.assertEqual(r2.status_code, 200)
        self.assertNotEqual(old_refresh, r2.data["refresh"])
        self.assertNotEqual(old_access, r2.data["access"])

    def test_reusing_old_refresh_is_rejected(self):
        r = self._login()
        old_refresh = r.data["refresh"]

        self.client.post("/refresh/", {"refresh": old_refresh}, format="json")

        reuse = self.client.post(
            "/refresh/", {"refresh": old_refresh}, format="json"
        )
        self.assertNotEqual(reuse.status_code, 200)

    # ---- Per-device logout ----
    def test_logout_revokes_only_current_session(self):
        a = self._login(device_id="dev-A")
        b = self._login(device_id="dev-B")
        self.assertEqual(a.status_code, 200)
        self.assertEqual(b.status_code, 200)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {a.data['access']}")
        out = self.client.post(
            "/logout/",
            {"refresh": a.data["refresh"]},
            format="json",
        )
        self.assertEqual(out.status_code, 200)

        # A's access should now be rejected
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {a.data['access']}")
        self.assertEqual(self.client.get("/me/").status_code, 401)

        # B should still work
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {b.data['access']}")
        self.assertEqual(self.client.get("/me/").status_code, 200)

    # ---- Force logout all ----
    def test_logout_all_invalidates_every_access_token(self):
        a = self._login(device_id="dev-A")
        b = self._login(device_id="dev-B")

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {a.data['access']}")
        out = self.client.post("/logout-all/", {}, format="json")
        self.assertEqual(out.status_code, 200)

        for tok in (a.data["access"], b.data["access"]):
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tok}")
            self.assertEqual(self.client.get("/me/").status_code, 401)

        # token_version should have incremented
        self.user.refresh_from_db()
        self.assertGreaterEqual(self.user.security.token_version, 1)

    # ---- Session listing ----
    def test_sessions_endpoint_returns_active_device(self):
        a = self._login(device_id="dev-A")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {a.data['access']}")
        resp = self.client.get("/sessions/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
        entry = resp.data[0]
        self.assertEqual(entry["device_id"], "dev-A")
        self.assertTrue(entry["is_current"])

    def test_revoke_specific_session(self):
        a = self._login(device_id="dev-A")
        b = self._login(device_id="dev-B")

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {b.data['access']}")
        sessions = self.client.get("/sessions/").data
        target = next(s for s in sessions if s["device_id"] == "dev-A")

        revoke = self.client.post(
            f"/sessions/{target['session_id']}/revoke/", {}, format="json"
        )
        self.assertEqual(revoke.status_code, 200)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {a.data['access']}")
        self.assertEqual(self.client.get("/me/").status_code, 401)

    # ---- Suspicious login detection ----
    def test_new_device_and_country_flagged_high(self):
        # first login ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â baselines the device
        self._login(device_id="dev-A", country="IN")

        # second login from brand-new device + country
        r = self._login(device_id="dev-Z", country="US")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["risk_level"], "high")
        self.assertIn("new_device", r.data["risk_reasons"])
        self.assertIn("new_country", r.data["risk_reasons"])

    def test_same_device_is_low_risk(self):
        self._login(device_id="dev-A", country="IN")
        r = self._login(device_id="dev-A", country="IN")
        self.assertEqual(r.data["risk_level"], "low")
        self.assertEqual(r.data["risk_reasons"], [])


# -------------------------------------------------------------------------
# Existing transaction test (unchanged)
# -------------------------------------------------------------------------

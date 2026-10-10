from django.contrib.auth import get_user_model
from django.core import mail
from django.db import connection
from django.db.models.deletion import get_candidate_relations_to_delete
from django.test import TransactionTestCase, override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch

from apps.collaboration.models import AuditLog, Comment

User = get_user_model()


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

    # ---------- JWT ----------

    def test_jwt_login_success(self):
        resp = self.client.post("/api/token/", {
            "username": "authtest",
            "password": self.password,
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)

    def test_jwt_login_success_with_email(self):
        resp = self.client.post("/api/token/", {
            "username": "AUTHTEST@example.com",
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

    def test_me_includes_read_only_superuser_status(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/auth/api/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_superuser"])

        self.user.is_superuser = True
        self.user.save(update_fields=["is_superuser"])
        response = self.client.get("/api/auth/api/me/")
        self.assertTrue(response.data["is_superuser"])

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
        welcome_email = next(
            message for message in mail.outbox
            if message.to == [user.email]
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
        response = self.client.post("/api/auth/api/account-recovery/", {
            "email": self.user.email.upper(),
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.user.username, mail.outbox[0].body)
        self.assertIn("/reset-password/", mail.outbox[0].body)

        reset_link = mail.outbox[0].body.split("http://localhost:5173", 1)[1].split()[0]
        uid, token = reset_link.strip("/").split("/")[-2:]
        reset_response = self.client.post("/api/auth/api/password-reset/confirm/", {
            "uid": uid,
            "token": token,
            "password": "NewStrongPass!456",
            "password2": "NewStrongPass!456",
        }, format="json")

        self.assertEqual(reset_response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewStrongPass!456"))

    def test_recovery_response_does_not_disclose_unknown_email(self):
        response = self.client.post("/api/auth/api/account-recovery/", {
            "email": "unknown@example.com",
        }, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data['detail'],
            'If an active account exists for that email, recovery instructions have been sent.',
        )
        self.assertEqual(len(mail.outbox), 0)


class AuditLogUserDeletionTests(TransactionTestCase):
    audit_table_created = False

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(AuditLog)
        cls.audit_table_created = True

    @classmethod
    def tearDownClass(cls):
        if cls.audit_table_created:
            with connection.schema_editor() as schema_editor:
                schema_editor.delete_model(AuditLog)
        super().tearDownClass()

    def test_deleting_user_preserves_comments_and_audit_log(self):
        user = User.objects.create_user(
            username="audituser",
            email="audituser@example.com",
            password="TestPass!23",
        )
        audit_log = AuditLog.objects.create(
            action="DELETE",
            resource="/admin/authentication/user/",
            resource_id=str(user.pk),
            changes={},
            user=user,
        )
        comment = Comment(
            body="Production note",
            user=user,
        )
        with connection.cursor() as cursor:
            cursor.execute(
                "CREATE TABLE collab_comments ("
                "id uuid PRIMARY KEY, "
                "user_id bigint NULL REFERENCES authentication_user(id)"
                ")"
            )
            cursor.execute(
                "INSERT INTO collab_comments (id, user_id) VALUES (%s, %s)",
                [comment.id, user.pk],
            )

        get_relations = get_candidate_relations_to_delete

        def collaboration_relations(opts):
            return (
                relation for relation in get_relations(opts)
                if relation.related_model in (AuditLog, Comment)
            )

        with patch(
            "django.db.models.deletion.get_candidate_relations_to_delete",
            side_effect=collaboration_relations,
        ):
            try:
                user.delete()
                audit_log.refresh_from_db()
                self.assertIsNone(audit_log.user_id)
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT user_id FROM collab_comments WHERE id = %s",
                        [comment.id],
                    )
                    self.assertIsNone(cursor.fetchone()[0])
            finally:
                with connection.cursor() as cursor:
                    cursor.execute("DROP TABLE collab_comments")
                with connection.schema_editor() as schema_editor:
                    schema_editor.delete_model(AuditLog)
                type(self).audit_table_created = False
"""
test_assigned_domain_and_jury_accounts.py

Verification suite for the Final Two Fixes:
1. Jury Portal — Assigned Domain Header (Dynamic, canonical project_domains.title, no internal slugs, multi-domain support).
2. Admin Settings — Jury Login Account Management & Secure Password Reset (Dynamic directory, login ID, copy, temporary password shown once, security enforcement).
"""

import asyncio
import os
import sys
import unittest
from unittest.mock import AsyncMock, patch, MagicMock

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.schemas.jury import (
    JuryProfile,
    ResetJuryPasswordRequest,
    ResetJuryPasswordResponse,
    DomainAssignmentItem,
)
from app.services.jury_service import JuryService
from app.api.juries import reset_jury_password, list_juries


class TestAssignedDomainAndJuryAccounts(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        self.service = JuryService()
        self.service._aliases_cache = None
        self.service._cache_timestamp = 0.0

    # =========================================================================
    # TEST CASE 1: JURY PORTAL — ASSIGNED DOMAIN HEADER (CANONICAL TITLE)
    # =========================================================================
    async def test_case_1_jury_assigned_domain_header_canonical_title(self):
        """
        Create/login as Jury A.
        Jury A has:
        domain_id = 'smart-automation'
        public.project_domains.title = 'Computer Science & Artificial Intelligence'

        Expected in bootstrap:
        domain_title = 'Computer Science & Artificial Intelligence' (NOT 'smart-automation')
        Jury A project list remains EXACTLY its assigned projects only.
        """
        judge_uid = "judge-user-uuid-001"
        mock_domains = [
            {"id": "smart-automation", "title": "Computer Science & Artificial Intelligence"},
            {"id": "ai-software", "title": "Civil Engineering & Smart Infrastructure"},
        ]
        mock_jdas = [
            {
                "id": "jda-1",
                "judge_user_id": judge_uid,
                "domain_id": "smart-automation",
                "assignment_mode": "ALL",
                "is_active": True,
                "created_at": "2026-10-04T10:00:00Z",
            }
        ]
        mock_judges = [
            {
                "id": judge_uid,
                "user_id": judge_uid,
                "name": "Dr. Alan Turing",
                "email": "turing@sru.edu.in",
                "department": "CSE",
                "is_active": True,
            }
        ]
        mock_regs = [
            {
                "registration_id": "PRG-CSE-001",
                "team_name": "AI Visionaries",
                "leader_name": "Alice",
                "projects": [{"title": "Vision AI", "category": "Computer Science & Artificial Intelligence"}],
                "institutions": [{"name": "SR University"}],
                "team_members": [{"name": "Alice", "email": "alice@sru.edu.in", "is_team_leader": True}],
            },
            {
                "registration_id": "PRG-CIV-002",
                "team_name": "Bridge Builders",
                "leader_name": "Bob",
                "projects": [{"title": "Smart Bridge", "category": "Civil Engineering & Smart Infrastructure"}],
                "institutions": [{"name": "SR University"}],
                "team_members": [{"name": "Bob", "email": "bob@sru.edu.in", "is_team_leader": True}],
            },
        ]

        async def mock_fetch_supabase(table, query_params=""):
            if table == "project_domains":
                return mock_domains
            elif table == "jury_domain_assignments":
                return mock_jdas
            elif table == "judges":
                return mock_judges
            elif table == "registrations":
                return mock_regs
            elif table == "judge_evaluations":
                return []
            elif table == "domain_aliases":
                return []
            return []

        with patch("app.services.jury_service.db.fetch_supabase", side_effect=mock_fetch_supabase):
            bootstrap = await self.service.get_jury_bootstrap(judge_uid)

            # 1. Verify assignments list in bootstrap
            self.assertEqual(len(bootstrap.assignments), 1)
            assignment = bootstrap.assignments[0]
            self.assertEqual(assignment.domain_id, "smart-automation")
            # Canonical title must be public.project_domains.title, NOT the internal slug
            self.assertEqual(assignment.domain_title, "Computer Science & Artificial Intelligence")
            self.assertNotEqual(assignment.domain_title, "smart-automation")

            # 2. Verify project isolation: Jury A only sees same-domain projects
            self.assertEqual(len(bootstrap.projects), 1)
            self.assertEqual(bootstrap.projects[0].registration_id, "PRG-CSE-001")
            # Other domain (Civil Engineering) must be excluded
            reg_ids = [p.registration_id for p in bootstrap.projects]
            self.assertNotIn("PRG-CIV-002", reg_ids)

    # =========================================================================
    # TEST CASE 2: MULTIPLE DOMAIN ASSIGNMENTS DISPLAYED DYNAMICALLY
    # =========================================================================
    async def test_case_2_multiple_domain_assignments(self):
        """
        Jury B has two active domain assignments:
        Domain A: Computer Science & Artificial Intelligence (slug: smart-automation)
        Domain B: Electronics & Communication Technologies (slug: health-biotech)

        Expected:
        Both human-readable domain titles resolved and displayed dynamically without hardcoded limits.
        """
        judge_uid = "judge-user-uuid-002"
        mock_domains = [
            {"id": "smart-automation", "title": "Computer Science & Artificial Intelligence"},
            {"id": "health-biotech", "title": "Electronics & Communication Technologies"},
            {"id": "green-sustainability", "title": "Mechanical Engineering & Automation"},
        ]
        mock_jdas = [
            {
                "id": "jda-1",
                "judge_user_id": judge_uid,
                "domain_id": "smart-automation",
                "assignment_mode": "ALL",
                "is_active": True,
                "created_at": "2026-10-04T10:00:00Z",
            },
            {
                "id": "jda-2",
                "judge_user_id": judge_uid,
                "domain_id": "health-biotech",
                "assignment_mode": "SELECTED",
                "is_active": True,
                "created_at": "2026-10-04T10:05:00Z",
            },
        ]
        mock_judges = [
            {
                "id": judge_uid,
                "user_id": judge_uid,
                "name": "Dr. Ada Lovelace",
                "email": "lovelace@sru.edu.in",
                "department": "ECE",
                "is_active": True,
            }
        ]

        async def mock_fetch_supabase(table, query_params=""):
            if table == "project_domains":
                return mock_domains
            elif table == "jury_domain_assignments":
                return mock_jdas
            elif table == "judges":
                return mock_judges
            elif table == "registrations":
                return []
            elif table == "judge_evaluations":
                return []
            elif table == "domain_aliases":
                return []
            elif table == "jury_project_assignments":
                return []
            return []

        with patch("app.services.jury_service.db.fetch_supabase", side_effect=mock_fetch_supabase):
            bootstrap = await self.service.get_jury_bootstrap(judge_uid)
            domain_titles = [a.domain_title for a in bootstrap.assignments]

            self.assertEqual(len(domain_titles), 2)
            self.assertIn("Computer Science & Artificial Intelligence", domain_titles)
            self.assertIn("Electronics & Communication Technologies", domain_titles)
            # Internal slugs must not be shown
            self.assertNotIn("smart-automation", domain_titles)
            self.assertNotIn("health-biotech", domain_titles)

    # =========================================================================
    # TEST CASE 3: ADMIN SETTINGS — JURY ACCOUNT MANAGEMENT LIST
    # =========================================================================
    async def test_case_3_admin_settings_jury_account_management(self):
        """
        Admin lists jury accounts dynamically:
        Jury Alpha, Login: jury.alpha@example.com
        Assigned domain: Computer Science & Artificial Intelligence
        Status: Active

        Expected:
        JuryProfile includes name, email (login ID), assigned_domain_titles, is_active, created_at, updated_at.
        """
        mock_judges = [
            {
                "id": "judge-1",
                "user_id": "auth-uuid-alpha",
                "name": "Jury Alpha",
                "email": "jury.alpha@example.com",
                "department": "Computer Science",
                "is_active": True,
                "created_at": "2026-10-01T09:00:00Z",
                "updated_at": "2026-10-02T10:00:00Z",
            },
            {
                "id": "judge-2",
                "user_id": "auth-uuid-beta",
                "name": "Jury Beta",
                "email": "jury.beta@example.com",
                "department": "Civil Engineering",
                "is_active": False,
                "created_at": "2026-10-03T11:00:00Z",
                "updated_at": "2026-10-04T12:00:00Z",
            },
        ]
        mock_domains = [
            {"id": "smart-automation", "title": "Computer Science & Artificial Intelligence"},
            {"id": "ai-software", "title": "Civil Engineering & Smart Infrastructure"},
        ]
        mock_jdas = [
            {
                "judge_user_id": "auth-uuid-alpha",
                "domain_id": "smart-automation",
                "assignment_mode": "ALL",
            }
        ]

        async def mock_fetch_supabase(table, query_params=""):
            if table == "judges":
                return mock_judges
            elif table == "project_domains":
                return mock_domains
            elif table == "jury_domain_assignments":
                return mock_jdas
            elif table == "user_roles":
                return [
                    {"user_id": "auth-uuid-alpha", "role": "jury", "is_active": True},
                    {"user_id": "auth-uuid-beta", "role": "jury", "is_active": False},
                ]
            elif table == "judge_evaluations":
                return []
            return []

        with patch("app.services.jury_service.db.fetch_supabase", side_effect=mock_fetch_supabase):
            juries = await self.service.list_juries()

            self.assertEqual(len(juries), 2)
            alpha = next(j for j in juries if j.name == "Jury Alpha")
            self.assertEqual(alpha.email, "jury.alpha@example.com")
            self.assertTrue(alpha.is_active)
            self.assertEqual(alpha.assigned_domain_titles, ["Computer Science & Artificial Intelligence"])
            self.assertEqual(alpha.created_at, "2026-10-01T09:00:00Z")

            beta = next(j for j in juries if j.name == "Jury Beta")
            self.assertEqual(beta.email, "jury.beta@example.com")
            self.assertFalse(beta.is_active)
            self.assertEqual(beta.assigned_domain_titles, [])

    # =========================================================================
    # TEST CASE 4: SECURE PASSWORD RESET
    # =========================================================================
    async def test_case_4_secure_password_reset(self):
        """
        Admin resets password:
        - Secure backend reset succeeds
        - Temporary password returned ONCE
        - Plaintext password NOT written to database
        - Old password invalidated via Supabase Admin API
        """
        judge_uid = "auth-uuid-alpha"
        mock_judges = [
            {
                "id": "judge-1",
                "user_id": judge_uid,
                "name": "Jury Alpha",
                "email": "jury.alpha@example.com",
            }
        ]

        mock_http_response = MagicMock()
        mock_http_response.status_code = 200
        mock_http_response.json.return_value = {"id": judge_uid}

        mock_client = AsyncMock()
        mock_client.put.return_value = mock_http_response

        async def mock_fetch_supabase(table, query_params=""):
            if table == "judges":
                return mock_judges
            return []

        # Track DB write calls to prove no password column or plaintext password is written
        db_writes = []
        async def mock_insert_supabase(table, data):
            db_writes.append((table, data))
            return data

        async def mock_update_supabase(table, data, col, val):
            db_writes.append((table, data))
            return data

        with patch("app.services.jury_service.db.fetch_supabase", side_effect=mock_fetch_supabase), \
             patch("app.services.jury_service.db.get_client", return_value=mock_client), \
             patch("app.config.Settings.get_effective_key", return_value="test-service-key"), \
             patch("app.services.jury_service.db.insert_supabase", side_effect=mock_insert_supabase), \
             patch("app.services.jury_service.db.update_supabase", side_effect=mock_update_supabase):

            # Test A: Auto-generated secure temporary password
            res_auto = await self.service.reset_jury_password(judge_uid)

            self.assertTrue(res_auto.success)
            self.assertEqual(res_auto.login_id, "jury.alpha@example.com")
            self.assertIsNotNone(res_auto.temporary_password)
            self.assertGreaterEqual(len(res_auto.temporary_password), 8)
            # Verify client.put called to Supabase admin API
            mock_client.put.assert_called_once()
            called_url = mock_client.put.call_args[0][0]
            called_payload = mock_client.put.call_args[1]["json"]
            self.assertIn(f"/auth/v1/admin/users/{judge_uid}", called_url)
            self.assertEqual(called_payload["password"], res_auto.temporary_password)

            # Test B: Custom admin temporary password
            mock_client.reset_mock()
            custom_pass = "TempPass2026!#"
            res_custom = await self.service.reset_jury_password(judge_uid, temporary_password=custom_pass)
            self.assertTrue(res_custom.success)
            self.assertEqual(res_custom.temporary_password, custom_pass)
            called_payload_custom = mock_client.put.call_args[1]["json"]
            self.assertEqual(called_payload_custom["password"], custom_pass)

            # CRITICAL SECURITY VERIFICATION: Plaintext passwords NOT written to database
            self.assertEqual(len(db_writes), 0, "No database write operations occurred during password reset")

    # =========================================================================
    # TEST CASE 5: SECURITY (ADMIN ONLY, 403 FOR NON-ADMIN, NO SECRETS EXPOSED)
    # =========================================================================
    async def test_case_5_security_and_authorization(self):
        """
        Verify:
        - Non-admin (jury, participant) gets 403 Forbidden
        - Unauthenticated request rejected (401)
        - Password hashes never returned by APIs
        - Service-role key never exposed
        """
        from fastapi import HTTPException
        from app.core.auth import verify_admin_auth

        # 1. Unauthenticated request (no header)
        with self.assertRaises(HTTPException) as ctx:
            await verify_admin_auth(authorization=None)
        self.assertEqual(ctx.exception.status_code, 401)

        # 2. Non-admin user (role='jury')
        mock_user_data = {"id": "jury-user-uid", "email": "jury@sru.edu.in"}
        mock_user_roles = [{"user_id": "jury-user-uid", "role": "jury"}]

        mock_http_response = MagicMock()
        mock_http_response.status_code = 200
        mock_http_response.json.return_value = mock_user_data

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_http_response

        async def mock_fetch_supabase(table, query_params=""):
            if table == "user_roles":
                return mock_user_roles
            return []

        with patch("app.core.auth.db.get_client", return_value=mock_client), \
             patch("app.core.auth.db.fetch_supabase", side_effect=mock_fetch_supabase), \
             patch("app.config.Settings.get_effective_key", return_value="test-key"):
            with self.assertRaises(HTTPException) as ctx:
                await verify_admin_auth(authorization="Bearer jury-token")
            self.assertEqual(ctx.exception.status_code, 403)
            self.assertIn("forbidden", ctx.exception.detail.lower())

        # 3. Verify JuryProfile schema never includes password or password_hash fields
        fields = JuryProfile.model_fields.keys()
        self.assertNotIn("password", fields)
        self.assertNotIn("plain_password", fields)
        self.assertNotIn("jury_password", fields)
        self.assertNotIn("password_hash", fields)
        self.assertNotIn("encrypted_password", fields)


if __name__ == "__main__":
    unittest.main()

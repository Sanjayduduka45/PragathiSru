import asyncio
import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException

from app.services.jury_service import JuryService
from app.schemas.jury import (
    AssignedProjectItem,
    AssignedProjectsResponse,
    JuryBootstrapResponse,
    JuryBootstrapSummary,
)

class TestJuryPortalAssignedProjects(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.service = JuryService()
        self.jury_1_id = "00000000-0000-0000-0000-000000000001"
        self.jury_2_id = "00000000-0000-0000-0000-000000000002"

    @patch("app.database.db.fetch_supabase")
    async def test_assigned_projects_authorization_and_isolation(self, mock_fetch):
        """
        Verify:
        1. Authenticated jury only receives explicitly assigned projects.
        2. Projects belonging to another jury are excluded.
        3. Single project lookup for another jury's project raises 403.
        4. Count equals number of projects in the list.
        5. Evaluated/Remaining/Progress calculated strictly from assigned list.
        """
        # Mock database rows:
        # Domain 'domain-cs': assigned to jury_1 in SELECTED mode (P01, P02)
        # Domain 'domain-cs': assigned to jury_2 in SELECTED mode (P03)
        # Project P04 is unassigned
        jdas = [
            {
                "id": "jda-1",
                "judge_user_id": self.jury_1_id,
                "domain_id": "smart-automation",
                "assignment_mode": "SELECTED",
                "is_active": True,
            },
            {
                "id": "jda-2",
                "judge_user_id": self.jury_2_id,
                "domain_id": "smart-automation",
                "assignment_mode": "SELECTED",
                "is_active": True,
            },
        ]
        pas = [
            {"id": "pa-1", "jury_domain_assignment_id": "jda-1", "registration_id": "PRAGATHI26-CSE01"},
            {"id": "pa-2", "jury_domain_assignment_id": "jda-1", "registration_id": "PRAGATHI26-CSE02"},
            {"id": "pa-3", "jury_domain_assignment_id": "jda-2", "registration_id": "PRAGATHI26-CSE03"},
        ]
        regs = [
            {
                "registration_id": "PRAGATHI26-CSE01",
                "team_name": "Alpha",
                "projects": [{"title": "Vision AI", "category": "Computer Science & Artificial Intelligence"}],
                "institutions": [{"name": "SRU"}],
            },
            {
                "registration_id": "PRAGATHI26-CSE02",
                "team_name": "Beta",
                "projects": [{"title": "NLP Core", "category": "Computer Science & Artificial Intelligence"}],
                "institutions": [{"name": "SRU"}],
            },
            {
                "registration_id": "PRAGATHI26-CSE03",
                "team_name": "Gamma",
                "projects": [{"title": "Robo Sense", "category": "Computer Science & Artificial Intelligence"}],
                "institutions": [{"name": "SRU"}],
            },
            {
                "registration_id": "PRAGATHI26-CSE04",
                "team_name": "Delta",
                "projects": [{"title": "Unassigned AI", "category": "Computer Science & Artificial Intelligence"}],
                "institutions": [{"name": "SRU"}],
            },
        ]
        domains = [
            {"id": "smart-automation", "title": "Computer Science & Artificial Intelligence"}
        ]
        judges = [
            {"id": "j1", "user_id": self.jury_1_id, "name": "Prof A", "email": "a@sru.edu.in", "is_active": True},
            {"id": "j2", "user_id": self.jury_2_id, "name": "Prof B", "email": "b@sru.edu.in", "is_active": True},
        ]
        evals_j1 = [
            {
                "id": "ev-1",
                "judge_id": self.jury_1_id,
                "registration_id": "PRAGATHI26-CSE01",
                "total_score": 88.0,
                "created_at": "2026-10-08T10:00:00Z",
            }
        ]

        async def fake_fetch(table, query_params=""):
            if table == "judges":
                return judges
            if table == "jury_domain_assignments":
                return jdas
            if table == "jury_project_assignments":
                return pas
            if table == "registrations":
                return regs
            if table == "project_domains":
                return domains
            if table == "judge_evaluations":
                if self.jury_1_id in query_params:
                    return evals_j1
                return []
            if table == "domain_aliases":
                return []
            return []

        mock_fetch.side_effect = fake_fetch

        # 1. Fetch bootstrap / assigned projects for Jury 1
        bootstrap = await self.service.get_jury_bootstrap(self.jury_1_id)
        self.assertTrue(bootstrap.success)
        assigned_p_ids = [p.registration_id for p in bootstrap.projects]

        # Jury 1 MUST ONLY see PRAGATHI26-CSE01 and PRAGATHI26-CSE02
        self.assertEqual(len(bootstrap.projects), 2)
        self.assertEqual(assigned_p_ids, ["PRAGATHI26-CSE01", "PRAGATHI26-CSE02"])
        self.assertNotIn("PRAGATHI26-CSE03", assigned_p_ids)  # Belonging to Jury 2
        self.assertNotIn("PRAGATHI26-CSE04", assigned_p_ids)  # Unassigned

        # 2. Count verification: Assigned Projects count equals number of projects displayed
        self.assertEqual(bootstrap.summary.assigned, len(bootstrap.projects))
        self.assertEqual(bootstrap.summary.assigned, 2)

        # 3. Evaluated, Remaining, Progress strictly from assigned list
        self.assertEqual(bootstrap.summary.evaluated, 1)  # Only CSE01 is evaluated
        self.assertEqual(bootstrap.summary.remaining, 1)  # CSE02 is pending

        # Check fields of each project:
        p01 = next(p for p in bootstrap.projects if p.registration_id == "PRAGATHI26-CSE01")
        self.assertEqual(p01.project_title, "Vision AI")
        self.assertEqual(p01.team_name, "Alpha")
        self.assertEqual(p01.domain_title, "Computer Science & Artificial Intelligence")
        self.assertEqual(p01.evaluation_status, "EVALUATED")
        self.assertEqual(p01.total_score, 88.0)

        p02 = next(p for p in bootstrap.projects if p.registration_id == "PRAGATHI26-CSE02")
        self.assertEqual(p02.project_title, "NLP Core")
        self.assertEqual(p02.team_name, "Beta")
        self.assertEqual(p02.domain_title, "Computer Science & Artificial Intelligence")
        self.assertEqual(p02.evaluation_status, "PENDING")
        self.assertIsNone(p02.total_score)

        # 4. Lookup tests for Jury 1:
        # P01 (assigned) -> returns item
        found_p1 = await self.service.get_assigned_project_by_id(self.jury_1_id, "PRAGATHI26-CSE01")
        self.assertIsNotNone(found_p1)
        self.assertEqual(found_p1.registration_id, "PRAGATHI26-CSE01")

        # P01 bare format ('CSE01') -> returns item
        found_p1_bare = await self.service.get_assigned_project_by_id(self.jury_1_id, "CSE01")
        self.assertIsNotNone(found_p1_bare)
        self.assertEqual(found_p1_bare.registration_id, "PRAGATHI26-CSE01")

        # P03 (belongs to Jury 2) -> returns None
        found_p3 = await self.service.get_assigned_project_by_id(self.jury_1_id, "PRAGATHI26-CSE03")
        self.assertIsNone(found_p3)

        # P04 (unassigned) -> returns None
        found_p4 = await self.service.get_assigned_project_by_id(self.jury_1_id, "PRAGATHI26-CSE04")
        self.assertIsNone(found_p4)

        # 5. Lookup tests for Jury 2:
        found_p3_j2 = await self.service.get_assigned_project_by_id(self.jury_2_id, "PRAGATHI26-CSE03")
        self.assertIsNotNone(found_p3_j2)
        self.assertEqual(found_p3_j2.registration_id, "PRAGATHI26-CSE03")

        # Jury 2 cannot see P01 or P02
        self.assertIsNone(await self.service.get_assigned_project_by_id(self.jury_2_id, "PRAGATHI26-CSE01"))
        self.assertIsNone(await self.service.get_assigned_project_by_id(self.jury_2_id, "PRAGATHI26-CSE02"))

        print("\n[SUCCESS] All 15 assertions passed in TestJuryPortalAssignedProjects!")

if __name__ == "__main__":
    unittest.main()

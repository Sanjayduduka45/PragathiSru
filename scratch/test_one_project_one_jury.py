"""
scratch/test_one_project_one_jury.py
Authoritative Test for ONE PROJECT = ONE ACTIVE JURY

Test Case:
- Domain X has 10 projects: P01, P02, P03, P04, P05, P06, P07, P08, P09, P10.
- Jury A assigned: P01, P02, P03, P04.
- Candidate list before Jury B assignment:
    Must be P05, P06, P07, P08, P09, P10.
    Must NOT contain P01, P02, P03, P04 (completely excluded).
- Jury B assigned: P05, P06, P07.
- Candidate list for Jury C:
    Must be P08, P09, P10 ONLY.
    Must NOT contain P01, P02, P03, P04, P05, P06, P07.
- Dashboards:
    Jury A = exactly 4 (P01, P02, P03, P04)
    Jury B = exactly 3 (P05, P06, P07)
    Jury C = exactly 3 (P08, P09, P10)
- Intersections:
    A ∩ B = empty
    A ∩ C = empty
    B ∩ C = empty
- Duplicate assignment:
    Try assigning P01 to Jury B while P01 already belongs to Jury A:
    MUST return HTTP 409 Conflict.
"""

import sys
import os
import asyncio
from typing import Dict, List, Any, Optional
from fastapi import HTTPException

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.jury_service import jury_service, JuryService
from app.database import db

passed = 0
failed = 0

def assert_check(condition: bool, description: str):
    global passed, failed
    if condition:
        passed += 1
        print(f"  \033[92m[PASS]\033[0m {description}")
    else:
        failed += 1
        print(f"  \033[91m[FAIL]\033[0m {description}")
        raise AssertionError(f"Test assertion failed: {description}")


class MockDatabaseForOneProjectOneJury:
    """In-memory DB fixture to test the exact 10-project, 3-jury scenario."""
    def __init__(self):
        self.domains = [
            {"id": "domain-x", "title": "Domain X Track"}
        ]
        self.aliases = [
            {"domain_id": "domain-x", "alias_text": "Domain X Track", "is_active": True},
            {"domain_id": "domain-x", "alias_text": "Domain X", "is_active": True},
        ]
        self.judges = [
            {"id": "jury_a_id", "user_id": "jury_a_uid", "name": "Jury A", "email": "jurya@sru.edu.in", "department": "CSE", "is_active": True},
            {"id": "jury_b_id", "user_id": "jury_b_uid", "name": "Jury B", "email": "juryb@sru.edu.in", "department": "ECE", "is_active": True},
            {"id": "jury_c_id", "user_id": "jury_c_uid", "name": "Jury C", "email": "juryc@sru.edu.in", "department": "MECH", "is_active": True},
        ]
        # 10 projects for Domain X: P01 to P10
        self.registrations = [
            {
                "registration_id": f"P{i:02d}",
                "team_name": f"Team {i}",
                "institution_name": "SR University",
                "projects": [{"title": f"Project P{i:02d}", "category": "Domain X Track"}],
                "institutions": [{"name": "SR University"}],
                "team_members": [{"name": f"Lead {i}", "email": f"lead{i}@sru.edu.in", "is_team_leader": True}],
            }
            for i in range(1, 11)
        ]
        self.jdas: List[Dict[str, Any]] = []
        self.pas: List[Dict[str, Any]] = []
        self.evals: List[Dict[str, Any]] = []

    async def fetch_supabase(self, table: str, query_params: str = "") -> Optional[List[Dict[str, Any]]]:
        if table == "project_domains":
            return list(self.domains)
        elif table == "domain_aliases":
            return list(self.aliases)
        elif table == "judges":
            return list(self.judges)
        elif table == "registrations":
            return list(self.registrations)
        elif table == "jury_domain_assignments":
            rows = list(self.jdas)
            if "judge_user_id=eq." in query_params:
                part = query_params.split("judge_user_id=eq.")[1].split("&")[0]
                rows = [r for r in rows if r.get("judge_user_id") == part]
            if "domain_id=eq." in query_params:
                part = query_params.split("domain_id=eq.")[1].split("&")[0]
                rows = [r for r in rows if r.get("domain_id") == part]
            return rows
        elif table == "jury_project_assignments":
            rows = list(self.pas)
            if "jury_domain_assignment_id=eq." in query_params:
                part = query_params.split("jury_domain_assignment_id=eq.")[1].split("&")[0]
                rows = [r for r in rows if r.get("jury_domain_assignment_id") == part]
            elif "jury_domain_assignment_id=in.(" in query_params:
                part = query_params.split("jury_domain_assignment_id=in.(")[1].split(")")[0]
                aids = [a.strip() for a in part.split(",")]
                rows = [r for r in rows if r.get("jury_domain_assignment_id") in aids]
            return rows
        elif table == "judge_evaluations":
            return list(self.evals)
        return []

    async def insert_supabase(self, table: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        row = dict(payload)
        if "id" not in row:
            row["id"] = f"{table}_{len(getattr(self, 'pas' if table == 'jury_project_assignments' else 'jdas')) + 1}"
        if table == "jury_domain_assignments":
            self.jdas.append(row)
        elif table == "jury_project_assignments":
            # Safety uniqueness check
            for existing in self.pas:
                if existing.get("registration_id") == row.get("registration_id"):
                    return None  # Uniqueness violation
            self.pas.append(row)
        elif table == "judge_evaluations":
            self.evals.append(row)
        return row

    async def upsert_supabase(self, table: str, payload: Dict[str, Any], on_conflict: str = "") -> Optional[Dict[str, Any]]:
        if table == "jury_domain_assignments":
            for j in self.jdas:
                if j.get("judge_user_id") == payload.get("judge_user_id") and j.get("domain_id") == payload.get("domain_id"):
                    j.update(payload)
                    return j
            return await self.insert_supabase(table, payload)
        return await self.insert_supabase(table, payload)

    async def update_supabase(self, table: str, eq_column: str, eq_value: str, payload: Dict[str, Any]) -> bool:
        target_list = self.jdas if table == "jury_domain_assignments" else self.pas
        for row in target_list:
            if str(row.get(eq_column)) == str(eq_value):
                row.update(payload)
                return True
        return False

    async def delete_supabase(self, table: str, eq_column: str, eq_value: str) -> bool:
        target_list = self.jdas if table == "jury_domain_assignments" else self.pas
        orig_len = len(target_list)
        target_list[:] = [r for r in target_list if str(r.get(eq_column)) != str(eq_value)]
        return len(target_list) < orig_len


async def run_one_project_one_jury_suite():
    global passed, failed
    passed = 0
    failed = 0

    print("=" * 60)
    print("TEST SUITE: ONE PROJECT = ONE ACTIVE JURY SPECIFICATION")
    print("=" * 60)

    mock_db = MockDatabaseForOneProjectOneJury()
    original_fetch = db.fetch_supabase
    original_insert = db.insert_supabase
    original_upsert = db.upsert_supabase
    original_update = db.update_supabase
    original_delete = db.delete_supabase
    from app.config import settings
    orig_supabase_url = settings.supabase_url
    settings.supabase_url = ""

    db.fetch_supabase = mock_db.fetch_supabase
    db.insert_supabase = mock_db.insert_supabase
    db.upsert_supabase = mock_db.upsert_supabase
    db.update_supabase = mock_db.update_supabase
    db.delete_supabase = mock_db.delete_supabase

    # Reset cache
    jury_service._aliases_cache.clear()
    jury_service._aliases_cache_loaded = False

    try:
        # STEP 1: Assign Domain X to Jury A in SELECTED mode with P01, P02, P03, P04
        print("\n--- Step 1: Assign Jury A (P01, P02, P03, P04) ---")
        jda_a = await jury_service.assign_domain(
            judge_user_id="jury_a_uid",
            domain_id="domain-x",
            assignment_mode="SELECTED",
            assigned_by="admin"
        )
        assert_check(jda_a is not None, "Jury A domain assignment created")
        assignment_a_id = str(jda_a.get("id"))

        added_a = await jury_service.add_selected_projects(
            assignment_id=assignment_a_id,
            registration_ids=["P01", "P02", "P03", "P04"],
            assigned_by="admin"
        )
        assert_check(added_a == 4, "Jury A successfully assigned 4 projects (P01..P04)")

        # STEP 2: Candidate list before Jury B assignment
        print("\n--- Step 2: Query candidate list for Jury B ---")
        cand_b_res = await jury_service.get_assignment_candidates(
            domain_id="domain-x",
            for_judge_user_id="jury_b_uid"
        )
        cand_b_ids = [c.registration_id for c in cand_b_res.candidates]
        print(f"  Candidate list for Jury B: {cand_b_ids}")

        assert_check(
            cand_b_ids == ["P05", "P06", "P07", "P08", "P09", "P10"],
            f"Jury B candidate list is exactly P05..P10: got {cand_b_ids}"
        )
        for forbidden in ["P01", "P02", "P03", "P04"]:
            assert_check(
                forbidden not in cand_b_ids,
                f"Jury B candidate list DOES NOT contain {forbidden}"
            )
        assert_check(cand_b_res.available_count == 6, f"available_count is 6: got {cand_b_res.available_count}")
        assert_check(cand_b_res.already_assigned_count == 4, f"already_assigned_count is 4: got {cand_b_res.already_assigned_count}")

        # STEP 3: Assign Jury B (P05, P06, P07)
        print("\n--- Step 3: Assign Jury B (P05, P06, P07) ---")
        jda_b = await jury_service.assign_domain(
            judge_user_id="jury_b_uid",
            domain_id="domain-x",
            assignment_mode="SELECTED",
            assigned_by="admin"
        )
        assert_check(jda_b is not None, "Jury B domain assignment created")
        assignment_b_id = str(jda_b.get("id"))

        added_b = await jury_service.add_selected_projects(
            assignment_id=assignment_b_id,
            registration_ids=["P05", "P06", "P07"],
            assigned_by="admin"
        )
        assert_check(added_b == 3, "Jury B successfully assigned 3 projects (P05..P07)")

        # STEP 4: Candidate list for Jury C
        print("\n--- Step 4: Query candidate list for Jury C ---")
        cand_c_res = await jury_service.get_assignment_candidates(
            domain_id="domain-x",
            for_judge_user_id="jury_c_uid"
        )
        cand_c_ids = [c.registration_id for c in cand_c_res.candidates]
        print(f"  Candidate list for Jury C: {cand_c_ids}")

        assert_check(
            cand_c_ids == ["P08", "P09", "P10"],
            f"Jury C candidate list is P08, P09, P10 ONLY: got {cand_c_ids}"
        )
        for forbidden in ["P01", "P02", "P03", "P04", "P05", "P06", "P07"]:
            assert_check(
                forbidden not in cand_c_ids,
                f"Jury C candidate list DOES NOT contain {forbidden}"
            )
        assert_check(cand_c_res.available_count == 3, f"available_count is 3: got {cand_c_res.available_count}")
        assert_check(cand_c_res.already_assigned_count == 7, f"already_assigned_count is 7: got {cand_c_res.already_assigned_count}")

        # STEP 5: Assign Jury C (P08, P09, P10)
        print("\n--- Step 5: Assign Jury C (P08, P09, P10) ---")
        jda_c = await jury_service.assign_domain(
            judge_user_id="jury_c_uid",
            domain_id="domain-x",
            assignment_mode="SELECTED",
            assigned_by="admin"
        )
        assert_check(jda_c is not None, "Jury C domain assignment created")
        assignment_c_id = str(jda_c.get("id"))

        added_c = await jury_service.add_selected_projects(
            assignment_id=assignment_c_id,
            registration_ids=["P08", "P09", "P10"],
            assigned_by="admin"
        )
        assert_check(added_c == 3, "Jury C successfully assigned 3 projects (P08..P10)")

        # STEP 6: Verify Dashboards for Jury A, B, C
        print("\n--- Step 6: Verify Dashboards ---")
        dash_a = await jury_service.get_jury_bootstrap("jury_a_uid")
        dash_b = await jury_service.get_jury_bootstrap("jury_b_uid")
        dash_c = await jury_service.get_jury_bootstrap("jury_c_uid")

        dash_a_ids = set(p.registration_id for p in dash_a.projects)
        dash_b_ids = set(p.registration_id for p in dash_b.projects)
        dash_c_ids = set(p.registration_id for p in dash_c.projects)

        print(f"  Jury A Dashboard Projects ({len(dash_a_ids)}): {sorted(list(dash_a_ids))}")
        print(f"  Jury B Dashboard Projects ({len(dash_b_ids)}): {sorted(list(dash_b_ids))}")
        print(f"  Jury C Dashboard Projects ({len(dash_c_ids)}): {sorted(list(dash_c_ids))}")

        assert_check(len(dash_a_ids) == 4, f"Jury A dashboard count = exactly 4 (got {len(dash_a_ids)})")
        assert_check(dash_a_ids == {"P01", "P02", "P03", "P04"}, "Jury A projects = {P01, P02, P03, P04}")

        assert_check(len(dash_b_ids) == 3, f"Jury B dashboard count = exactly 3 (got {len(dash_b_ids)})")
        assert_check(dash_b_ids == {"P05", "P06", "P07"}, "Jury B projects = {P05, P06, P07}")

        assert_check(len(dash_c_ids) == 3, f"Jury C dashboard count = exactly 3 (got {len(dash_c_ids)})")
        assert_check(dash_c_ids == {"P08", "P09", "P10"}, "Jury C projects = {P08, P09, P10}")

        # STEP 7: Assert Intersections are Empty
        print("\n--- Step 7: Verify Intersections ---")
        inter_ab = dash_a_ids.intersection(dash_b_ids)
        inter_ac = dash_a_ids.intersection(dash_c_ids)
        inter_bc = dash_b_ids.intersection(dash_c_ids)

        assert_check(len(inter_ab) == 0, f"A intersection B is empty: {inter_ab}")
        assert_check(len(inter_ac) == 0, f"A intersection C is empty: {inter_ac}")
        assert_check(len(inter_bc) == 0, f"B intersection C is empty: {inter_bc}")

        # STEP 8: Try assigning P01 to Jury B -> MUST return HTTP 409 Conflict
        print("\n--- Step 8: Try duplicate assignment P01 -> Jury B (Expect 409) ---")
        conflict_caught = False
        conflict_status = None
        conflict_detail = None
        try:
            await jury_service.add_selected_projects(
                assignment_id=assignment_b_id,
                registration_ids=["P01"],
                assigned_by="admin"
            )
        except HTTPException as exc:
            conflict_caught = True
            conflict_status = exc.status_code
            conflict_detail = exc.detail
            print(f"  Caught expected HTTPException: status={exc.status_code}, detail='{exc.detail}'")
        except Exception as e:
            print(f"  Caught unexpected exception: {e}")

        assert_check(conflict_caught, "Attempting to assign P01 to Jury B raised HTTPException")
        assert_check(conflict_status == 409, f"HTTP Status is 409 Conflict: got {conflict_status}")
        assert_check(
            "already assigned" in str(conflict_detail).lower(),
            f"Detail specifies already assigned: '{conflict_detail}'"
        )

        # STEP 9: Verify Editing Jury A Candidate List retains own projects
        print("\n--- Step 9: Verify Editing Jury A includes own projects ---")
        cand_a_res = await jury_service.get_assignment_candidates(
            domain_id="domain-x",
            for_judge_user_id="jury_a_uid"
        )
        cand_a_ids = [c.registration_id for c in cand_a_res.candidates]
        print(f"  Candidate list for Jury A (editing): {cand_a_ids}")
        assert_check(
            cand_a_ids == ["P01", "P02", "P03", "P04"],
            f"Jury A candidate list contains its own projects only (since P05..P10 belong to B and C): got {cand_a_ids}"
        )
        for other_jury_project in ["P05", "P06", "P07", "P08", "P09", "P10"]:
            assert_check(
                other_jury_project not in cand_a_ids,
                f"Jury A candidate list DOES NOT contain {other_jury_project} owned by B or C"
            )

        print("\n" + "=" * 60)
        print(f"RESULT: ALL {passed} TESTS PASSED SUCCESSFULLY!")
        print("=" * 60)

    finally:
        settings.supabase_url = orig_supabase_url
        db.fetch_supabase = original_fetch
        db.insert_supabase = original_insert
        db.upsert_supabase = original_upsert
        db.update_supabase = original_update
        db.delete_supabase = original_delete

if __name__ == "__main__":
    asyncio.run(run_one_project_one_jury_suite())

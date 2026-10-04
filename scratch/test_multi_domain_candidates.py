"""
scratch/test_multi_domain_candidates.py
Multi-Domain Candidate Loading & Segregation Regression Test Suite.

Authoritative Rules Covered:
1. Every domain is independent.
2. Generic formula: selected_domain_id -> canonical resolution (projects.category + domain_aliases + project_domains) -> exact domain matching -> ownership filtering.
3. registrations.category is NEVER used.
4. Registration ID prefixes are NEVER used as domain authority.
5. Zero foreign-domain leakage across all domains.
6. When editing existing jury: available = unassigned OR owned by current jury; other jury's projects unavailable.
7. Dynamic project growth: new projects appear automatically in the right domain.
8. Dynamic new canonical domain: dynamically appears and loads candidates without code changes.
"""

import sys
import os
import asyncio
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.jury_service import jury_service
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

class MockDatabaseForCandidates:
    """In-memory DB fixture to test candidates across all domains deterministically."""
    def __init__(self):
        self.domains = [
            {"id": "smart-automation", "title": "Computer Science & Artificial Intelligence"},
            {"id": "green-sustainability", "title": "Mechanical Engineering & Automation"},
            {"id": "ai-software", "title": "Civil Engineering & Smart Infrastructure"},
            {"id": "hardware-iot", "title": "Electrical Engineering & Energy Systems"},
            {"id": "health-biotech", "title": "Electronics & Communication Technologies"},
            {"id": "domain-7c89c586", "title": "Agriculture & Agri-Innovation"},
            {"id": "domain-315daeb9", "title": "Healthcare & Biomedical Innovations"},
            {"id": "open-innovation", "title": "Business Management & Entrepreneurship"},
            {"id": "domain-c0677a05", "title": "Multidisciplinary Innovation & Smart Solutions"},
            {"id": "domain-9f52a525", "title": "School Innovation & Young Innovators"},
        ]
        self.aliases = [
            {"domain_id": d["id"], "alias_text": d["title"], "is_active": True}
            for d in self.domains
        ]
        self.judges = [
            {"id": "judge_1", "user_id": "judge_1_uid", "name": "Jury Panel 1", "is_active": True},
            {"id": "judge_2", "user_id": "judge_2_uid", "name": "Jury Panel 2", "is_active": True},
        ]
        self.jdas = []
        self.pas = []
        self.registrations = []
        self.projects = []
        self.institutions = [
            {"id": "inst_1", "name": "SR University"},
            {"id": "inst_2", "name": "Warangal Institute of Tech"},
        ]

    async def fetch_supabase(self, table: str, query: str = ""):
        if table == "project_domains":
            return [dict(d) for d in self.domains]
        if table == "domain_aliases":
            return [dict(a) for a in self.aliases]
        if table == "judges":
            return [dict(j) for j in self.judges]
        if table == "jury_domain_assignments":
            return [dict(j) for j in self.jdas]
        if table == "jury_project_assignments":
            return [dict(p) for p in self.pas]
        if table == "institutions":
            return [dict(i) for i in self.institutions]
        if table == "registrations":
            result = []
            for r in self.registrations:
                r_copy = dict(r)
                if "projects(" in query:
                    # Resolve project for this registration
                    r_copy["projects"] = [
                        {"title": p["title"], "category": p["category"]}
                        for p in self.projects if p["registration_id"] == r["id"]
                    ]
                if "institutions(" in query:
                    r_copy["institutions"] = {"name": "SR University"}
                result.append(r_copy)
            return result
        return []

    async def insert_supabase(self, table: str, payload: dict):
        row = dict(payload)
        if "id" not in row:
            row["id"] = str(uuid.uuid4())
        if table == "jury_domain_assignments":
            self.jdas.append(row)
        elif table == "jury_project_assignments":
            self.pas.append(row)
        elif table == "project_domains":
            self.domains.append(row)
        elif table == "domain_aliases":
            self.aliases.append(row)
        elif table == "registrations":
            self.registrations.append(row)
        elif table == "projects":
            self.projects.append(row)
        return row

async def run_multi_domain_tests():
    global db
    import app.services.jury_service as js_mod
    import app.database as db_mod

    mock_db = MockDatabaseForCandidates()
    # Save original fetch_supabase
    orig_fetch = db_mod.db.fetch_supabase
    orig_insert = db_mod.db.insert_supabase
    db_mod.db.fetch_supabase = mock_db.fetch_supabase
    db_mod.db.insert_supabase = mock_db.insert_supabase

    try:
        print("\n--- TEST 1: Seed unassigned projects across ALL 10 canonical domains ---")
        # 3 projects per domain = 30 projects
        dom_project_map = {}
        for d in mock_db.domains:
            dom_id = d["id"]
            dom_title = d["title"]
            dom_project_map[dom_id] = []
            for i in range(1, 4):
                r_id = f"REG-{dom_id[:4].upper()}-{i:02d}"
                r_uuid = str(uuid.uuid4())
                mock_db.registrations.append({
                    "id": r_uuid,
                    "registration_id": r_id,
                    "team_name": f"Team {r_id}",
                    "institution_name": "SR University",
                })
                # Strictly category on projects table only:
                mock_db.projects.append({
                    "id": str(uuid.uuid4()),
                    "registration_id": r_uuid,
                    "title": f"Project {r_id}",
                    "category": dom_title,  # exact canonical category
                })
                dom_project_map[dom_id].append(r_id)

        # Refresh cache
        jury_service._aliases_cache = {}
        await jury_service._refresh_aliases_cache()

        print("\n--- TEST 2: Validate each canonical domain candidate loading & strict isolation ---")
        for d in mock_db.domains:
            dom_id = d["id"]
            dom_title = d["title"]
            expected_rids = sorted(dom_project_map[dom_id])

            res = await jury_service.get_assignment_candidates(dom_id)
            assert_check(res.success is True, f"Domain '{dom_title}': API returned success=True")
            assert_check(res.domain_id == dom_id, f"Domain '{dom_title}': domain_id matches requested '{dom_id}'")
            assert_check(res.available_count == 3, f"Domain '{dom_title}': available_count == 3")
            assert_check(res.already_assigned_count == 0, f"Domain '{dom_title}': already_assigned_count == 0")
            assert_check(res.available_candidates == 3, f"Domain '{dom_title}': available_candidates alias == 3")
            assert_check(res.total_candidates == 3, f"Domain '{dom_title}': total_candidates == 3")

            returned_rids = sorted([c.registration_id for c in res.candidates])
            assert_check(returned_rids == expected_rids, f"Domain '{dom_title}': exactly expected projects returned: {returned_rids}")

            # Assert ZERO foreign-domain leakage
            for cand in res.candidates:
                assert_check(cand.canonical_domain_id == dom_id, f"Candidate {cand.registration_id} canonical domain is strictly {dom_id}")
                assert_check(cand.available is True, f"Candidate {cand.registration_id} is unassigned and available")

        print("\n--- TEST 3: Partial Assignment Partitioning (Jury A owns projects, Jury B excluded) ---")
        # In smart-automation (CSE): Assign 2 projects to Jury Panel 1
        cse_pids = dom_project_map["smart-automation"]
        jda_cse_1 = {
            "id": "jda_cse_1",
            "judge_user_id": "judge_1_uid",
            "domain_id": "smart-automation",
            "assignment_mode": "SELECTED",
            "is_active": True,
        }
        mock_db.jdas.append(jda_cse_1)
        mock_db.pas.append({
            "id": "pa_1",
            "jury_domain_assignment_id": "jda_cse_1",
            "registration_id": cse_pids[0],
        })
        mock_db.pas.append({
            "id": "pa_2",
            "jury_domain_assignment_id": "jda_cse_1",
            "registration_id": cse_pids[1],
        })

        # Query candidates for a new jury (no for_judge_user_id)
        cands_fresh = await jury_service.get_assignment_candidates("smart-automation")
        assert_check(cands_fresh.available_count == 1, "After 2 assigned, available_count is exactly 1")
        assert_check(cands_fresh.already_assigned_count == 2, "After 2 assigned, already_assigned_count is exactly 2")

        cands_fresh_ids = [c.registration_id for c in cands_fresh.candidates]
        assert_check(cands_fresh_ids == [cse_pids[2]], f"Only unassigned project is in candidates: {cands_fresh_ids}")
        assert_check(cse_pids[0] not in cands_fresh_ids and cse_pids[1] not in cands_fresh_ids, "Owned projects are completely excluded from response")

        print("\n--- TEST 4: Editing existing Jury A (own projects remain available) ---")
        cands_edit_a = await jury_service.get_assignment_candidates("smart-automation", for_judge_user_id="judge_1_uid")
        cands_edit_a_ids = [c.registration_id for c in cands_edit_a.candidates]
        assert_check(sorted(cands_edit_a_ids) == sorted(cse_pids), f"Editing Jury A sees own 2 projects + 1 unassigned: {cands_edit_a_ids}")

        print("\n--- TEST 5: Editing Jury B when Jury A owns projects ---")
        cands_edit_b = await jury_service.get_assignment_candidates("smart-automation", for_judge_user_id="judge_2_uid")
        cands_edit_b_ids = [c.registration_id for c in cands_edit_b.candidates]
        assert_check(cands_edit_b_ids == [cse_pids[2]], f"Jury B can only see unassigned project: {cands_edit_b_ids}")
        assert_check(cse_pids[0] not in cands_edit_b_ids and cse_pids[1] not in cands_edit_b_ids, "Jury A's projects are completely excluded for Jury B")

        print("\n--- TEST 6: Dynamic Future Project Growth ---")
        # Add dynamic new project in Mechanical Engineering & Automation
        new_mech_rid = "REG-MCH-NEW99"
        new_mech_uuid = str(uuid.uuid4())
        mock_db.registrations.append({
            "id": new_mech_uuid,
            "registration_id": new_mech_rid,
            "team_name": "Dynamic Mech Team",
            "institution_name": "SR University",
        })
        mock_db.projects.append({
            "id": str(uuid.uuid4()),
            "registration_id": new_mech_uuid,
            "title": "Hyperloop Brake Automation",
            "category": "Mechanical Engineering & Automation",
        })

        mech_cands = await jury_service.get_assignment_candidates("green-sustainability")
        assert_check(mech_cands.available_count == 4, f"Mechanical candidates dynamically increased from 3 to 4 (got {mech_cands.available_count})")
        assert_check(new_mech_rid in [c.registration_id for c in mech_cands.candidates], f"New project {new_mech_rid} is immediately in candidate list")

        # Confirm new project does NOT leak into Civil or CSE
        civ_cands = await jury_service.get_assignment_candidates("ai-software")
        cse_cands = await jury_service.get_assignment_candidates("smart-automation")
        assert_check(new_mech_rid not in [c.registration_id for c in civ_cands.candidates], "New mech project did NOT leak into Civil candidates")
        assert_check(new_mech_rid not in [c.registration_id for c in cse_cands.candidates], "New mech project did NOT leak into CSE candidates")

        print("\n--- TEST 7: Dynamic Future Domain Support (Zero Source Code Changes) ---")
        # Add an 11th brand new domain "domain-aerospace"
        new_dom = {"id": "domain-aerospace", "title": "Aerospace & Drone Technologies"}
        mock_db.domains.append(new_dom)
        mock_db.aliases.append({"domain_id": "domain-aerospace", "alias_text": "Aerospace & Drone Technologies", "is_active": True})

        # Add 2 projects for this new domain
        for i in range(1, 3):
            aero_rid = f"REG-AERO-{i:02d}"
            aero_uuid = str(uuid.uuid4())
            mock_db.registrations.append({
                "id": aero_uuid,
                "registration_id": aero_rid,
                "team_name": f"Aero Team {i}",
                "institution_name": "Aero Institute",
            })
            mock_db.projects.append({
                "id": str(uuid.uuid4()),
                "registration_id": aero_uuid,
                "title": f"Autonomous UAV Patrol {i}",
                "category": "Aerospace & Drone Technologies",
            })

        # Invalidate cache so dynamic reload triggers
        jury_service._cache_timestamp = 0
        aero_cands = await jury_service.get_assignment_candidates("domain-aerospace")
        assert_check(aero_cands.success is True, "Brand new domain candidate lookup succeeds (200)")
        assert_check(aero_cands.domain_id == "domain-aerospace", "Domain ID matches brand new domain")
        assert_check(aero_cands.domain_title == "Aerospace & Drone Technologies", "Domain title resolved dynamically")
        assert_check(aero_cands.available_count == 2, f"Brand new domain has exactly 2 available candidates (got {aero_cands.available_count})")
        assert_check(sorted([c.registration_id for c in aero_cands.candidates]) == ["REG-AERO-01", "REG-AERO-02"], "Both aero projects found")

        print("\n=====================================================================")
        print(f"ALL {passed} MULTI-DOMAIN CANDIDATE REGRESSION TESTS PASSED (0 FAILED)!")
        print("=====================================================================")

    finally:
        db_mod.db.fetch_supabase = orig_fetch
        db_mod.db.insert_supabase = orig_insert

if __name__ == "__main__":
    asyncio.run(run_multi_domain_tests())

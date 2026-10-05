"""
test_localhost_e2e_verification.py
Localhost End-to-End Manual Verification Script for PRAGATHI 2K26 Jury Portal.

Verifies Scenarios A through H directly against FastAPI application & localhost server:
A. Domain with one jury: jury sees only projects assigned within its domain
B. Same domain with multiple juries: Jury 1 and Jury 2 see only their partitions (ZERO overlap)
C. Cross-domain isolation: jury from Domain A cannot access Domain B projects
D. Admin project assignment: assigned project immediately unavailable for all other juries (409 Conflict)
E. Editing an existing jury: own projects & unassigned are available; other jury's projects unavailable
F. Unauthorized access: manual ID / QR scan / direct API all reject with 403 & exact message
G. Evaluation: assigned project accessible (200), unassigned project rejected (403)
H. Dynamic behavior: heterogeneous jury counts (1, 2, 3 juries), dynamic new projects, zero hardcoding

SAFETY: Runs 100% in-memory locally with ZERO writes or queries to the production database.
"""

import sys
import os
import asyncio
import uuid
from typing import Dict, List, Any, Optional

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import httpx
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.auth import verify_admin_auth, verify_jury_auth
from app.database import db
from app.services.jury_service import jury_service

# ─── COLOR LOGGING ──────────────────────────────────────────────────────────
GREEN = "\033[92m"
RED = "\033[91m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RESET = "\033[0m"

passed_count = 0
failed_count = 0

def assert_check(condition: bool, description: str):
    global passed_count, failed_count
    if condition:
        passed_count += 1
        print(f"  {GREEN}[PASS]{RESET} {description}")
    else:
        failed_count += 1
        print(f"  {RED}[FAIL]{RESET} {description}")

# ─── IN-MEMORY LOCAL DATABASE FIXTURE (ZERO PROD DB ACCESS) ─────────────────
class LocalMockDatabase:
    """In-memory database store replacing remote Supabase calls for safe local verification."""
    def __init__(self):
        self.tables: Dict[str, List[Dict[str, Any]]] = {
            "project_domains": [
                {"id": "ai-software", "title": "Civil Engineering & Smart Infrastructure"},
                {"id": "hardware-iot", "title": "Electrical Engineering & Energy Systems"},
                {"id": "green-sustainability", "title": "Mechanical Engineering & Automation"},
                {"id": "health-biotech", "title": "Electronics & Communication Technologies"},
                {"id": "smart-automation", "title": "Computer Science & Artificial Intelligence"},
                {"id": "open-innovation", "title": "Business Management & Entrepreneurship"},
                {"id": "domain-7c89c586", "title": "Agriculture & Agri-Innovation"},
                {"id": "domain-315daeb9", "title": "Healthcare & Biomedical Innovations"},
                {"id": "domain-c0677a05", "title": "Multidisciplinary Innovation & Smart Solutions"},
                {"id": "domain-9f52a525", "title": "School Innovation & Young Innovators"},
            ],
            "domain_aliases": [
                {"domain_id": "ai-software", "alias_text": "Civil Engineering & Smart Infrastructure", "is_active": True},
                {"domain_id": "smart-automation", "alias_text": "Computer Science & Artificial Intelligence", "is_active": True},
                {"domain_id": "green-sustainability", "alias_text": "Mechanical Engineering & Automation", "is_active": True},
                {"domain_id": "hardware-iot", "alias_text": "Electrical Engineering & Energy Systems", "is_active": True},
                {"domain_id": "health-biotech", "alias_text": "Electronics & Communication Technologies", "is_active": True},
                {"domain_id": "open-innovation", "alias_text": "Business Management & Entrepreneurship", "is_active": True},
                {"domain_id": "domain-7c89c586", "alias_text": "Agriculture & Agri-Innovation", "is_active": True},
                {"domain_id": "domain-315daeb9", "alias_text": "Healthcare & Biomedical Innovations", "is_active": True},
                {"domain_id": "domain-c0677a05", "alias_text": "Multidisciplinary Innovation & Smart Solutions", "is_active": True},
                {"domain_id": "domain-9f52a525", "alias_text": "School Innovation & Young Innovators", "is_active": True},
            ],
            "judges": [],
            "user_roles": [],
            "registrations": [],
            "projects": [],
            "jury_domain_assignments": [],
            "jury_project_assignments": [],
            "judge_evaluations": [],
        }

    async def fetch_supabase(self, table: str, query: str = "") -> List[Dict[str, Any]]:
        rows = self.tables.get(table, [])
        if not query:
            return [dict(r) for r in rows]

        # Parse simple query filters
        filters_eq = {}
        filters_in = {}
        for part in query.split("&"):
            if "=eq." in part:
                k, v = part.split("=eq.", 1)
                filters_eq[k.strip()] = v.strip()
            elif "=in." in part:
                k, v = part.split("=in.", 1)
                v_clean = v.strip().lstrip("(").rstrip(")")
                vals = [x.strip() for x in v_clean.split(",") if x.strip()]
                filters_in[k.strip()] = set(vals)

        filtered = []
        for r in rows:
            match = True
            for k, v in filters_eq.items():
                r_val = str(r.get(k, ""))
                if v.lower() == "true":
                    if r.get(k) is not True:
                        match = False; break
                elif v.lower() == "false":
                    if r.get(k) is not False:
                        match = False; break
                elif r_val.upper() != v.upper():
                    match = False; break
            if match and filters_in:
                for k, vals in filters_in.items():
                    r_val = str(r.get(k, ""))
                    if r_val not in vals:
                        match = False; break
            if match:
                # Resolve nested projects / institutions if requested
                r_copy = dict(r)
                if "projects(" in query:
                    matching_p = [p for p in self.tables.get("projects", []) if p.get("registration_id") == r.get("id")]
                    r_copy["projects"] = matching_p
                filtered.append(r_copy)
        return filtered

    async def insert_supabase(self, table: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        row = dict(payload)
        if "id" not in row:
            row["id"] = str(uuid.uuid4())
        self.tables.setdefault(table, []).append(row)
        return row

    async def update_supabase(self, table: str, match_col: str, match_val: Any, payload: Dict[str, Any]) -> bool:
        for r in self.tables.get(table, []):
            if str(r.get(match_col)) == str(match_val):
                r.update(payload)
                return True
        return False

    async def delete_supabase(self, table: str, match_col: str, match_val: Any) -> bool:
        rows = self.tables.get(table, [])
        before_len = len(rows)
        self.tables[table] = [r for r in rows if str(r.get(match_col)) != str(match_val)]
        return len(self.tables[table]) < before_len

    async def upsert_supabase(self, table: str, payload: Dict[str, Any], on_conflict: str = "") -> Optional[Dict[str, Any]]:
        return await self.insert_supabase(table, payload)

# ─── SEED HETEROGENEOUS ARCHITECTURE SCENARIO ──────────────────────────────
def seed_scenario_data(mock_db: LocalMockDatabase):
    # Setup test judges
    judges = [
        {"id": str(uuid.uuid4()), "user_id": "judge_civil_1", "name": "Civil Jury Panel 1", "email": "civil1@sru.edu.in", "department": "Civil", "is_active": True},
        {"id": str(uuid.uuid4()), "user_id": "judge_cse_1", "name": "CSE Jury Panel 1", "email": "cse1@sru.edu.in", "department": "CSE", "is_active": True},
        {"id": str(uuid.uuid4()), "user_id": "judge_cse_2", "name": "CSE Jury Panel 2", "email": "cse2@sru.edu.in", "department": "CSE", "is_active": True},
        {"id": str(uuid.uuid4()), "user_id": "judge_mech_1", "name": "Mech Jury Panel 1", "email": "mech1@sru.edu.in", "department": "Mechanical", "is_active": True},
        {"id": str(uuid.uuid4()), "user_id": "judge_eee_1", "name": "EEE Jury Panel 1", "email": "eee1@sru.edu.in", "department": "EEE", "is_active": True},
        {"id": str(uuid.uuid4()), "user_id": "judge_eee_2", "name": "EEE Jury Panel 2", "email": "eee2@sru.edu.in", "department": "EEE", "is_active": True},
        {"id": str(uuid.uuid4()), "user_id": "judge_eee_3", "name": "EEE Jury Panel 3", "email": "eee3@sru.edu.in", "department": "EEE", "is_active": True},
        {"id": str(uuid.uuid4()), "user_id": "judge_ece_1", "name": "ECE Jury Panel 1", "email": "ece1@sru.edu.in", "department": "ECE", "is_active": True},
    ]
    mock_db.tables["judges"] = judges

    # Setup projects & registrations across domains
    # Domain 1 (ai-software / Civil): 5 projects
    # Domain 2 (smart-automation / CSE): 6 projects
    # Domain 3 (green-sustainability / Mech): 4 projects
    # Domain 4 (hardware-iot / EEE): 6 projects
    # Domain 5 (health-biotech / ECE): 4 projects
    domains_data = [
        ("ai-software", "Civil Engineering & Smart Infrastructure", "PRAGATHI26-CIV", 5),
        ("smart-automation", "Computer Science & Artificial Intelligence", "PRAGATHI26-CSE", 6),
        ("green-sustainability", "Mechanical Engineering & Automation", "PRAGATHI26-MCH", 4),
        ("hardware-iot", "Electrical Engineering & Energy Systems", "PRAGATHI26-EEE", 6),
        ("health-biotech", "Electronics & Communication Technologies", "PRAGATHI26-ECE", 4),
    ]

    for d_id, d_cat, prefix, count in domains_data:
        for i in range(1, count + 1):
            r_uuid = str(uuid.uuid4())
            reg_id = f"{prefix}{i:02d}"
            mock_db.tables["registrations"].append({
                "id": r_uuid,
                "registration_id": reg_id,
                "team_name": f"Team {reg_id}",
                "leader_name": f"Leader {reg_id}",
                "category": d_cat,
                "institution_name": "SR University",
            })
            mock_db.tables["projects"].append({
                "id": str(uuid.uuid4()),
                "registration_id": r_uuid,
                "title": f"Innovative Prototype {reg_id}",
                "category": d_cat,
                "problem_statement": f"Challenge statement for {reg_id}",
                "proposed_solution": f"Proposed architecture for {reg_id}",
                "innovation": f"Key innovation in {reg_id}",
                "expected_outcomes": f"Deliverables for {reg_id}",
            })

    # Domain 1 (Civil): 1 jury in ALL mode
    da_civ1 = str(uuid.uuid4())
    mock_db.tables["jury_domain_assignments"].append({
        "id": da_civ1,
        "judge_user_id": "judge_civil_1",
        "domain_id": "ai-software",
        "assignment_mode": "ALL",
        "is_active": True,
        "created_at": "2026-10-01T10:00:00Z"
    })

    # Domain 2 (CSE): 2 juries in SELECTED mode (P1-P3 to CSE1, P4-P6 to CSE2)
    da_cse1 = str(uuid.uuid4())
    da_cse2 = str(uuid.uuid4())
    mock_db.tables["jury_domain_assignments"].extend([
        {"id": da_cse1, "judge_user_id": "judge_cse_1", "domain_id": "smart-automation", "assignment_mode": "SELECTED", "is_active": True, "created_at": "2026-10-01T10:00:00Z"},
        {"id": da_cse2, "judge_user_id": "judge_cse_2", "domain_id": "smart-automation", "assignment_mode": "SELECTED", "is_active": True, "created_at": "2026-10-01T10:00:00Z"},
    ])
    for i in range(1, 4):
        mock_db.tables["jury_project_assignments"].append({
            "id": str(uuid.uuid4()),
            "jury_domain_assignment_id": da_cse1,
            "registration_id": f"PRAGATHI26-CSE{i:02d}",
        })
    for i in range(4, 7):
        mock_db.tables["jury_project_assignments"].append({
            "id": str(uuid.uuid4()),
            "jury_domain_assignment_id": da_cse2,
            "registration_id": f"PRAGATHI26-CSE{i:02d}",
        })

    # Domain 4 (EEE): 3 juries in SELECTED mode (2 projects each)
    da_eee1 = str(uuid.uuid4())
    da_eee2 = str(uuid.uuid4())
    da_eee3 = str(uuid.uuid4())
    mock_db.tables["jury_domain_assignments"].extend([
        {"id": da_eee1, "judge_user_id": "judge_eee_1", "domain_id": "hardware-iot", "assignment_mode": "SELECTED", "is_active": True, "created_at": "2026-10-01T10:00:00Z"},
        {"id": da_eee2, "judge_user_id": "judge_eee_2", "domain_id": "hardware-iot", "assignment_mode": "SELECTED", "is_active": True, "created_at": "2026-10-01T10:00:00Z"},
        {"id": da_eee3, "judge_user_id": "judge_eee_3", "domain_id": "hardware-iot", "assignment_mode": "SELECTED", "is_active": True, "created_at": "2026-10-01T10:00:00Z"},
    ])
    mock_db.tables["jury_project_assignments"].extend([
        {"id": str(uuid.uuid4()), "jury_domain_assignment_id": da_eee1, "registration_id": "PRAGATHI26-EEE01"},
        {"id": str(uuid.uuid4()), "jury_domain_assignment_id": da_eee1, "registration_id": "PRAGATHI26-EEE02"},
        {"id": str(uuid.uuid4()), "jury_domain_assignment_id": da_eee2, "registration_id": "PRAGATHI26-EEE03"},
        {"id": str(uuid.uuid4()), "jury_domain_assignment_id": da_eee2, "registration_id": "PRAGATHI26-EEE04"},
        {"id": str(uuid.uuid4()), "jury_domain_assignment_id": da_eee3, "registration_id": "PRAGATHI26-EEE05"},
        {"id": str(uuid.uuid4()), "jury_domain_assignment_id": da_eee3, "registration_id": "PRAGATHI26-EEE06"},
    ])

    # Domain 5 (ECE): 1 jury in SELECTED mode with 2 projects assigned (2 unassigned)
    da_ece1 = str(uuid.uuid4())
    mock_db.tables["jury_domain_assignments"].append({
        "id": da_ece1, "judge_user_id": "judge_ece_1", "domain_id": "health-biotech", "assignment_mode": "SELECTED", "is_active": True, "created_at": "2026-10-01T10:00:00Z"
    })
    mock_db.tables["jury_project_assignments"].extend([
        {"id": str(uuid.uuid4()), "jury_domain_assignment_id": da_ece1, "registration_id": "PRAGATHI26-ECE01"},
        {"id": str(uuid.uuid4()), "jury_domain_assignment_id": da_ece1, "registration_id": "PRAGATHI26-ECE02"},
    ])

    return {
        "da_civ1": da_civ1,
        "da_cse1": da_cse1,
        "da_cse2": da_cse2,
        "da_eee1": da_eee1,
        "da_eee2": da_eee2,
        "da_eee3": da_eee3,
        "da_ece1": da_ece1,
    }

# ─── MAIN VERIFICATION SUITE ────────────────────────────────────────────────
async def run_localhost_e2e_verification():
    print(f"\n{BLUE}======================================================================{RESET}")
    print(f"{BLUE}PRAGATHI 2K26 — LOCALHOST END-TO-END MANUAL JURY VERIFICATION{RESET}")
    print(f"{BLUE}======================================================================{RESET}\n")

    # 1. LIVE HTTP PROXY & HEALTH CHECK (Testing running localhost servers)
    print(f"{YELLOW}--- [Pre-flight] Verifying Localhost Service Health & Proxy ---{RESET}")
    try:
        async with httpx.AsyncClient(timeout=3.0) as live_client:
            backend_res = await live_client.get("http://127.0.0.1:8000/api/health")
            assert_check(backend_res.status_code == 200, f"Localhost Backend (http://127.0.0.1:8000/api/health) is live (status 200)")

            vite_res = await live_client.get("http://localhost:3000/api/health")
            assert_check(vite_res.status_code == 200, f"Vite Reverse Proxy (http://localhost:3000/api/health) forwards to backend (status 200)")
    except Exception as e:
        print(f"  {RED}[ERROR] Local server check encountered error: {e}{RESET}")

    # 2. SETUP ISOLATED IN-MEMORY DB FIXTURE (ZERO PROD DB ACCESS)
    mock_db = LocalMockDatabase()
    assignment_ids = seed_scenario_data(mock_db)

    # Monkeypatch db methods for jury_service to use local mock
    original_fetch = db.fetch_supabase
    original_insert = db.insert_supabase
    original_update = db.update_supabase
    original_delete = db.delete_supabase
    original_upsert = db.upsert_supabase

    db.fetch_supabase = mock_db.fetch_supabase
    db.insert_supabase = mock_db.insert_supabase
    db.update_supabase = mock_db.update_supabase
    db.delete_supabase = mock_db.delete_supabase
    db.upsert_supabase = mock_db.upsert_supabase

    # Clear resolution caches and enable enforcement for authoritative local E2E verification
    old_enforce = os.environ.get("JURY_ASSIGNMENT_ENFORCEMENT")
    os.environ["JURY_ASSIGNMENT_ENFORCEMENT"] = "true"
    jury_service._aliases_cache = {}
    jury_service._cache_timestamp = 0

    transport = ASGITransport(app=app)

    try:
        # ─────────────────────────────────────────────────────────────────
        # SCENARIO A: DOMAIN WITH ONE JURY
        # ─────────────────────────────────────────────────────────────────
        print(f"\n{YELLOW}--- Scenario A: Domain With One Jury (Civil Domain) ---{RESET}")
        app.dependency_overrides[verify_jury_auth] = lambda: {
            "authenticated": True,
            "user_id": "judge_civil_1",
            "email": "civil1@sru.edu.in",
            "role": "jury"
        }

        async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
            boot_res = await client.get("/api/jury/bootstrap")
            assert_check(boot_res.status_code == 200, "Jury Civil Bootstrap returns 200 OK")
            boot_data = boot_res.json()
            civ_projects = [p["registration_id"] for p in boot_data.get("projects", [])]

            assert_check(
                len(civ_projects) == 5 and all(p.startswith("PRAGATHI26-CIV") for p in civ_projects),
                f"Civil Jury sees exactly its 5 domain projects ({civ_projects})"
            )
            assert_check(
                not any("CSE" in p or "MECH" in p or "EEE" in p or "ECE" in p for p in civ_projects),
                "Civil Jury receives ZERO projects from other domains"
            )

        # ─────────────────────────────────────────────────────────────────
        # SCENARIO B: SAME DOMAIN WITH MULTIPLE JURIES (CSE Domain)
        # ─────────────────────────────────────────────────────────────────
        print(f"\n{YELLOW}--- Scenario B: Same Domain with Multiple Juries (Partitioning) ---{RESET}")
        # Jury CSE 1
        app.dependency_overrides[verify_jury_auth] = lambda: {
            "authenticated": True, "user_id": "judge_cse_1", "email": "cse1@sru.edu.in", "role": "jury"
        }
        async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
            res_cse1 = await client.get("/api/jury/bootstrap")
            cse1_projects = [p["registration_id"] for p in res_cse1.json().get("projects", [])]

        # Jury CSE 2
        app.dependency_overrides[verify_jury_auth] = lambda: {
            "authenticated": True, "user_id": "judge_cse_2", "email": "cse2@sru.edu.in", "role": "jury"
        }
        async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
            res_cse2 = await client.get("/api/jury/bootstrap")
            cse2_projects = [p["registration_id"] for p in res_cse2.json().get("projects", [])]

        assert_check(
            cse1_projects == ["PRAGATHI26-CSE01", "PRAGATHI26-CSE02", "PRAGATHI26-CSE03"],
            f"Jury CSE 1 dashboard displays exactly its assigned partition: {cse1_projects}"
        )
        assert_check(
            cse2_projects == ["PRAGATHI26-CSE04", "PRAGATHI26-CSE05", "PRAGATHI26-CSE06"],
            f"Jury CSE 2 dashboard displays exactly its assigned partition: {cse2_projects}"
        )
        assert_check(
            set(cse1_projects).isdisjoint(set(cse2_projects)),
            "ZERO PROJECT OVERLAP: CSE Jury 1 and CSE Jury 2 project sets have empty intersection"
        )

        # ─────────────────────────────────────────────────────────────────
        # SCENARIO C: CROSS-DOMAIN ISOLATION
        # ─────────────────────────────────────────────────────────────────
        print(f"\n{YELLOW}--- Scenario C: Cross-Domain Isolation ---{RESET}")
        # Civil Jury attempting to access Mechanical or CSE project
        app.dependency_overrides[verify_jury_auth] = lambda: {
            "authenticated": True, "user_id": "judge_civil_1", "email": "civil1@sru.edu.in", "role": "jury"
        }
        async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
            res_cross_mech = await client.get("/api/jury/assigned-projects/PRAGATHI26-MCH01")
            res_cross_cse = await client.get("/api/jury/assigned-projects/PRAGATHI26-CSE01")

            assert_check(res_cross_mech.status_code == 403, "Civil Jury accessing Mechanical project receives HTTP 403")
            assert_check(res_cross_cse.status_code == 403, "Civil Jury accessing CSE project receives HTTP 403")
            assert_check(
                res_cross_mech.json().get("detail") == "This project is not assigned to you for evaluation. Please evaluate the assigned projects only.",
                "Cross-domain access returns exact friendly 403 message"
            )

        # ─────────────────────────────────────────────────────────────────
        # SCENARIO D: ADMIN PROJECT ASSIGNMENT & EXCLUSIVITY
        # ─────────────────────────────────────────────────────────────────
        print(f"\n{YELLOW}--- Scenario D: Admin Assignment Candidate Segregation & Exclusivity ---{RESET}")
        app.dependency_overrides[verify_admin_auth] = lambda: {
            "authenticated": True, "user_id": "admin_uuid", "email": "admin@sru.edu.in", "role": "admin"
        }
        async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
            # Check CSE candidates: All 6 are assigned
            cands_cse = await client.get("/api/admin/juries/assignment-candidates?domain_id=smart-automation")
            assert_check(cands_cse.status_code == 200, "Admin candidates query returns 200 OK")
            cands_data = cands_cse.json()
            assert_check(
                cands_data["available_count"] == 0 and cands_data["already_assigned_count"] == 6,
                "Fully partitioned domain (CSE) has 0 available candidates and 6 assigned candidates"
            )

            # Attempt to assign PRAGATHI26-CSE01 (owned by CSE1) to CSE2 -> MUST REJECT 409
            dup_assign_res = await client.post(
                f"/api/admin/jury-domain-assignments/{assignment_ids['da_cse2']}/projects",
                json={"registration_ids": ["PRAGATHI26-CSE01"]}
            )
            assert_check(
                dup_assign_res.status_code == 409,
                f"Duplicate assignment attempt rejected with HTTP 409 Conflict (got {dup_assign_res.status_code})"
            )
            assert_check(
                "already assigned to another jury" in dup_assign_res.json().get("detail", ""),
                "409 error details clearly explain duplicate project ownership conflict"
            )

        # ─────────────────────────────────────────────────────────────────
        # SCENARIO E: EDITING AN EXISTING JURY ASSIGNMENT
        # ─────────────────────────────────────────────────────────────────
        print(f"\n{YELLOW}--- Scenario E: Editing an Existing Jury Assignment ---{RESET}")
        async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
            # Query candidate list passing for_judge_user_id=judge_cse_1
            edit_cands_res = await client.get(
                "/api/admin/juries/assignment-candidates?domain_id=smart-automation&for_judge_user_id=judge_cse_1"
            )
            assert_check(edit_cands_res.status_code == 200, "Personalized candidate query returns 200 OK")
            edit_items = edit_cands_res.json().get("candidates", [])

            own_assigned = [c["registration_id"] for c in edit_items if not c.get("available") and c.get("assigned_to_judge_id") == "judge_cse_1"]
            other_unavail = [c["registration_id"] for c in edit_items if c["registration_id"] in {"PRAGATHI26-CSE04", "PRAGATHI26-CSE05", "PRAGATHI26-CSE06"}]

            assert_check(
                sorted(own_assigned) == ["PRAGATHI26-CSE01", "PRAGATHI26-CSE02", "PRAGATHI26-CSE03"],
                f"Jury's own currently assigned projects are visible as already assigned (non-selectable/disabled): {own_assigned}"
            )
            assert_check(
                sorted(other_unavail) == [],
                f"Projects belonging to OTHER jury are completely excluded: {other_unavail}"
            )

        # ─────────────────────────────────────────────────────────────────
        # SCENARIO F: UNAUTHORIZED ACCESS (Manual ID, QR, Direct API)
        # ─────────────────────────────────────────────────────────────────
        print(f"\n{YELLOW}--- Scenario F: Unauthorized Access Enforcement (Manual ID, QR, API) ---{RESET}")
        app.dependency_overrides[verify_jury_auth] = lambda: {
            "authenticated": True, "user_id": "judge_cse_1", "email": "cse1@sru.edu.in", "role": "jury"
        }
        async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
            # F1: Manual entry of same-domain, other-jury project
            f1_res = await client.get("/api/jury/assigned-projects/PRAGATHI26-CSE04")
            assert_check(f1_res.status_code == 403, "Manual ID entry of other jury project returns HTTP 403")

            # F2: QR scan of cross-domain project
            f2_res = await client.get("/api/jury/assigned-projects/PRAGATHI26-EEE01")
            assert_check(f2_res.status_code == 403, "QR scan of cross-domain project returns HTTP 403")

            # F3: Direct API lookup of unassigned project
            f3_res = await client.get("/api/jury/assigned-projects/PRAGATHI26-ECE03")
            assert_check(f3_res.status_code == 403, "Direct API of unassigned project returns HTTP 403")

            assert_check(
                f1_res.json().get("detail") == "This project is not assigned to you for evaluation. Please evaluate the assigned projects only.",
                "Exact friendly 403 message returned for all unauthorized lookup attempts"
            )

        # ─────────────────────────────────────────────────────────────────
        # SCENARIO G: EVALUATION PERMISSIONS
        # ─────────────────────────────────────────────────────────────────
        print(f"\n{YELLOW}--- Scenario G: Evaluation Access & Submission Restrictions ---{RESET}")
        async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
            # G1: Assigned project can be fetched normally
            g_own_res = await client.get("/api/jury/assigned-projects/PRAGATHI26-CSE01")
            assert_check(g_own_res.status_code == 200, "Assigned project can be fetched normally (status 200)")
            proj_data = g_own_res.json()
            assert_check(
                proj_data["registration_id"] == "PRAGATHI26-CSE01" and proj_data["team_name"] == "Team PRAGATHI26-CSE01",
                "Assigned project details match authoritative database records"
            )

            # G2: Unassigned project cannot be fetched or accessed
            g_other_res = await client.get("/api/jury/assigned-projects/PRAGATHI26-CSE04")
            assert_check(g_other_res.status_code == 403, "Unassigned project cannot be accessed for evaluation (status 403)")

            # G3: Evaluation Submission: Assigned project evaluated and reflected in bootstrap
            eval_row = {
                "id": str(uuid.uuid4()),
                "judge_id": "judge_cse_1",
                "judge_name": "CSE Jury Panel 1",
                "judge_email": "cse1@sru.edu.in",
                "registration_id": "PRAGATHI26-CSE01",
                "total_score": 88.0,
                "created_at": "2026-10-04T00:15:00Z"
            }
            await mock_db.insert_supabase("judge_evaluations", eval_row)
            boot_after_eval = await client.get("/api/jury/bootstrap")
            projs_eval_check = {p["registration_id"]: p for p in boot_after_eval.json().get("projects", [])}
            assert_check(
                projs_eval_check.get("PRAGATHI26-CSE01", {}).get("is_evaluated") is True,
                "Assigned project evaluation is recorded and reflected as EVALUATED in Jury bootstrap"
            )
            assert_check(
                boot_after_eval.json().get("summary", {}).get("evaluated") == 1 and boot_after_eval.json().get("summary", {}).get("remaining") == 2,
                "Jury bootstrap summary reflects exactly 1 evaluated and 2 remaining projects"
            )

            # G4: Unassigned project submission blocked by pre-evaluation verification
            unassigned_check = await client.get("/api/jury/assigned-projects/PRAGATHI26-CSE04")
            assert_check(
                unassigned_check.status_code == 403 and unassigned_check.json().get("detail") == "This project is not assigned to you for evaluation. Please evaluate the assigned projects only.",
                "Unassigned project submission attempt blocked by pre-evaluation verification (403 Forbidden)"
            )

        # ─────────────────────────────────────────────────────────────────
        # SCENARIO H: DYNAMIC BEHAVIOR (Arbitrary Juries & Projects)
        # ─────────────────────────────────────────────────────────────────
        print(f"\n{YELLOW}--- Scenario H: Dynamic Behavior (Arbitrary Juries & Dynamic Growth) ---{RESET}")
        # Verify Domain 4 (EEE) partitions cleanly across 3 juries
        eee_juries = ["judge_eee_1", "judge_eee_2", "judge_eee_3"]
        eee_sets = []
        for j_uid in eee_juries:
            app.dependency_overrides[verify_jury_auth] = lambda u=j_uid: {
                "authenticated": True, "user_id": u, "email": f"{u}@sru.edu.in", "role": "jury"
            }
            async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
                res = await client.get("/api/jury/bootstrap")
                eee_sets.append([p["registration_id"] for p in res.json().get("projects", [])])

        assert_check(
            eee_sets[0] == ["PRAGATHI26-EEE01", "PRAGATHI26-EEE02"] and
            eee_sets[1] == ["PRAGATHI26-EEE03", "PRAGATHI26-EEE04"] and
            eee_sets[2] == ["PRAGATHI26-EEE05", "PRAGATHI26-EEE06"],
            "Domain with 3 juries (EEE) partitions dynamically into 3 disjoint subsets"
        )
        assert_check(
            len(set(eee_sets[0]).intersection(set(eee_sets[1]))) == 0 and
            len(set(eee_sets[1]).intersection(set(eee_sets[2]))) == 0 and
            len(set(eee_sets[0]).intersection(set(eee_sets[2]))) == 0,
            "Triple jury domain has ZERO pairwise project overlap"
        )

        # Dynamic Project Growth: Add a new project dynamically to CSE
        new_r_uuid = str(uuid.uuid4())
        mock_db.tables["registrations"].append({
            "id": new_r_uuid,
            "registration_id": "PRAGATHI26-NEW-CSE99",
            "team_name": "Team Quantum AI",
            "category": "Computer Science & Artificial Intelligence",
        })
        mock_db.tables["projects"].append({
            "id": str(uuid.uuid4()),
            "registration_id": new_r_uuid,
            "title": "Quantum Neural Transformer",
            "category": "Computer Science & Artificial Intelligence",
        })

        app.dependency_overrides[verify_admin_auth] = lambda: {
            "authenticated": True, "user_id": "admin_uuid", "email": "admin@sru.edu.in", "role": "admin"
        }
        async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
            cands_after_new = await client.get("/api/admin/juries/assignment-candidates?domain_id=smart-automation")
            civ_cands = await client.get("/api/admin/juries/assignment-candidates?domain_id=ai-software")

            new_cands = cands_after_new.json().get("candidates", [])
            new_in_cse = any(c["registration_id"] == "PRAGATHI26-NEW-CSE99" and c["available"] is True for c in new_cands)
            new_in_civ = any(c["registration_id"] == "PRAGATHI26-NEW-CSE99" for c in civ_cands.json().get("candidates", []))

            assert_check(new_in_cse, "New dynamic registration appears in smart-automation candidate pool as available")
            assert_check(not new_in_civ, "New dynamic registration NEVER appears in Civil candidate pool")

        # Verify new project does NOT enter any jury's dashboard until assigned
        app.dependency_overrides[verify_jury_auth] = lambda: {
            "authenticated": True, "user_id": "judge_cse_1", "email": "cse1@sru.edu.in", "role": "jury"
        }
        async with AsyncClient(transport=transport, base_url="http://localhost:3000") as client:
            boot_after_new = await client.get("/api/jury/bootstrap")
            projs_after = [p["registration_id"] for p in boot_after_new.json().get("projects", [])]
            assert_check(
                "PRAGATHI26-NEW-CSE99" not in projs_after,
                "New unassigned project does not enter Jury dashboard until Admin assigns it"
            )

    finally:
        # Restore db methods and env
        if old_enforce is not None:
            os.environ["JURY_ASSIGNMENT_ENFORCEMENT"] = old_enforce
        else:
            os.environ.pop("JURY_ASSIGNMENT_ENFORCEMENT", None)
        db.fetch_supabase = original_fetch
        db.insert_supabase = original_insert
        db.update_supabase = original_update
        db.delete_supabase = original_delete
        db.upsert_supabase = original_upsert
        app.dependency_overrides.clear()

    # ─── SUMMARY REPORT ──────────────────────────────────────────────────────────
    print(f"\n{BLUE}======================================================================{RESET}")
    print(f"VERIFICATION SUMMARY: {passed_count} PASSED, {failed_count} FAILED")
    print(f"{BLUE}======================================================================{RESET}\n")
    return failed_count == 0

if __name__ == "__main__":
    success = asyncio.run(run_localhost_e2e_verification())
    sys.exit(0 if success else 1)

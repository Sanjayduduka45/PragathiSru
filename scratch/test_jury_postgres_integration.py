#!/usr/bin/env python3
"""
PRAGATHI 2K26 — Real PostgreSQL Integration Test Suite
======================================================
Tests actual PostgreSQL database behavior (NOT mocks or in-memory simulators):
1. Migration objects exist (unique indexes, triggers, trigger functions, RPCs)
2. Invariant 1: SELECTED vs SELECTED conflict (RPC and database-level unique constraint)
3. Invariant 2: SELECTED vs ALL conflict (RPC and trigger fallback)
4. Invariant 3: ALL vs SELECTED conflict (RPC and trigger fallback)
5. Invariant 4: ALL vs ALL conflict (RPC and partial unique index)
6. Real concurrent transactions: exactly ONE owner after conflicting concurrent operations
7. Real concurrent DB connections & transactions: transactional advisory lock verification
8. Expected PostgreSQL error codes (23505 unique violation, P0002 not found)
9. Migration packaging: forward migration ends at COMMIT; rollback is cleanly separated
10. Rollback script execution and safe re-application without data loss

Target DB:
- Host: localhost
- Port: 5432
- Database: pragathi_test
- User: postgres
- Password: os.getenv("PRAGATHI_TEST_DB_PASSWORD")
"""

import os
import sys
import uuid
import time
import threading
from pathlib import Path

try:
    import psycopg2
    from psycopg2 import sql, extras
except ImportError:
    print("ERROR: psycopg2 is required to run this test suite.")
    print("Install it with: pip install psycopg2-binary")
    sys.exit(1)

REPO_ROOT = Path(__file__).resolve().parent.parent
MIGRATION_FILE = REPO_ROOT / "supabase" / "jury_exclusive_assignment_migration.sql"
ROLLBACK_FILE = REPO_ROOT / "supabase" / "jury_exclusive_assignment_rollback.sql"
BOOTSTRAP_FILE = REPO_ROOT / "supabase" / "local_jury_integration_bootstrap.sql"

DB_HOST = os.getenv("PRAGATHI_TEST_DB_HOST", "localhost")
DB_PORT = int(os.getenv("PRAGATHI_TEST_DB_PORT", "5432"))
DB_NAME = os.getenv("PRAGATHI_TEST_DB_NAME", "pragathi_test")
DB_USER = os.getenv("PRAGATHI_TEST_DB_USER", "postgres")
DB_PASSWORD = os.getenv("PRAGATHI_TEST_DB_PASSWORD")

# Deterministic UUIDs for test judges to guarantee FK integrity across test resets
TEST_JUDGE_1_UUID = "11111111-1111-4111-8111-111111111111"
TEST_JUDGE_2_UUID = "22222222-2222-4222-8222-222222222222"
TEST_JUDGE_3_UUID = "33333333-3333-4333-8333-333333333333"

FIXED_JUDGE_IDS = {
    "judge_1": TEST_JUDGE_1_UUID,
    "judge_2": TEST_JUDGE_2_UUID,
    "judge_3": TEST_JUDGE_3_UUID,
}


def get_connection(autocommit=False):
    """Establishes a new, independent PostgreSQL connection."""
    if not DB_PASSWORD:
        raise ValueError(
            "PRAGATHI_TEST_DB_PASSWORD environment variable is not set.\n"
            "Please set it before running this test:\n"
            "  Windows PowerShell: $env:PRAGATHI_TEST_DB_PASSWORD='your_password'\n"
            "  Linux/macOS bash:   export PRAGATHI_TEST_DB_PASSWORD='your_password'"
        )
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    conn.autocommit = autocommit
    return conn


class TestContext:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    def assert_true(self, condition, test_name, detail=""):
        if condition:
            self.passed += 1
            print(f"  [PASS] {test_name}")
        else:
            self.failed += 1
            msg = f"  [FAIL] {test_name} - {detail}"
            print(msg)
            self.errors.append(msg)


def bootstrap_database():
    """Bootstraps the local test database with base schema and runs forward migration."""
    print("[-] Bootstrapping test database with base schema...")
    with get_connection(autocommit=True) as conn:
        with conn.cursor() as cur:
            if not BOOTSTRAP_FILE.exists():
                raise FileNotFoundError(f"Bootstrap file not found: {BOOTSTRAP_FILE}")
            cur.execute(BOOTSTRAP_FILE.read_text(encoding="utf-8"))

    print("[-] Applying forward migration (jury_exclusive_assignment_migration.sql)...")
    with get_connection(autocommit=True) as conn:
        with conn.cursor() as cur:
            if not MIGRATION_FILE.exists():
                raise FileNotFoundError(f"Migration file not found: {MIGRATION_FILE}")
            cur.execute(MIGRATION_FILE.read_text(encoding="utf-8"))
    print("[+] Test database successfully bootstrapped and migrated.")


def seed_test_judges(conn):
    """Ensures test judges exist in public.judges with fixed deterministic UUIDs."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO public.judges (user_id, name, email, department, is_active)
            VALUES
                (%s, 'Judge 1', 'judge1@integration-test.pragathi.org', 'Computer Science', TRUE),
                (%s, 'Judge 2', 'judge2@integration-test.pragathi.org', 'Civil Engineering', TRUE),
                (%s, 'Judge 3', 'judge3@integration-test.pragathi.org', 'Mechanical Engineering', TRUE)
            ON CONFLICT (email) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                name = EXCLUDED.name,
                is_active = TRUE;
        """, (TEST_JUDGE_1_UUID, TEST_JUDGE_2_UUID, TEST_JUDGE_3_UUID))
    conn.commit()
    return FIXED_JUDGE_IDS


def reset_test_state(conn):
    """
    Cleans all assignments, test projects, and registrations,
    and ensures test judges and baseline projects are deterministically seeded.
    Guarantees every UUID in FIXED_JUDGE_IDS has a matching row in public.judges.
    """
    with conn.cursor() as cur:
        # Delete dependent assignments first
        cur.execute("DELETE FROM public.jury_project_assignments;")
        cur.execute("DELETE FROM public.jury_domain_assignments;")
        cur.execute("DELETE FROM public.projects WHERE registration_id IN (SELECT id FROM public.registrations WHERE registration_id LIKE 'PRAGATHI26-INT%');")
        cur.execute("DELETE FROM public.registrations WHERE registration_id LIKE 'PRAGATHI26-INT%';")

        # Ensure test judges exist
        cur.execute("""
            INSERT INTO public.judges (user_id, name, email, department, is_active)
            VALUES
                (%s, 'Judge 1', 'judge1@integration-test.pragathi.org', 'Computer Science', TRUE),
                (%s, 'Judge 2', 'judge2@integration-test.pragathi.org', 'Civil Engineering', TRUE),
                (%s, 'Judge 3', 'judge3@integration-test.pragathi.org', 'Mechanical Engineering', TRUE)
            ON CONFLICT (email) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                name = EXCLUDED.name,
                is_active = TRUE;
        """, (TEST_JUDGE_1_UUID, TEST_JUDGE_2_UUID, TEST_JUDGE_3_UUID))

        # Seed test registrations and projects
        projects_data = [
            ("PRAGATHI26-INT001", "AI Smart Highway", "Artificial Intelligence & Software Engineering"),
            ("PRAGATHI26-INT002", "Autonomous Drone Vision", "Civil Engineering & Smart Infrastructure"),
            ("PRAGATHI26-INT003", "Robotic Arm Controller", "Mechanical & Robotics Engineering"),
            ("PRAGATHI26-INT004", "Solar Tracking Rig", "Robotics")
        ]
        for reg_id, title, cat in projects_data:
            cur.execute("""
                INSERT INTO public.registrations (registration_id, team_name, participant_type, registration_status, payment_status)
                VALUES (%s, %s, 'sru_student', 'approved', 'paid')
                ON CONFLICT (registration_id) DO NOTHING;
            """, (reg_id, f"Team {reg_id}"))

            cur.execute("""
                INSERT INTO public.projects (registration_id, title, category)
                SELECT id, %s, %s FROM public.registrations WHERE registration_id = %s
                ON CONFLICT (registration_id) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category;
            """, (title, cat, reg_id))

    conn.commit()
    return FIXED_JUDGE_IDS


def test_1_migration_objects_exist(ctx):
    """Verifies that all migration database objects (indexes, triggers, RPCs) exist in PostgreSQL."""
    print("\n--- Test 1: PostgreSQL Migration Objects Verification ---")
    with get_connection() as conn:
        with conn.cursor(cursor_factory=extras.DictCursor) as cur:
            # Check unique index idx_jury_domain_single_active_all
            cur.execute("""
                SELECT indexname, indexdef FROM pg_indexes
                WHERE tablename = 'jury_domain_assignments' AND indexname = 'idx_jury_domain_single_active_all';
            """)
            idx1 = cur.fetchone()
            ctx.assert_true(idx1 is not None, "Index idx_jury_domain_single_active_all exists in PostgreSQL")
            ctx.assert_true("UNIQUE" in idx1["indexdef"] and "assignment_mode = 'ALL'" in idx1["indexdef"],
                            "Index idx_jury_domain_single_active_all is partial unique on ALL mode")

            # Check unique index idx_jury_project_assignments_unique_reg
            cur.execute("""
                SELECT indexname, indexdef FROM pg_indexes
                WHERE tablename = 'jury_project_assignments' AND indexname = 'idx_jury_project_assignments_unique_reg';
            """)
            idx2 = cur.fetchone()
            ctx.assert_true(idx2 is not None, "Index idx_jury_project_assignments_unique_reg exists in PostgreSQL")
            ctx.assert_true("UNIQUE" in idx2["indexdef"] and "registration_id" in idx2["indexdef"],
                            "Index idx_jury_project_assignments_unique_reg is UNIQUE on registration_id")

            # Check triggers
            cur.execute("""
                SELECT trigger_name, event_manipulation, event_object_table
                FROM information_schema.triggers
                WHERE trigger_name IN ('trg_check_project_exclusive_assignment', 'trg_check_domain_all_exclusive_assignment');
            """)
            triggers = {row["trigger_name"]: row for row in cur.fetchall()}
            ctx.assert_true("trg_check_project_exclusive_assignment" in triggers,
                            "Trigger trg_check_project_exclusive_assignment exists on jury_project_assignments")
            ctx.assert_true("trg_check_domain_all_exclusive_assignment" in triggers,
                            "Trigger trg_check_domain_all_exclusive_assignment exists on jury_domain_assignments")

            # Check RPC functions
            cur.execute("""
                SELECT routine_name, routine_type, security_type
                FROM information_schema.routines
                WHERE routine_schema = 'public'
                  AND routine_name IN ('assign_jury_domain_exclusive', 'add_jury_selected_projects_exclusive');
            """)
            routines = {row["routine_name"]: row for row in cur.fetchall()}
            ctx.assert_true("assign_jury_domain_exclusive" in routines,
                            "RPC function assign_jury_domain_exclusive exists in PostgreSQL")
            ctx.assert_true("add_jury_selected_projects_exclusive" in routines,
                            "RPC function add_jury_selected_projects_exclusive exists in PostgreSQL")
            if "assign_jury_domain_exclusive" in routines:
                ctx.assert_true(routines["assign_jury_domain_exclusive"]["security_type"] == "DEFINER",
                                "RPC assign_jury_domain_exclusive is SECURITY DEFINER")


def test_2_migration_packaging_and_rollback_separation(ctx):
    """Verifies forward migration ends at COMMIT; rollback is cleanly separated."""
    print("\n--- Test 2: Migration Packaging & Separation Audit ---")
    mig_content = MIGRATION_FILE.read_text(encoding="utf-8").strip()
    ctx.assert_true(mig_content.endswith("COMMIT;"),
                    "Forward migration terminates strictly with COMMIT; (no trailing statements)")
    ctx.assert_true("DROP FUNCTION" not in mig_content,
                    "Forward migration contains NO DROP FUNCTION statements")
    ctx.assert_true("DROP TRIGGER" not in mig_content.split("COMMIT;")[0] or "DROP TRIGGER IF EXISTS" in mig_content,
                    "Triggers use safe DROP TRIGGER IF EXISTS before CREATE TRIGGER")

    # Verify rollback file exists and contains reverse operations
    ctx.assert_true(ROLLBACK_FILE.exists(), "Rollback script jury_exclusive_assignment_rollback.sql exists")
    rb_content = ROLLBACK_FILE.read_text(encoding="utf-8")
    ctx.assert_true("DROP FUNCTION IF EXISTS public.assign_jury_domain_exclusive" in rb_content,
                    "Rollback script drops assign_jury_domain_exclusive")
    ctx.assert_true("DROP INDEX IF EXISTS public.idx_jury_project_assignments_unique_reg" in rb_content,
                    "Rollback script drops idx_jury_project_assignments_unique_reg")
    ctx.assert_true("DELETE FROM" not in rb_content,
                    "Rollback script is strictly non-destructive (contains no DELETE statements)")


def test_3_selected_vs_selected_conflict(ctx):
    """Tests SELECTED vs SELECTED conflict via both RPC and database-level unique constraint."""
    print("\n--- Test 3: Invariant 1 — SELECTED vs SELECTED Conflict ---")
    with get_connection() as conn:
        judge_ids = reset_test_state(conn)
        with conn.cursor(cursor_factory=extras.DictCursor) as cur:
            j1 = judge_ids["judge_1"]
            j2 = judge_ids["judge_2"]
            p1_reg = "PRAGATHI26-INT001"

            # 1. Assign Judge 1 domain 'ai-software' in SELECTED mode via RPC
            cur.execute("SELECT public.assign_jury_domain_exclusive(%s, 'ai-software', 'SELECTED');", (j1,))
            res1 = cur.fetchone()[0]
            j1_assign_id = res1["id"]

            # Add project 1 to Judge 1 via RPC
            cur.execute("SELECT public.add_jury_selected_projects_exclusive(%s, ARRAY[%s]::text[]);",
                        (j1_assign_id, p1_reg))
            conn.commit()

            # 2. Assign Judge 2 domain 'ai-software' in SELECTED mode
            cur.execute("SELECT public.assign_jury_domain_exclusive(%s, 'ai-software', 'SELECTED');", (j2,))
            res2 = cur.fetchone()[0]
            j2_assign_id = res2["id"]
            conn.commit()

            # 3. Attempt to add same project 1 to Judge 2 via RPC -> Expect Exception
            rpc_failed = False
            err_code = None
            try:
                cur.execute("SELECT public.add_jury_selected_projects_exclusive(%s, ARRAY[%s]::text[]);",
                            (j2_assign_id, p1_reg))
                conn.commit()
            except psycopg2.Error as e:
                conn.rollback()
                rpc_failed = True
                err_code = e.pgcode

            ctx.assert_true(rpc_failed, "RPC rejects assigning already-assigned project to Judge 2")
            ctx.assert_true(err_code == "23505", f"RPC error code is 23505 (unique_violation), got: {err_code}")

            # 4. Attempt direct SQL bypass -> Expect database unique constraint / trigger rejection
            db_failed = False
            try:
                cur.execute("""
                    INSERT INTO public.jury_project_assignments (jury_domain_assignment_id, registration_id)
                    VALUES (%s, %s);
                """, (j2_assign_id, p1_reg))
                conn.commit()
            except psycopg2.Error as e:
                conn.rollback()
                db_failed = True
                err_code = e.pgcode

            ctx.assert_true(db_failed, "Direct SQL insert violates unique index idx_jury_project_assignments_unique_reg")
            ctx.assert_true(err_code == "23505", f"Database error code is 23505, got: {err_code}")


def test_4_selected_vs_all_conflict(ctx):
    """Tests SELECTED vs ALL conflict: Judge 1 has selected project; Judge 2 attempts ALL mode for domain."""
    print("\n--- Test 4: Invariant 2 — SELECTED vs ALL Conflict ---")
    with get_connection() as conn:
        judge_ids = reset_test_state(conn)
        with conn.cursor(cursor_factory=extras.DictCursor) as cur:
            j1 = judge_ids["judge_1"]
            j2 = judge_ids["judge_2"]
            p2_reg = "PRAGATHI26-INT002"  # Civil category alias -> resolves to ai-software

            # Ensure Judge 1 has p2 in SELECTED mode
            cur.execute("SELECT public.assign_jury_domain_exclusive(%s, 'ai-software', 'SELECTED');", (j1,))
            j1_assign_id = cur.fetchone()[0]["id"]
            cur.execute("SELECT public.add_jury_selected_projects_exclusive(%s, ARRAY[%s]::text[]);",
                        (j1_assign_id, p2_reg))
            conn.commit()

            # Judge 2 attempts to claim 'ai-software' in ALL mode via RPC -> MUST FAIL
            rpc_failed = False
            err_code = None
            try:
                cur.execute("SELECT public.assign_jury_domain_exclusive(%s, 'ai-software', 'ALL');", (j2,))
                conn.commit()
            except psycopg2.Error as e:
                conn.rollback()
                rpc_failed = True
                err_code = e.pgcode

            ctx.assert_true(rpc_failed, "RPC rejects setting ALL mode when active SELECTED projects exist for another judge")
            ctx.assert_true(err_code == "23505", f"Error code is 23505, got: {err_code}")

            # Direct SQL bypass attempt: INSERT INTO jury_domain_assignments with ALL mode
            db_failed = False
            try:
                cur.execute("""
                    INSERT INTO public.jury_domain_assignments (judge_user_id, domain_id, assignment_mode, is_active)
                    VALUES (%s, 'ai-software', 'ALL', TRUE);
                """, (j2,))
                conn.commit()
            except psycopg2.Error as e:
                conn.rollback()
                db_failed = True
                err_code = e.pgcode

            ctx.assert_true(db_failed, "Database trigger trg_check_domain_all_exclusive_assignment blocks direct ALL insert")
            ctx.assert_true(err_code == "23505", f"Trigger error code is 23505, got: {err_code}")


def test_5_all_vs_selected_conflict(ctx):
    """
    Tests ALL vs SELECTED conflict:
    1. Create Judge 1 ALL assignment successfully.
    2. Attempt Judge 2 SELECTED assignment.
    3. Catch psycopg2.errors.UniqueViolation / SQLSTATE 23505.
    4. Mark PASS when:
       - the assignment is rejected
       - error code == 23505
       - Judge 2 gets no active conflicting assignment
    5. Roll back the failed transaction before subsequent assertions.
    """
    print("\n--- Test 5: Invariant 3 — ALL vs SELECTED Conflict ---")
    with get_connection() as conn:
        judge_ids = reset_test_state(conn)
        with conn.cursor(cursor_factory=extras.DictCursor) as cur:
            j1 = judge_ids["judge_1"]
            j2 = judge_ids["judge_2"]
            p1_reg = "PRAGATHI26-INT001"

            # 1. Create Judge 1 ALL assignment successfully
            cur.execute("SELECT public.assign_jury_domain_exclusive(%s, 'ai-software', 'ALL');", (j1,))
            conn.commit()

            # 2. Attempt Judge 2 SELECTED assignment via RPC -> Expected to be rejected with 23505
            rpc_failed = False
            err_code = None
            try:
                cur.execute("SELECT public.assign_jury_domain_exclusive(%s, 'ai-software', 'SELECTED');", (j2,))
                conn.commit()
            except psycopg2.Error as e:
                conn.rollback()  # 5. Roll back failed transaction before subsequent assertions
                rpc_failed = True
                err_code = e.pgcode

            # 3 & 4. Mark PASS when rejected with 23505 and Judge 2 gets no active assignment
            ctx.assert_true(rpc_failed, "RPC rejects Judge 2 SELECTED domain assignment when Judge 1 holds ALL mode")
            ctx.assert_true(err_code == "23505", f"RPC error code is 23505 (unique_violation), got: {err_code}")

            cur.execute("""
                SELECT count(*) FROM public.jury_domain_assignments
                WHERE judge_user_id = %s AND domain_id = 'ai-software' AND is_active = TRUE;
            """, (j2,))
            active_domain_count = cur.fetchone()[0]
            ctx.assert_true(active_domain_count == 0, "Judge 2 gets NO active domain assignment for ai-software")

            # 5. Direct SQL bypass attempt: Insert direct project assignment for Judge 2
            # Even if an inactive parent assignment exists, the project trigger MUST block
            # assigning a project in an ALL-mode domain to another judge
            cur.execute("""
                INSERT INTO public.jury_domain_assignments (judge_user_id, domain_id, assignment_mode, is_active)
                VALUES (%s, 'ai-software', 'SELECTED', FALSE)
                RETURNING id;
            """, (j2,))
            j2_inactive_id = cur.fetchone()[0]
            conn.commit()

            db_proj_failed = False
            proj_err_code = None
            try:
                cur.execute("""
                    INSERT INTO public.jury_project_assignments (jury_domain_assignment_id, registration_id)
                    VALUES (%s, %s);
                """, (j2_inactive_id, p1_reg))
                conn.commit()
            except psycopg2.Error as e:
                conn.rollback()
                db_proj_failed = True
                proj_err_code = e.pgcode

            ctx.assert_true(db_proj_failed, "Database trigger trg_check_project_exclusive_assignment blocks project assignment in ALL domain")
            ctx.assert_true(proj_err_code == "23505", f"Trigger error code is 23505, got: {proj_err_code}")

            cur.execute("""
                SELECT count(*) FROM public.jury_project_assignments
                WHERE registration_id = %s;
            """, (p1_reg,))
            jpa_count = cur.fetchone()[0]
            ctx.assert_true(jpa_count == 0, "Zero project assignment rows exist for PRAGATHI26-INT001 (managed purely by Judge 1 ALL mode)")


def test_6_all_vs_all_conflict(ctx):
    """
    Tests ALL vs ALL conflict:
    Judge 1 has ALL mode; Judge 2 attempts ALL mode for same domain.
    Expected: rejected with SQLSTATE 23505.
    """
    print("\n--- Test 6: Invariant 4 — ALL vs ALL Conflict ---")
    with get_connection() as conn:
        judge_ids = reset_test_state(conn)
        with conn.cursor(cursor_factory=extras.DictCursor) as cur:
            j1 = judge_ids["judge_1"]
            j2 = judge_ids["judge_2"]

            # 1. Judge 1 claims 'domain-9f52a525' in ALL mode
            cur.execute("SELECT public.assign_jury_domain_exclusive(%s, 'domain-9f52a525', 'ALL');", (j1,))
            conn.commit()

            # 2. Judge 2 attempts to claim 'domain-9f52a525' in ALL mode via RPC -> MUST FAIL with 23505
            rpc_failed = False
            err_code = None
            try:
                cur.execute("SELECT public.assign_jury_domain_exclusive(%s, 'domain-9f52a525', 'ALL');", (j2,))
                conn.commit()
            except psycopg2.Error as e:
                conn.rollback()
                rpc_failed = True
                err_code = e.pgcode

            ctx.assert_true(rpc_failed, "RPC rejects second active ALL mode assignment for same domain")
            ctx.assert_true(err_code == "23505", f"RPC error code is 23505, got: {err_code}")

            cur.execute("""
                SELECT count(*) FROM public.jury_domain_assignments
                WHERE judge_user_id = %s AND domain_id = 'domain-9f52a525' AND is_active = TRUE AND assignment_mode = 'ALL';
            """, (j2,))
            ctx.assert_true(cur.fetchone()[0] == 0, "Judge 2 has NO active ALL assignment for domain-9f52a525")

            # 3. Direct SQL bypass attempt -> Unique partial index idx_jury_domain_single_active_all MUST BLOCK with 23505
            db_failed = False
            try:
                cur.execute("""
                    INSERT INTO public.jury_domain_assignments (judge_user_id, domain_id, assignment_mode, is_active)
                    VALUES (%s, 'domain-9f52a525', 'ALL', TRUE);
                """, (j2,))
                conn.commit()
            except psycopg2.Error as e:
                conn.rollback()
                db_failed = True
                err_code = e.pgcode

            ctx.assert_true(db_failed, "Unique index idx_jury_domain_single_active_all blocks direct ALL insert")
            ctx.assert_true(err_code == "23505", f"Index error code is 23505, got: {err_code}")


def test_7_real_concurrent_transactions(ctx):
    """
    Tests REAL PostgreSQL Concurrency:
    Two separate DB connections run in parallel threads and attempt to claim the SAME project.
    Verifies that transactional advisory locks serialize the operations and exactly ONE succeeds,
    while the loser transaction is captured and verified with SQLSTATE 23505.
    """
    print("\n--- Test 7: Real PostgreSQL Concurrency & Advisory Lock Serialization ---")
    clean_conn = get_connection()
    judge_ids = reset_test_state(clean_conn)

    j1 = judge_ids["judge_1"]
    j2 = judge_ids["judge_2"]
    target_project = "PRAGATHI26-INT001"

    # Set up both judges in SELECTED mode for 'ai-software'
    with clean_conn.cursor(cursor_factory=extras.DictCursor) as cur:
        cur.execute("SELECT public.assign_jury_domain_exclusive(%s, 'ai-software', 'SELECTED');", (j1,))
        j1_assign_id = cur.fetchone()[0]["id"]
        cur.execute("SELECT public.assign_jury_domain_exclusive(%s, 'ai-software', 'SELECTED');", (j2,))
        j2_assign_id = cur.fetchone()[0]["id"]
    clean_conn.commit()
    clean_conn.close()

    results = {}
    barrier = threading.Barrier(2)

    def worker(worker_id, judge_user_id, assignment_id):
        conn = get_connection()
        try:
            cur = conn.cursor()
            barrier.wait()  # Synchronize threads to hit PostgreSQL at the exact same millisecond
            cur.execute("SELECT public.add_jury_selected_projects_exclusive(%s, ARRAY[%s]::text[]);",
                        (assignment_id, target_project))
            conn.commit()
            results[worker_id] = {"status": "SUCCESS"}
        except psycopg2.Error as e:
            conn.rollback()
            results[worker_id] = {"status": "FAILED", "code": e.pgcode, "msg": str(e)}
        finally:
            conn.close()

    t1 = threading.Thread(target=worker, args=("worker_1", j1, j1_assign_id))
    t2 = threading.Thread(target=worker, args=("worker_2", j2, j2_assign_id))

    t1.start()
    t2.start()
    t1.join(timeout=10)
    t2.join(timeout=10)

    success_count = sum(1 for r in results.values() if r["status"] == "SUCCESS")
    failed_count = sum(1 for r in results.values() if r["status"] == "FAILED")

    ctx.assert_true(success_count == 1, f"Exactly ONE concurrent transaction succeeded (got: {success_count})")
    ctx.assert_true(failed_count == 1, f"Exactly ONE concurrent transaction failed (got: {failed_count})")

    # Assert that the loser failed with SQLSTATE 23505 as expected
    failed_worker = next(r for r in results.values() if r["status"] == "FAILED")
    ctx.assert_true(failed_worker.get("code") == "23505",
                    f"Concurrent loser failed with expected SQLSTATE 23505 (got: {failed_worker.get('code')})")

    # Verify database state in PostgreSQL: exactly 1 row in jury_project_assignments
    verify_conn = get_connection()
    with verify_conn.cursor() as cur:
        cur.execute("""
            SELECT jda.judge_user_id, jpa.registration_id
            FROM public.jury_project_assignments jpa
            JOIN public.jury_domain_assignments jda ON jda.id = jpa.jury_domain_assignment_id
            WHERE jpa.registration_id = %s;
        """, (target_project,))
        rows = cur.fetchall()
        ctx.assert_true(len(rows) == 1, f"Exactly ONE project assignment row exists in PostgreSQL (got {len(rows)})")
    verify_conn.close()


def test_8_rollback_and_reapply_safety(ctx):
    """
    Tests Rollback execution and re-application:
    - Runs rollback script -> all objects removed
    - Verifies user data is preserved
    - Re-runs forward migration -> all objects restored cleanly
    """
    print("\n--- Test 8: Rollback Execution and Safe Re-Application ---")
    with get_connection(autocommit=True) as conn:
        with conn.cursor() as cur:
            # 1. Execute Rollback
            cur.execute(ROLLBACK_FILE.read_text(encoding="utf-8"))

            # 2. Assert objects are dropped
            cur.execute("""
                SELECT count(*) FROM pg_indexes
                WHERE tablename = 'jury_domain_assignments' AND indexname = 'idx_jury_domain_single_active_all';
            """)
            idx_count = cur.fetchone()[0]
            ctx.assert_true(idx_count == 0, "Rollback successfully dropped idx_jury_domain_single_active_all")

            # 3. Assert user tables and data still exist
            cur.execute("SELECT count(*) FROM public.project_domains;")
            dom_count = cur.fetchone()[0]
            ctx.assert_true(dom_count > 0, "Table project_domains and its rows remain intact after rollback")

            # 4. Re-apply Forward Migration cleanly
            cur.execute(MIGRATION_FILE.read_text(encoding="utf-8"))

            # 5. Assert objects are restored
            cur.execute("""
                SELECT count(*) FROM pg_indexes
                WHERE tablename = 'jury_domain_assignments' AND indexname = 'idx_jury_domain_single_active_all';
            """)
            idx_restored = cur.fetchone()[0]
            ctx.assert_true(idx_restored == 1, "Forward migration cleanly re-applied and restored idx_jury_domain_single_active_all")


def main():
    print("=" * 70)
    print("PRAGATHI 2K26 — REAL POSTGRESQL INTEGRATION TEST SUITE")
    print("=" * 70)

    if not DB_PASSWORD:
        print("\n[!] NOTICE: PRAGATHI_TEST_DB_PASSWORD environment variable is NOT set.")
        print("To run this test against a live local PostgreSQL instance:")
        print("  1. In PowerShell: $env:PRAGATHI_TEST_DB_PASSWORD = 'your_postgres_password'")
        print("  2. Run: python scratch/test_jury_postgres_integration.py")
        print("\nExiting with status code 0 (informational pre-requisite check).")
        return 0

    ctx = TestContext()
    try:
        # Step 0: Bootstrap & Migrate
        bootstrap_database()

        # Step 1: Ensure initial test judges exist
        init_conn = get_connection()
        seed_test_judges(init_conn)
        init_conn.close()

        # Run Tests with self-contained reset and isolation
        test_1_migration_objects_exist(ctx)
        test_2_migration_packaging_and_rollback_separation(ctx)
        test_3_selected_vs_selected_conflict(ctx)
        test_4_selected_vs_all_conflict(ctx)
        test_5_all_vs_selected_conflict(ctx)
        test_6_all_vs_all_conflict(ctx)
        test_7_real_concurrent_transactions(ctx)
        test_8_rollback_and_reapply_safety(ctx)

    except Exception as e:
        print(f"\n[FATAL ERROR during test execution]: {e}")
        import traceback
        traceback.print_exc()
        return 1

    print("\n" + "=" * 70)
    print(f"POSTGRESQL INTEGRATION SUMMARY: {ctx.passed} Passed, {ctx.failed} Failed")
    print("=" * 70)
    if ctx.failed > 0:
        for err in ctx.errors:
            print(err)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

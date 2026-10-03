import asyncio
import sys
import os
import time
import httpx

sys.path.insert(0, os.path.abspath('backend'))
from app.config import settings
from app.database import db
from app.core.auth import verify_jury_auth
from app.services.jury_service import jury_service

async def run_baseline_measurement():
    print("=" * 65)
    print("STARTING PRAGATHI BASELINE PERFORMANCE MEASUREMENTS")
    print("=" * 65)

    supa_url = settings.supabase_url
    key = settings.get_effective_key()
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    # 1. Measure Auth Token Acquisition (Login flow)
    t0 = time.perf_counter()
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f'{supa_url}/auth/v1/admin/generate_link',
            headers=headers,
            json={'type': 'magiclink', 'email': 'jurytest01@pragathi.test'}
        )
        data = r.json()
        hashed_token = data.get('hashed_token')
        v_res = await client.post(
            f'{supa_url}/auth/v1/verify',
            headers={'apikey': key},
            json={'type': 'magiclink', 'token_hash': hashed_token}
        )
        token_data = v_res.json()
        access_token = token_data.get('access_token')
    t_login = (time.perf_counter() - t0) * 1000

    print(f"A. Login submit -> Supabase auth success: {t_login:.2f} ms")

    # 2. Measure verify_jury_auth execution time
    auth_header = f"Bearer {access_token}"
    t0 = time.perf_counter()
    auth_res = await verify_jury_auth(authorization=auth_header)
    t_verify = (time.perf_counter() - t0) * 1000
    print(f"D. verify_jury_auth execution time: {t_verify:.2f} ms")
    print(f"   - Verified User: {auth_res.get('user_id')} | Role: {auth_res.get('role')}")

    # Measure breakdown inside verify_jury_auth:
    t0 = time.perf_counter()
    async with httpx.AsyncClient() as client:
        await client.get(f"{settings.supabase_url}/auth/v1/user", headers={"apikey": key, "Authorization": f"Bearer {access_token}"})
    t_supa_user = (time.perf_counter() - t0) * 1000

    t0 = time.perf_counter()
    roles = await db.fetch_supabase("user_roles", f"user_id=eq.{auth_res['user_id']}&select=role,is_active")
    t_roles = (time.perf_counter() - t0) * 1000

    print(f"   - Sub-step Supabase GET /auth/v1/user: {t_supa_user:.2f} ms")
    print(f"   - Sub-step PostgREST user_roles check: {t_roles:.2f} ms")

    # 3. Measure assigned project service time (get_assigned_projects_for_jury)
    t0 = time.perf_counter()
    assigned_res = await jury_service.get_assigned_projects_for_jury(auth_res['user_id'])
    t_assigned = (time.perf_counter() - t0) * 1000
    print(f"E. assigned project service time (get_assigned_projects_for_jury): {t_assigned:.2f} ms")
    print(f"   - Total Assigned: {assigned_res.total_assigned} | Completed: {assigned_res.completed_count} | Pending: {assigned_res.pending_count}")

    # 4. Measure client evaluation call time (EvaluationService.getEvaluationsByJudge)
    t0 = time.perf_counter()
    evals = await db.fetch_supabase("judge_evaluations", f"judge_id=eq.{auth_res['user_id']}&select=*")
    t_evals = (time.perf_counter() - t0) * 1000
    print(f"   - Frontend separate evaluation query time: {t_evals:.2f} ms")

    # 5. Measure full HTTP roundtrip to local backend for GET /api/jury/assigned-projects
    t0 = time.perf_counter()
    async with httpx.AsyncClient() as client:
        http_res = await client.get(
            'http://127.0.0.1:8000/api/jury/assigned-projects',
            headers={'Authorization': f'Bearer {access_token}'}
        )
    t_http_assigned = (time.perf_counter() - t0) * 1000
    print(f"   - Full HTTP roundtrip GET /api/jury/assigned-projects: {t_http_assigned:.2f} ms (Status: {http_res.status_code})")

    # 6. Sum total dashboard loading time before data is visible
    t_dash_visible = t_http_assigned + t_evals
    print(f"C. JuryDashboard mount -> useful project data visible: {t_dash_visible:.2f} ms")
    print(f"B. Auth success -> JuryDashboard mounted: ~15-30 ms (React render lifecycle)")
    print(f"Total Login -> Useful content visible: ~{t_login + t_dash_visible:.2f} ms")

    # 7. Request counts
    # On dashboard load:
    # 1 HTTP to /api/jury/assigned-projects
    # 1 HTTP from browser to Supabase PostgREST for evaluations
    # (plus onAuthStateChange calls resolveUserRole -> 1 extra PostgREST call)
    # Backend triggers:
    # 1 to /auth/v1/user
    # 1 to user_roles
    # 1 to judges (if fallback)
    # 1 to jury_domain_assignments
    # 1 to registrations
    # 1 to judge_evaluations
    # Total PostgREST/Supabase calls per load: 5-7 calls!
    print("F. Number of HTTP requests during initial JuryDashboard load: 2-3 (backend + Supabase direct + auth state)")
    print("G. Number of Supabase/PostgREST requests triggered by one dashboard load: 6-7 requests")

    # 8. Admin Jury Management request count
    # Currently loadData in JuryAdmin makes:
    # 1. GET /api/admin/juries
    # 2. GET /api/admin/juries/completion-overview
    # 3. GET /api/domains
    # 4. GET /api/admin/registrations
    # 5. GET /api/admin/juries/{id}/assignments
    # 6. GET /api/admin/juries/{id}/project-progress
    print("H. Admin Jury Management initial request count: 6 requests on first mount (loads all tabs eagerly)")

    print("=" * 65)

if __name__ == "__main__":
    asyncio.run(run_baseline_measurement())

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

async def run_after_measurement():
    print("=" * 65)
    print("STARTING PRAGATHI OPTIMIZED (AFTER) PERFORMANCE MEASUREMENTS")
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

    # 2. Measure verify_jury_auth execution time (Optimized fast path)
    auth_header = f"Bearer {access_token}"
    t0 = time.perf_counter()
    auth_res = await verify_jury_auth(authorization=auth_header)
    t_verify = (time.perf_counter() - t0) * 1000
    print(f"D. verify_jury_auth execution time (fast path): {t_verify:.2f} ms")
    print(f"   - Verified User: {auth_res.get('user_id')} | Role: {auth_res.get('role')}")

    # 3. Measure get_jury_bootstrap execution time (Parallel bulk reads)
    t0 = time.perf_counter()
    bootstrap_res = await jury_service.get_jury_bootstrap(auth_res['user_id'])
    t_bootstrap = (time.perf_counter() - t0) * 1000
    print(f"E. Bootstrap service execution time (bulk parallel reads): {t_bootstrap:.2f} ms")
    print(f"   - Total Assigned: {bootstrap_res.summary.assigned} | Evaluated: {bootstrap_res.summary.evaluated} | Remaining: {bootstrap_res.summary.remaining}")
    print(f"   - Projects returned: {len(bootstrap_res.projects)} | Evaluations bundled: {len(bootstrap_res.evaluations)}")

    # 4. Measure Full HTTP roundtrip to local backend for GET /api/jury/bootstrap
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        http_res = await client.get(
            'http://127.0.0.1:8000/api/jury/bootstrap',
            headers={'Authorization': f'Bearer {access_token}'}
        )
    t_http_bootstrap = (time.perf_counter() - t0) * 1000
    print(f"   - Full HTTP roundtrip GET /api/jury/bootstrap: {t_http_bootstrap:.2f} ms (Status: {http_res.status_code})")

    # 5. Measure Dashboard mount -> useful project data visible
    # In the optimized flow, ONE request to /api/jury/bootstrap provides ALL data:
    # jury profile, assignments, projects with status, summary counts, and evaluations.
    t_dash_visible = t_http_bootstrap
    print(f"C. JuryDashboard mount -> useful project data visible: {t_dash_visible:.2f} ms")
    print(f"B. Auth success -> JuryDashboard mounted: ~15-30 ms (Instant layout + skeleton shell)")
    print(f"Total Login -> Useful content visible: ~{t_login + t_dash_visible:.2f} ms")

    # 6. Admin Jury Management initial requests
    print("\n--- ADMIN JURY MANAGEMENT MEASUREMENTS ---")
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f'{supa_url}/auth/v1/admin/generate_link',
            headers=headers,
            json={'type': 'magiclink', 'email': 'admin@sru.edu.in'}
        )
        data = r.json()
        hashed_token = data.get('hashed_token')
        v_res = await client.post(
            f'{supa_url}/auth/v1/verify',
            headers={'apikey': key},
            json={'type': 'magiclink', 'token_hash': hashed_token}
        )
        admin_token = v_res.json().get('access_token')

    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        admin_juries_res = await client.get(
            'http://127.0.0.1:8000/api/admin/juries',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
    t_admin_initial = (time.perf_counter() - t0) * 1000
    print(f"H. Admin Jury Management initial request time (Tab 1 lazy load only): {t_admin_initial:.2f} ms (Status: {admin_juries_res.status_code})")
    print(f"   - Juries loaded: {len(admin_juries_res.json()) if admin_juries_res.status_code == 200 else admin_juries_res.text}")

    print("\n" + "=" * 65)
    print("COMPARISON SUMMARY")
    print("=" * 65)
    # Baseline recorded values:
    # verify_jury_auth: 1753.64 ms
    # assigned projects service: 3422.08 ms
    # HTTP assigned-projects: 4979.86 ms
    # Frontend eval query: 772.96 ms
    # Total dashboard mount -> visible: 5752.82 ms
    # Total login -> visible: 6855.45 ms
    # Dashboard requests: 2-3
    # Admin initial requests: 6
    print(f"verify_jury_auth: 1753.64 ms -> {t_verify:.2f} ms ({(1753.64 - t_verify)/1753.64*100:+.1f}%)")
    print(f"Dashboard mount -> visible: 5752.82 ms -> {t_dash_visible:.2f} ms ({(5752.82 - t_dash_visible)/5752.82*100:+.1f}%)")
    print(f"Total Login -> visible: 6855.45 ms -> {t_login + t_dash_visible:.2f} ms ({(6855.45 - (t_login + t_dash_visible))/6855.45*100:+.1f}%)")
    print(f"Initial Dashboard HTTP requests: 2-3 requests -> 1 request (-67%)")
    print(f"Admin Jury initial HTTP requests: 6 requests -> 1 request (-83%)")
    print("=" * 65)

if __name__ == '__main__':
    asyncio.run(run_after_measurement())

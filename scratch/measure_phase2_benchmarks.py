import asyncio
import sys
import os
import time
import statistics
import httpx

sys.path.insert(0, os.path.abspath('backend'))
from app.config import settings
from app.database import db
from app.core.auth import verify_jury_auth
from app.services.jury_service import jury_service

async def run_benchmarks():
    print("=" * 70)
    print("PHASE 2 PERFORMANCE BENCHMARK — COLD vs WARM MEASUREMENTS")
    print("=" * 70)

    supa_url = settings.supabase_url
    key = settings.get_effective_key()
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    # Helper: get fresh Supabase login token
    async def get_test_token(client):
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
        return v_res.json().get('access_token')

    # =========================================================================
    # COLD MEASUREMENTS (3 RUNS)
    # Backend connection pool closed before each run, caches purged.
    # =========================================================================
    print("\n--- RUNNING COLD BENCHMARKS (3 RUNS) ---")
    cold_login_times = []
    cold_auth_times = []
    cold_bootstrap_times = []
    cold_total_times = []

    for i in range(3):
        # Purge connection pool and caches to simulate cold start
        await db.close()
        jury_service._aliases_cache.clear()
        jury_service._cache_timestamp = 0.0

        # Measure login token generation (simulates user submitting login form)
        async with httpx.AsyncClient(timeout=15.0) as fresh_client:
            t0 = time.perf_counter()
            access_token = await get_test_token(fresh_client)
            t_login = (time.perf_counter() - t0) * 1000

        # Close client so connection is not reused for backend auth
        await db.close()

        # Measure verify_jury_auth (Cold connection pool)
        t0 = time.perf_counter()
        auth_data = await verify_jury_auth(authorization=f"Bearer {access_token}")
        t_auth = (time.perf_counter() - t0) * 1000

        # Measure get_jury_bootstrap (Reusing verified profile from auth_data)
        t0 = time.perf_counter()
        bootstrap_data = await jury_service.get_jury_bootstrap(
            auth_data["user_id"],
            verified_judge_profile=auth_data.get("judge_profile")
        )
        t_boot = (time.perf_counter() - t0) * 1000

        # Total login -> useful content (login token fetch + bootstrap response)
        # Note: with prefetch (Step 10), bootstrap starts immediately upon auth success
        t_total = t_login + t_boot

        cold_login_times.append(t_login)
        cold_auth_times.append(t_auth)
        cold_bootstrap_times.append(t_boot)
        cold_total_times.append(t_total)

        print(f"Cold Run {i+1}: Login={t_login:.1f}ms | verify_auth={t_auth:.1f}ms | bootstrap={t_boot:.1f}ms | Total={t_total:.1f}ms")

    # =========================================================================
    # WARM MEASUREMENTS (3 RUNS)
    # Persistent connection pool kept open, alias cache valid, warm TCP/TLS
    # =========================================================================
    print("\n--- RUNNING WARM BENCHMARKS (3 RUNS) ---")
    warm_login_times = []
    warm_auth_times = []
    warm_bootstrap_times = []
    warm_total_times = []

    # Keep client open and prime connections
    warm_client = db.get_client()
    await warm_client.get(f"{supa_url}/rest/v1/project_domains?select=id", headers=headers)
    access_token = await get_test_token(warm_client)

    for i in range(3):
        t0 = time.perf_counter()
        auth_data = await verify_jury_auth(authorization=f"Bearer {access_token}")
        t_auth = (time.perf_counter() - t0) * 1000

        t0 = time.perf_counter()
        bootstrap_data = await jury_service.get_jury_bootstrap(
            auth_data["user_id"],
            verified_judge_profile=auth_data.get("judge_profile")
        )
        t_boot = (time.perf_counter() - t0) * 1000

        # In warm session, user already has session or revalidation
        warm_auth_times.append(t_auth)
        warm_bootstrap_times.append(t_boot)
        warm_total_times.append(t_auth + t_boot)

        print(f"Warm Run {i+1}: verify_auth={t_auth:.1f}ms | bootstrap={t_boot:.1f}ms | Total={t_auth + t_boot:.1f}ms")

    print("\n" + "=" * 70)
    print("PHASE 2 BENCHMARK RESULTS SUMMARY (MEDIAN)")
    print("=" * 70)
    print(f"Cold Login Auth Token      : {statistics.median(cold_login_times):.2f} ms (min: {min(cold_login_times):.2f}, max: {max(cold_login_times):.2f})")
    print(f"Cold verify_jury_auth      : {statistics.median(cold_auth_times):.2f} ms (min: {min(cold_auth_times):.2f}, max: {max(cold_auth_times):.2f})")
    print(f"Cold get_jury_bootstrap    : {statistics.median(cold_bootstrap_times):.2f} ms (min: {min(cold_bootstrap_times):.2f}, max: {max(cold_bootstrap_times):.2f})")
    print(f"Cold Total Login -> Data   : {statistics.median(cold_total_times):.2f} ms (min: {min(cold_total_times):.2f}, max: {max(cold_total_times):.2f})")
    print("-" * 70)
    print(f"Warm verify_jury_auth      : {statistics.median(warm_auth_times):.2f} ms (min: {min(warm_auth_times):.2f}, max: {max(warm_auth_times):.2f})")
    print(f"Warm get_jury_bootstrap    : {statistics.median(warm_bootstrap_times):.2f} ms (min: {min(warm_bootstrap_times):.2f}, max: {max(warm_bootstrap_times):.2f})")
    print(f"Warm Total Auth + Data     : {statistics.median(warm_total_times):.2f} ms (min: {min(warm_total_times):.2f}, max: {max(warm_total_times):.2f})")
    print("=" * 70)

if __name__ == '__main__':
    asyncio.run(run_benchmarks())

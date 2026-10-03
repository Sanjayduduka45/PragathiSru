import asyncio
import sys
import os
import time
import statistics
import httpx

sys.path.insert(0, os.path.abspath('backend'))
from app.config import settings
from app.database import db

async def profile_calls():
    print("=" * 70)
    print("PHASE 2: PROFILING INDIVIDUAL REMOTE CALLS")
    print("=" * 70)

    supa_url = settings.supabase_url
    key = settings.get_effective_key()
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json'
    }

    # Step 1: Obtain Jury Token
    print("\n[1] Obtaining Jury Test Token...")
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
        user_id = token_data.get('user', {}).get('id')

    print(f"Jury User ID: {user_id}")
    print(f"Token obtained: {access_token[:20]}...")

    # We will run 3 full rounds of individual profiling.
    # In each round, we measure:
    # 1. New client (cold connection) vs Reused client (warm connection)
    # 2. Every single endpoint call individually

    call_definitions = [
        # AUTH CALLS
        ("AUTH: Supabase token/user verification (/auth/v1/user)",
         "GET", f"{supa_url}/auth/v1/user", {"apikey": key, "Authorization": f"Bearer {access_token}"}, None),
        ("AUTH: user_roles by user_id",
         "GET", f"{supa_url}/rest/v1/user_roles?user_id=eq.{user_id}&select=role,is_active", headers, None),
        ("AUTH: judges by user_id (id, is_active)",
         "GET", f"{supa_url}/rest/v1/judges?user_id=eq.{user_id}&select=id,is_active", headers, None),
        
        # BOOTSTRAP CALLS
        ("BOOTSTRAP: jury_domain_assignments",
         "GET", f"{supa_url}/rest/v1/jury_domain_assignments?judge_user_id=eq.{user_id}&is_active=eq.true", headers, None),
        ("BOOTSTRAP: judges profile (id,user_id,name,email,department,is_active)",
         "GET", f"{supa_url}/rest/v1/judges?user_id=eq.{user_id}&select=id,user_id,name,email,department,is_active", headers, None),
        ("BOOTSTRAP: registrations/projects (CURRENT FULL JOIN: *,projects(*),institutions(*),team_members(*))",
         "GET", f"{supa_url}/rest/v1/registrations?select=*,projects(*),institutions(*),team_members(*)", headers, None),
        ("BOOTSTRAP: registrations/projects (OPTIMIZED: minimal fields needed)",
         "GET", f"{supa_url}/rest/v1/registrations?select=registration_id,team_name,category,project_title,institution_name,leader_name,projects(title,category,problem_statement,proposed_solution,innovation,expected_outcomes),team_members(name,email,is_team_leader)", headers, None),
        ("BOOTSTRAP: judge_evaluations",
         "GET", f"{supa_url}/rest/v1/judge_evaluations?judge_id=eq.{user_id}&order=created_at.desc", headers, None),
        ("BOOTSTRAP: project_domains",
         "GET", f"{supa_url}/rest/v1/project_domains?select=id,title", headers, None),
        ("BOOTSTRAP: domain_aliases refresh",
         "GET", f"{supa_url}/rest/v1/domain_aliases?is_active=eq.true&select=alias_text,domain_id", headers, None),
        ("BOOTSTRAP: selected assignments (jury_project_assignments)",
         "GET", f"{supa_url}/rest/v1/jury_project_assignments?select=registration_id,jury_domain_assignment_id&limit=10", headers, None),
    ]

    print("\n--- MEASURING CONNECTION OVERHEAD (COLD vs WARM) ---")
    cold_times = []
    warm_times = []
    for i in range(3):
        # Cold: brand new client (fresh DNS/TCP/TLS)
        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=10.0) as fresh_client:
            res = await fresh_client.get(f"{supa_url}/auth/v1/user", headers={"apikey": key, "Authorization": f"Bearer {access_token}"})
        t_cold = (time.perf_counter() - t0) * 1000
        cold_times.append(t_cold)

        # Warm: reused client (warm keep-alive connection)
        async with httpx.AsyncClient(timeout=10.0) as persistent_client:
            # Prime connection
            await persistent_client.get(f"{supa_url}/auth/v1/user", headers={"apikey": key, "Authorization": f"Bearer {access_token}"})
            t0 = time.perf_counter()
            res = await persistent_client.get(f"{supa_url}/auth/v1/user", headers={"apikey": key, "Authorization": f"Bearer {access_token}"})
            t_warm = (time.perf_counter() - t0) * 1000
            warm_times.append(t_warm)

    print(f"Cold (New TCP/TLS)   : min={min(cold_times):.2f}ms | median={statistics.median(cold_times):.2f}ms | max={max(cold_times):.2f}ms")
    print(f"Warm (Reused TCP/TLS): min={min(warm_times):.2f}ms | median={statistics.median(warm_times):.2f}ms | max={max(warm_times):.2f}ms")
    print(f"TCP/TLS Overhead per request: ~{statistics.median(cold_times) - statistics.median(warm_times):.2f}ms !")

    print("\n--- INDIVIDUAL CALL PROFILING (3 RUNS EACH - COLD vs REUSED) ---")

    # Measure each call with fresh client (current database.py behavior)
    results_fresh = {name: [] for name, _, _, _, _ in call_definitions}
    payload_sizes = {}

    for round_num in range(3):
        print(f"\nRound {round_num + 1}/3 (Fresh Client per call - Current Behavior):")
        for name, method, url, hdrs, body in call_definitions:
            t0 = time.perf_counter()
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(url, headers=hdrs)
            dt = (time.perf_counter() - t0) * 1000
            results_fresh[name].append(dt)
            payload_sizes[name] = len(res.content)
            print(f"  [{res.status_code}] {name[:45]:<45}: {dt:6.2f} ms ({len(res.content)} bytes)")

    # Measure each call with Reused Persistent client
    results_reused = {name: [] for name, _, _, _, _ in call_definitions}
    async with httpx.AsyncClient(timeout=15.0) as persistent_client:
        # Warm the connection first
        await persistent_client.get(f"{supa_url}/rest/v1/project_domains?select=id", headers=headers)

        for round_num in range(3):
            print(f"\nRound {round_num + 1}/3 (Reused Connection Pool):")
            for name, method, url, hdrs, body in call_definitions:
                t0 = time.perf_counter()
                res = await persistent_client.get(url, headers=hdrs)
                dt = (time.perf_counter() - t0) * 1000
                results_reused[name].append(dt)
                print(f"  [{res.status_code}] {name[:45]:<45}: {dt:6.2f} ms")

    print("\n" + "=" * 80)
    print("INDIVIDUAL PROFILING SUMMARY TABLE")
    print("=" * 80)
    print(f"{'Call Name':<50} | {'Fresh Min/Med/Max (ms)':<25} | {'Reused Min/Med/Max (ms)':<25} | Payload")
    print("-" * 115)
    for name, _, _, _, _ in call_definitions:
        f_min = min(results_fresh[name])
        f_med = statistics.median(results_fresh[name])
        f_max = max(results_fresh[name])
        r_min = min(results_reused[name])
        r_med = statistics.median(results_reused[name])
        r_max = max(results_reused[name])
        bytes_len = payload_sizes.get(name, 0)
        print(f"{name[:50]:<50} | {f_min:5.1f} / {f_med:5.1f} / {f_max:5.1f} | {r_min:5.1f} / {r_med:5.1f} / {r_max:5.1f} | {bytes_len:>7} B")

    print("=" * 80)

if __name__ == '__main__':
    asyncio.run(profile_calls())

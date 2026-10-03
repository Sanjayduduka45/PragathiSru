import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import asyncio
from app.database import db

async def test_read():
    print("--- FETCHING JUDGES ---")
    judges = await db.fetch_supabase("judges")
    print("judges count:", len(judges) if judges else None)
    print("judges raw:", judges)

    print("\n--- FETCHING ASSIGNMENTS ---")
    assignments = await db.fetch_supabase("jury_domain_assignments")
    print("assignments count:", len(assignments) if assignments else None)
    print("assignments raw:", assignments)

    print("\n--- FETCHING USER_ROLES ---")
    roles = await db.fetch_supabase("user_roles")
    print("roles count:", len(roles) if roles else None)
    if roles:
        jury_roles = [r for r in roles if str(r.get("role", "")).lower() in ("jury", "judge")]
        print("jury_roles count:", len(jury_roles))
        print("jury_roles raw:", jury_roles)

if __name__ == "__main__":
    asyncio.run(test_read())

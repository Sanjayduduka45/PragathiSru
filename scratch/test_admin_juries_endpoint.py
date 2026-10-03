import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.auth import verify_admin_auth

async def test_endpoint():
    # Override auth to simulate verified admin session for the test
    app.dependency_overrides[verify_admin_auth] = lambda: {
        "authenticated": True,
        "auth_type": "supabase_jwt",
        "user_id": "55a33fe7-683e-4bde-bc35-d2395f3dadf9",
        "email": "admin@sru.edu.in",
        "role": "admin"
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/admin/juries")
        print("GET /api/admin/juries STATUS:", res.status_code)
        print("GET /api/admin/juries JSON:", res.json())

        if res.status_code == 200 and len(res.json()) > 0:
            uid = res.json()[0]["user_id"]
            assign_res = await client.get(f"/api/admin/juries/{uid}/assignments")
            print(f"GET /api/admin/juries/{uid}/assignments STATUS:", assign_res.status_code)
            print(f"GET /api/admin/juries/{uid}/assignments JSON:", assign_res.json())

    app.dependency_overrides.clear()

if __name__ == "__main__":
    asyncio.run(test_endpoint())

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

import asyncio
from app.services.jury_service import jury_service

async def test_assignments():
    juries = await jury_service.list_juries()
    print("list_juries() returned:", juries)
    if juries:
        uid = juries[0].user_id
        assignments = await jury_service.get_jury_assignments(uid)
        print("get_jury_assignments() returned:", assignments)

if __name__ == "__main__":
    asyncio.run(test_assignments())

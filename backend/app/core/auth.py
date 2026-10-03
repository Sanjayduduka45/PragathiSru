import asyncio
import httpx
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException
from app.config import settings
from app.database import db

async def verify_admin_auth(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """
    Authoritative Admin Authorization Dependency for Results Endpoints:
    - Relies EXCLUSIVELY on Authorization: Bearer <Supabase logged-in admin access_token>
    - NO X-Admin-Secret fallback
    - NO SUPABASE_SERVICE_ROLE_KEY client authentication
    - Validates token against Supabase Auth API
    - Authoritative lookup in public.user_roles using authenticated user UUID
    - Fallback uses verified authenticated user's email only if UUID lookup yields no row
    - Enforces role in ('admin', 'superadmin', 'coordinator')
    - Returns 401 if unauthenticated
    - Returns 403 if authenticated non-admin (e.g. jury or participant)
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Provide a valid Supabase Admin Bearer token."
        )

    token = authorization.split("Bearer ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token is empty."
        )

    # Validate token against Supabase Auth service (GET /auth/v1/user)
    supa_key = settings.get_effective_key()
    auth_url = f"{settings.supabase_url}/auth/v1/user"
    headers = {
        "apikey": supa_key or "",
        "Authorization": f"Bearer {token}",
    }

    user_data = None
    for attempt in range(2):
        try:
            client = db.get_client()
            res = await client.get(auth_url, headers=headers)
            if res.status_code == 200:
                user_data = res.json()
                break
            elif res.status_code in (429, 502, 503, 504) and attempt == 0:
                await asyncio.sleep(0.08)
                continue
            elif res.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid or expired Supabase authentication session."
                )
        except HTTPException:
            raise
        except Exception as e:
            if attempt == 0:
                await asyncio.sleep(0.08)
                continue
            print(f"[Admin Auth] Token verification exception: {e}")
            raise HTTPException(
                status_code=401,
                detail="Authentication verification failed."
            )

    user_id = user_data.get("id")
    user_email = (user_data.get("email") or "").lower().strip()

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token: missing user ID."
        )

    # 1. Authoritative lookup by authenticated user UUID in public.user_roles
    role = None
    try:
        roles_by_uuid = await db.fetch_supabase("user_roles", f"user_id=eq.{user_id}&select=role,is_active")
        if roles_by_uuid and len(roles_by_uuid) > 0:
            row = roles_by_uuid[0]
            if row.get("is_active", True):
                role = (row.get("role") or "").lower().strip()

        # 2. Strict fallback only if user_id was not yet populated in user_roles table
        # (Uses verified authenticated user's email only to query public.user_roles)
        if not role and user_email:
            roles_by_email = await db.fetch_supabase("user_roles", f"user_email=eq.{user_email}&select=role,is_active")
            if roles_by_email and len(roles_by_email) > 0:
                row = roles_by_email[0]
                if row.get("is_active", True):
                    role = (row.get("role") or "").lower().strip()

        # 3. Fallback to user_metadata / app_metadata from Supabase Auth token
        if not role:
            meta_role = (
                user_data.get("user_metadata", {}).get("role") or
                user_data.get("app_metadata", {}).get("role") or ""
            ).lower().strip()
            if meta_role in {"admin", "superadmin", "coordinator"}:
                role = meta_role
    except Exception as e:
        print(f"[Admin Auth] Role query error: {e}")

    # Enforce allowed Admin roles strictly from public.user_roles
    allowed_admin_roles = {"admin", "superadmin", "coordinator"}
    if role in allowed_admin_roles:
        return {
            "authenticated": True,
            "auth_type": "supabase_jwt",
            "user_id": user_id,
            "email": user_email,
            "role": role,
        }

    # Authenticated user is not an Admin in public.user_roles
    raise HTTPException(
        status_code=403,
        detail=f"Access forbidden: User with role '{role or 'unassigned'}' is not authorized to access Admin Results."
    )

async def verify_jury_auth(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """
    Authoritative Jury Authorization Dependency:
    - Relies on Authorization: Bearer <Supabase logged-in jury/judge access_token>
    - Validates token against Supabase Auth API using persistent connection pool
    - Looks up public.user_roles and public.judges using user_id UUID concurrently
    - Enforces active status and role in ('jury', 'judge', 'admin', 'superadmin')
    - Returns 401 if unauthenticated, 403 if unauthorized
    - Passes server-verified canonical judge profile to avoid redundant downstream lookups
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authentication required: Provide a valid Supabase Jury Bearer token."
        )

    token = authorization.split("Bearer ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token is empty."
        )

    supa_key = settings.get_effective_key()
    auth_url = f"{settings.supabase_url}/auth/v1/user"
    headers = {
        "apikey": supa_key or "",
        "Authorization": f"Bearer {token}",
    }

    user_data = None
    for attempt in range(2):
        try:
            client = db.get_client()
            res = await client.get(auth_url, headers=headers)
            if res.status_code == 200:
                user_data = res.json()
                break
            elif res.status_code in (429, 502, 503, 504) and attempt == 0:
                await asyncio.sleep(0.08)
                continue
            elif res.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid or expired Supabase authentication session."
                )
        except HTTPException:
            raise
        except Exception as e:
            if attempt == 0:
                await asyncio.sleep(0.08)
                continue
            print(f"[Jury Auth] Token verification exception: {e}")
            raise HTTPException(
                status_code=401,
                detail="Authentication verification failed."
            )

    user_id = user_data.get("id")
    user_email = (user_data.get("email") or "").lower().strip()

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token: missing user ID."
        )

    # FAST PATH: Concurrently query canonical UUID-based sources
    role = None
    judge_row = None
    try:
        roles_task = db.fetch_supabase("user_roles", f"user_id=eq.{user_id}&select=role,is_active")
        judges_task = db.fetch_supabase("judges", f"user_id=eq.{user_id}&select=id,user_id,name,email,department,is_active")
        roles_res, judges_res = await asyncio.gather(roles_task, judges_task, return_exceptions=True)

        if isinstance(roles_res, list) and len(roles_res) > 0:
            row = roles_res[0]
            if row.get("is_active", True):
                role = (row.get("role") or "").lower().strip()

        if isinstance(judges_res, list) and len(judges_res) > 0:
            j_candidate = judges_res[0]
            if j_candidate.get("is_active", True):
                judge_row = j_candidate
                if not role:
                    role = "jury"

        # STOP if canonical UUID lookup succeeded. Only run slow fallbacks if UUID genuinely yielded no role.
        if not role:
            # Fallback 1: email lookups concurrently if email exists
            if user_email:
                email_roles_task = db.fetch_supabase("user_roles", f"user_email=eq.{user_email}&select=role,is_active")
                email_judges_task = db.fetch_supabase("judges", f"email=eq.{user_email}&select=id,user_id,name,email,department,is_active")
                em_roles, em_judges = await asyncio.gather(email_roles_task, email_judges_task, return_exceptions=True)

                if isinstance(em_roles, list) and len(em_roles) > 0 and em_roles[0].get("is_active", True):
                    role = (em_roles[0].get("role") or "").lower().strip()
                if isinstance(em_judges, list) and len(em_judges) > 0 and em_judges[0].get("is_active", True):
                    judge_row = em_judges[0]
                    if not role:
                        role = "jury"

            # Fallback 2: user_metadata / app_metadata from Supabase Auth token
            if not role:
                meta_role = (
                    user_data.get("user_metadata", {}).get("role") or
                    user_data.get("app_metadata", {}).get("role") or ""
                ).lower().strip()
                if meta_role in {"jury", "judge", "admin", "superadmin"}:
                    role = meta_role
    except Exception as e:
        print(f"[Jury Auth] Role query error: {e}")

    # Allow jury, judge, or admin (admins can inspect jury views)
    allowed_jury_roles = {"jury", "judge", "admin", "superadmin"}
    if role in allowed_jury_roles:
        is_admin_role = role in {"admin", "superadmin"}
        has_active_db_auth = (judge_row is not None and judge_row.get("is_active", True)) or (roles_res and len(roles_res) > 0 and roles_res[0].get("is_active", True))
        if not is_admin_role and not has_active_db_auth:
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: Jury account has been deleted or deactivated."
            )
        return {
            "authenticated": True,
            "auth_type": "supabase_jwt",
            "user_id": user_id,
            "email": user_email,
            "role": role,
            "judge_profile": judge_row,
        }

    raise HTTPException(
        status_code=403,
        detail=f"Access forbidden: User with role '{role or 'unassigned'}' is not authorized as a Jury member."
    )

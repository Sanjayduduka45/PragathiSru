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

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(auth_url, headers=headers)
            if res.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid or expired Supabase authentication session."
                )
            user_data = res.json()
    except HTTPException:
        raise
    except Exception as e:
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

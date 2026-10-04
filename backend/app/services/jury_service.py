import asyncio
import os
import time
from typing import List, Dict, Any, Optional, Set, Tuple
from fastapi import HTTPException, status
from app.config import settings
from app.database import db
from app.schemas.jury import (
    JuryProfile,
    UpdateJuryProfileRequest,
    DomainAssignmentItem,
    ProjectAssignmentItem,
    AssignmentCandidateItem,
    AssignmentCandidatesResponse,
    CreateJuryAccountRequest,
    MarksExportItem,
    MarksExportResponse,
    ProjectCompletionItem,
    JuryCompletionOverviewResponse,
    AssignedProjectItem,
    AssignedProjectsResponse,
    JuryProjectProgressItem,
    JuryProjectProgressResponse,
    JuryBootstrapProfile,
    JuryBootstrapSummary,
    JuryBootstrapResponse,
    ResetJuryPasswordResponse,
)

# Built-in fallback alias dictionary matching authoritative live production project_domains
KNOWN_DOMAIN_ALIASES: Dict[str, str] = {
    # 1. ai-software -> Civil Engineering & Smart Infrastructure
    "civil engineering & smart infrastructure": "ai-software",
    # 2. hardware-iot -> Electrical Engineering & Energy Systems
    "electrical engineering & energy systems": "hardware-iot",
    # 3. green-sustainability -> Mechanical Engineering & Automation
    "mechanical engineering & automation": "green-sustainability",
    # 4. health-biotech -> Electronics & Communication Technologies
    "electronics & communication technologies": "health-biotech",
    # 5. smart-automation -> Computer Science & Artificial Intelligence
    "computer science & artificial intelligence": "smart-automation",
    # 6. open-innovation -> Business Management & Entrepreneurship
    "business management & entrepreneurship": "open-innovation",
    # 7. domain-7c89c586 -> Agriculture & Agri-Innovation
    "agriculture & agri-innovation": "domain-7c89c586",
    # 8. domain-315daeb9 -> Healthcare & Biomedical Innovations
    "healthcare & biomedical innovations": "domain-315daeb9",
    # 9. domain-c0677a05 -> Multidisciplinary Innovation & Smart Solutions + Alias
    "multidisciplinary innovation & smart solutions": "domain-c0677a05",
    "multidisciplinary innovation & smart solution": "domain-c0677a05",
    # 10. domain-9f52a525 -> School Innovation & Young Innovators + Alias
    "school innovation & young innovators": "domain-9f52a525",
    "school innovation & young innovators (for 8th\u201312th standard students)": "domain-9f52a525",
    "school innovation & young innovators (for 8th-12th standard students)": "domain-9f52a525",
}

class JuryService:
    def __init__(self):
        self._aliases_cache: Dict[str, str] = {}
        self._cache_timestamp: float = 0.0
        self._cache_ttl: float = 60.0  # 1 minute bounded TTL
        self._aliases_lock: Optional[asyncio.Lock] = None

    def _get_aliases_lock(self) -> asyncio.Lock:
        try:
            current_loop = asyncio.get_running_loop()
        except RuntimeError:
            current_loop = None

        if getattr(self, "_aliases_lock_loop", None) != current_loop or getattr(self, "_aliases_lock", None) is None:
            self._aliases_lock = asyncio.Lock()
            self._aliases_lock_loop = current_loop
        return self._aliases_lock

    async def _refresh_aliases_cache(self):
        """Loads domain aliases and project domain titles into memory cache with lock protection."""
        now = time.time()
        if self._aliases_cache and (now - self._cache_timestamp) < self._cache_ttl:
            return

        lock = self._get_aliases_lock()
        async with lock:
            now = time.time()
            if self._aliases_cache and (now - self._cache_timestamp) < self._cache_ttl:
                return

            cache = dict(KNOWN_DOMAIN_ALIASES)
            try:
                db_aliases = await db.fetch_supabase("domain_aliases", "is_active=eq.true&select=alias_text,domain_id")
                if db_aliases:
                    for row in db_aliases:
                        text = (row.get("alias_text") or "").strip().lower()
                        dom_id = (row.get("domain_id") or "").strip()
                        if text and dom_id:
                            cache[text] = dom_id
            except Exception as e:
                print(f"[JuryService] Failed to load domain_aliases: {e}")

            try:
                domains_raw = await db.fetch_supabase("project_domains", "select=id,title")
                if domains_raw:
                    for d in domains_raw:
                        d_title = (d.get("title") or "").strip().lower()
                        d_id = (d.get("id") or "").strip()
                        if d_title and d_id and d_title not in cache:
                            cache[d_title] = d_id
                        if d_id and d_id.lower() not in cache:
                            cache[d_id.lower()] = d_id
            except Exception as e:
                print(f"[JuryService] Failed to load project_domains for alias cache: {e}")

            self._aliases_cache = cache
            self._cache_timestamp = now

    async def resolve_domain_id(self, category: str) -> str:
        """
        Safely resolves a category string to a canonical domain_id.
        1. Checks trim + lowercase in domain_aliases (including known mismatches).
        2. Fallback exact normalized match against project_domains.title or project_domains.id.
        3. Returns 'UNMAPPED' if unresolved. Never silently guesses.
        """
        if not category:
            return "UNMAPPED"

        clean = category.strip().lower()
        await self._refresh_aliases_cache()

        if clean in self._aliases_cache:
            return self._aliases_cache[clean]

        # Fallback: check project_domains titles and ids directly
        try:
            domains_raw = await db.fetch_supabase("project_domains", "select=id,title")
            if domains_raw:
                for d in domains_raw:
                    d_title = (d.get("title") or "").strip().lower()
                    d_id = (d.get("id") or "").strip()
                    if d_title == clean or d_id.lower() == clean:
                        self._aliases_cache[clean] = d_id
                        return d_id
        except Exception as e:
            print(f"[JuryService] Error resolving domain against project_domains: {e}")

        return "UNMAPPED"

    # ─── Jury Account Management ───────────────────────────────────────────────

    async def list_juries(self) -> List[JuryProfile]:
        """
        Lists all juries authoritatively from public.judges with completed evaluation counts
        and assigned domain counts.

        Permanent Canonical Architecture:
        - public.judges is the authoritative source for jury membership.
        - Canonical identity is judges.user_id (Supabase auth.users.id).
        - Enriches from public.user_roles where role IN ('jury', 'judge') (normalized internally).
        - Active status is strictly derived from judges.is_active.
        - Deduplicates by unique judges.user_id (never displays duplicate accounts).
        - Domain assignments counted using jury_domain_assignments.judge_user_id = judges.user_id.
        - Completed evaluations counted using judge_evaluations.judge_id = judges.user_id.
        - Never silently returns [] on backend/query exceptions; logs and raises HTTPException(500).
        """
        try:
            # 1. Fetch judges (authoritative jury registry)
            judges_raw = await db.fetch_supabase("judges", "order=name.asc")
            if judges_raw is None:
                raise RuntimeError("Failed to query public.judges from Supabase database.")

            # 2. Fetch related data in bulk to avoid N+1 queries
            user_roles_raw = await db.fetch_supabase("user_roles", "role=in.(jury,judge)&select=user_id,role,is_active") or []
            evals_raw = await db.fetch_supabase("judge_evaluations", "select=judge_id") or []
            assignments_raw = await db.fetch_supabase("jury_domain_assignments", "is_active=eq.true&select=judge_user_id,domain_id,assignment_mode") or []
            domains_raw = await db.fetch_supabase("project_domains", "select=id,title") or []

            # Domain map for canonical human-readable domain titles
            domain_name_map: Dict[str, str] = {}
            for d in domains_raw:
                did = str(d.get("id") or "").strip()
                dtitle = str(d.get("title") or "").strip()
                if did:
                    domain_name_map[did] = dtitle or did
                    domain_name_map[did.lower()] = dtitle or did

            # User roles map (accepting both 'jury' and 'judge', normalized to 'jury')
            roles_by_uid: Dict[str, str] = {}
            for r in user_roles_raw:
                uid = str(r.get("user_id") or "").strip()
                if uid:
                    raw_role = str(r.get("role") or "").lower().strip()
                    if raw_role in ("jury", "judge"):
                        roles_by_uid[uid] = "jury"

            # Evaluation counts aggregated by judge_id UUID
            eval_counts: Dict[str, int] = {}
            for ev in evals_raw:
                jid = str(ev.get("judge_id") or "").strip()
                if jid:
                    eval_counts[jid] = eval_counts.get(jid, 0) + 1

            # Domain assignments count and canonical domain titles aggregated by judge_user_id UUID
            domain_counts: Dict[str, int] = {}
            domain_titles_by_judge: Dict[str, List[str]] = {}
            for a in assignments_raw:
                jid = str(a.get("judge_user_id") or "").strip()
                dom_id = str(a.get("domain_id") or "").strip()
                if jid:
                    domain_counts[jid] = domain_counts.get(jid, 0) + 1
                    if dom_id:
                        title = domain_name_map.get(dom_id) or domain_name_map.get(dom_id.lower())
                        if not title or title == dom_id:
                            resolved_id = await self.resolve_domain_id(dom_id)
                            title = domain_name_map.get(resolved_id) or domain_name_map.get(resolved_id.lower()) or dom_id
                        if jid not in domain_titles_by_judge:
                            domain_titles_by_judge[jid] = []
                        if title not in domain_titles_by_judge[jid]:
                            domain_titles_by_judge[jid].append(title)

            # 3. Deduplicate and construct canonical JuryProfile list
            seen_user_ids: Set[str] = set()
            result: List[JuryProfile] = []

            for j in judges_raw:
                uid = str(j.get("user_id") or "").strip()
                # Ignore invalid rows without user_id
                if not uid:
                    continue

                # Deduplication protection: never display the same jury twice
                if uid in seen_user_ids:
                    continue
                seen_user_ids.add(uid)

                # Authoritative active status from judges.is_active (default True if unset)
                is_active = bool(j.get("is_active") if j.get("is_active") is not None else True)

                # Primary key ID (fallback to user_id if id is missing)
                jid_pk = str(j.get("id") or uid).strip()

                # Evaluations completed matching canonical judge_id = uid (also check jid_pk defensively)
                completed_evals = eval_counts.get(uid, 0)
                if completed_evals == 0 and jid_pk != uid:
                    completed_evals = eval_counts.get(jid_pk, 0)

                # Assigned domains count matching canonical judge_user_id = uid (also check jid_pk defensively)
                assigned_domains = domain_counts.get(uid, 0)
                if assigned_domains == 0 and jid_pk != uid:
                    assigned_domains = domain_counts.get(jid_pk, 0)

                assigned_titles = domain_titles_by_judge.get(uid, [])
                if not assigned_titles and jid_pk != uid:
                    assigned_titles = domain_titles_by_judge.get(jid_pk, [])

                result.append(JuryProfile(
                    id=jid_pk,
                    user_id=uid,
                    name=j.get("name") or "Jury Evaluator",
                    email=j.get("email") or "",
                    department=j.get("department") or "",
                    is_active=is_active,
                    evaluations_completed=completed_evals,
                    assigned_domains_count=assigned_domains,
                    assigned_domain_titles=assigned_titles,
                    created_at=j.get("created_at"),
                    updated_at=j.get("updated_at"),
                ))

            return result

        except HTTPException:
            raise
        except Exception as e:
            print(f"[JuryService Error] list_juries failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve jury accounts: {str(e)}"
            )

    async def update_jury_profile(self, judge_user_id: str, payload: UpdateJuryProfileRequest) -> bool:
        """Updates jury name, department, or active status without hard-deleting the user."""
        update_data: Dict[str, Any] = {}
        if payload.name is not None:
            update_data["name"] = payload.name.strip()
        if payload.department is not None:
            update_data["department"] = payload.department.strip()
        if payload.is_active is not None:
            if payload.is_active is False:
                # Assignment Integrity Rule: Prevent deactivating a jury with active evaluations participating in Results
                evals = await db.fetch_supabase("judge_evaluations", f"judge_id=eq.{judge_user_id}&select=id,registration_id") or []
                if evals:
                    eval_count = len(evals)
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"Cannot deactivate jury member: This jury has submitted {eval_count} active evaluation(s). "
                            "To preserve evaluation and completion integrity, please reset their evaluations in Results "
                            "before deactivating this account."
                        )
                    )
            update_data["is_active"] = payload.is_active

        if not update_data:
            return True

        # Update judges table
        success = await db.update_supabase("judges", "user_id", judge_user_id, update_data)

        # If is_active was toggled, sync user_roles.is_active
        if payload.is_active is not None:
            try:
                await db.update_supabase("user_roles", "user_id", judge_user_id, {"is_active": payload.is_active})
            except Exception as e:
                print(f"[JuryService] Notice: could not sync user_roles.is_active: {e}")

        return success

    # ─── Assignment Management ────────────────────────────────────────────────

    async def get_jury_assignments(self, judge_user_id: str) -> List[DomainAssignmentItem]:
        """Returns all domain assignments and their selected project counts for a jury."""
        assignments = await db.fetch_supabase(
            "jury_domain_assignments",
            f"judge_user_id=eq.{judge_user_id}&order=created_at.desc"
        ) or []

        # Defensive lookup: if not found, check if judge_user_id is judges.id instead of user_id (or vice versa)
        if not assignments:
            judge_row = await db.fetch_supabase("judges", f"id=eq.{judge_user_id}&select=id,user_id") or []
            if judge_row and judge_row[0].get("user_id"):
                alt_uid = str(judge_row[0].get("user_id"))
                assignments = await db.fetch_supabase(
                    "jury_domain_assignments",
                    f"judge_user_id=eq.{alt_uid}&order=created_at.desc"
                ) or []
            if not assignments:
                judge_row_by_uid = await db.fetch_supabase("judges", f"user_id=eq.{judge_user_id}&select=id,user_id") or []
                if judge_row_by_uid and judge_row_by_uid[0].get("id"):
                    alt_id = str(judge_row_by_uid[0].get("id"))
                    assignments = await db.fetch_supabase(
                        "jury_domain_assignments",
                        f"judge_user_id=eq.{alt_id}&order=created_at.desc"
                    ) or []

        domains_raw = await db.fetch_supabase("project_domains", "select=id,title") or []
        domain_name_map: Dict[str, str] = {}
        for d in domains_raw:
            did = str(d.get("id") or "").strip()
            dtitle = str(d.get("title") or "").strip()
            if did:
                domain_name_map[did] = dtitle or did
                domain_name_map[did.lower()] = dtitle or did

        # Project counts for SELECTED mode assignments
        project_assignments = await db.fetch_supabase("jury_project_assignments", "select=jury_domain_assignment_id") or []
        project_count_map: Dict[str, int] = {}
        for pa in project_assignments:
            aid = str(pa.get("jury_domain_assignment_id") or "")
            project_count_map[aid] = project_count_map.get(aid, 0) + 1

        result: List[DomainAssignmentItem] = []
        for a in assignments:
            aid = str(a.get("id") or "")
            dom_id = str(a.get("domain_id") or "").strip()
            d_title = domain_name_map.get(dom_id) or domain_name_map.get(dom_id.lower())
            if not d_title or d_title == dom_id:
                resolved_id = await self.resolve_domain_id(dom_id)
                d_title = domain_name_map.get(resolved_id) or domain_name_map.get(resolved_id.lower()) or dom_id
            result.append(DomainAssignmentItem(
                id=aid,
                judge_user_id=str(a.get("judge_user_id") or judge_user_id),
                domain_id=dom_id,
                domain_title=d_title,
                assignment_mode=a.get("assignment_mode") or "ALL",
                is_active=a.get("is_active", True),
                selected_projects_count=project_count_map.get(aid, 0),
                created_at=a.get("created_at") or "",
            ))

        return result

    async def assign_domain(
        self,
        judge_user_id: str,
        domain_id: str,
        assignment_mode: str,
        assigned_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Assigns a domain to a jury in ALL or SELECTED mode.
        Enforces Strict Project Exclusivity:
        - Only ONE active ALL-mode jury may own a domain.
        - If an ALL assignment exists for this domain, another jury cannot be assigned in ALL or SELECTED mode.
        - If SELECTED assignments exist for this domain, another jury cannot be assigned in ALL mode.
        """
        clean_mode = "SELECTED" if assignment_mode.upper() == "SELECTED" else "ALL"
        clean_dom_id = domain_id.strip()

        # Fetch domain title for user-facing error messages
        domains_raw = await db.fetch_supabase("project_domains", f"id=eq.{clean_dom_id}&select=title") or []
        domain_title = (domains_raw[0].get("title") if domains_raw else "") or clean_dom_id

        # 0. Attempt authoritative PostgreSQL RPC with per-domain transaction advisory lock
        rpc_url = f"{settings.supabase_url}/rest/v1/rpc/assign_jury_domain_exclusive"
        key = settings.get_effective_key()
        if settings.supabase_url and key:
            try:
                import httpx
                async with httpx.AsyncClient(timeout=10.0) as client:
                    rpc_res = await client.post(
                        rpc_url,
                        headers={
                            "apikey": key,
                            "Authorization": f"Bearer {key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "p_judge_user_id": judge_user_id,
                            "p_domain_id": clean_dom_id,
                            "p_assignment_mode": clean_mode,
                            "p_assigned_by": assigned_by,
                        }
                    )
                    if rpc_res.status_code in (200, 201):
                        return rpc_res.json()
                    elif rpc_res.status_code in (400, 409):
                        err_text = rpc_res.text
                        if "ALL mode" in err_text or "already assigned" in err_text or "23505" in err_text:
                            raise HTTPException(
                                status_code=status.HTTP_409_CONFLICT,
                                detail=f"Domain assignment conflict: Domain '{domain_title}' cannot be assigned in {clean_mode} mode due to an existing active assignment."
                            )
            except HTTPException:
                raise
            except Exception as e:
                pass

        # Fetch all active assignments for this domain
        active_jdas = await db.fetch_supabase(
            "jury_domain_assignments",
            f"domain_id=eq.{clean_dom_id}&is_active=eq.true"
        ) or []

        # Check for conflicts with OTHER judges
        for jda in active_jdas:
            existing_judge_id = str(jda.get("judge_user_id") or "")
            if existing_judge_id == judge_user_id:
                continue

            existing_mode = jda.get("assignment_mode") or "ALL"

            if existing_mode == "ALL":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Domain '{domain_title}' is already assigned to another jury member in ALL mode."
                )

            if clean_mode == "ALL" and existing_mode == "SELECTED":
                # Check if the other judge has actual projects assigned
                jda_id = str(jda.get("id") or "")
                pas = await db.fetch_supabase(
                    "jury_project_assignments",
                    f"jury_domain_assignment_id=eq.{jda_id}&select=id"
                ) or []
                if pas:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Some projects in this domain are already assigned. Use SELECTED Mode to assign only the remaining projects."
                    )

        payload = {
            "judge_user_id": judge_user_id,
            "domain_id": clean_dom_id,
            "assignment_mode": clean_mode,
            "is_active": True,
            "assigned_by": assigned_by,
        }

        # Upsert in case the assignment already exists
        row = await db.upsert_supabase("jury_domain_assignments", payload, on_conflict="judge_user_id,domain_id")
        if not row:
            # Fallback insert
            row = await db.insert_supabase("jury_domain_assignments", payload)
            if not row:
                raise RuntimeError("Failed to create domain assignment.")

        return row

    async def update_assignment_mode(self, assignment_id: str, assignment_mode: str) -> bool:
        """
        Switches an assignment between ALL and SELECTED mode.
        Enforces Assignment Integrity & Exclusivity Rules:
        - If switching ALL -> SELECTED, verify evaluated projects are already explicitly assigned.
        - If switching SELECTED -> ALL, verify no other jury has ALL or SELECTED assignments in this domain.
        """
        clean_mode = "SELECTED" if assignment_mode.upper() == "SELECTED" else "ALL"

        jda_rows = await db.fetch_supabase("jury_domain_assignments", f"id=eq.{assignment_id}") or []
        if not jda_rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found.")

        jda = jda_rows[0]
        current_mode = jda.get("assignment_mode") or "ALL"
        judge_user_id = str(jda.get("judge_user_id") or "")
        domain_id = str(jda.get("domain_id") or "")

        if clean_mode == "SELECTED" and current_mode == "ALL":
            # 1. Fetch explicit selected project registrations for this assignment
            pas = await db.fetch_supabase(
                "jury_project_assignments",
                f"jury_domain_assignment_id=eq.{assignment_id}&select=registration_id"
            ) or []
            explicit_reg_ids = {str(p.get("registration_id") or "").strip().upper() for p in pas}

            # 2. Fetch all registrations in this domain
            regs_raw = await db.fetch_supabase(
                "registrations",
                "select=registration_id,projects(category)"
            )
            if regs_raw is None:
                regs_raw = await db.fetch_supabase("registrations", "") or []

            domain_reg_ids: Set[str] = set()
            for r in regs_raw:
                p_data = r.get("projects")
                cat = ""
                if isinstance(p_data, list) and len(p_data) > 0:
                    cat = p_data[0].get("category") or ""
                elif isinstance(p_data, dict):
                    cat = p_data.get("category") or ""

                resolved = await self.resolve_domain_id(cat)
                if resolved == domain_id:
                    rid = (r.get("registration_id") or "").strip().upper()
                    if rid:
                        domain_reg_ids.add(rid)

            # 3. Check if jury has submitted evaluations for any project in this domain
            if domain_reg_ids:
                evals = await db.fetch_supabase(
                    "judge_evaluations",
                    f"judge_id=eq.{judge_user_id}&select=registration_id"
                ) or []
                evaluated_reg_ids = {str(e.get("registration_id") or "").strip().upper() for e in evals}
                domain_evaluated_ids = domain_reg_ids.intersection(evaluated_reg_ids)

                # 4. Check for orphan evaluations
                orphaned_ids = domain_evaluated_ids - explicit_reg_ids
                if orphaned_ids:
                    orphan_list = ", ".join(sorted(list(orphaned_ids)))
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"Cannot switch assignment to SELECTED mode: Jury member has already submitted "
                            f"evaluation(s) for project(s) in this domain ({orphan_list}) that are not "
                            "explicitly assigned in SELECTED mode. Please add these projects to the SELECTED "
                            "assignment or reset their evaluations in Results first."
                        )
                    )

        elif clean_mode == "ALL" and current_mode == "SELECTED":
            # Switching SELECTED -> ALL: Check if another active judge already owns this domain in ALL mode or has projects
            other_active_jdas = await db.fetch_supabase(
                "jury_domain_assignments",
                f"domain_id=eq.{domain_id}&is_active=eq.true"
            ) or []
            for o_jda in other_active_jdas:
                o_jid = str(o_jda.get("judge_user_id") or "")
                if o_jid == judge_user_id:
                    continue
                o_mode = o_jda.get("assignment_mode") or "ALL"
                if o_mode == "ALL":
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Domain is already assigned to another jury member in ALL mode."
                    )
                # If other judge has SELECTED projects in this domain
                o_aid = str(o_jda.get("id") or "")
                o_pas = await db.fetch_supabase(
                    "jury_project_assignments",
                    f"jury_domain_assignment_id=eq.{o_aid}&select=id"
                ) or []
                if o_pas:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Some projects in this domain are already assigned. Use SELECTED Mode to assign only the remaining projects."
                    )

        return await db.update_supabase("jury_domain_assignments", "id", assignment_id, {"assignment_mode": clean_mode})

    async def remove_assignment(self, assignment_id: str) -> bool:
        """
        Enforces Assignment Integrity Rule:
        Blocks removal if this jury member has already evaluated projects covered by this assignment.
        """
        assignment_rows = await db.fetch_supabase("jury_domain_assignments", f"id=eq.{assignment_id}") or []
        if not assignment_rows:
            raise LookupError("Assignment not found.")

        assignment = assignment_rows[0]
        judge_user_id = str(assignment.get("judge_user_id") or "")
        domain_id = str(assignment.get("domain_id") or "")
        mode = assignment.get("assignment_mode") or "ALL"

        # Find all projects covered by this assignment
        covered_reg_ids: Set[str] = set()

        if mode == "ALL":
            # All projects in this domain
            regs_raw = await db.fetch_supabase("registrations", "select=registration_id,projects(category)")
            if regs_raw is None:
                regs_raw = await db.fetch_supabase("registrations", "") or []
            for r in regs_raw:
                p_data = r.get("projects")
                cat = ""
                if isinstance(p_data, list) and len(p_data) > 0:
                    cat = p_data[0].get("category") or ""
                elif isinstance(p_data, dict):
                    cat = p_data.get("category") or ""

                resolved = await self.resolve_domain_id(cat)
                if resolved == domain_id:
                    reg_id = (r.get("registration_id") or "").strip().upper()
                    if reg_id:
                        covered_reg_ids.add(reg_id)
        else:
            # Selected projects only
            pas = await db.fetch_supabase("jury_project_assignments", f"jury_domain_assignment_id=eq.{assignment_id}&select=registration_id") or []
            for pa in pas:
                reg_id = (pa.get("registration_id") or "").strip().upper()
                if reg_id:
                    covered_reg_ids.add(reg_id)

        # Check for submitted evaluations by this judge for any covered project
        if covered_reg_ids:
            evals = await db.fetch_supabase("judge_evaluations", f"judge_id=eq.{judge_user_id}&select=registration_id") or []
            evaluated_reg_ids = {str(e.get("registration_id") or "").strip().upper() for e in evals}
            conflicts = covered_reg_ids.intersection(evaluated_reg_ids)

            if conflicts:
                conflict_list = ", ".join(list(conflicts)[:3])
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Cannot remove assignment: this jury has already submitted evaluation(s) "
                        f"for project(s): {conflict_list}. "
                        "Admin must reset those evaluation(s) before removing this assignment."
                    )
                )

        # Clean to delete
        return await db.delete_supabase("jury_domain_assignments", "id", assignment_id)

    async def get_selected_projects(self, assignment_id: str) -> List[ProjectAssignmentItem]:
        """Gets all explicitly assigned projects for a SELECTED mode assignment."""
        pas = await db.fetch_supabase("jury_project_assignments", f"jury_domain_assignment_id=eq.{assignment_id}") or []
        if not pas:
            return []

        regs = await db.fetch_supabase("registrations", "select=registration_id,team_name,projects(title)") or []
        reg_map = {}
        for r in regs:
            reg_id = (r.get("registration_id") or "").strip().upper()
            p_data = r.get("projects")
            title = ""
            if isinstance(p_data, list) and len(p_data) > 0:
                title = p_data[0].get("title") or ""
            elif isinstance(p_data, dict):
                title = p_data.get("title") or ""
            reg_map[reg_id] = {
                "team_name": r.get("team_name") or "Team",
                "project_title": title or "Project Title",
            }

        result: List[ProjectAssignmentItem] = []
        for pa in pas:
            reg_id = (pa.get("registration_id") or "").strip().upper()
            info = reg_map.get(reg_id, {"team_name": "Team", "project_title": "Project Title"})
            result.append(ProjectAssignmentItem(
                id=str(pa.get("id") or ""),
                jury_domain_assignment_id=str(pa.get("jury_domain_assignment_id") or assignment_id),
                registration_id=reg_id,
                project_title=info["project_title"],
                team_name=info["team_name"],
                created_at=pa.get("created_at") or "",
            ))

        return result

    async def add_selected_projects(
        self,
        assignment_id: str,
        registration_ids: List[str],
        assigned_by: Optional[str] = None
    ) -> int:
        """
        Adds selected projects to a SELECTED mode assignment.
        Enforces Selected Project Domain Integrity:
        A selected project must resolve to the same canonical domain_id
        as its parent jury_domain_assignment.
        """
        jda_rows = await db.fetch_supabase("jury_domain_assignments", f"id=eq.{assignment_id}") or []
        if not jda_rows:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jury domain assignment not found.")

        current_jda = jda_rows[0]
        target_domain_id = str(current_jda.get("domain_id") or "").strip()
        current_judge_id = str(current_jda.get("judge_user_id") or "").strip()

        # 0. Attempt authoritative PostgreSQL RPC with per-domain transaction advisory lock
        rpc_url = f"{settings.supabase_url}/rest/v1/rpc/add_jury_selected_projects_exclusive"
        key = settings.get_effective_key()
        if settings.supabase_url and key:
            try:
                import httpx
                async with httpx.AsyncClient(timeout=10.0) as client:
                    rpc_res = await client.post(
                        rpc_url,
                        headers={
                            "apikey": key,
                            "Authorization": f"Bearer {key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "p_assignment_id": assignment_id,
                            "p_registration_ids": [r.strip().upper() for r in registration_ids],
                            "p_assigned_by": assigned_by,
                        }
                    )
                    if rpc_res.status_code in (200, 201):
                        data = rpc_res.json()
                        return data.get("added_count", len(registration_ids))
                    elif rpc_res.status_code in (400, 409):
                        err_text = rpc_res.text
                        for rid in registration_ids:
                            clean_rid = rid.strip().upper()
                            if clean_rid in err_text:
                                raise HTTPException(
                                    status_code=status.HTTP_409_CONFLICT,
                                    detail=f"Project {clean_rid} is already assigned to another jury member."
                                )
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail="One or more selected projects are already assigned to another jury member."
                        )
            except HTTPException:
                raise
            except Exception as e:
                pass

        # 1. Resolve canonical judge identities to avoid any UUID/id divergence
        judges_raw = await db.fetch_supabase("judges", "select=id,user_id") or []
        judge_id_to_user_id = {}
        for j in judges_raw:
            uid = str(j.get("user_id") or "").strip()
            jid = str(j.get("id") or "").strip()
            if uid:
                judge_id_to_user_id[uid] = uid
            if jid and uid:
                judge_id_to_user_id[jid] = uid

        current_canonical_judge_id = judge_id_to_user_id.get(current_judge_id, current_judge_id)

        # 2. Verify no OTHER active judge holds this domain in ALL mode
        other_active_jdas = await db.fetch_supabase(
            "jury_domain_assignments",
            f"domain_id=eq.{target_domain_id}&is_active=eq.true"
        ) or []
        for o_jda in other_active_jdas:
            o_jid = str(o_jda.get("judge_user_id") or "").strip()
            canonical_o_jid = judge_id_to_user_id.get(o_jid, o_jid)
            if canonical_o_jid != current_canonical_judge_id and (o_jda.get("assignment_mode") or "ALL") == "ALL":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Domain '{target_domain_id}' is already assigned to another jury member in ALL mode."
                )

        # 3. Build active project assignment ownership map across other active judges
        all_jdas = await db.fetch_supabase("jury_domain_assignments", "is_active=eq.true&select=id,judge_user_id") or []
        jda_judge_map = {
            str(j.get("id")): judge_id_to_user_id.get(str(j.get("judge_user_id") or "").strip(), str(j.get("judge_user_id") or "").strip())
            for j in all_jdas
        }

        all_pas = await db.fetch_supabase("jury_project_assignments", "select=jury_domain_assignment_id,registration_id") or []
        active_project_owners: Dict[str, str] = {}
        for pa in all_pas:
            p_jda_id = str(pa.get("jury_domain_assignment_id") or "").strip()
            p_reg_id = (pa.get("registration_id") or "").strip().upper()
            owner_judge = jda_judge_map.get(p_jda_id)
            if owner_judge and p_reg_id:
                active_project_owners[p_reg_id] = owner_judge

        # 4. Fetch projects/registrations to check their domain
        regs_raw = await db.fetch_supabase("registrations", "select=registration_id,projects(category)")
        if regs_raw is None:
            regs_raw = await db.fetch_supabase("registrations", "") or []
        reg_cat_map: Dict[str, str] = {}
        for r in regs_raw:
            rid = (r.get("registration_id") or "").strip().upper()
            p_data = r.get("projects")
            cat = ""
            if isinstance(p_data, list) and len(p_data) > 0:
                cat = p_data[0].get("category") or ""
            elif isinstance(p_data, dict):
                cat = p_data.get("category") or ""
            if cat and rid:
                reg_cat_map[rid] = cat

        added_count = 0
        for rid in registration_ids:
            clean_rid = rid.strip().upper()

            # Enforce project exclusivity: reject if already assigned to another jury member
            existing_owner = active_project_owners.get(clean_rid)
            if existing_owner and existing_owner != current_canonical_judge_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Project {clean_rid} is already assigned to another jury member."
                )

            # Fallback single lookup if not in batch fetch
            if clean_rid not in reg_cat_map:
                single_reg = await db.fetch_supabase(
                    "registrations",
                    f"registration_id=eq.{clean_rid}&select=registration_id,projects(category)"
                )
                if not single_reg:
                    single_reg = await db.fetch_supabase(
                        "registrations",
                        f"registration_id=eq.{clean_rid}"
                    ) or []
                if single_reg:
                    r = single_reg[0]
                    p_data = r.get("projects")
                    cat = ""
                    if isinstance(p_data, list) and len(p_data) > 0:
                        cat = p_data[0].get("category") or ""
                    elif isinstance(p_data, dict):
                        cat = p_data.get("category") or ""
                    if cat:
                        reg_cat_map[clean_rid] = cat

            cat = reg_cat_map.get(clean_rid, "")
            resolved_dom = await self.resolve_domain_id(cat)
            if resolved_dom != "UNMAPPED" and resolved_dom != target_domain_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Selected project '{clean_rid}' belongs to domain '{resolved_dom}', "
                        f"which does not match parent assignment domain '{target_domain_id}'."
                    )
                )

            payload = {
                "jury_domain_assignment_id": assignment_id,
                "registration_id": clean_rid,
                "assigned_by": assigned_by,
            }
            try:
                row = await db.insert_supabase("jury_project_assignments", payload)
                if row:
                    added_count += 1
                    active_project_owners[clean_rid] = current_judge_id
                else:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Project {clean_rid} is already assigned to another jury member."
                    )
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Project {clean_rid} is already assigned to another jury member."
                )
        return added_count

    async def remove_selected_project(self, project_assignment_id: str) -> bool:
        """Removes a single selected project assignment with integrity check."""
        pa_rows = await db.fetch_supabase("jury_project_assignments", f"id=eq.{project_assignment_id}") or []
        if not pa_rows:
            raise LookupError("Project assignment not found.")

        pa = pa_rows[0]
        assignment_id = str(pa.get("jury_domain_assignment_id") or "")
        reg_id = (pa.get("registration_id") or "").strip().upper()

        jda_rows = await db.fetch_supabase("jury_domain_assignments", f"id=eq.{assignment_id}") or []
        if jda_rows:
            judge_user_id = str(jda_rows[0].get("judge_user_id") or "")
            # Check if evaluated
            evals = await db.fetch_supabase(
                "judge_evaluations",
                f"judge_id=eq.{judge_user_id}&registration_id=eq.{reg_id}&select=id"
            ) or []
            if evals:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Cannot remove project {reg_id}: this jury member has already evaluated it. Reset the evaluation first."
                )

        return await db.delete_supabase("jury_project_assignments", "id", project_assignment_id)

    # ─── Assigned Projects for Logged-In Jury ─────────────────────────────────

    async def get_jury_bootstrap(
        self,
        judge_user_id: str,
        verified_judge_profile: Optional[Dict[str, Any]] = None
    ) -> JuryBootstrapResponse:
        """
        Fast authoritative Jury Bootstrap endpoint:
        Returns jury profile, assignments, assigned projects, summary counts,
        and evaluations in ONE response using parallel bulk database queries.
        Reuses verified jury profile from auth context if already loaded to avoid redundant queries.
        """
        canonical_uid = str(judge_user_id).strip()

        # Step 1: Concurrently launch independent reads
        jdas_task = db.fetch_supabase(
            "jury_domain_assignments",
            f"judge_user_id=eq.{canonical_uid}&is_active=eq.true"
        )

        if (
            verified_judge_profile
            and isinstance(verified_judge_profile, dict)
            and (verified_judge_profile.get("user_id") or verified_judge_profile.get("id"))
        ):
            judges_task = None
            pre_judge_rows = [verified_judge_profile]
        else:
            judges_task = db.fetch_supabase(
                "judges",
                f"user_id=eq.{canonical_uid}&select=id,user_id,name,email,department,is_active"
            )
            pre_judge_rows = None

        regs_task = db.fetch_supabase(
            "registrations",
            "select=registration_id,team_name,leader_name,projects(title,category,problem_statement,proposed_solution,innovation,expected_outcomes),institutions(name),team_members(name,email,is_team_leader)"
        )
        evals_task = db.fetch_supabase(
            "judge_evaluations",
            f"judge_id=eq.{canonical_uid}&order=created_at.desc"
        )
        domains_task = db.fetch_supabase(
            "project_domains",
            "select=id,title"
        )
        alias_task = self._refresh_aliases_cache()

        if judges_task is not None:
            jdas_raw, judges_raw, regs_raw, evals_raw, domains_raw, _ = await asyncio.gather(
                jdas_task, judges_task, regs_task, evals_task, domains_task, alias_task,
                return_exceptions=True
            )
            judge_rows = judges_raw if isinstance(judges_raw, list) else []
        else:
            jdas_raw, regs_raw, evals_raw, domains_raw, _ = await asyncio.gather(
                jdas_task, regs_task, evals_task, domains_task, alias_task,
                return_exceptions=True
            )
            judge_rows = pre_judge_rows or []

        jdas = jdas_raw if isinstance(jdas_raw, list) else []
        regs_raw = regs_raw if isinstance(regs_raw, list) else []
        evals_raw = evals_raw if isinstance(evals_raw, list) else []
        domains_raw = domains_raw if isinstance(domains_raw, list) else []

        judge_info = judge_rows[0] if judge_rows else {}
        alt_id = str(judge_info.get("id")) if judge_info.get("id") else None

        # Check alternative ID mappings if assignments were empty by canonical_uid
        if not jdas:
            if alt_id and alt_id != canonical_uid:
                alt_jdas = await db.fetch_supabase(
                    "jury_domain_assignments",
                    f"judge_user_id=eq.{alt_id}&is_active=eq.true"
                )
                if alt_jdas and isinstance(alt_jdas, list):
                    jdas = alt_jdas
            if not jdas:
                judge_rows_by_id = await db.fetch_supabase("judges", f"id=eq.{canonical_uid}&select=id,user_id,name,email,department,is_active") or []
                if judge_rows_by_id:
                    judge_info = judge_rows_by_id[0]
                    alt_uid = str(judge_rows_by_id[0].get("user_id"))
                    if alt_uid and alt_uid != canonical_uid:
                        alt_jdas = await db.fetch_supabase(
                            "jury_domain_assignments",
                            f"judge_user_id=eq.{alt_uid}&is_active=eq.true"
                        )
                        if alt_jdas and isinstance(alt_jdas, list):
                            jdas = alt_jdas

        # If evals were empty by canonical_uid, check alt_id
        if not evals_raw and alt_id and alt_id != canonical_uid:
            alt_evals = await db.fetch_supabase(
                "judge_evaluations",
                f"judge_id=eq.{alt_id}&order=created_at.desc"
            )
            if alt_evals and isinstance(alt_evals, list):
                evals_raw = alt_evals

        # Ensure only assignments belonging to this judge user id are processed
        jdas = [j for j in jdas if str(j.get("judge_user_id") or "").strip() == canonical_uid or (alt_id and str(j.get("judge_user_id") or "").strip() == alt_id)]

        all_domain_ids: Set[str] = set()
        selected_assignment_ids: Set[str] = set()
        selected_jda_domain_map: Dict[str, str] = {}

        for jda in jdas:
            mode = jda.get("assignment_mode") or "ALL"
            dom_id = str(jda.get("domain_id") or "").strip()
            aid = str(jda.get("id") or "").strip()
            if mode == "ALL":
                if dom_id:
                    all_domain_ids.add(dom_id)
            else:
                if aid:
                    selected_assignment_ids.add(aid)
                    if dom_id:
                        selected_jda_domain_map[aid] = dom_id

        # Bulk fetch explicit selected project registrations if any SELECTED mode assignments
        selected_reg_ids: Set[str] = set()
        selected_reg_domain_map: Dict[str, str] = {}
        if selected_assignment_ids:
            if len(selected_assignment_ids) == 1:
                pas = await db.fetch_supabase(
                    "jury_project_assignments",
                    f"jury_domain_assignment_id=eq.{next(iter(selected_assignment_ids))}&select=registration_id,jury_domain_assignment_id"
                ) or []
            else:
                pas = await db.fetch_supabase(
                    "jury_project_assignments",
                    f"jury_domain_assignment_id=in.({','.join(selected_assignment_ids)})&select=registration_id,jury_domain_assignment_id"
                ) or []
            for p in pas:
                rid = (p.get("registration_id") or "").strip().upper()
                aid = str(p.get("jury_domain_assignment_id") or "").strip()
                if rid and aid in selected_assignment_ids:
                    selected_reg_ids.add(rid)
                    selected_reg_domain_map[rid] = selected_jda_domain_map.get(aid, "")

        # Build assigned domain IDs set for this jury
        jury_assigned_domain_ids: Set[str] = all_domain_ids.union(set(selected_jda_domain_map.values()))

        domain_name_map: Dict[str, str] = {}
        for d in domains_raw:
            did = str(d.get("id") or "").strip()
            dtitle = str(d.get("title") or "").strip()
            if did:
                domain_name_map[did] = dtitle or did
                domain_name_map[did.lower()] = dtitle or did

        # Build DomainAssignmentItem list
        domain_assignment_items: List[DomainAssignmentItem] = []
        for jda in jdas:
            d_id = str(jda.get("domain_id") or "").strip()
            d_title = domain_name_map.get(d_id) or domain_name_map.get(d_id.lower())
            if not d_title or d_title == d_id:
                resolved_id = await self.resolve_domain_id(d_id)
                d_title = domain_name_map.get(resolved_id) or domain_name_map.get(resolved_id.lower()) or d_id
            mode = jda.get("assignment_mode") or "ALL"
            sel_count = len(selected_reg_ids) if mode == "SELECTED" else 0
            domain_assignment_items.append(DomainAssignmentItem(
                id=str(jda.get("id") or ""),
                judge_user_id=canonical_uid,
                domain_id=d_id,
                domain_title=d_title,
                assignment_mode=mode,
                is_active=jda.get("is_active", True),
                selected_projects_count=sel_count,
                created_at=str(jda.get("created_at") or ""),
            ))

        # Check feature flag for staged rollout
        enforce_env = os.getenv("JURY_ASSIGNMENT_ENFORCEMENT", "").strip().lower()
        if enforce_env in ("true", "1", "yes"):
            enforce_assignments = True
        elif enforce_env in ("false", "0", "no"):
            enforce_assignments = False
        else:
            enforce_assignments = getattr(settings, "jury_assignment_enforcement", False)

        # Map evaluations: registration_id (uppercase) -> evaluation row
        eval_map: Dict[str, Dict[str, Any]] = {}
        for ev in evals_raw:
            r_id = str(ev.get("registration_id") or "").strip().upper()
            if r_id:
                eval_map[r_id] = ev

        assigned_map: Dict[str, AssignedProjectItem] = {}

        for r in regs_raw:
            reg_id = (r.get("registration_id") or "").strip().upper()
            if not reg_id:
                continue

            p_data = r.get("projects")
            if isinstance(p_data, list) and len(p_data) > 0:
                p_data = p_data[0]
            elif not isinstance(p_data, dict):
                p_data = {}

            inst_data = r.get("institutions")
            if isinstance(inst_data, list) and len(inst_data) > 0:
                inst_data = inst_data[0]
            elif not isinstance(inst_data, dict):
                inst_data = {}

            cat = p_data.get("category") or r.get("category") or "General"
            resolved_dom_id = await self.resolve_domain_id(cat)

            # STEP 1: Absolute Domain Isolation
            # A jury assigned under one or more canonical domains must NEVER see projects
            # belonging to unassigned canonical domains (zero cross-domain leakage).
            if resolved_dom_id not in jury_assigned_domain_ids:
                continue

            # STEP 2: Within assigned canonical domain(s), enforce project ownership
            # Domain membership alone gives ZERO project visibility in SELECTED mode.
            # Dashboard source for SELECTED mode must strictly be jury_project_assignments for authenticated jury.
            is_covered_all = resolved_dom_id in all_domain_ids
            is_covered_selected = reg_id in selected_reg_ids
            is_covered = is_covered_all or is_covered_selected
            assigned_mode_str = "ALL" if is_covered_all else "SELECTED"

            if is_covered:
                members_raw = r.get("team_members") or []
                members = []
                for m in members_raw:
                    members.append({
                        "name": m.get("name") or "",
                        "email": m.get("email") or "",
                        "role": "Leader" if m.get("is_team_leader") else "Member",
                    })

                ev = eval_map.get(reg_id)
                is_eval = ev is not None
                eval_id = str(ev.get("id")) if ev else None
                eval_status = "EVALUATED" if is_eval else "PENDING"
                raw_score = None
                sub_at = None
                if ev is not None:
                    raw_val = ev.get("total_score")
                    if raw_val is not None:
                        raw_score = float(raw_val)
                        if raw_score.is_integer():
                            raw_score = float(int(raw_score))
                    sub_at = ev.get("created_at") or ev.get("updated_at")

                dom_title = domain_name_map.get(resolved_dom_id) or cat

                item = AssignedProjectItem(
                    registration_id=reg_id,
                    team_name=r.get("team_name") or "Team",
                    project_title=p_data.get("title") or r.get("project_title") or "Project Title",
                    category=cat,
                    institution_name=inst_data.get("name") or r.get("institution_name") or "SR University",
                    leader_name=r.get("leader_name") or "Leader",
                    members=members,
                    problem_statement=p_data.get("problem_statement"),
                    proposed_solution=p_data.get("proposed_solution"),
                    innovation=p_data.get("innovation"),
                    expected_outcomes=p_data.get("expected_outcomes"),
                    is_evaluated=is_eval,
                    evaluation_id=eval_id,
                    assignment_mode=assigned_mode_str,
                    domain_id=resolved_dom_id if resolved_dom_id != "UNMAPPED" else None,
                    domain_title=dom_title,
                    evaluation_status=eval_status,
                    total_score=raw_score,
                    submitted_at=sub_at,
                )

                if reg_id in assigned_map:
                    if assigned_mode_str == "ALL" and assigned_map[reg_id].assignment_mode == "SELECTED":
                        assigned_map[reg_id].assignment_mode = "ALL"
                else:
                    assigned_map[reg_id] = item

        # Sort projects by registration_id
        sorted_projects = sorted(list(assigned_map.values()), key=lambda x: x.registration_id)

        # Summary metrics: evaluated count is intersection of assigned projects and submitted evaluations
        assigned_count = len(sorted_projects)
        evaluated_count = sum(1 for p in sorted_projects if p.is_evaluated)
        remaining_count = max(0, assigned_count - evaluated_count)

        # Format evaluations for frontend
        formatted_evals = []
        for ev in evals_raw:
            raw_scores = ev.get("criteria_scores") or {}
            inno = float(raw_scores.get("innovation") if raw_scores.get("innovation") is not None else (ev.get("innovation_score") or 0.0))
            tech = float(raw_scores.get("technical") if raw_scores.get("technical") is not None else (ev.get("technical_score") or 0.0))
            impl = float(raw_scores.get("implementation") if raw_scores.get("implementation") is not None else (raw_scores.get("relevance") if raw_scores.get("relevance") is not None else (ev.get("relevance_score") or 0.0)))
            imp = float(raw_scores.get("impact") if raw_scores.get("impact") is not None else (ev.get("impact_score") or 0.0))
            pres = float(raw_scores.get("presentation") if raw_scores.get("presentation") is not None else (ev.get("presentation_score") or 0.0))
            t_score = float(ev.get("total_score") if ev.get("total_score") is not None else 0.0)

            formatted_evals.append({
                "id": str(ev.get("id")),
                "registrationId": (ev.get("registration_id") or "").strip().upper(),
                "projectTitle": ev.get("project_title") or "",
                "teamName": ev.get("team_name") or "",
                "category": ev.get("category") or "",
                "judgeId": str(ev.get("judge_id") or canonical_uid),
                "judgeEmail": ev.get("judge_email") or judge_info.get("email") or "",
                "judgeName": ev.get("judge_name") or judge_info.get("name") or "Jury Evaluator",
                "scores": {
                    "innovation": inno,
                    "technical": tech,
                    "implementation": impl,
                    "relevance": impl,
                    "impact": imp,
                    "presentation": pres,
                },
                "totalScore": t_score,
                "comments": ev.get("comments") or "",
                "submittedAt": ev.get("created_at") or ev.get("updated_at") or "",
            })

        jury_profile = JuryBootstrapProfile(
            user_id=canonical_uid,
            name=judge_info.get("name") or "Jury Evaluator",
            email=judge_info.get("email") or "",
            department=judge_info.get("department") or "",
            is_active=judge_info.get("is_active", True),
        )

        return JuryBootstrapResponse(
            success=True,
            jury=jury_profile,
            assignments=domain_assignment_items,
            projects=sorted_projects,
            summary=JuryBootstrapSummary(
                assigned=assigned_count,
                evaluated=evaluated_count,
                remaining=remaining_count,
            ),
            evaluations=formatted_evals,
        )

    async def get_assigned_projects_for_jury(self, judge_user_id: str) -> AssignedProjectsResponse:
        """
        Authoritative endpoint for Jury Portal:
        Returns DISTINCT projects covered by:
        ALL domain assignments UNION SELECTED project assignments.
        Reuses fast bootstrap logic for identical security and zero divergence.
        """
        bootstrap = await self.get_jury_bootstrap(judge_user_id)
        return AssignedProjectsResponse(
            success=True,
            judge_user_id=bootstrap.jury.user_id,
            total_assigned=bootstrap.summary.assigned,
            completed_count=bootstrap.summary.evaluated,
            pending_count=bootstrap.summary.remaining,
            projects=bootstrap.projects,
        )

    async def get_assigned_project_by_id(self, judge_user_id: str, registration_id: str) -> Optional[AssignedProjectItem]:
        """Returns single project only if assigned to this jury member."""
        all_assigned = await self.get_assigned_projects_for_jury(judge_user_id)
        clean_id = registration_id.strip().upper()
        for p in all_assigned.projects:
            if p.registration_id == clean_id:
                return p
        return None

    # ─── Dynamic Completion Overview ──────────────────────────────────────────

    async def get_completion_overview(self) -> JuryCompletionOverviewResponse:
        """
        Authoritative Completion Overview:
        For every project:
        AssignedJuries = DISTINCT active juries covering it via ALL or SELECTED mode.
        SubmittedJuries = DISTINCT judge_id from judge_evaluations INTERSECT AssignedJuries.
        """
        # 1. Fetch judges, active domain assignments, selected projects, registrations, and evaluations
        judges_raw = await db.fetch_supabase("judges", "is_active=eq.true") or []
        active_judge_ids = {str(j.get("user_id") or ""): j for j in judges_raw if j.get("user_id")}

        jdas_raw = await db.fetch_supabase("jury_domain_assignments", "is_active=eq.true") or []
        pas_raw = await db.fetch_supabase("jury_project_assignments", "") or []

        regs_raw = await db.fetch_supabase("registrations", "select=registration_id,team_name,projects(title,category)") or []
        evals_raw = await db.fetch_supabase("judge_evaluations", "select=judge_id,judge_name,judge_email,registration_id,total_score") or []

        domains_raw = await db.fetch_supabase("project_domains", "select=id,title") or []
        domain_name_map = {str(d.get("id")): d.get("title") or str(d.get("id")) for d in domains_raw}

        # 2. Map ALL assignments by domain_id: domain_id -> List[judge_user_id]
        domain_all_juries: Dict[str, Set[str]] = {}
        # Map SELECTED assignments: assignment_id -> judge_user_id
        selected_assignment_judges: Dict[str, str] = {}

        for jda in jdas_raw:
            jid = str(jda.get("judge_user_id") or "")
            if jid not in active_judge_ids:
                continue

            aid = str(jda.get("id") or "")
            dom_id = str(jda.get("domain_id") or "")
            mode = jda.get("assignment_mode") or "ALL"

            if mode == "ALL":
                if dom_id not in domain_all_juries:
                    domain_all_juries[dom_id] = set()
                domain_all_juries[dom_id].add(jid)
            else:
                selected_assignment_judges[aid] = jid

        # Map SELECTED projects: registration_id -> Set[judge_user_id]
        project_selected_juries: Dict[str, Set[str]] = {}
        for pa in pas_raw:
            aid = str(pa.get("jury_domain_assignment_id") or "")
            reg_id = (pa.get("registration_id") or "").strip().upper()
            if aid in selected_assignment_judges and reg_id:
                jid = selected_assignment_judges[aid]
                if reg_id not in project_selected_juries:
                    project_selected_juries[reg_id] = set()
                project_selected_juries[reg_id].add(jid)

        # 3. Map submitted evaluations: registration_id -> Dict[judge_id, eval_info]
        evals_by_reg: Dict[str, Dict[str, Dict[str, Any]]] = {}
        for ev in evals_raw:
            reg_id = (ev.get("registration_id") or "").strip().upper()
            jid = str(ev.get("judge_id") or "")
            if reg_id and jid:
                if reg_id not in evals_by_reg:
                    evals_by_reg[reg_id] = {}
                evals_by_reg[reg_id][jid] = {
                    "judge_id": jid,
                    "judge_name": ev.get("judge_name") or "Jury",
                    "judge_email": ev.get("judge_email") or "",
                    "total_score": float(ev.get("total_score") or 0.0),
                }

        # 4. Compute metrics per project
        items: List[ProjectCompletionItem] = []
        completed_count = 0
        in_progress_count = 0
        not_evaluated_count = 0
        unassigned_count = 0

        for r in regs_raw:
            reg_id = (r.get("registration_id") or "").strip().upper()
            if not reg_id:
                continue

            p_data = r.get("projects")
            if isinstance(p_data, list) and len(p_data) > 0:
                p_data = p_data[0]
            elif not isinstance(p_data, dict):
                p_data = {}

            title = p_data.get("title") or "Project Title"
            category = p_data.get("category") or "General"
            resolved_dom_id = await self.resolve_domain_id(category)

            # Assigned Juries = ALL domain juries UNION SELECTED project juries
            assigned_ids: Set[str] = set()
            if resolved_dom_id in domain_all_juries:
                assigned_ids.update(domain_all_juries[resolved_dom_id])
            if reg_id in project_selected_juries:
                assigned_ids.update(project_selected_juries[reg_id])

            assigned_juries_list = []
            for jid in assigned_ids:
                j_info = active_judge_ids.get(jid, {})
                assigned_juries_list.append({
                    "user_id": jid,
                    "name": j_info.get("name") or "Jury Evaluator",
                    "email": j_info.get("email") or "",
                })

            # Submitted Juries = evaluations INTERSECT assigned juries
            reg_evals = evals_by_reg.get(reg_id, {})
            submitted_ids = assigned_ids.intersection(set(reg_evals.keys()))

            submitted_juries_list = []
            for jid in submitted_ids:
                ev_data = reg_evals[jid]
                submitted_juries_list.append(ev_data)

            a_count = len(assigned_ids)
            s_count = len(submitted_ids)

            # Status derivation
            if a_count == 0:
                p_status = "UNASSIGNED"
                unassigned_count += 1
            elif s_count == 0:
                p_status = "NOT_EVALUATED"
                not_evaluated_count += 1
            elif s_count == a_count:
                p_status = "COMPLETED"
                completed_count += 1
            else:
                p_status = "IN_PROGRESS"
                in_progress_count += 1

            items.append(ProjectCompletionItem(
                registration_id=reg_id,
                team_name=r.get("team_name") or "Team",
                project_title=title,
                category=category,
                domain_id=resolved_dom_id,
                domain_title=domain_name_map.get(resolved_dom_id, category),
                assigned_juries=assigned_juries_list,
                submitted_juries=submitted_juries_list,
                assigned_count=a_count,
                submitted_count=s_count,
                status=p_status,
            ))

        return JuryCompletionOverviewResponse(
            success=True,
            total_projects=len(items),
            completed_projects=completed_count,
            in_progress_projects=in_progress_count,
            not_evaluated_projects=not_evaluated_count,
            unassigned_projects=unassigned_count,
            projects=items,
        )

    # ─── Atomic Evaluation Reset & Audit ──────────────────────────────────────

    async def atomic_reset_evaluation(
        self,
        evaluation_id: str,
        admin_user_id: str,
        reset_reason: str
    ) -> Dict[str, Any]:
        """
        Atomically snapshots the evaluation row to evaluation_reset_audit
        and deletes the evaluation record.
        """
        clean_id = evaluation_id.strip()
        clean_reason = reset_reason.strip()
        if not clean_reason:
            raise ValueError("A valid reset reason is required.")

        # 1. First attempt Postgres RPC call
        rpc_url = f"{settings.supabase_url}/rest/v1/rpc/atomic_reset_evaluation"
        key = settings.get_effective_key()
        headers = {
            "apikey": key or "",
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                rpc_res = await client.post(
                    rpc_url,
                    headers=headers,
                    json={
                        "p_evaluation_id": clean_id,
                        "p_admin_user_id": admin_user_id,
                        "p_reset_reason": clean_reason,
                    }
                )
                if rpc_res.status_code == 200:
                    return rpc_res.json()
        except Exception as e:
            print(f"[JuryService] RPC execution notice: {e}. Falling back to atomic client transaction.")

        # 2. Fallback via service-role PostgREST
        existing_rows = await db.fetch_supabase("judge_evaluations", f"id=eq.{clean_id}") or []
        if not existing_rows:
            raise LookupError(f"Evaluation with ID '{clean_id}' not found.")

        target = existing_rows[0]

        # Audit snapshot
        audit_payload = {
            "evaluation_id": clean_id,
            "judge_id": target.get("judge_id"),
            "judge_name": target.get("judge_name") or "Jury",
            "judge_email": target.get("judge_email") or "",
            "registration_id": target.get("registration_id"),
            "scores_snapshot": target.get("criteria_scores") or {},
            "total_score": float(target.get("total_score") or 0.0),
            "reset_by": admin_user_id,
            "reset_reason": clean_reason,
        }

        audit_row = await db.insert_supabase("evaluation_reset_audit", audit_payload)

        # Delete evaluation row
        delete_success = await db.delete_supabase("judge_evaluations", "id", clean_id)
        if not delete_success:
            raise RuntimeError("Failed to delete evaluation record.")

        return {
            "success": True,
            "message": "Evaluation successfully reset and logged to audit trail.",
            "deleted_id": clean_id,
            "audit_id": audit_row.get("id") if audit_row else None,
            "judge_id": target.get("judge_id"),
            "registration_id": target.get("registration_id"),
        }

    # ─── Jury Project Progress (Admin) ────────────────────────────────────────

    async def get_jury_project_progress(self, judge_user_id: str) -> JuryProjectProgressResponse:
        """
        Authoritative endpoint for Admin Jury Management:
        Returns complete assigned project list along with dynamic evaluation progress
        for the specified jury member.

        Rules:
        - Canonical identity: public.judges.user_id = jury_domain_assignments.judge_user_id = judge_evaluations.judge_id
        - For ALL mode: resolves all projects belonging to the assigned canonical domain.
        - For SELECTED mode: resolves only explicit jury_project_assignments rows.
        - Multiple domains: combines projects from all active assignments, deduplicating by registration_id.
        - Inactive juries: still inspectable read-only.
        - Evaluation status:
          If judge_evaluations contains (judge_id = selected jury user_id AND registration_id = assigned project):
            status = 'EVALUATED', score = judge_evaluations.total_score, submitted_at = created_at
          Else:
            status = 'PENDING', score = None, submitted_at = None
        - Summary counts:
          assigned_projects = number of distinct currently assigned registration IDs
          evaluated_projects = number of assigned registration IDs having a valid submitted evaluation by this jury
          remaining_projects = assigned_projects - evaluated_projects
        - Unassigned historical evaluations: NEVER inflate assigned/evaluated counters.
        - Raw score only (/100), no normalization/merit/ranking.
        - Bulk queries to prevent N+1.
        """
        canonical_uid = str(judge_user_id).strip()
        possible_judge_ids = {canonical_uid}

        # 1. Resolve canonical judge identity from judges table (supports either id or user_id)
        judge_rows = await db.fetch_supabase("judges", f"or=(user_id.eq.{canonical_uid},id.eq.{canonical_uid})&select=id,user_id,name,email,is_active") or []
        if judge_rows:
            j = judge_rows[0]
            if j.get("user_id"):
                canonical_uid = str(j.get("user_id")).strip()
                possible_judge_ids.add(canonical_uid)
            if j.get("id"):
                possible_judge_ids.add(str(j.get("id")).strip())

        # 2. Fetch active domain assignments in bulk
        jdas = await db.fetch_supabase(
            "jury_domain_assignments",
            f"judge_user_id=eq.{canonical_uid}&is_active=eq.true&order=created_at.desc"
        ) or []
        if not jdas and len(possible_judge_ids) > 1:
            for alt_id in possible_judge_ids:
                if alt_id != canonical_uid:
                    jdas = await db.fetch_supabase(
                        "jury_domain_assignments",
                        f"judge_user_id=eq.{alt_id}&is_active=eq.true&order=created_at.desc"
                    ) or []
                    if jdas:
                        break

        # If jury has no assignments, return empty response immediately
        if not jdas:
            return JuryProjectProgressResponse(
                success=True,
                jury_user_id=canonical_uid,
                assigned_projects=0,
                evaluated_projects=0,
                remaining_projects=0,
                projects=[],
            )

        # 3. Categorize assignments into ALL domains vs SELECTED assignments
        all_domain_ids: Set[str] = set()
        selected_assignment_ids: Set[str] = set()
        selected_jda_domain_map: Dict[str, str] = {}

        for jda in jdas:
            mode = jda.get("assignment_mode") or "ALL"
            dom_id = str(jda.get("domain_id") or "").strip()
            aid = str(jda.get("id") or "").strip()
            if mode == "ALL":
                if dom_id:
                    all_domain_ids.add(dom_id)
            else:
                if aid:
                    selected_assignment_ids.add(aid)
                    if dom_id:
                        selected_jda_domain_map[aid] = dom_id

        # 4. Fetch explicit selected project registrations if any SELECTED mode assignments
        selected_reg_domain_map: Dict[str, str] = {}
        if selected_assignment_ids:
            if len(selected_assignment_ids) == 1:
                pas = await db.fetch_supabase(
                    "jury_project_assignments",
                    f"jury_domain_assignment_id=eq.{next(iter(selected_assignment_ids))}&select=registration_id,jury_domain_assignment_id"
                ) or []
            else:
                pas = await db.fetch_supabase(
                    "jury_project_assignments",
                    f"jury_domain_assignment_id=in.({','.join(selected_assignment_ids)})&select=registration_id,jury_domain_assignment_id"
                ) or []
            for p in pas:
                rid = (p.get("registration_id") or "").strip().upper()
                aid = str(p.get("jury_domain_assignment_id") or "")
                if rid:
                    selected_reg_domain_map[rid] = selected_jda_domain_map.get(aid, "")

        # 5, 6, 7. Concurrently fetch domains, registrations with projects, and jury evaluations
        domains_task = db.fetch_supabase("project_domains", "select=id,title")
        regs_task = db.fetch_supabase("registrations", "select=registration_id,team_name,projects(title,category)")
        evals_task = db.fetch_supabase(
            "judge_evaluations",
            f"judge_id=eq.{canonical_uid}&select=id,registration_id,total_score,created_at,updated_at"
        )
        alias_task = self._refresh_aliases_cache()

        domains_raw, regs_raw, evals_raw, _ = await asyncio.gather(
            domains_task, regs_task, evals_task, alias_task,
            return_exceptions=True
        )

        domains_raw = domains_raw if isinstance(domains_raw, list) else []
        regs_raw = regs_raw if isinstance(regs_raw, list) else []
        evals_raw = evals_raw if isinstance(evals_raw, list) else []
        domain_name_map = {str(d.get("id")): d.get("title") or str(d.get("id")) for d in domains_raw}

        if not evals_raw and len(possible_judge_ids) > 1:
            for alt_id in possible_judge_ids:
                if alt_id != canonical_uid:
                    evals_raw = await db.fetch_supabase(
                        "judge_evaluations",
                        f"judge_id=eq.{alt_id}&select=id,registration_id,total_score,created_at,updated_at"
                    ) or []
                    if evals_raw:
                        break

        # Map evaluations: registration_id (uppercase) -> evaluation row
        eval_map: Dict[str, Dict[str, Any]] = {}
        for ev in evals_raw:
            r_id = str(ev.get("registration_id") or "").strip().upper()
            if r_id:
                eval_map[r_id] = ev

        # 8. Filter and construct assigned projects list (with deduplication by registration_id)
        assigned_map: Dict[str, JuryProjectProgressItem] = {}

        for r in regs_raw:
            reg_id = (r.get("registration_id") or "").strip().upper()
            if not reg_id:
                continue

            p_data = r.get("projects")
            cat = ""
            title = ""
            if isinstance(p_data, list) and len(p_data) > 0:
                title = p_data[0].get("title") or ""
                cat = p_data[0].get("category") or ""
            elif isinstance(p_data, dict):
                title = p_data.get("title") or ""
                cat = p_data.get("category") or ""
            if not cat:
                cat = r.get("category") or "General"
            if not title:
                title = r.get("project_title") or "Project Title"
            team_name = r.get("team_name") or "Team"

            resolved_dom_id = await self.resolve_domain_id(cat)

            is_covered_all = resolved_dom_id in all_domain_ids
            is_covered_selected = reg_id in selected_reg_domain_map

            if not (is_covered_all or is_covered_selected):
                continue

            # Determine mode and canonical domain
            if is_covered_all:
                assignment_mode = "ALL"
                canonical_dom_id = resolved_dom_id
            else:
                assignment_mode = "SELECTED"
                canonical_dom_id = selected_reg_domain_map.get(reg_id) or resolved_dom_id

            canonical_dom_title = domain_name_map.get(canonical_dom_id) or (
                domain_name_map.get(resolved_dom_id) if resolved_dom_id != "UNMAPPED" else cat
            )

            # Evaluation status and raw score
            ev = eval_map.get(reg_id)
            if ev is not None:
                eval_status = "EVALUATED"
                raw_score = float(ev.get("total_score") if ev.get("total_score") is not None else 0.0)
                if raw_score.is_integer():
                    raw_score = float(int(raw_score))
                sub_at = ev.get("created_at") or ev.get("updated_at")
            else:
                eval_status = "PENDING"
                raw_score = None
                sub_at = None

            item = JuryProjectProgressItem(
                registration_id=reg_id,
                project_title=title,
                team_name=team_name,
                domain_id=canonical_dom_id if canonical_dom_id != "UNMAPPED" else None,
                domain_title=canonical_dom_title,
                assignment_mode=assignment_mode,
                evaluation_status=eval_status,
                total_score=raw_score,
                submitted_at=sub_at,
            )

            # Deduplication: if project already in assigned_map, ALL takes precedence over SELECTED
            if reg_id in assigned_map:
                if assignment_mode == "ALL" and assigned_map[reg_id].assignment_mode == "SELECTED":
                    assigned_map[reg_id].assignment_mode = "ALL"
            else:
                assigned_map[reg_id] = item

        # Sort projects by registration_id for consistent ordering
        sorted_projects = sorted(list(assigned_map.values()), key=lambda x: x.registration_id)

        # 9. Compute summary metrics strictly from the active assigned set
        assigned_count = len(sorted_projects)
        evaluated_count = sum(1 for p in sorted_projects if p.evaluation_status == "EVALUATED")
        remaining_count = assigned_count - evaluated_count

        return JuryProjectProgressResponse(
            success=True,
            jury_user_id=canonical_uid,
            assigned_projects=assigned_count,
            evaluated_projects=evaluated_count,
            remaining_projects=remaining_count,
            projects=sorted_projects,
        )

    # ─── Assignment Candidates Endpoint ───────────────────────────────────────

    async def get_assignment_candidates(self, domain_id: str, for_judge_user_id: Optional[str] = None) -> AssignmentCandidatesResponse:
        """
        Authoritative candidate loader for SELECTED mode assignment:
        - Resolves target domain canonically.
        - Excludes any registration not canonically belonging to this domain.
        - Determines real-time availability under the exclusive ownership rule.
        - If for_judge_user_id is provided, projects assigned to that judge remain available for editing,
          while projects owned by OTHER juries remain unavailable.
        """
        clean_dom_id = domain_id.strip()
        await self._refresh_aliases_cache()

        # 1. Fetch domain title
        domains_raw = await db.fetch_supabase("project_domains", "select=id,title") or []
        domain_name_map = {str(d.get("id")): d.get("title") or str(d.get("id")) for d in domains_raw}
        dom_title = domain_name_map.get(clean_dom_id, clean_dom_id)

        # 2. Fetch active domain assignments and judges
        judges_raw = await db.fetch_supabase("judges", "is_active=eq.true&select=id,user_id,name") or []
        judge_name_map = {}
        judge_id_to_user_id = {}
        for j in judges_raw:
            uid = str(j.get("user_id") or "").strip()
            jid = str(j.get("id") or "").strip()
            name = j.get("name") or "Jury Evaluator"
            if uid:
                judge_name_map[uid] = name
                judge_id_to_user_id[uid] = uid
            if jid:
                judge_name_map[jid] = name
                if uid:
                    judge_id_to_user_id[jid] = uid

        clean_target_judge_id = None
        if for_judge_user_id:
            raw_target = str(for_judge_user_id).strip()
            clean_target_judge_id = judge_id_to_user_id.get(raw_target, raw_target)

        jdas_raw = await db.fetch_supabase("jury_domain_assignments", "is_active=eq.true") or []
        pas_raw = await db.fetch_supabase("jury_project_assignments", "") or []

        # Check if an ALL-mode jury exists for this domain
        all_mode_judge_id = None
        all_mode_judge_name = None
        for jda in jdas_raw:
            if str(jda.get("domain_id")) == clean_dom_id and (jda.get("assignment_mode") or "ALL") == "ALL":
                jid = str(jda.get("judge_user_id") or "").strip()
                if jid:
                    canonical_jid = judge_id_to_user_id.get(jid, jid)
                    all_mode_judge_id = canonical_jid
                    all_mode_judge_name = judge_name_map.get(canonical_jid, judge_name_map.get(jid, "Jury Evaluator"))
                    break

        # Map active SELECTED project assignments: reg_id -> (canonical_judge_id, judge_name)
        selected_assignment_map: Dict[str, Tuple[str, str]] = {}
        selected_jda_judge: Dict[str, str] = {}
        for jda in jdas_raw:
            if (jda.get("assignment_mode") or "ALL") == "SELECTED":
                aid = str(jda.get("id") or "").strip()
                jid = str(jda.get("judge_user_id") or "").strip()
                if aid and jid:
                    canonical_jid = judge_id_to_user_id.get(jid, jid)
                    selected_jda_judge[aid] = canonical_jid

        for pa in pas_raw:
            aid = str(pa.get("jury_domain_assignment_id") or "").strip()
            reg_id = (pa.get("registration_id") or "").strip().upper()
            if aid in selected_jda_judge and reg_id:
                canonical_jid = selected_jda_judge[aid]
                selected_assignment_map[reg_id] = (canonical_jid, judge_name_map.get(canonical_jid, "Jury Evaluator"))

        # 3. Fetch all registrations with embedded institutions and projects (strictly using projects.category)
        regs_raw = await db.fetch_supabase(
            "registrations",
            "select=registration_id,team_name,institutions(name),projects(title,category)"
        )
        if regs_raw is None:
            regs_raw = await db.fetch_supabase(
                "registrations",
                "select=registration_id,team_name,projects(title,category)"
            ) or []

        candidates: List[AssignmentCandidateItem] = []
        available_count = 0
        already_assigned_count = 0
        seen_reg_ids: Set[str] = set()

        for r in regs_raw:
            reg_id = (r.get("registration_id") or "").strip().upper()
            if not reg_id or reg_id in seen_reg_ids:
                continue

            inst_data = r.get("institutions")
            if isinstance(inst_data, dict):
                institution = inst_data.get("name") or ""
            elif isinstance(inst_data, list) and len(inst_data) > 0:
                institution = inst_data[0].get("name") or ""
            else:
                institution = r.get("institution_name") or ""

            p_data = r.get("projects")
            p_list = p_data if isinstance(p_data, list) else ([p_data] if isinstance(p_data, dict) and p_data else [])
            if not p_list:
                p_list = [{"title": r.get("project_title") or "Project Title", "category": ""}]

            for p in p_list:
                title = p.get("title") or r.get("project_title") or "Project Title"
                category = p.get("category") or ""
                resolved_dom_id = await self.resolve_domain_id(category)

                # Strict domain filtering: exclude any project that does not belong to this canonical domain
                if resolved_dom_id != clean_dom_id:
                    continue

                seen_reg_ids.add(reg_id)

                # Determine assignment status under the exclusive ownership rule
                is_assigned = False
                assigned_judge_id = None
                assigned_judge_name = None

                if all_mode_judge_id:
                    is_assigned = True
                    assigned_judge_id = all_mode_judge_id
                    assigned_judge_name = all_mode_judge_name
                elif reg_id in selected_assignment_map:
                    is_assigned = True
                    assigned_judge_id, assigned_judge_name = selected_assignment_map[reg_id]

                if clean_target_judge_id:
                    available = (not is_assigned) or (assigned_judge_id == clean_target_judge_id)
                else:
                    available = not is_assigned

                # Authoritative Filter:
                # If project has NO active owner: include in available list
                # Else if project owner == jury currently being edited: include it because it is that jury's existing assignment
                # Else: EXCLUDE IT COMPLETELY FROM RESPONSE/LIST
                if available:
                    available_count += 1
                    candidates.append(AssignmentCandidateItem(
                        registration_id=reg_id,
                        project_title=title,
                        team_name=r.get("team_name") or "Team",
                        institution=institution,
                        canonical_domain_id=resolved_dom_id,
                        domain_title=dom_title,
                        canonical_domain_title=dom_title,
                        is_assigned=is_assigned,
                        assigned_to_judge_id=assigned_judge_id,
                        assigned_to_judge_name=assigned_judge_name,
                        assigned_jury_id=assigned_judge_id,
                        assigned_jury_name=assigned_judge_name,
                        available=True,
                    ))
                else:
                    already_assigned_count += 1
                break  # Process one project per registration

        # Sort: alphabetical by registration_id
        candidates.sort(key=lambda x: x.registration_id)

        total_count = len(candidates)
        return AssignmentCandidatesResponse(
            success=True,
            domain_id=clean_dom_id,
            domain_title=dom_title,
            available_count=len(candidates),
            already_assigned_count=already_assigned_count,
            total_candidates=len(candidates),
            available_candidates=len(candidates),
            assigned_candidates=already_assigned_count,
            candidates=candidates,
        )

    # ─── Delete Jury Account ──────────────────────────────────────────────────

    async def delete_jury_account(self, judge_user_id: str) -> Dict[str, Any]:
        """
        Hard-deletes a jury account and its associated assignments.
        Enforces Results Integrity Rule:
        If ANY submitted/draft evaluation exists in judge_evaluations:
        BLOCK deletion with 409 Conflict:
        'This jury member has evaluation history. Reset/remove the associated evaluations before deleting the account.'

        Deterministic & Idempotent Safety Property:
        1. Verifies zero evaluation history across both user_id and judge table ID.
        2. Revokes database access first (removes project assignments, domain assignments,
           public.judges, and public.user_roles). Once this step runs, the account is
           immediately unauthorized from evaluating or viewing any projects.
        3. Calls Supabase Auth Admin API to delete the Auth user.
        4. If Auth deletion temporarily fails, returns HTTP 502 indicating DB access was safely
           revoked and Auth deletion should be retried. Repeating DELETE is fully idempotent.
        """
        canonical_uid = judge_user_id.strip()

        # 1. Fetch judge to check both user_id and internal ID
        judge_rows = await db.fetch_supabase(
            "judges",
            f"user_id=eq.{canonical_uid}&select=id,user_id,email"
        ) or []
        possible_judge_ids = [canonical_uid]
        if judge_rows:
            jid = str(judge_rows[0].get("id") or "")
            if jid and jid not in possible_judge_ids:
                possible_judge_ids.append(jid)

        # Check for any evaluation history across user_id and internal judge id
        for jid in possible_judge_ids:
            evals = await db.fetch_supabase(
                "judge_evaluations",
                f"judge_id=eq.{jid}&select=id"
            ) or []
            if evals and len(evals) > 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="This jury member has evaluation history. Reset/remove the associated evaluations before deleting the account."
                )

        # 2. Database-side removal: assignments, judges profile, and user_roles
        jdas = await db.fetch_supabase(
            "jury_domain_assignments",
            f"judge_user_id=eq.{canonical_uid}&select=id"
        ) or []
        for jda in jdas:
            jda_id = str(jda.get("id"))
            await db.delete_supabase("jury_project_assignments", "jury_domain_assignment_id", jda_id)

        await db.delete_supabase("jury_domain_assignments", "judge_user_id", canonical_uid)
        await db.delete_supabase("judges", "user_id", canonical_uid)
        if len(possible_judge_ids) > 1 and possible_judge_ids[1] != canonical_uid:
            await db.delete_supabase("judges", "id", possible_judge_ids[1])
        await db.delete_supabase("user_roles", "user_id", canonical_uid)

        # 3. Delete Supabase Auth account via server-side Admin API
        auth_deleted = True
        auth_error_msg: Optional[str] = None
        key = settings.get_effective_key()
        if settings.supabase_url and key:
            try:
                auth_admin_url = f"{settings.supabase_url}/auth/v1/admin/users/{canonical_uid}"
                client = db.get_client()
                headers = {
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                }
                res = await client.delete(auth_admin_url, headers=headers)
                # HTTP 200, 204 or 404 (already deleted / idempotent) are successful
                if res.status_code not in (200, 204, 404):
                    auth_deleted = False
                    auth_error_msg = f"Auth admin returned HTTP {res.status_code}: {res.text[:100]}"
                    print(f"[JuryService Warning] Supabase Auth user delete {canonical_uid}: {auth_error_msg}")
            except Exception as e:
                auth_deleted = False
                auth_error_msg = str(e)
                print(f"[JuryService Warning] Supabase Auth delete user exception: {e}")

        if not auth_deleted:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Jury database access was safely revoked, but Supabase Auth account deletion encountered an issue and should be retried: {auth_error_msg}"
            )

        return {"success": True, "message": "Jury account and assignments removed successfully."}

    # ─── Create Jury Account ──────────────────────────────────────────────────

    async def create_jury_account(self, payload: CreateJuryAccountRequest) -> Dict[str, Any]:
        """
        Authoritative backend creation for jury accounts:
        - Validates name, email, department, and password (8-72 chars).
        - Creates Supabase Auth user via admin API with service-role key.
        - Creates public.judges profile and public.user_roles record.
        - Provides compensating cleanup if database insertion fails.
        - Never logs password.
        """
        name = payload.name.strip()
        email = payload.email.strip().lower()
        department = payload.department.strip()
        password = payload.temporaryPassword.strip()
        is_active = payload.isActive

        if len(password) < 8 or len(password) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Temporary password must be between 8 and 72 characters long."
            )

        key = settings.get_effective_key()
        if not settings.supabase_url or not key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: missing Supabase credentials."
            )

        client = db.get_client()
        auth_admin_url = f"{settings.supabase_url}/auth/v1/admin/users"
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

        # 1. Create Auth User
        user_id = None
        try:
            create_payload = {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "name": name,
                    "department": department,
                    "role": "jury",
                },
            }
            res = await client.post(auth_admin_url, headers=headers, json=create_payload)
            if res.status_code not in (200, 201):
                err_text = res.text[:200]
                if "already registered" in err_text or "already exists" in err_text:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"An account with email '{email}' already exists."
                    )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create auth user: {err_text}"
                )
            auth_data = res.json()
            user_id = auth_data.get("id") or (auth_data.get("user") or {}).get("id")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Auth creation exception: {str(e)}"
            )

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Auth user created but no ID was returned."
            )

        # 2. Insert into public.judges and public.user_roles (with compensating cleanup)
        try:
            judge_payload = {
                "user_id": user_id,
                "name": name,
                "email": email,
                "department": department,
                "is_active": is_active,
            }
            judge_row = await db.insert_supabase("judges", judge_payload)
            if not judge_row:
                raise RuntimeError("Failed to insert into public.judges")

            role_payload = {
                "user_id": user_id,
                "user_email": email,
                "role": "jury",
                "is_active": is_active,
            }
            role_row = await db.insert_supabase("user_roles", role_payload)
            if not role_row:
                print(f"[JuryService Warning] user_roles insert notice for {email}")
        except Exception as e:
            print(f"[JuryService] Database record creation failed, executing compensating cleanup: {e}")
            try:
                await client.delete(f"{auth_admin_url}/{user_id}", headers=headers)
                await db.delete_supabase("judges", "user_id", user_id)
                await db.delete_supabase("user_roles", "user_id", user_id)
            except Exception as rb_err:
                print(f"[JuryService] Compensating rollback notice: {rb_err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to initialize database records for jury account: {str(e)}"
            )

        return {
            "success": True,
            "user_id": user_id,
            "name": name,
            "email": email,
            "department": department,
            "temporaryPassword": password,
            "is_active": is_active,
        }

    # ─── Reset Jury Password ──────────────────────────────────────────────────

    async def reset_jury_password(
        self,
        judge_user_id: str,
        temporary_password: Optional[str] = None
    ) -> ResetJuryPasswordResponse:
        """
        Authoritative Admin endpoint to securely reset a jury member's password:
        - Validates judge user exists in public.judges.
        - Obtains linked auth user UUID and authentication login ID (email).
        - Generates secure random 12-char temporary password if not provided by admin.
        - Updates password directly via Supabase Auth Admin API using service-role credentials.
        - Never stores plaintext password or hashes in the database.
        - Never logs password.
        - Returns temporary password ONCE to caller.
        """
        import secrets
        import string

        canonical_uid = str(judge_user_id).strip()
        if not canonical_uid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Judge user ID is required."
            )

        # 1. Authoritative lookup in public.judges
        judges_raw = await db.fetch_supabase("judges", f"user_id=eq.{canonical_uid}&select=id,user_id,email,name") or []
        if not judges_raw:
            # Fallback check if passed ID is judges.id PK
            judges_raw = await db.fetch_supabase("judges", f"id=eq.{canonical_uid}&select=id,user_id,email,name") or []

        if not judges_raw:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jury account not found."
            )

        judge_info = judges_raw[0]
        login_email = (judge_info.get("email") or "").strip().lower()
        auth_uid = str(judge_info.get("user_id") or canonical_uid).strip()

        if not login_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Jury account does not have a registered login email."
            )

        # 2. Determine temporary password
        if temporary_password:
            temp_pass = temporary_password.strip()
            if len(temp_pass) < 8 or len(temp_pass) > 72:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Temporary password must be between 8 and 72 characters long."
                )
        else:
            # Generate secure temporary password
            # Must contain upper, lower, digit, and special char
            special_chars = "!@#$%^&*"
            alphabet = string.ascii_letters + string.digits + special_chars
            while True:
                pwd = ''.join(secrets.choice(alphabet) for _ in range(12))
                if (any(c.islower() for c in pwd)
                    and any(c.isupper() for c in pwd)
                    and any(c.isdigit() for c in pwd)
                    and any(c in special_chars for c in pwd)):
                    temp_pass = pwd
                    break

        # 3. Call Supabase Auth Admin API to update password
        key = settings.get_effective_key()
        if not settings.supabase_url or not key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server configuration error: missing Supabase credentials."
            )

        client = db.get_client()
        auth_admin_url = f"{settings.supabase_url}/auth/v1/admin/users/{auth_uid}"
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

        try:
            res = await client.put(auth_admin_url, headers=headers, json={"password": temp_pass})
            if res.status_code not in (200, 201):
                err_text = res.text[:200]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to reset auth password: {err_text}"
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Auth password reset exception: {str(e)}"
            )

        return ResetJuryPasswordResponse(
            success=True,
            login_id=login_email,
            temporary_password=temp_pass,
            message="Password reset successfully. Copy this password now. For security, it will not be shown again."
        )

    # ─── Marks Export ─────────────────────────────────────────────────────────

    async def get_marks_export(
        self,
        theme_id: Optional[str] = None,
        project_ids: Optional[List[str]] = None
    ) -> MarksExportResponse:
        """
        Authoritative export endpoint for Admin Results:
        Produces export rows containing registration, project, canonical theme,
        assigned jury name, evaluation status, and individual criteria marks.
        Pending projects have blank marks, never manufactured zeros.
        """
        # Fetch registrations + projects
        regs_raw = await db.fetch_supabase(
            "registrations",
            "select=registration_id,team_name,institutions(name),projects(title,category)"
        )
        if regs_raw is None:
            regs_raw = await db.fetch_supabase(
                "registrations",
                "select=registration_id,team_name,projects(title,category)"
            ) or []

        # Fetch evaluations
        evals_raw = await db.fetch_supabase("judge_evaluations", "") or []
        eval_map: Dict[str, Dict[str, Any]] = {}
        for ev in evals_raw:
            rid = (ev.get("registration_id") or "").strip().upper()
            if rid:
                eval_map[rid] = ev

        # Fetch domains
        domains_raw = await db.fetch_supabase("project_domains", "select=id,title") or []
        domain_name_map = {str(d.get("id")): d.get("title") or str(d.get("id")) for d in domains_raw}

        # Fetch judges & assignments
        judges_raw = await db.fetch_supabase("judges", "select=user_id,name") or []
        judge_name_map = {str(j.get("user_id")): j.get("name") or "Jury Evaluator" for j in judges_raw if j.get("user_id")}

        jdas_raw = await db.fetch_supabase("jury_domain_assignments", "is_active=eq.true") or []
        pas_raw = await db.fetch_supabase("jury_project_assignments", "") or []

        domain_all_juries: Dict[str, str] = {}
        selected_jda_judge: Dict[str, str] = {}
        for jda in jdas_raw:
            jid = str(jda.get("judge_user_id") or "")
            dom = str(jda.get("domain_id") or "")
            mode = jda.get("assignment_mode") or "ALL"
            aid = str(jda.get("id") or "")
            if mode == "ALL":
                domain_all_juries[dom] = judge_name_map.get(jid, "Jury Evaluator")
            else:
                selected_jda_judge[aid] = judge_name_map.get(jid, "Jury Evaluator")

        project_selected_juries: Dict[str, str] = {}
        for pa in pas_raw:
            aid = str(pa.get("jury_domain_assignment_id") or "")
            reg_id = (pa.get("registration_id") or "").strip().upper()
            if aid in selected_jda_judge and reg_id:
                project_selected_juries[reg_id] = selected_jda_judge[aid]

        records: List[MarksExportItem] = []
        clean_theme_filter = theme_id.strip() if theme_id else None
        filter_pids = {p.strip().upper() for p in project_ids} if project_ids else None

        for r in regs_raw:
            reg_id = (r.get("registration_id") or "").strip().upper()
            if not reg_id:
                continue

            if filter_pids is not None and reg_id not in filter_pids:
                continue

            p_data = r.get("projects")
            if isinstance(p_data, list) and len(p_data) > 0:
                p_data = p_data[0]
            elif not isinstance(p_data, dict):
                p_data = {}

            inst_data = r.get("institutions")
            if isinstance(inst_data, dict):
                institution = inst_data.get("name") or ""
            elif isinstance(inst_data, list) and len(inst_data) > 0:
                institution = inst_data[0].get("name") or ""
            else:
                institution = r.get("institution_name") or ""

            title = p_data.get("title") or r.get("project_title") or "Project Title"
            category = p_data.get("category") or ""
            resolved_dom_id = await self.resolve_domain_id(category)

            if clean_theme_filter and resolved_dom_id != clean_theme_filter:
                continue

            dom_title = domain_name_map.get(resolved_dom_id, category or "General")

            # Determine assigned jury name
            assigned_jury = None
            if resolved_dom_id in domain_all_juries:
                assigned_jury = domain_all_juries[resolved_dom_id]
            elif reg_id in project_selected_juries:
                assigned_jury = project_selected_juries[reg_id]

            # Evaluation details
            ev = eval_map.get(reg_id)
            if ev:
                eval_status = "Evaluated"
                raw_scores = ev.get("criteria_scores") or {}
                c_inno = float(raw_scores.get("innovation") if raw_scores.get("innovation") is not None else (ev.get("innovation_score") or 0.0))
                c_tech = float(raw_scores.get("technical") if raw_scores.get("technical") is not None else (ev.get("technical_score") or 0.0))
                c_proto = float(raw_scores.get("working_model") if raw_scores.get("working_model") is not None else (raw_scores.get("implementation") if raw_scores.get("implementation") is not None else (ev.get("relevance_score") or 0.0)))
                c_impact = float(raw_scores.get("impact") if raw_scores.get("impact") is not None else (ev.get("impact_score") or 0.0))
                c_pres = float(raw_scores.get("presentation") if raw_scores.get("presentation") is not None else (ev.get("presentation_score") or 0.0))
                raw_total = float(ev.get("total_score") if ev.get("total_score") is not None else sum([c_inno, c_tech, c_proto, c_impact, c_pres]))
                eval_at = ev.get("created_at") or ev.get("updated_at")
                if ev.get("judge_name") and not assigned_jury:
                    assigned_jury = ev.get("judge_name")
            else:
                eval_status = "Pending"
                c_inno = None
                c_tech = None
                c_proto = None
                c_impact = None
                c_pres = None
                raw_total = None
                eval_at = None

            records.append(MarksExportItem(
                registration_id=reg_id,
                project_title=title,
                team_name=r.get("team_name") or "Team",
                institution=institution,
                institution_name=institution,
                department=r.get("department") or "",
                canonical_theme=dom_title,
                domain_id=resolved_dom_id,
                assigned_jury_name=assigned_jury,
                evaluation_status=eval_status,
                criteria_innovation=c_inno,
                criteria_technical=c_tech,
                criteria_prototype=c_proto,
                criteria_impact=c_impact,
                criteria_presentation=c_pres,
                raw_total=raw_total,
                evaluated_at=eval_at,
            ))

        records.sort(key=lambda x: (x.canonical_theme, x.registration_id))
        total_count = len(records)
        eval_count = sum(1 for r in records if r.evaluation_status == "Evaluated")
        pend_count = total_count - eval_count

        return MarksExportResponse(
            success=True,
            total_projects=total_count,
            evaluated_count=eval_count,
            pending_count=pend_count,
            records=records,
            projects=records,
        )

jury_service = JuryService()

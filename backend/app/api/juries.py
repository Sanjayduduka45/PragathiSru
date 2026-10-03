from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.auth import verify_admin_auth, verify_jury_auth
from app.services.jury_service import jury_service
from app.schemas.jury import (
    JuryProfile,
    UpdateJuryProfileRequest,
    DomainAssignmentItem,
    ProjectAssignmentItem,
    CreateDomainAssignmentRequest,
    UpdateDomainAssignmentRequest,
    AddProjectAssignmentsRequest,
    JuryCompletionOverviewResponse,
    AssignedProjectItem,
    AssignedProjectsResponse,
    JuryProjectProgressItem,
    JuryProjectProgressResponse,
    JuryBootstrapResponse,
    AssignmentCandidatesResponse,
    CreateJuryAccountRequest,
)

router = APIRouter(tags=["Jury Management"])

# ─── ADMIN ENDPOINTS ──────────────────────────────────────────────────────────

@router.get("/api/admin/juries", response_model=List[JuryProfile])
async def list_juries(auth_data: dict = Depends(verify_admin_auth)):
    """Admin endpoint to list all jury accounts with evaluation and assignment stats."""
    return await jury_service.list_juries()

@router.post("/api/admin/juries")
async def create_jury_account(
    payload: CreateJuryAccountRequest,
    auth_data: dict = Depends(verify_admin_auth)
):
    """
    Authoritative Admin endpoint to create a new jury account with Supabase Auth,
    public.judges record, and user_roles mapping.
    """
    return await jury_service.create_jury_account(payload)

@router.delete("/api/admin/juries/{judge_user_id}")
async def delete_jury_account(
    judge_user_id: str,
    auth_data: dict = Depends(verify_admin_auth)
):
    """
    Admin endpoint to hard delete a jury account.
    Blocks if jury has any submitted evaluations.
    """
    return await jury_service.delete_jury_account(judge_user_id)

@router.get("/api/admin/juries/assignment-candidates", response_model=AssignmentCandidatesResponse)
async def get_assignment_candidates(
    domain_id: str = Query(..., description="Canonical Domain ID"),
    for_judge_user_id: Optional[str] = Query(None, description="Optional target judge user ID to include their own projects as available"),
    auth_data: dict = Depends(verify_admin_auth)
):
    """
    Admin endpoint returning assignment candidates strictly for the requested canonical domain.
    Only returns candidates belonging to that domain, with availability status.
    """
    return await jury_service.get_assignment_candidates(domain_id, for_judge_user_id=for_judge_user_id)

@router.patch("/api/admin/juries/{judge_user_id}")
async def update_jury_profile(
    judge_user_id: str,
    payload: UpdateJuryProfileRequest,
    auth_data: dict = Depends(verify_admin_auth)
):
    """Admin endpoint to edit a jury's name, department, or toggle active/inactive status."""
    try:
        success = await jury_service.update_jury_profile(judge_user_id, payload)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update jury profile.")
        return {"success": True, "message": "Jury profile updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/api/admin/juries/{judge_user_id}/assignments", response_model=List[DomainAssignmentItem])
async def get_jury_assignments(
    judge_user_id: str,
    auth_data: dict = Depends(verify_admin_auth)
):
    """Admin endpoint to get all domain assignments for a specific jury."""
    return await jury_service.get_jury_assignments(judge_user_id)

@router.post("/api/admin/juries/{judge_user_id}/assignments")
async def assign_domain_to_jury(
    judge_user_id: str,
    payload: CreateDomainAssignmentRequest,
    auth_data: dict = Depends(verify_admin_auth)
):
    """Admin endpoint to assign a domain to a jury in ALL or SELECTED mode."""
    admin_id = auth_data.get("user_id")
    row = await jury_service.assign_domain(
        judge_user_id=judge_user_id,
        domain_id=payload.domain_id,
        assignment_mode=payload.assignment_mode,
        assigned_by=admin_id,
    )
    return {"success": True, "assignment": row}

@router.patch("/api/admin/jury-domain-assignments/{assignment_id}")
async def update_assignment_mode(
    assignment_id: str,
    payload: UpdateDomainAssignmentRequest,
    auth_data: dict = Depends(verify_admin_auth)
):
    """Admin endpoint to switch assignment mode between ALL and SELECTED."""
    if payload.assignment_mode is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="assignment_mode is required.")
    try:
        success = await jury_service.update_assignment_mode(assignment_id, payload.assignment_mode)
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update assignment mode.")
        return {"success": True, "message": "Assignment mode updated."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/api/admin/jury-domain-assignments/{assignment_id}")
async def remove_assignment(
    assignment_id: str,
    auth_data: dict = Depends(verify_admin_auth)
):
    """
    Admin endpoint to remove a domain assignment.
    Enforces Assignment Integrity Rule: blocks deletion if evaluations were already submitted.
    """
    try:
        success = await jury_service.remove_assignment(assignment_id)
        return {"success": True, "message": "Assignment removed successfully."}
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/api/admin/jury-domain-assignments/{assignment_id}/projects", response_model=List[ProjectAssignmentItem])
async def get_selected_projects(
    assignment_id: str,
    auth_data: dict = Depends(verify_admin_auth)
):
    """Admin endpoint to list all explicit project assignments for a SELECTED mode domain."""
    return await jury_service.get_selected_projects(assignment_id)

@router.post("/api/admin/jury-domain-assignments/{assignment_id}/projects")
async def add_selected_projects(
    assignment_id: str,
    payload: AddProjectAssignmentsRequest,
    auth_data: dict = Depends(verify_admin_auth)
):
    """Admin endpoint to add selected projects to a SELECTED mode assignment."""
    admin_id = auth_data.get("user_id")
    added = await jury_service.add_selected_projects(assignment_id, payload.registration_ids, assigned_by=admin_id)
    return {"success": True, "added_count": added}

@router.delete("/api/admin/jury-project-assignments/{project_assignment_id}")
async def remove_selected_project(
    project_assignment_id: str,
    auth_data: dict = Depends(verify_admin_auth)
):
    """Admin endpoint to remove a project assignment with integrity check."""
    try:
        success = await jury_service.remove_selected_project(project_assignment_id)
        return {"success": True, "message": "Project assignment removed successfully."}
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/api/admin/juries/completion-overview", response_model=JuryCompletionOverviewResponse)
async def get_completion_overview(auth_data: dict = Depends(verify_admin_auth)):
    """
    Authoritative Admin endpoint returning dynamic completion metrics for every project:
    Submitted Count / Assigned Count (e.g. 3/4).
    """
    return await jury_service.get_completion_overview()

@router.get("/api/admin/juries/{judge_user_id}/project-progress", response_model=JuryProjectProgressResponse)
async def get_jury_project_progress(
    judge_user_id: str,
    auth_data: dict = Depends(verify_admin_auth)
):
    """
    Authoritative Admin endpoint returning complete assigned project list along with
    dynamic evaluation progress (Assigned, Evaluated, Remaining, per-project status and raw scores).
    """
    try:
        return await jury_service.get_jury_project_progress(judge_user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ─── JURY ENDPOINTS ───────────────────────────────────────────────────────────

@router.get("/api/jury/assigned-projects", response_model=AssignedProjectsResponse)
async def get_assigned_projects(auth_data: dict = Depends(verify_jury_auth)):
    """
    Authoritative Jury endpoint:
    Returns projects covered by ALL domain assignments UNION SELECTED project assignments.
    """
    judge_user_id = auth_data.get("user_id")
    return await jury_service.get_assigned_projects_for_jury(judge_user_id)

@router.get("/api/jury/assigned-projects/{registration_id}", response_model=AssignedProjectItem)
async def get_assigned_project_by_id(
    registration_id: str,
    auth_data: dict = Depends(verify_jury_auth)
):
    """
    Validates that the project is assigned to the authenticated jury member.
    Returns 403 if project is not assigned.
    """
    judge_user_id = auth_data.get("user_id")
    project = await jury_service.get_assigned_project_by_id(judge_user_id, registration_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This project is not assigned to you for evaluation. Please evaluate the assigned projects only."
        )
    return project

@router.get("/api/jury/bootstrap", response_model=JuryBootstrapResponse)
async def get_jury_bootstrap(auth_data: dict = Depends(verify_jury_auth)):
    """
    Authoritative Jury Bootstrap endpoint:
    Returns jury profile, assignments, assigned projects, summary counts,
    and evaluations in ONE fast response.
    """
    judge_user_id = auth_data.get("user_id")
    verified_profile = auth_data.get("judge_profile")
    return await jury_service.get_jury_bootstrap(judge_user_id, verified_judge_profile=verified_profile)

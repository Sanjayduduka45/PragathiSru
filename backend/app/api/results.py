from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import verify_admin_auth
from app.schemas.results import AdminResultsResponse, DeleteEvaluationResponse
from app.services.results_service import results_service

router = APIRouter(prefix="/api/admin/results", tags=["Admin Results"])

@router.get("", response_model=AdminResultsResponse)
async def get_admin_results(
    auth_data: dict = Depends(verify_admin_auth),
):
    """
    Secure endpoint returning authoritative, server-calculated Admin Results:
    - Dynamic evaluations count per project (no hardcoded expected count)
    - Theme-wise Min-Max normalization
    - 70% Normalized + 30% Raw Overall Merit Score
    - Deterministic tie-breaking across 5 official competition criteria
    - Overall Prize Allocation (1st, 2nd, 3rd)
    - Theme Prize Allocation (1st, 2nd) with strict prize exclusivity
    - Zero confidential formula leakage to public/jury clients
    """
    try:
        results = await results_service.get_admin_results()
        return results
    except Exception as e:
        print(f"[Results API Error] Failed to compute admin results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate results."
        )

@router.delete("/evaluations/{evaluation_id}", response_model=DeleteEvaluationResponse)
async def delete_individual_evaluation(
    evaluation_id: str,
    auth_data: dict = Depends(verify_admin_auth),
):
    """
    Secure endpoint to delete a single test/invalid jury evaluation:
    - Deletes ONLY the specific row from public.judge_evaluations
    - Registrations, projects, teams, jury accounts, and other evaluations are untouched
    - Allows the jury to submit a fresh evaluation if needed
    - Results automatically recalculate on next fetch
    """
    try:
        response = await results_service.delete_evaluation(evaluation_id)
        return response
    except LookupError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        print(f"[Results API Error] Failed to delete evaluation {evaluation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete evaluation."
        )

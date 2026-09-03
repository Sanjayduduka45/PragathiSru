from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional, Dict, Any
import re
import time
from datetime import datetime, timezone
from app.database import db

router = APIRouter(tags=["Posters"])

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg"
}
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

@router.post("/api/posters/upload")
async def upload_poster(
    registration_id: str = Form(...),
    leader_email: str = Form(...),
    file: UploadFile = File(...)
):
    clean_reg_id = (registration_id or "").strip().upper()
    clean_email = (leader_email or "").strip().lower()

    if not clean_reg_id:
        raise HTTPException(status_code=400, detail="Registration ID is required.")
    if not clean_email:
        raise HTTPException(status_code=400, detail="Team Leader email is required.")
    if not file:
        raise HTTPException(status_code=400, detail="Poster file is required.")

    # 1. Look up registration in Supabase with server-side database client
    is_uuid = bool(re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', clean_reg_id, re.IGNORECASE))

    reg_row = None
    if is_uuid:
        by_id = await db.fetch_supabase("registrations", f"id=eq.{clean_reg_id}&select=*,team_members(*),projects(*),institutions(*)")
        if by_id and len(by_id) > 0:
            reg_row = by_id[0]

    if not reg_row:
        by_code = await db.fetch_supabase("registrations", f"registration_id=eq.{clean_reg_id}&select=*,team_members(*),projects(*),institutions(*)")
        if by_code and len(by_code) > 0:
            reg_row = by_code[0]

    if not reg_row:
        raise HTTPException(status_code=404, detail=f"Registration '{clean_reg_id}' not found in database.")

    reg_uuid = reg_row.get("id")
    public_reg_code = reg_row.get("registration_id") or clean_reg_id

    # 2. Authoritatively verify the provided email is the actual Team Leader
    db_leader_email = (reg_row.get("leader_email") or "").strip().lower()
    members = reg_row.get("team_members") or []

    is_leader = (clean_email == db_leader_email) or any(
        (tm.get("email") or "").strip().lower() == clean_email and tm.get("is_team_leader")
        for tm in members
    )

    if not is_leader:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: The provided email is not the registered Team Leader for this project."
        )

    # 3. File validation: Content Type and Extension
    filename = file.filename or "poster.pdf"
    content_type = (file.content_type or "").lower()
    ext = filename[filename.rfind("."):].lower() if "." in filename else ""

    if ext not in ALLOWED_EXTENSIONS and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{content_type or ext}'. Only PDF, PNG, and JPG/JPEG files are accepted."
        )

    # 4. Enforce file size limit (20MB)
    file_bytes = await file.read()
    if not file_bytes or len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded poster file is empty.")
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds the 20MB limit (size: {len(file_bytes) / (1024 * 1024):.1f}MB)."
        )

    # 5. Sanitize filename and construct storage path: {public_reg_code}/{timestamp}_{sanitized_filename}
    sanitized_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    storage_path = f"{public_reg_code}/{int(time.time())}_{sanitized_filename}"

    # Determine clean content type
    clean_ct = content_type if content_type in ALLOWED_CONTENT_TYPES else ("application/pdf" if ext == ".pdf" else "image/png")

    # 6. Upload exclusively to 'project-posters' via server-side service-role
    public_url = await db.upload_supabase_storage("project-posters", storage_path, file_bytes, clean_ct)
    if not public_url:
        raise HTTPException(status_code=500, detail="Failed to upload poster file to project-posters storage.")

    # 7. Extract project and institution metadata from registration
    projects = reg_row.get("projects") or []
    proj = projects[0] if isinstance(projects, list) and len(projects) > 0 else (projects if isinstance(projects, dict) else {})

    institutions = reg_row.get("institutions") or []
    inst = institutions[0] if isinstance(institutions, list) and len(institutions) > 0 else (institutions if isinstance(institutions, dict) else {})

    project_title = proj.get("title") or reg_row.get("project_title") or "Project Prototype"
    category = proj.get("category") or reg_row.get("category") or "General"
    institution_name = inst.get("name") or reg_row.get("institution_name") or "SR University"
    leader_name = reg_row.get("leader_name") or next((tm.get("name") for tm in members if tm.get("is_team_leader")), "Team Leader")

    now_iso = datetime.now(timezone.utc).isoformat()

    # 8. Construct poster_content structure expected by ParticipantDashboard and PostersAdmin
    poster_content: Dict[str, Any] = {
        "fileUrl": public_url,
        "filePath": f"project-posters/{storage_path}",
        "fileName": filename,
        "fileSize": len(file_bytes),
        "fileType": clean_ct,
        "uploadedAt": now_iso,
        "teamName": reg_row.get("team_name", ""),
        "projectTitle": project_title,
        "category": category,
        "institutionName": institution_name,
        "leaderName": leader_name,
        "leaderEmail": clean_email,
    }

    # 9. Upsert into public.poster_submissions table
    submission_payload: Dict[str, Any] = {
        "registration_id": reg_uuid,
        "poster_content": poster_content,
        "status": "submitted",
        "submitted_at": now_iso,
        "updated_at": now_iso
    }

    upsert_res = await db.upsert_supabase("poster_submissions", submission_payload, on_conflict="registration_id")
    if not upsert_res:
        existing = await db.fetch_supabase("poster_submissions", f"registration_id=eq.{reg_uuid}&select=id")
        if existing and len(existing) > 0:
            sub_id = existing[0].get("id")
            upsert_res = await db.update_supabase("poster_submissions", "id", sub_id, submission_payload)
        else:
            upsert_res = await db.insert_supabase("poster_submissions", submission_payload)

    if not upsert_res:
        raise HTTPException(status_code=500, detail="Failed to save poster submission to database.")

    return {
        "success": True,
        "fileUrl": public_url,
        "registration_id": public_reg_code,
        "fileName": filename,
        "message": "Project poster uploaded and submitted successfully."
    }

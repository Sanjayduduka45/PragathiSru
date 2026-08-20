import uuid
from typing import List
from fastapi import HTTPException
from app.database import db
from app.schemas.domain import DomainItem, DomainCreate, DomainUpdate

class DomainService:
    @staticmethod
    async def get_domains() -> List[DomainItem]:
        res = await db.fetch_supabase("project_domains", "order=display_order.asc")
        if res is not None and len(res) > 0:
            return [
                DomainItem(
                    id=str(row.get("id")),
                    title=row.get("title", ""),
                    description=row.get("description", ""),
                    icon_name=row.get("icon_name", "Cpu"),
                    color=row.get("color", "from-blue-600 to-indigo-600"),
                    badge_text=row.get("badge_text", ""),
                    active=row.get("is_active", True),
                    display_order=row.get("display_order", 0)
                )
                for row in res
            ]
        
        local = db.load_local()
        items = local.get("project_domains", [])
        return [DomainItem(**item) for item in items]

    @staticmethod
    async def create_domain(data: DomainCreate) -> DomainItem:
        row_id = f"domain-{uuid.uuid4().hex[:8]}"

        payload = {
            "id": row_id,
            "title": data.title,
            "description": data.description,
            "icon_name": data.icon_name,
            "color": data.color,
            "badge_text": data.badge_text,
            "is_active": data.active,
            "display_order": data.display_order
        }

        res = await db.insert_supabase("project_domains", payload)

        if not res:
            raise HTTPException(
                status_code=400,
                detail="Failed to add domain to Supabase"
            )

        new_item = DomainItem(
            id=row_id,
            **data.model_dump()
        )

        local = db.load_local()
        local.setdefault("project_domains", []).append(new_item.model_dump())
        db.save_local(local)

        return new_item

    @staticmethod
    async def update_domain(domain_id: str, data: DomainUpdate) -> DomainItem:
        update_fields = data.model_dump(exclude_unset=True)
        db_payload = {}
        if "title" in update_fields: db_payload["title"] = update_fields["title"]
        if "description" in update_fields: db_payload["description"] = update_fields["description"]
        if "icon_name" in update_fields: db_payload["icon_name"] = update_fields["icon_name"]
        if "color" in update_fields: db_payload["color"] = update_fields["color"]
        if "badge_text" in update_fields: db_payload["badge_text"] = update_fields["badge_text"]
        if "active" in update_fields: db_payload["is_active"] = update_fields["active"]
        if "display_order" in update_fields: db_payload["display_order"] = update_fields["display_order"]

        if db_payload:
            supa_success = await db.update_supabase("project_domains", "id", domain_id, db_payload)
            if not supa_success:
                raise HTTPException(status_code=400, detail="Failed to update domain in Supabase")

        # Production: Fetch updated record directly from Supabase (source of truth)
        supa_rows = await db.fetch_supabase("project_domains", f"id=eq.{domain_id}&limit=1")
        if supa_rows is not None and len(supa_rows) > 0:
            row = supa_rows[0]
            updated_item = DomainItem(
                id=str(row.get("id")),
                title=row.get("title", ""),
                description=row.get("description", ""),
                icon_name=row.get("icon_name", "Cpu"),
                color=row.get("color", "from-blue-600 to-indigo-600"),
                badge_text=row.get("badge_text", ""),
                active=row.get("is_active", True),
                display_order=row.get("display_order", 0)
            )
            # Sync local JSON mirror for local development
            local = db.load_local()
            items = local.get("project_domains", [])
            found = False
            for i, it in enumerate(items):
                if str(it.get("id")) == str(domain_id):
                    items[i] = updated_item.model_dump()
                    found = True
                    break
            if not found:
                items.append(updated_item.model_dump())
            local["project_domains"] = items
            db.save_local(local)
            return updated_item

        # Fallback for offline local development without Supabase
        local = db.load_local()
        items = local.get("project_domains", [])
        updated = None
        for i, item in enumerate(items):
            if str(item.get("id")) == str(domain_id):
                for k, v in update_fields.items():
                    item[k] = v
                items[i] = item
                updated = DomainItem(**item)
                break
        
        if updated is None:
            updated = DomainItem(
                id=domain_id,
                title=update_fields.get("title", "Domain"),
                description=update_fields.get("description", ""),
                icon_name=update_fields.get("icon_name", "Cpu"),
                color=update_fields.get("color", "from-blue-600 to-indigo-600"),
                badge_text=update_fields.get("badge_text", ""),
                active=update_fields.get("active", True),
                display_order=update_fields.get("display_order", 0)
            )
            items.append(updated.model_dump())

        local["project_domains"] = items
        db.save_local(local)
        return updated

    @staticmethod
    async def delete_domain(domain_id: str) -> bool:
        supa_success = await db.delete_supabase("project_domains", "id", domain_id)
        local = db.load_local()
        items = local.get("project_domains", [])
        orig_len = len(items)
        filtered = [item for item in items if str(item.get("id")) != str(domain_id)]
        local["project_domains"] = filtered
        db.save_local(local)
        return supa_success or (len(filtered) < orig_len)

domain_service = DomainService()

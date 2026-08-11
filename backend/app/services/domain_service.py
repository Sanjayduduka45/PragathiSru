import uuid
from typing import List
from app.database import db
from app.schemas.domain import DomainItem, DomainCreate, DomainUpdate

class DomainService:
    @staticmethod
    async def get_domains() -> List[DomainItem]:
        res = await db.fetch_supabase("project_domains", "order=display_order.asc")
        if res is not None and len(res) > 0:
            return [
                DomainItem(
                    id=row.get("id"),
                    title=row.get("title"),
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
        new_item = DomainItem(
            id=f"domain-{uuid.uuid4().hex[:8]}",
            **data.model_dump()
        )
        local = db.load_local()
        local.setdefault("project_domains", []).append(new_item.model_dump())
        db.save_local(local)
        return new_item

    @staticmethod
    async def update_domain(domain_id: str, data: DomainUpdate) -> DomainItem:
        local = db.load_local()
        items = local.get("project_domains", [])
        updated = None
        for i, item in enumerate(items):
            if item.get("id") == domain_id:
                for k, v in data.model_dump(exclude_unset=True).items():
                    item[k] = v
                items[i] = item
                updated = DomainItem(**item)
                break
        
        if updated is None:
            # If not found in list, append as new
            updated = DomainItem(id=domain_id, title="Domain", description="", **data.model_dump(exclude_unset=True))
            items.append(updated.model_dump())

        local["project_domains"] = items
        db.save_local(local)
        return updated

    @staticmethod
    async def delete_domain(domain_id: str) -> bool:
        local = db.load_local()
        items = local.get("project_domains", [])
        filtered = [item for item in items if item.get("id") != domain_id]
        local["project_domains"] = filtered
        db.save_local(local)
        await db.delete_supabase("project_domains", "id", domain_id)
        return True

domain_service = DomainService()

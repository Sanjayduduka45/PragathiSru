import uuid
from typing import List
from app.database import db
from app.schemas.sponsor import SponsorItem, SponsorCreate, SponsorUpdate

class SponsorService:
    @staticmethod
    async def get_sponsors() -> List[SponsorItem]:
        res = await db.fetch_supabase("sponsors", "order=display_order.asc")
        if res is not None and len(res) > 0:
            return [
                SponsorItem(
                    id=row.get("id"),
                    name=row.get("name"),
                    type=row.get("sponsor_type", "Partner"),
                    role=row.get("role", ""),
                    logo_text=row.get("logo_text", ""),
                    website=row.get("website", ""),
                    active=row.get("is_active", True),
                    order=row.get("display_order", 0)
                )
                for row in res
            ]
        local = db.load_local()
        return [SponsorItem(**item) for item in local.get("sponsors", [])]

    @staticmethod
    async def create_sponsor(data: SponsorCreate) -> SponsorItem:
        new_item = SponsorItem(
            id=f"sponsor-{uuid.uuid4().hex[:8]}",
            **data.model_dump()
        )
        local = db.load_local()
        local.setdefault("sponsors", []).append(new_item.model_dump())
        db.save_local(local)
        return new_item

    @staticmethod
    async def update_sponsor(sponsor_id: str, data: SponsorUpdate) -> SponsorItem:
        local = db.load_local()
        items = local.get("sponsors", [])
        updated = None
        for i, item in enumerate(items):
            if item.get("id") == sponsor_id:
                for k, v in data.model_dump(exclude_unset=True).items():
                    item[k] = v
                items[i] = item
                updated = SponsorItem(**item)
                break

        if updated is None:
            updated = SponsorItem(id=sponsor_id, name="", **data.model_dump(exclude_unset=True))
            items.append(updated.model_dump())

        local["sponsors"] = items
        db.save_local(local)
        return updated

    @staticmethod
    async def delete_sponsor(sponsor_id: str) -> bool:
        local = db.load_local()
        items = local.get("sponsors", [])
        filtered = [item for item in items if item.get("id") != sponsor_id]
        local["sponsors"] = filtered
        db.save_local(local)
        await db.delete_supabase("sponsors", "id", sponsor_id)
        return True

sponsor_service = SponsorService()

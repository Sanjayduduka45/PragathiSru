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
                    id=str(row.get("id")),
                    name=row.get("name", ""),
                    type=row.get("sponsor_type") or row.get("type", "Partner"),
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
        payload = {
            "name": data.name,
            "sponsor_type": data.type,
            "role": data.role,
            "logo_text": data.logo_text,
            "website": data.website,
            "is_active": data.active,
            "display_order": data.order
        }
        res = await db.insert_supabase("sponsors", payload)
        row_id = res.get("id") if res else f"sponsor-{uuid.uuid4().hex[:8]}"

        new_item = SponsorItem(
            id=str(row_id),
            **data.model_dump()
        )
        local = db.load_local()
        local.setdefault("sponsors", []).append(new_item.model_dump())
        db.save_local(local)
        return new_item

    @staticmethod
    async def update_sponsor(sponsor_id: str, data: SponsorUpdate) -> SponsorItem:
        update_fields = data.model_dump(exclude_unset=True)
        db_payload = {}
        if "name" in update_fields: db_payload["name"] = update_fields["name"]
        if "type" in update_fields: db_payload["sponsor_type"] = update_fields["type"]
        if "role" in update_fields: db_payload["role"] = update_fields["role"]
        if "logo_text" in update_fields: db_payload["logo_text"] = update_fields["logo_text"]
        if "website" in update_fields: db_payload["website"] = update_fields["website"]
        if "active" in update_fields: db_payload["is_active"] = update_fields["active"]
        if "order" in update_fields: db_payload["display_order"] = update_fields["order"]

        if db_payload:
            await db.update_supabase("sponsors", "id", sponsor_id, db_payload)

        local = db.load_local()
        items = local.get("sponsors", [])
        updated = None
        for i, item in enumerate(items):
            if str(item.get("id")) == str(sponsor_id):
                for k, v in update_fields.items():
                    item[k] = v
                items[i] = item
                updated = SponsorItem(**item)
                break

        if updated is None:
            updated = SponsorItem(id=sponsor_id, name="", **update_fields)
            items.append(updated.model_dump())

        local["sponsors"] = items
        db.save_local(local)
        return updated

    @staticmethod
    async def delete_sponsor(sponsor_id: str) -> bool:
        await db.delete_supabase("sponsors", "id", sponsor_id)
        local = db.load_local()
        items = local.get("sponsors", [])
        filtered = [item for item in items if str(item.get("id")) != str(sponsor_id)]
        local["sponsors"] = filtered
        db.save_local(local)
        return True

sponsor_service = SponsorService()

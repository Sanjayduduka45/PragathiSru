import uuid
from typing import List
from app.database import db
from app.schemas.faq import FAQItem, FAQCreate, FAQUpdate

class FAQService:
    @staticmethod
    async def get_faqs() -> List[FAQItem]:
        res = await db.fetch_supabase("faqs", "order=display_order.asc")
        if res is not None and len(res) > 0:
            return [
                FAQItem(
                    id=row.get("id"),
                    question=row.get("question"),
                    answer=row.get("answer"),
                    category=row.get("category", "General"),
                    active=row.get("is_active", True),
                    order=row.get("display_order", 0)
                )
                for row in res
            ]
        local = db.load_local()
        return [FAQItem(**item) for item in local.get("faqs", [])]

    @staticmethod
    async def create_faq(data: FAQCreate) -> FAQItem:
        new_item = FAQItem(
            id=f"faq-{uuid.uuid4().hex[:8]}",
            **data.model_dump()
        )
        local = db.load_local()
        local.setdefault("faqs", []).append(new_item.model_dump())
        db.save_local(local)
        return new_item

    @staticmethod
    async def update_faq(faq_id: str, data: FAQUpdate) -> FAQItem:
        local = db.load_local()
        items = local.get("faqs", [])
        updated = None
        for i, item in enumerate(items):
            if item.get("id") == faq_id:
                for k, v in data.model_dump(exclude_unset=True).items():
                    item[k] = v
                items[i] = item
                updated = FAQItem(**item)
                break

        if updated is None:
            updated = FAQItem(id=faq_id, question="", answer="", **data.model_dump(exclude_unset=True))
            items.append(updated.model_dump())

        local["faqs"] = items
        db.save_local(local)
        return updated

    @staticmethod
    async def delete_faq(faq_id: str) -> bool:
        local = db.load_local()
        items = local.get("faqs", [])
        filtered = [item for item in items if item.get("id") != faq_id]
        local["faqs"] = filtered
        db.save_local(local)
        await db.delete_supabase("faqs", "id", faq_id)
        return True

faq_service = FAQService()

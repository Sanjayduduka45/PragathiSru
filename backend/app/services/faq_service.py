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
                    id=str(row.get("id")),
                    question=row.get("question", ""),
                    answer=row.get("answer", ""),
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
        payload = {
            "question": data.question,
            "answer": data.answer,
            "category": data.category,
            "is_active": data.active,
            "display_order": data.order
        }
        res = await db.insert_supabase("faqs", payload)
        row_id = res.get("id") if res else f"faq-{uuid.uuid4().hex[:8]}"

        new_item = FAQItem(
            id=str(row_id),
            **data.model_dump()
        )
        local = db.load_local()
        local.setdefault("faqs", []).append(new_item.model_dump())
        db.save_local(local)
        return new_item

    @staticmethod
    async def update_faq(faq_id: str, data: FAQUpdate) -> FAQItem:
        update_fields = data.model_dump(exclude_unset=True)
        db_payload = {}
        if "question" in update_fields: db_payload["question"] = update_fields["question"]
        if "answer" in update_fields: db_payload["answer"] = update_fields["answer"]
        if "category" in update_fields: db_payload["category"] = update_fields["category"]
        if "active" in update_fields: db_payload["is_active"] = update_fields["active"]
        if "order" in update_fields: db_payload["display_order"] = update_fields["order"]

        if db_payload:
            await db.update_supabase("faqs", "id", faq_id, db_payload)

        local = db.load_local()
        items = local.get("faqs", [])
        updated = None
        for i, item in enumerate(items):
            if str(item.get("id")) == str(faq_id):
                for k, v in update_fields.items():
                    item[k] = v
                items[i] = item
                updated = FAQItem(**item)
                break

        if updated is None:
            updated = FAQItem(id=faq_id, question="", answer="", **update_fields)
            items.append(updated.model_dump())

        local["faqs"] = items
        db.save_local(local)
        return updated

    @staticmethod
    async def delete_faq(faq_id: str) -> bool:
        await db.delete_supabase("faqs", "id", faq_id)
        local = db.load_local()
        items = local.get("faqs", [])
        filtered = [item for item in items if str(item.get("id")) != str(faq_id)]
        local["faqs"] = filtered
        db.save_local(local)
        return True

faq_service = FAQService()

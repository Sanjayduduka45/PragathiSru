import uuid
from typing import List
from app.database import db
from app.schemas.testimonial import TestimonialItem, TestimonialCreate, TestimonialUpdate

DEFAULT_TESTIMONIALS = [
    {
        "id": "testim-1",
        "title": "PRAGATHI 2K25 — Project Expo Showcase",
        "description": "PRAGATHI gave our team the platform to present our AI Agriculture sensor prototype to industry mentors. The feedback helped us convert our project into a patent-pending startup!",
        "person_name": "Ananya Rao",
        "designation": "Team Lead, AgriSense IoT",
        "event_name": "PRAGATHI 2K25",
        "event_year": "2025",
        "image_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
        "image_alt": "PRAGATHI 2K25 Expo Presentation",
        "image_aspect_ratio": "16:9",
        "image_position": "center",
        "is_active": True,
        "display_order": 1
    }
]

class TestimonialService:
    @staticmethod
    async def get_testimonials() -> List[TestimonialItem]:
        res = await db.fetch_supabase("testimonials", "order=display_order.asc")
        if res is not None and len(res) > 0:
            return [
                TestimonialItem(
                    id=str(row.get("id")),
                    title=row.get("title", ""),
                    description=row.get("description", ""),
                    person_name=row.get("person_name", ""),
                    designation=row.get("designation", ""),
                    event_name=row.get("event_name", ""),
                    event_year=row.get("event_year", ""),
                    image_url=row.get("image_url", ""),
                    image_alt=row.get("image_alt", ""),
                    image_aspect_ratio=row.get("image_aspect_ratio", "16:9"),
                    image_position=row.get("image_position", "center"),
                    is_active=row.get("is_active", True),
                    display_order=row.get("display_order", 0)
                )
                for row in res
            ]
        local = db.load_local()
        items = local.get("testimonials", DEFAULT_TESTIMONIALS)
        return [TestimonialItem(**item) for item in items]

    @staticmethod
    async def create_testimonial(data: TestimonialCreate) -> TestimonialItem:
        payload = {
            "title": data.title,
            "description": data.description,
            "person_name": data.person_name,
            "designation": data.designation,
            "event_name": data.event_name,
            "event_year": data.event_year,
            "image_url": data.image_url,
            "is_active": data.is_active,
            "display_order": data.display_order
        }
        res = await db.insert_supabase("testimonials", payload)
        row_id = res.get("id") if res else f"testim-{uuid.uuid4().hex[:8]}"

        new_item = TestimonialItem(
            id=str(row_id),
            **data.model_dump()
        )
        local = db.load_local()
        local.setdefault("testimonials", []).append(new_item.model_dump())
        db.save_local(local)
        return new_item

    @staticmethod
    async def update_testimonial(testimonial_id: str, data: TestimonialUpdate) -> TestimonialItem:
        update_fields = data.model_dump(exclude_unset=True)
        db_payload = {}
        if "title" in update_fields: db_payload["title"] = update_fields["title"]
        if "description" in update_fields: db_payload["description"] = update_fields["description"]
        if "person_name" in update_fields: db_payload["person_name"] = update_fields["person_name"]
        if "designation" in update_fields: db_payload["designation"] = update_fields["designation"]
        if "event_name" in update_fields: db_payload["event_name"] = update_fields["event_name"]
        if "event_year" in update_fields: db_payload["event_year"] = update_fields["event_year"]
        if "image_url" in update_fields: db_payload["image_url"] = update_fields["image_url"]
        if "is_active" in update_fields: db_payload["is_active"] = update_fields["is_active"]
        if "display_order" in update_fields: db_payload["display_order"] = update_fields["display_order"]

        if db_payload:
            await db.update_supabase("testimonials", "id", testimonial_id, db_payload)

        local = db.load_local()
        items = local.get("testimonials", DEFAULT_TESTIMONIALS)
        updated = None
        for i, item in enumerate(items):
            if str(item.get("id")) == str(testimonial_id):
                for k, v in update_fields.items():
                    item[k] = v
                items[i] = item
                updated = TestimonialItem(**item)
                break

        if updated is None:
            updated = TestimonialItem(id=testimonial_id, title="", person_name="", **update_fields)
            items.append(updated.model_dump())

        local["testimonials"] = items
        db.save_local(local)
        return updated

    @staticmethod
    async def delete_testimonial(testimonial_id: str) -> bool:
        await db.delete_supabase("testimonials", "id", testimonial_id)
        local = db.load_local()
        items = local.get("testimonials", [])
        filtered = [item for item in items if str(item.get("id")) != str(testimonial_id)]
        local["testimonials"] = filtered
        db.save_local(local)
        return True

testimonial_service = TestimonialService()

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
    },
    {
        "id": "testim-2",
        "title": "Hardware & Robotics Exhibition",
        "description": "Organization and infrastructure at SR University Warangal was top tier. The exhibition stalls, judge interaction, and seamless digital management made it a memorable experience.",
        "person_name": "K. Vikram Reddy",
        "designation": "Student Researcher, NIT Warangal",
        "event_name": "PRAGATHI 2K25",
        "event_year": "2025",
        "image_url": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
        "image_alt": "Smart Grid Project Exhibition",
        "image_aspect_ratio": "16:9",
        "image_position": "center",
        "is_active": True,
        "display_order": 2
    },
    {
        "id": "testim-3",
        "title": "Innovation & Entrepreneurship Mentorship",
        "description": "PRAGATHI is designed to foster a culture of creative problem solving, cross-disciplinary collaboration, and real-world engineering impact among young minds across India.",
        "person_name": "Dr. P. Srinivas",
        "designation": "Incubation Coordinator, SR University",
        "event_name": "PRAGATHI 2K25",
        "event_year": "2025",
        "image_url": "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80",
        "image_alt": "SR University Faculty & Mentor Panel",
        "image_aspect_ratio": "16:9",
        "image_position": "center",
        "is_active": True,
        "display_order": 3
    }
]

class TestimonialService:
    @staticmethod
    async def get_testimonials() -> List[TestimonialItem]:
        res = await db.fetch_supabase("testimonials", "order=display_order.asc")
        if res is not None and len(res) > 0:
            return [
                TestimonialItem(
                    id=row.get("id"),
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
        new_item = TestimonialItem(
            id=f"testim-{uuid.uuid4().hex[:8]}",
            **data.model_dump()
        )
        local = db.load_local()
        local.setdefault("testimonials", []).append(new_item.model_dump())
        db.save_local(local)
        return new_item

    @staticmethod
    async def update_testimonial(testimonial_id: str, data: TestimonialUpdate) -> TestimonialItem:
        local = db.load_local()
        items = local.get("testimonials", DEFAULT_TESTIMONIALS)
        updated = None
        for i, item in enumerate(items):
            if item.get("id") == testimonial_id:
                for k, v in data.model_dump(exclude_unset=True).items():
                    item[k] = v
                items[i] = item
                updated = TestimonialItem(**item)
                break

        if updated is None:
            updated = TestimonialItem(id=testimonial_id, title="", person_name="", **data.model_dump(exclude_unset=True))
            items.append(updated.model_dump())

        local["testimonials"] = items
        db.save_local(local)
        return updated

    @staticmethod
    async def delete_testimonial(testimonial_id: str) -> bool:
        local = db.load_local()
        items = local.get("testimonials", [])
        filtered = [item for item in items if item.get("id") != testimonial_id]
        local["testimonials"] = filtered
        db.save_local(local)
        await db.delete_supabase("testimonials", "id", testimonial_id)
        return True

testimonial_service = TestimonialService()

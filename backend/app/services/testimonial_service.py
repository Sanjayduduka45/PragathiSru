import uuid
from typing import List
from app.database import db
from app.schemas.testimonial import TestimonialItem, TestimonialCreate, TestimonialUpdate

DEFAULT_TESTIMONIALS = [
    {
        "id": "testim-1",
        "title": "Robotics & Autonomous Navigation Prototype",
        "description": "Student researchers presenting an autonomous obstacle-avoiding mobile robot equipped with LiDAR and real-time computer vision hardware at the PRAGATHI National Expo.",
        "person_name": "",
        "designation": "Robotics & Automation Track",
        "event_name": "PRAGATHI 2K25",
        "event_year": "2025",
        "image_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
        "image_alt": "Robotics & Hardware Prototype Expo",
        "image_aspect_ratio": "16:9",
        "image_position": "center",
        "media_type": "image",
        "media_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
        "is_active": True,
        "display_order": 1
    },
    {
        "id": "testim-2",
        "title": "Solar Tracking & Clean Energy Micro-Grid",
        "description": "Dual-axis solar tracking prototype designed by undergraduate engineers for off-grid rural electrification, evaluated live by clean energy scientists.",
        "person_name": "",
        "designation": "Green Energy & CleanTech Track",
        "event_name": "PRAGATHI 2K25",
        "event_year": "2025",
        "image_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        "image_alt": "Solar Tracking Micro-Grid Prototype",
        "image_aspect_ratio": "16:9",
        "image_position": "center",
        "media_type": "image",
        "media_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        "is_active": True,
        "display_order": 2
    },
    {
        "id": "testim-3",
        "title": "Smart AgriTech Soil Telemetry Sensor",
        "description": "IoT wireless sensor nodes measuring NPK soil nutrients and soil moisture in real-time, incubated under SRiX startup ecosystem.",
        "person_name": "",
        "designation": "Smart Agriculture Track",
        "event_name": "PRAGATHI 2K24",
        "event_year": "2024",
        "image_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
        "image_alt": "AgriTech Telemetry Sensor Prototype",
        "image_aspect_ratio": "16:9",
        "image_position": "center",
        "media_type": "image",
        "media_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
        "is_active": True,
        "display_order": 3
    },
    {
        "id": "testim-4",
        "title": "AI Medical ECG & Health Monitoring System",
        "description": "Portable 12-lead ECG device paired with lightweight neural network classification model for rapid rural cardiac screening.",
        "person_name": "",
        "designation": "Healthcare & Bio-Tech Track",
        "event_name": "PRAGATHI 2K24",
        "event_year": "2024",
        "image_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        "image_alt": "Healthcare ECG Hardware Prototype",
        "image_aspect_ratio": "16:9",
        "image_position": "center",
        "media_type": "image",
        "media_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        "is_active": True,
        "display_order": 4
    },
    {
        "id": "testim-5",
        "title": "National Project Expo Keynote & Highlights",
        "description": "Video highlights from the PRAGATHI National Expo floor, featuring live project demonstrations and valedictory awards ceremony.",
        "person_name": "",
        "designation": "Valedictory Ceremony & Highlights",
        "event_name": "PRAGATHI Highlights",
        "event_year": "2025",
        "image_url": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
        "image_alt": "National Project Expo Highlights Video",
        "image_aspect_ratio": "16:9",
        "image_position": "center",
        "media_type": "video",
        "media_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "thumbnail_url": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
        "is_active": True,
        "display_order": 5
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
                    image_url=row.get("image_url", "") or row.get("media_url", ""),
                    image_alt=row.get("image_alt", ""),
                    image_aspect_ratio=row.get("image_aspect_ratio", "16:9"),
                    image_position=row.get("image_position", "center"),
                    media_type=row.get("media_type", "image"),
                    media_url=row.get("media_url", "") or row.get("image_url", ""),
                    thumbnail_url=row.get("thumbnail_url", "") or row.get("image_url", ""),
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
            "person_name": data.person_name or "",
            "designation": data.designation,
            "event_name": data.event_name,
            "event_year": data.event_year,
            "image_url": data.image_url or data.media_url,
            "media_type": data.media_type or "image",
            "media_url": data.media_url or data.image_url,
            "thumbnail_url": data.thumbnail_url or data.image_url,
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
        for k in ("title", "description", "person_name", "designation", "event_name", "event_year", "image_url", "media_type", "media_url", "thumbnail_url", "is_active", "display_order"):
            if k in update_fields:
                db_payload[k] = update_fields[k]

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
            updated = TestimonialItem(id=testimonial_id, title="", **update_fields)
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

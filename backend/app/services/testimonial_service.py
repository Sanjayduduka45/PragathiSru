import httpx
from typing import List, Optional

from fastapi import HTTPException

from app.database import db
from app.config import settings
from app.schemas.testimonial import (
    TestimonialItem,
    TestimonialCreate,
    TestimonialUpdate,
)


DEFAULT_TESTIMONIALS = [
    {
        "id": "testim-1",
        "title": "Robotics & Autonomous Navigation Prototype",
        "description": "Student researchers presenting an autonomous obstacle-avoiding mobile robot equipped with LiDAR and real-time computer vision hardware at the PRAGATHI National Expo.",
        "person_name": "",
        "designation": "Robotics & Automation Track",
        "event_name": "PRAGATHI 2K25",
        "event_year": 2025,
        "media_type": "image",
        "media_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80",
        "is_active": True,
        "display_order": 1,
    },
    {
        "id": "testim-2",
        "title": "Solar Tracking & Clean Energy Micro-Grid",
        "description": "Dual-axis solar tracking prototype designed by undergraduate engineers for off-grid rural electrification, evaluated live by clean energy scientists.",
        "person_name": "",
        "designation": "Green Energy & CleanTech Track",
        "event_name": "PRAGATHI 2K25",
        "event_year": 2025,
        "media_type": "image",
        "media_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        "is_active": True,
        "display_order": 2,
    },
    {
        "id": "testim-3",
        "title": "Smart AgriTech Soil Telemetry Sensor",
        "description": "IoT wireless sensor nodes measuring NPK soil nutrients and soil moisture in real-time, incubated under SRiX startup ecosystem.",
        "person_name": "",
        "designation": "Smart Agriculture Track",
        "event_name": "PRAGATHI 2K24",
        "event_year": 2024,
        "media_type": "image",
        "media_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
        "is_active": True,
        "display_order": 3,
    },
    {
        "id": "testim-4",
        "title": "AI Medical ECG & Health Monitoring System",
        "description": "Portable 12-lead ECG device paired with lightweight neural network classification model for rapid rural cardiac screening.",
        "person_name": "",
        "designation": "Healthcare & Bio-Tech Track",
        "event_name": "PRAGATHI 2K24",
        "event_year": 2024,
        "media_type": "image",
        "media_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        "thumbnail_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        "is_active": True,
        "display_order": 4,
    },
    {
        "id": "testim-5",
        "title": "National Project Expo Keynote & Highlights",
        "description": "Video highlights from the PRAGATHI National Expo floor, featuring live project demonstrations and valedictory awards ceremony.",
        "person_name": "",
        "designation": "Valedictory Ceremony & Highlights",
        "event_name": "PRAGATHI Highlights",
        "event_year": 2025,
        "media_type": "video",
        "media_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "thumbnail_url": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
        "is_active": True,
        "display_order": 5,
    },
]


def row_to_item(row: dict) -> TestimonialItem:
    """
    Convert a Supabase row into the exact Pydantic schema.
    This function intentionally uses ONLY columns that exist
    in the current testimonials table.
    """
    return TestimonialItem(
        id=str(row.get("id")),
        title=row.get("title") or "",
        description=row.get("description") or "",
        person_name=row.get("person_name"),
        designation=row.get("designation") or "",
        event_name=row.get("event_name") or "",
        event_year=row.get("event_year"),
        media_type=row.get("media_type") or "image",
        media_url=row.get("media_url") or "",
        thumbnail_url=row.get("thumbnail_url") or "",
        is_active=(
            row.get("is_active")
            if row.get("is_active") is not None
            else True
        ),
        display_order=(
            row.get("display_order")
            if row.get("display_order") is not None
            else 0
        ),
    )


class TestimonialService:

    @staticmethod
    async def get_testimonials() -> List[TestimonialItem]:
        """
        Get testimonials from Supabase.
        If Supabase has no rows, use local fallback data.
        """

        res = await db.fetch_supabase(
            "testimonials",
            "select=id,title,description,person_name,designation,event_name,event_year,media_type,media_url,thumbnail_url,is_active,display_order&order=display_order.asc",
        )

        if res is not None and len(res) > 0:
            return [row_to_item(row) for row in res]

        local = db.load_local()
        items = local.get("testimonials", DEFAULT_TESTIMONIALS)

        return [TestimonialItem(**item) for item in items]


    @staticmethod
    async def create_testimonial(
        data: TestimonialCreate,
    ) -> TestimonialItem:

        payload = {
            "title": data.title,
            "description": data.description,
            "person_name": data.person_name,
            "designation": data.designation,
            "event_name": data.event_name,
            "event_year": data.event_year,
            "media_type": data.media_type or "image",
            "media_url": data.media_url or "",
            "thumbnail_url": data.thumbnail_url or "",
            "is_active": data.is_active,
            "display_order": data.display_order,
        }

        res = await db.insert_supabase(
            "testimonials",
            payload,
        )

        if not res:
            raise HTTPException(
                status_code=500,
                detail="Failed to insert testimonial into Supabase database.",
            )

        return row_to_item(res)


    @staticmethod
    async def update_testimonial(
        testimonial_id: str,
        data: TestimonialUpdate,
    ) -> TestimonialItem:

        update_fields = data.model_dump(
            exclude_unset=True
        )

        # Only allow columns that actually exist
        # in the current Supabase table.
        allowed_fields = {
            "title",
            "description",
            "person_name",
            "designation",
            "event_name",
            "event_year",
            "media_type",
            "media_url",
            "thumbnail_url",
            "is_active",
            "display_order",
        }

        db_payload = {
            key: value
            for key, value in update_fields.items()
            if key in allowed_fields
        }

        if db_payload:
            success = await db.update_supabase(
                "testimonials",
                "id",
                testimonial_id,
                db_payload,
            )

            if not success:
                raise HTTPException(
                    status_code=500,
                    detail=(
                        f"Failed to update testimonial "
                        f"'{testimonial_id}' in Supabase database."
                    ),
                )

        updated_rows = await db.fetch_supabase(
            "testimonials",
            f"select=id,title,description,person_name,designation,event_name,event_year,media_type,media_url,thumbnail_url,is_active,display_order&id=eq.{testimonial_id}",
        )

        if updated_rows and len(updated_rows) > 0:
            return row_to_item(updated_rows[0])

        raise HTTPException(
            status_code=404,
            detail=f"Testimonial '{testimonial_id}' not found.",
        )


    @staticmethod
    async def delete_testimonial(
        testimonial_id: str,
    ) -> bool:

        success = await db.delete_supabase(
            "testimonials",
            "id",
            testimonial_id,
        )

        if not success:
            raise HTTPException(
                status_code=500,
                detail=(
                    f"Failed to delete testimonial "
                    f"'{testimonial_id}' from Supabase database."
                ),
            )

        return True


    @staticmethod
    async def upload_testimonial_media(
        bucket: str,
        path: str,
        content: bytes,
        content_type: str,
    ) -> Optional[str]:

        if not settings.supabase_url or not settings.supabase_key:
            return None

        bucket_url = (
            f"{settings.supabase_url}/storage/v1/bucket"
        )

        upload_url = (
            f"{settings.supabase_url}"
            f"/storage/v1/object/{bucket}/{path}"
        )

        headers = {
            "apikey": settings.supabase_key,
            "Authorization": (
                f"Bearer {settings.supabase_key}"
            ),
        }

        try:
            async with httpx.AsyncClient(
                timeout=30.0
            ) as client:

                # Create bucket if it doesn't already exist.
                await client.post(
                    bucket_url,
                    headers={
                        **headers,
                        "Content-Type": "application/json",
                    },
                    json={
                        "id": bucket,
                        "name": bucket,
                        "public": True,
                    },
                )

                file_headers = {
                    **headers,
                    "Content-Type": content_type,
                    "x-upsert": "true",
                }

                response = await client.post(
                    upload_url,
                    headers=file_headers,
                    content=content,
                )

                if response.status_code in (200, 201):
                    return (
                        f"{settings.supabase_url}"
                        f"/storage/v1/object/public/"
                        f"{bucket}/{path}"
                    )

                print(
                    "[Testimonial Storage] Upload failed:",
                    response.status_code,
                    response.text,
                )

        except Exception as exc:
            print(
                "[Testimonial Storage] Error uploading:",
                exc,
            )

        return None


testimonial_service = TestimonialService()

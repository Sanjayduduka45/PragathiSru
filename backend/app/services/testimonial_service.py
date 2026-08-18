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
        "title": "PRAGATHI Expo Inauguration",
        "description": "Guests, faculty members, and organizers gather at the PRAGATHI Project Expo entrance during the opening moments of the event.",
        "person_name": "",
        "designation": "Expo Inauguration",
        "event_name": "PRAGATHI Project Expo",
        "event_year": 2026,
        "media_type": "image",
        "media_url": "/event-memories/IMG_7326.JPG",
        "thumbnail_url": "/event-memories/IMG_7326.JPG",
        "is_active": True,
        "display_order": 1,
    },
    {
        "id": "testim-2",
        "title": "Guests Explore the Expo",
        "description": "Guests and faculty members walk through the exhibition area as project demonstrations begin.",
        "person_name": "",
        "designation": "Expo Walkthrough",
        "event_name": "Event Highlights",
        "event_year": 2026,
        "media_type": "image",
        "media_url": "/event-memories/IMG_7330.JPG",
        "thumbnail_url": "/event-memories/IMG_7330.JPG",
        "is_active": True,
        "display_order": 2,
    },
    {
        "id": "testim-3",
        "title": "Young Innovator Presents a Project",
        "description": "A young participant explains a working project model to guests during the exhibition.",
        "person_name": "",
        "designation": "Project Demonstration",
        "event_name": "Student Innovation",
        "event_year": 2026,
        "media_type": "image",
        "media_url": "/event-memories/IMG_7363.JPG",
        "thumbnail_url": "/event-memories/IMG_7363.JPG",
        "is_active": True,
        "display_order": 3,
    },
    {
        "id": "testim-4",
        "title": "Project Demonstration & Discussion",
        "description": "Students and guests discuss the working model during a project demonstration at the expo.",
        "person_name": "",
        "designation": "Project Showcase",
        "event_name": "Technical Interaction",
        "event_year": 2026,
        "media_type": "image",
        "media_url": "/event-memories/IMG_7368.JPG",
        "thumbnail_url": "/event-memories/IMG_7368.JPG",
        "is_active": True,
        "display_order": 4,
    },
    {
        "id": "testim-5",
        "title": "Electric Mobility Prototype",
        "description": "Visitors and participants examine an electric mobility prototype displayed during the project exhibition.",
        "person_name": "",
        "designation": "Green Mobility",
        "event_name": "Prototype Showcase",
        "event_year": 2026,
        "media_type": "image",
        "media_url": "/event-memories/IMG_7377.JPG",
        "thumbnail_url": "/event-memories/IMG_7377.JPG",
        "is_active": True,
        "display_order": 5,
    },
    {
        "id": "testim-6",
        "title": "Drone Technology Demonstration",
        "description": "Students demonstrate a drone-based project while explaining its setup and operation to visitors.",
        "person_name": "",
        "designation": "Drone Technology",
        "event_name": "Project Demonstration",
        "event_year": 2026,
        "media_type": "image",
        "media_url": "/event-memories/IMG_7392.JPG",
        "thumbnail_url": "/event-memories/IMG_7392.JPG",
        "is_active": True,
        "display_order": 6,
    },
    {
        "id": "testim-7",
        "title": "Smart Agriculture Project",
        "description": "Students showcase an agriculture-focused project with crop samples, equipment, and supporting demonstrations.",
        "person_name": "",
        "designation": "Smart Agriculture",
        "event_name": "Project Showcase",
        "event_year": 2026,
        "media_type": "image",
        "media_url": "/event-memories/IMG_7441.JPG",
        "thumbnail_url": "/event-memories/IMG_7441.JPG",
        "is_active": True,
        "display_order": 7,
    },
    {
        "id": "testim-8",
        "title": "Project Award Ceremony",
        "description": "Students celebrate their achievement as the project team receives recognition during the PRAGATHI Expo.",
        "person_name": "",
        "designation": "Achievement",
        "event_name": "Awards & Recognition",
        "event_year": 2026,
        "media_type": "image",
        "media_url": "/event-memories/IMG_7687.JPG",
        "thumbnail_url": "/event-memories/IMG_7687.JPG",
        "is_active": True,
        "display_order": 8,
    },
    {
        "id": "testim-9",
        "title": "Celebrating Student Achievement",
        "description": "Student teams receive certificates and recognition for their project work during the closing celebrations.",
        "person_name": "",
        "designation": "Student Achievement",
        "event_name": "Recognition Ceremony",
        "event_year": 2026,
        "media_type": "image",
        "media_url": "/event-memories/IMG_7693.JPG",
        "thumbnail_url": "/event-memories/IMG_7693.JPG",
        "is_active": True,
        "display_order": 9,
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

        key = settings.get_effective_key()
        if not settings.supabase_url or not key:
            return None

        bucket_url = (
            f"{settings.supabase_url}/storage/v1/bucket"
        )

        upload_url = (
            f"{settings.supabase_url}"
            f"/storage/v1/object/{bucket}/{path}"
        )

        headers = {
            "apikey": key,
            "Authorization": (
                f"Bearer {key}"
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

from app.database import db
from app.schemas.event import EventDetails

class EventService:
    @staticmethod
    async def get_event_details() -> EventDetails:
        res = await db.fetch_supabase("site_settings", "limit=1")
        if res and len(res) > 0:
            row = res[0]
            return EventDetails(
                event_name=row.get("event_name", "PRAGATHI 2K26"),
                full_title=row.get("full_title", "PRAGATHI 2K26 — National Level Project Expo"),
                tagline=row.get("tagline", "Innovate. Create. Inspire."),
                event_date=row.get("event_date", "09 October 2026"),
                target_date_iso=row.get("target_date_iso", "2026-10-09T09:00:00+05:30"),
                venue=row.get("venue", "SR University Campus, Warangal"),
                institution=row.get("institution", "SR University"),
                location=row.get("location", "Warangal, Telangana"),
                prize_pool=row.get("prize_pool", "₹1,50,000"),
                contact_email=row.get("contact_email", "pragathi2k26@sru.edu.in"),
                helpline=row.get("helpline", "+91 870 281 8333")
            )
        
        local = db.load_local()
        ev = local.get("site_settings", {})
        if ev:
            return EventDetails(**ev)
        return EventDetails(
            event_name="PRAGATHI 2K26",
            full_title="PRAGATHI 2K26 — National Level Project Expo",
            tagline="Innovate. Create. Inspire.",
            event_date="09 October 2026",
            target_date_iso="2026-10-09T09:00:00+05:30",
            venue="SR University Campus, Warangal",
            institution="SR University",
            location="Warangal, Telangana",
            prize_pool="₹1,50,000",
            contact_email="pragathi2k26@sru.edu.in",
            helpline="+91 870 281 8333"
        )

    @staticmethod
    async def update_event_details(data: EventDetails) -> EventDetails:
        payload = data.model_dump()
        existing = await db.fetch_supabase("site_settings", "limit=1")
        if existing and len(existing) > 0:
            existing_row = existing[0]
            row_id = existing_row.get("id")
            if not payload.get("target_date_iso"):
                payload["target_date_iso"] = existing_row.get("target_date_iso", "2026-10-09T09:00:00+05:30")
            await db.update_supabase("site_settings", "id", str(row_id), payload)
        else:
            if not payload.get("target_date_iso"):
                payload["target_date_iso"] = "2026-10-09T09:00:00+05:30"
            await db.insert_supabase("site_settings", payload)

        data.target_date_iso = payload["target_date_iso"]
        local = db.load_local()
        local["site_settings"] = payload
        db.save_local(local)
        return data

event_service = EventService()

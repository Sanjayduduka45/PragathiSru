from app.database import db
from app.schemas.contact import ContactDetails

class ContactService:
    @staticmethod
    async def get_contact_details() -> ContactDetails:
        res = await db.fetch_supabase("site_settings", "limit=1")
        if res and len(res) > 0:
            row = res[0]
            return ContactDetails(
                contact_email=row.get("contact_email", "pragathi2k26@sru.edu.in"),
                helpline=row.get("helpline", "+91 870 281 8333"),
                institution=row.get("institution", "SR University"),
                venue=row.get("venue", "SR University Campus, Warangal")
            )
        
        local = db.load_local()
        ev = local.get("site_settings", {})
        return ContactDetails(
            contact_email=ev.get("contact_email", "pragathi2k26@sru.edu.in"),
            helpline=ev.get("helpline", "+91 870 281 8333"),
            institution=ev.get("institution", "SR University"),
            venue=ev.get("venue", "SR University Campus, Warangal")
        )

    @staticmethod
    async def update_contact_details(data: ContactDetails) -> ContactDetails:
        local = db.load_local()
        ev = local.get("site_settings", {})
        ev["contact_email"] = data.contact_email
        ev["helpline"] = data.helpline
        ev["institution"] = data.institution
        ev["venue"] = data.venue
        local["site_settings"] = ev
        db.save_local(local)
        
        await db.update_supabase("site_settings", "id", "1", {
            "contact_email": data.contact_email,
            "helpline": data.helpline,
            "institution": data.institution,
            "venue": data.venue
        })
        return data

contact_service = ContactService()

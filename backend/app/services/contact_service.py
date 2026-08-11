from app.database import db
from app.schemas.contact import ContactDetails

class ContactService:
    @staticmethod
    async def get_contact_details() -> ContactDetails:
        res = await db.fetch_supabase("contact_info", "limit=1")
        if res and len(res) > 0:
            row = res[0]
            return ContactDetails(
                contact_email=row.get("email") or row.get("contact_email", "pragathi2k26@sru.edu.in"),
                helpline=row.get("phone") or row.get("helpline", "+91 870 281 8333"),
                institution="SR University",
                venue=row.get("address") or "SR University Campus, Warangal"
            )
        
        site_res = await db.fetch_supabase("site_settings", "limit=1")
        if site_res and len(site_res) > 0:
            s_row = site_res[0]
            return ContactDetails(
                contact_email=s_row.get("contact_email", "pragathi2k26@sru.edu.in"),
                helpline=s_row.get("helpline", "+91 870 281 8333"),
                institution=s_row.get("institution", "SR University"),
                venue=s_row.get("venue", "SR University Campus, Warangal")
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
        contact_payload = {
            "email": data.contact_email,
            "phone": data.helpline,
            "address": data.venue
        }
        existing_ci = await db.fetch_supabase("contact_info", "limit=1")
        if existing_ci and len(existing_ci) > 0:
            ci_id = existing_ci[0].get("id")
            await db.update_supabase("contact_info", "id", str(ci_id), contact_payload)
        else:
            await db.insert_supabase("contact_info", contact_payload)

        site_payload = {
            "contact_email": data.contact_email,
            "helpline": data.helpline,
            "institution": data.institution,
            "venue": data.venue
        }
        existing_ss = await db.fetch_supabase("site_settings", "limit=1")
        if existing_ss and len(existing_ss) > 0:
            ss_id = existing_ss[0].get("id")
            await db.update_supabase("site_settings", "id", str(ss_id), site_payload)
        else:
            await db.insert_supabase("site_settings", site_payload)

        local = db.load_local()
        ev = local.get("site_settings", {})
        ev["contact_email"] = data.contact_email
        ev["helpline"] = data.helpline
        ev["institution"] = data.institution
        ev["venue"] = data.venue
        local["site_settings"] = ev
        db.save_local(local)
        
        return data

contact_service = ContactService()

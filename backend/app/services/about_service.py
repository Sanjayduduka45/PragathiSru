from app.database import db
from app.schemas.about import AboutContent

ORIGINAL_ABOUT_CONTENT = AboutContent(
    title="About PRAGATHI 2K26",
    description="PRAGATHI 2K26 is SR University's premier National Level Project Expo bringing together young minds, student researchers, and creative thinkers to demonstrate tangible, working prototypes that address real-world challenges.",
    vision="To establish PRAGATHI as India's premier university-led national expo platform that empowers young innovators to translate creative concepts into sustainable, patentable, and commercially viable solutions for societal impact.",
    objectives="1. Bridge Theory & Practice: Provide a hands-on arena where students construct working models beyond traditional curricula.\n2. Interdisciplinary Collaboration: Encourage teams to integrate AI, IoT, mechanical design, biotechnology, and green energy.\n3. Industry & Academic Interaction: Connect student teams directly with PhD researchers, industry judges, and investors.\n4. Incubation & Mentorship: Offer shortlisted projects seed grants and incubation support through SRiX Incubator.",
    is_override=False
)

class AboutService:
    @staticmethod
    async def get_about_content() -> AboutContent:
        # 1. Check if Supabase has an active admin override
        res = await db.fetch_supabase("about_content", "limit=1")
        if res and len(res) > 0:
            row = res[0]
            # If the row has content and is not marked inactive
            if row.get("title") or row.get("description"):
                return AboutContent(
                    title=row.get("title", ORIGINAL_ABOUT_CONTENT.title),
                    description=row.get("description", ORIGINAL_ABOUT_CONTENT.description),
                    vision=row.get("vision", ORIGINAL_ABOUT_CONTENT.vision),
                    objectives=row.get("objectives", ORIGINAL_ABOUT_CONTENT.objectives),
                    is_override=True
                )
        
        # 2. Check local database for active override
        local = db.load_local()
        ab = local.get("about_content_override")
        if ab and isinstance(ab, dict) and ab.get("is_override") is True and (ab.get("title") or ab.get("description")):
            return AboutContent(
                title=ab.get("title", ORIGINAL_ABOUT_CONTENT.title),
                description=ab.get("description", ORIGINAL_ABOUT_CONTENT.description),
                vision=ab.get("vision", ORIGINAL_ABOUT_CONTENT.vision),
                objectives=ab.get("objectives", ORIGINAL_ABOUT_CONTENT.objectives),
                is_override=True
            )

        # 3. Fallback to permanent immutable original baseline
        return ORIGINAL_ABOUT_CONTENT.model_copy()

    @staticmethod
    async def update_about_content(data: AboutContent) -> AboutContent:
        data.is_override = True
        payload = data.model_dump()
        
        # Save override to Supabase if table exists
        existing = await db.fetch_supabase("about_content", "limit=1")
        if existing and len(existing) > 0:
            row_id = existing[0].get("id")
            await db.update_supabase("about_content", "id", str(row_id), payload)
        else:
            await db.insert_supabase("about_content", payload)

        # Save override to local storage
        local = db.load_local()
        local["about_content_override"] = payload
        local["about_content"] = payload
        db.save_local(local)
        return data

    @staticmethod
    async def reset_about_content() -> AboutContent:
        # Delete override from Supabase if table exists
        existing = await db.fetch_supabase("about_content", "limit=1")
        if existing and len(existing) > 0:
            for row in existing:
                row_id = row.get("id")
                if row_id:
                    await db.delete_supabase("about_content", "id", str(row_id))

        # Clear override from local storage
        local = db.load_local()
        local.pop("about_content_override", None)
        local["about_content"] = None
        db.save_local(local)
        
        return ORIGINAL_ABOUT_CONTENT.model_copy()

about_service = AboutService()

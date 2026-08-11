from app.database import db
from app.schemas.about import AboutContent

class AboutService:
    @staticmethod
    async def get_about_content() -> AboutContent:
        res = await db.fetch_supabase("about_content", "limit=1")
        if res and len(res) > 0:
            row = res[0]
            return AboutContent(
                title=row.get("title", "About PRAGATHI 2K26"),
                description=row.get("description", ""),
                vision=row.get("vision", ""),
                objectives=row.get("objectives", "")
            )
        
        local = db.load_local()
        ab = local.get("about_content", {})
        if ab:
            return AboutContent(**ab)
        return AboutContent(
            title="About PRAGATHI 2K26",
            description="PRAGATHI 2K26 is SR University's flagship National Level Project Expo.",
            vision="To create a nationally recognized platform for engineering innovation.",
            objectives="1. Provide platform for prototypes. 2. Encourage interdisciplinary collaboration."
        )

    @staticmethod
    async def update_about_content(data: AboutContent) -> AboutContent:
        payload = data.model_dump()
        existing = await db.fetch_supabase("about_content", "limit=1")
        if existing and len(existing) > 0:
            row_id = existing[0].get("id")
            await db.update_supabase("about_content", "id", str(row_id), payload)
        else:
            await db.insert_supabase("about_content", payload)

        local = db.load_local()
        local["about_content"] = payload
        db.save_local(local)
        return data

about_service = AboutService()

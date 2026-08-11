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
        return AboutContent(**local.get("about_content", {}))

    @staticmethod
    async def update_about_content(data: AboutContent) -> AboutContent:
        payload = data.model_dump()
        local = db.load_local()
        local["about_content"] = payload
        db.save_local(local)
        
        await db.update_supabase("about_content", "id", "1", payload)
        return data

about_service = AboutService()

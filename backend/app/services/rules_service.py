from app.database import db
from app.schemas.rules import RulesContent

class RulesService:
    @staticmethod
    async def get_rules_content() -> RulesContent:
        res = await db.fetch_supabase("rules_content", "limit=1")
        if res and len(res) > 0:
            return RulesContent(content=res[0].get("content", ""))
        
        local = db.load_local()
        return RulesContent(**local.get("rules_content", {}))

    @staticmethod
    async def update_rules_content(data: RulesContent) -> RulesContent:
        payload = data.model_dump()
        local = db.load_local()
        local["rules_content"] = payload
        db.save_local(local)
        
        await db.update_supabase("rules_content", "id", "1", payload)
        return data

rules_service = RulesService()

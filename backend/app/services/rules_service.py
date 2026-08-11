from app.database import db
from app.schemas.rules import RulesContent

class RulesService:
    @staticmethod
    async def get_rules_content() -> RulesContent:
        res = await db.fetch_supabase("rules_content", "limit=1")
        if res and len(res) > 0:
            row = res[0]
            rules_data = row.get("rules_text") or row.get("content") or ""
            return RulesContent(content=rules_data if isinstance(rules_data, str) else str(rules_data))
        
        local = db.load_local()
        rl = local.get("rules_content", {})
        if rl:
            return RulesContent(**rl)
        return RulesContent(content="1. All projects must be original.\n2. Maximum 5 members per team.\n3. Working prototype mandatory.")

    @staticmethod
    async def update_rules_content(data: RulesContent) -> RulesContent:
        payload = {"rules_text": data.content}
        existing = await db.fetch_supabase("rules_content", "limit=1")
        if existing and len(existing) > 0:
            row_id = existing[0].get("id")
            await db.update_supabase("rules_content", "id", str(row_id), payload)
        else:
            await db.insert_supabase("rules_content", payload)

        local = db.load_local()
        local["rules_content"] = data.model_dump()
        db.save_local(local)
        return data

rules_service = RulesService()

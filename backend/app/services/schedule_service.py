import uuid
from typing import List
from app.database import db
from app.schemas.schedule import ScheduleItem, ScheduleCreate, ScheduleUpdate

class ScheduleService:
    @staticmethod
    async def get_schedule() -> List[ScheduleItem]:
        res = await db.fetch_supabase("schedule_items", "order=display_order.asc")
        if res is not None and len(res) > 0:
            return [
                ScheduleItem(
                    id=row.get("id"),
                    time=row.get("time_slot", ""),
                    event=row.get("event_title", ""),
                    location=row.get("location", ""),
                    description=row.get("description", ""),
                    badge=row.get("badge", ""),
                    active=row.get("is_active", True),
                    display_order=row.get("display_order", 0)
                )
                for row in res
            ]
        local = db.load_local()
        return [ScheduleItem(**item) for item in local.get("schedule_items", [])]

    @staticmethod
    async def create_schedule_item(data: ScheduleCreate) -> ScheduleItem:
        new_item = ScheduleItem(
            id=f"sch-{uuid.uuid4().hex[:8]}",
            **data.model_dump()
        )
        local = db.load_local()
        local.setdefault("schedule_items", []).append(new_item.model_dump())
        db.save_local(local)
        return new_item

    @staticmethod
    async def update_schedule_item(item_id: str, data: ScheduleUpdate) -> ScheduleItem:
        local = db.load_local()
        items = local.get("schedule_items", [])
        updated = None
        for i, item in enumerate(items):
            if item.get("id") == item_id:
                for k, v in data.model_dump(exclude_unset=True).items():
                    item[k] = v
                items[i] = item
                updated = ScheduleItem(**item)
                break

        if updated is None:
            updated = ScheduleItem(id=item_id, time="", event="", **data.model_dump(exclude_unset=True))
            items.append(updated.model_dump())

        local["schedule_items"] = items
        db.save_local(local)
        return updated

    @staticmethod
    async def delete_schedule_item(item_id: str) -> bool:
        local = db.load_local()
        items = local.get("schedule_items", [])
        filtered = [item for item in items if item.get("id") != item_id]
        local["schedule_items"] = filtered
        db.save_local(local)
        await db.delete_supabase("schedule_items", "id", item_id)
        return True

schedule_service = ScheduleService()

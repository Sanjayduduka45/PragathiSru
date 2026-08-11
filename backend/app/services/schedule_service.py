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
                    id=str(row.get("id")),
                    time=row.get("time") or row.get("time_slot", ""),
                    event=row.get("event") or row.get("event_title", ""),
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
        payload = {
            "time": data.time,
            "event": data.event,
            "location": data.location,
            "description": data.description,
            "badge": data.badge,
            "is_active": data.active,
            "display_order": data.display_order
        }
        res = await db.insert_supabase("schedule_items", payload)
        row_id = res.get("id") if res else f"sch-{uuid.uuid4().hex[:8]}"

        new_item = ScheduleItem(
            id=str(row_id),
            **data.model_dump()
        )
        local = db.load_local()
        local.setdefault("schedule_items", []).append(new_item.model_dump())
        db.save_local(local)
        return new_item

    @staticmethod
    async def update_schedule_item(item_id: str, data: ScheduleUpdate) -> ScheduleItem:
        update_fields = data.model_dump(exclude_unset=True)
        db_payload = {}
        if "time" in update_fields: db_payload["time"] = update_fields["time"]
        if "event" in update_fields: db_payload["event"] = update_fields["event"]
        if "location" in update_fields: db_payload["location"] = update_fields["location"]
        if "description" in update_fields: db_payload["description"] = update_fields["description"]
        if "badge" in update_fields: db_payload["badge"] = update_fields["badge"]
        if "active" in update_fields: db_payload["is_active"] = update_fields["active"]
        if "display_order" in update_fields: db_payload["display_order"] = update_fields["display_order"]

        if db_payload:
            await db.update_supabase("schedule_items", "id", item_id, db_payload)

        local = db.load_local()
        items = local.get("schedule_items", [])
        updated = None
        for i, item in enumerate(items):
            if str(item.get("id")) == str(item_id):
                for k, v in update_fields.items():
                    item[k] = v
                items[i] = item
                updated = ScheduleItem(**item)
                break

        if updated is None:
            updated = ScheduleItem(id=item_id, time="", event="", **update_fields)
            items.append(updated.model_dump())

        local["schedule_items"] = items
        db.save_local(local)
        return updated

    @staticmethod
    async def delete_schedule_item(item_id: str) -> bool:
        await db.delete_supabase("schedule_items", "id", item_id)
        local = db.load_local()
        items = local.get("schedule_items", [])
        filtered = [item for item in items if str(item.get("id")) != str(item_id)]
        local["schedule_items"] = filtered
        db.save_local(local)
        return True

schedule_service = ScheduleService()

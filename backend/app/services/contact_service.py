import uuid
from typing import List, Optional
from app.database import db
from app.schemas.contact import (
    ContactDetails,
    ContactPerson,
    ContactPersonCreate,
    ContactPersonUpdate
)

DEFAULT_CONTACT_PEOPLE: List[dict] = [
    {
        "id": "cp-lead-1",
        "category": "leadership",
        "name": "Dr. CH. Hussaian Basha",
        "designation": "Dean-Project Show Case",
        "mobile": "9514418276",
        "email": "dean.psc@sru.edu.in",
        "display_order": 1,
        "is_active": True
    },
    {
        "id": "cp-lead-2",
        "category": "leadership",
        "name": "Dr. Markala Karthik Reddy",
        "designation": "Associate Dean Project Show Case",
        "mobile": "7842227172",
        "email": "m.karthik@sru.edu.in",
        "display_order": 2,
        "is_active": True
    },
    {
        "id": "cp-lead-3",
        "category": "leadership",
        "name": "Dr. Shravan Kumar Yadav",
        "designation": "Associate Dean Project Show Case",
        "mobile": "9040316409",
        "email": "shravan.kumar@sru.edu.in",
        "display_order": 3,
        "is_active": True
    },
    {
        "id": "cp-coord-1",
        "category": "coordinator",
        "name": "Mr. Mohammad Afzal",
        "designation": "Coordinator",
        "mobile": "9100726799",
        "email": "",
        "display_order": 1,
        "is_active": True
    },
    {
        "id": "cp-coord-2",
        "category": "coordinator",
        "name": "Mr. Algol Sumanth",
        "designation": "Coordinator",
        "mobile": "7842421505",
        "email": "",
        "display_order": 2,
        "is_active": True
    }
]

class ContactService:
    # ─── CONTACT SETTINGS ───────────────────────────────────────────────────────
    @staticmethod
    async def get_contact_details() -> ContactDetails:
        site_res = await db.fetch_supabase("site_settings", "limit=1")
        if site_res and len(site_res) > 0:
            s_row = site_res[0]
            return ContactDetails(
                contact_email=s_row.get("contact_email", "pragathi2k26@sru.edu.in"),
                helpline=s_row.get("helpline", "+91 870 281 8333"),
                institution=s_row.get("institution", "SR University"),
                venue=s_row.get("venue", "SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371")
            )

        local = db.load_local()
        ev = local.get("site_settings", {})
        return ContactDetails(
            contact_email=ev.get("contact_email", "pragathi2k26@sru.edu.in"),
            helpline=ev.get("helpline", "+91 870 281 8333"),
            institution=ev.get("institution", "SR University"),
            venue=ev.get("venue", "SR University Campus, Ananthasagar, Hasanparthy, Warangal, Telangana - 506371")
        )

    @staticmethod
    async def update_contact_details(data: ContactDetails) -> ContactDetails:
        current = await ContactService.get_contact_details()
        merged_dict = current.model_dump()
        incoming = data.model_dump(exclude_unset=True)
        for k, v in incoming.items():
            if v is not None and v != "":
                merged_dict[k] = v

        site_payload = {
            "contact_email": merged_dict["contact_email"],
            "helpline": merged_dict["helpline"],
            "institution": merged_dict["institution"],
            "venue": merged_dict["venue"]
        }
        
        # Update Supabase site_settings
        existing_ss = await db.fetch_supabase("site_settings", "limit=1")
        if existing_ss and len(existing_ss) > 0:
            ss_id = existing_ss[0].get("id")
            await db.update_supabase("site_settings", "id", str(ss_id), site_payload)
        else:
            await db.insert_supabase("site_settings", site_payload)

        # Update local storage
        local = db.load_local()
        ev = local.get("site_settings", {})
        ev.update(site_payload)
        local["site_settings"] = ev
        db.save_local(local)
        
        return ContactDetails(**merged_dict)

    # ─── CONTACT PEOPLE CRUD ───────────────────────────────────────────────────
    @staticmethod
    async def get_contact_people() -> List[ContactPerson]:
        # 1. Check Supabase
        res = await db.fetch_supabase("contact_people", "order=display_order.asc")
        if res and len(res) > 0:
            return [
                ContactPerson(
                    id=str(r.get("id")),
                    category=r.get("category", "leadership"),
                    name=r.get("name", ""),
                    designation=r.get("designation", ""),
                    mobile=r.get("mobile", ""),
                    email=r.get("email", "") or "",
                    display_order=int(r.get("display_order", 1)),
                    is_active=bool(r.get("is_active", True))
                )
                for r in res
            ]

        # 2. Check local database
        local = db.load_local()
        cp = local.get("contact_people")
        if cp and isinstance(cp, list) and len(cp) > 0:
            return [ContactPerson(**p) for p in sorted(cp, key=lambda x: x.get("display_order", 1))]

        # 3. Fallback to default initial seed list
        local["contact_people"] = DEFAULT_CONTACT_PEOPLE
        db.save_local(local)
        return [ContactPerson(**p) for p in DEFAULT_CONTACT_PEOPLE]

    @staticmethod
    async def create_contact_person(data: ContactPersonCreate) -> ContactPerson:
        new_id = f"cp-{uuid.uuid4().hex[:8]}"
        person = ContactPerson(
            id=new_id,
            category=data.category,
            name=data.name.strip(),
            designation=data.designation.strip(),
            mobile=data.mobile.strip(),
            email=(data.email or "").strip(),
            display_order=data.display_order or 1,
            is_active=data.is_active if data.is_active is not None else True
        )
        
        payload = {
            "category": person.category,
            "name": person.name,
            "designation": person.designation,
            "mobile": person.mobile,
            "email": person.email,
            "display_order": person.display_order,
            "is_active": person.is_active
        }
        
        # Save to Supabase
        await db.insert_supabase("contact_people", payload)

        # Save to local storage
        local = db.load_local()
        cp = local.get("contact_people", [])
        if not cp:
            cp = list(DEFAULT_CONTACT_PEOPLE)
        cp.append(person.model_dump())
        local["contact_people"] = cp
        db.save_local(local)

        return person

    @staticmethod
    async def update_contact_person(person_id: str, data: ContactPersonUpdate) -> Optional[ContactPerson]:
        # 1. Check existing in local
        local = db.load_local()
        cp = local.get("contact_people", [])
        if not cp:
            cp = list(DEFAULT_CONTACT_PEOPLE)

        target_idx = None
        target_item = None
        for i, item in enumerate(cp):
            if str(item.get("id")) == str(person_id):
                target_idx = i
                target_item = dict(item)
                break

        if target_item is None:
            # Check Supabase
            existing = await db.fetch_supabase("contact_people", f"id=eq.{person_id}")
            if existing and len(existing) > 0:
                target_item = existing[0]

        if not target_item:
            return None

        # Apply updates
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            if v is not None:
                if isinstance(v, str):
                    target_item[k] = v.strip()
                else:
                    target_item[k] = v

        # Update Supabase
        db_payload = {
            "category": target_item.get("category"),
            "name": target_item.get("name"),
            "designation": target_item.get("designation"),
            "mobile": target_item.get("mobile"),
            "email": target_item.get("email", ""),
            "display_order": target_item.get("display_order", 1),
            "is_active": target_item.get("is_active", True)
        }
        await db.update_supabase("contact_people", "id", str(person_id), db_payload)

        # Update local
        if target_idx is not None:
            cp[target_idx] = target_item
        else:
            cp.append(target_item)
        local["contact_people"] = cp
        db.save_local(local)

        return ContactPerson(
            id=str(target_item.get("id")),
            category=target_item.get("category", "leadership"),
            name=target_item.get("name", ""),
            designation=target_item.get("designation", ""),
            mobile=target_item.get("mobile", ""),
            email=target_item.get("email", "") or "",
            display_order=int(target_item.get("display_order", 1)),
            is_active=bool(target_item.get("is_active", True))
        )

    @staticmethod
    async def delete_contact_person(person_id: str) -> bool:
        # Delete from Supabase
        await db.delete_supabase("contact_people", "id", str(person_id))

        # Delete from local
        local = db.load_local()
        cp = local.get("contact_people", [])
        if not cp:
            cp = list(DEFAULT_CONTACT_PEOPLE)
        
        filtered = [p for p in cp if str(p.get("id")) != str(person_id)]
        local["contact_people"] = filtered
        db.save_local(local)

        return True

contact_service = ContactService()


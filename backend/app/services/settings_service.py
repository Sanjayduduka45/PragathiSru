import uuid
import datetime
from typing import Dict, Any, List, Optional
from app.database import db
from app.schemas.settings import (
    FullSettings,
    EventConfig,
    NotificationConfig,
    SystemConfig,
    AdminProfile,
    FullSettingsUpdate,
    UserRoleItem,
    UserRoleCreate,
    UserRoleUpdate,
    AuditLogItem
)

DEFAULT_EVENT_CONFIG = {
    "event_name": "PRAGATHI 2K26",
    "event_date": "09 October 2026",
    "target_date_iso": "2026-10-09T09:00:00+05:30",
    "registration_status": "open",
    "registration_open_date": "2026-08-01T00:00:00+05:30",
    "registration_close_date": "2026-10-01T23:59:59+05:30",
    "website_visibility": "published",
    "event_status": "active"
}

DEFAULT_NOTIFICATION_CONFIG = {
    "announcement_emails_enabled": True,
    "registration_confirmation_emails_enabled": True,
    "event_reminder_alerts_enabled": True,
    "email_sender_name": "PRAGATHI 2K26 Secretariat",
    "provider_status": "ready"
}

DEFAULT_SYSTEM_CONFIG = {
    "maintenance_mode": False,
    "max_registrations": 500,
    "announcement_banner_enabled": False,
    "announcement_banner_text": "Welcome to PRAGATHI 2K26 Expo Registration Portal!",
    "debug_logging": False
}

DEFAULT_ADMIN_PROFILE = {
    "display_name": "Lead Administrator",
    "email": "admin@sru.edu.in",
    "role": "admin",
    "account_status": "verified",
    "last_sign_in": None,
    "auth_provider": "email"
}

DEFAULT_USER_ROLES = [
    {
        "id": "role-admin-1",
        "user_email": "admin@sru.edu.in",
        "role": "admin",
        "display_name": "Lead Administrator",
        "department": "Deanery",
        "is_active": True,
        "assigned_by": "system",
        "created_at": "2026-08-01T00:00:00Z"
    },
    {
        "id": "role-coord-1",
        "user_email": "coordinator@sru.edu.in",
        "role": "coordinator",
        "display_name": "Chief Event Coordinator",
        "department": "CSE",
        "is_active": True,
        "assigned_by": "system",
        "created_at": "2026-08-01T00:00:00Z"
    },
    {
        "id": "role-jury-1",
        "user_email": "jury.head@sru.edu.in",
        "role": "jury",
        "display_name": "Evaluation Panel Head",
        "department": "Research",
        "is_active": True,
        "assigned_by": "system",
        "created_at": "2026-08-01T00:00:00Z"
    }
]

class SettingsService:
    def __init__(self):
        # Ensure local DB has system_settings, user_roles, audit_logs initialized
        local_data = db.load_local()
        updated = False
        if "system_settings" not in local_data:
            local_data["system_settings"] = {
                "event_config": DEFAULT_EVENT_CONFIG.copy(),
                "notification_config": DEFAULT_NOTIFICATION_CONFIG.copy(),
                "system_config": DEFAULT_SYSTEM_CONFIG.copy(),
                "admin_profile": DEFAULT_ADMIN_PROFILE.copy()
            }
            updated = True
        if "user_roles" not in local_data:
            local_data["user_roles"] = DEFAULT_USER_ROLES.copy()
            updated = True
        if "audit_logs" not in local_data:
            local_data["audit_logs"] = [
                {
                    "id": "audit-init",
                    "action": "SYSTEM_INIT",
                    "performed_by": "system",
                    "target": "system_settings",
                    "details": "System settings and security framework initialized.",
                    "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
                }
            ]
            updated = True
        if updated:
            db.save_local(local_data)

    async def get_settings(self) -> FullSettings:
        # Try fetching from Supabase system_settings table
        supa_settings = await db.fetch_supabase("system_settings")
        event_dict = DEFAULT_EVENT_CONFIG.copy()
        notif_dict = DEFAULT_NOTIFICATION_CONFIG.copy()
        sys_dict = DEFAULT_SYSTEM_CONFIG.copy()
        admin_dict = DEFAULT_ADMIN_PROFILE.copy()

        if supa_settings and isinstance(supa_settings, list):
            for row in supa_settings:
                key = row.get("key")
                val = row.get("value") or {}
                if key == "event_config":
                    event_dict.update(val)
                elif key == "notification_config":
                    notif_dict.update(val)
                elif key == "system_config":
                    sys_dict.update(val)
                elif key == "admin_profile":
                    admin_dict.update(val)
        else:
            local = db.load_local().get("system_settings", {})
            event_dict.update(local.get("event_config", {}))
            notif_dict.update(local.get("notification_config", {}))
            sys_dict.update(local.get("system_config", {}))
            admin_dict.update(local.get("admin_profile", {}))

        return FullSettings(
            event=EventConfig(**event_dict),
            notifications=NotificationConfig(**notif_dict),
            system=SystemConfig(**sys_dict),
            admin_profile=AdminProfile(**admin_dict)
        )

    async def update_settings(self, updates: FullSettingsUpdate, updated_by: str = "admin") -> FullSettings:
        current = await self.get_settings()
        local_data = db.load_local()
        local_settings = local_data.get("system_settings", {})

        changed_sections = []

        if updates.event is not None:
            new_event = updates.event.model_dump()
            local_settings["event_config"] = new_event
            await db.upsert_supabase("system_settings", {
                "key": "event_config",
                "value": new_event,
                "description": "Core event lifecycle and registration window",
                "is_public": True,
                "updated_by": updated_by
            }, on_conflict="key")
            changed_sections.append("event_config")

        if updates.notifications is not None:
            new_notif = updates.notifications.model_dump()
            local_settings["notification_config"] = new_notif
            await db.upsert_supabase("system_settings", {
                "key": "notification_config",
                "value": new_notif,
                "description": "Email delivery and notification flags",
                "is_public": False,
                "updated_by": updated_by
            }, on_conflict="key")
            changed_sections.append("notification_config")

        if updates.system is not None:
            new_sys = updates.system.model_dump()
            local_settings["system_config"] = new_sys
            await db.upsert_supabase("system_settings", {
                "key": "system_config",
                "value": new_sys,
                "description": "System-level limits, banner, and maintenance mode",
                "is_public": True,
                "updated_by": updated_by
            }, on_conflict="key")
            changed_sections.append("system_config")

        if updates.admin_profile is not None:
            admin_dict = current.admin_profile.model_dump()
            admin_dict.update(updates.admin_profile)
            local_settings["admin_profile"] = admin_dict
            await db.upsert_supabase("system_settings", {
                "key": "admin_profile",
                "value": admin_dict,
                "description": "Admin profile metadata",
                "is_public": False,
                "updated_by": updated_by
            }, on_conflict="key")
            changed_sections.append("admin_profile")

        local_data["system_settings"] = local_settings
        db.save_local(local_data)

        # Log audit action
        await self.log_audit_action(
            action="SETTINGS_UPDATE",
            performed_by=updated_by,
            target="system_settings",
            details=f"Updated configuration sections: {', '.join(changed_sections)}"
        )

        return await self.get_settings()

    async def reset_settings(self, section: Optional[str] = None, updated_by: str = "admin") -> FullSettings:
        local_data = db.load_local()
        local_settings = local_data.get("system_settings", {})

        if not section or section == "all":
            local_settings["event_config"] = DEFAULT_EVENT_CONFIG.copy()
            local_settings["notification_config"] = DEFAULT_NOTIFICATION_CONFIG.copy()
            local_settings["system_config"] = DEFAULT_SYSTEM_CONFIG.copy()
            local_settings["admin_profile"] = DEFAULT_ADMIN_PROFILE.copy()
            detail = "All system settings restored to default baseline."
        elif section == "event":
            local_settings["event_config"] = DEFAULT_EVENT_CONFIG.copy()
            detail = "Event configuration restored to default baseline."
        elif section == "notifications":
            local_settings["notification_config"] = DEFAULT_NOTIFICATION_CONFIG.copy()
            detail = "Notification configuration restored to default baseline."
        elif section == "system":
            local_settings["system_config"] = DEFAULT_SYSTEM_CONFIG.copy()
            detail = "System configuration restored to default baseline."

        local_data["system_settings"] = local_settings
        db.save_local(local_data)

        # Sync with Supabase
        for key in ["event_config", "notification_config", "system_config", "admin_profile"]:
            val = local_settings.get(key)
            if val:
                await db.upsert_supabase("system_settings", {
                    "key": key,
                    "value": val,
                    "updated_by": updated_by
                }, on_conflict="key")

        await self.log_audit_action(
            action="SETTINGS_RESET",
            performed_by=updated_by,
            target=section or "all",
            details=detail
        )

        return await self.get_settings()

    # ─── USER ROLES CRUD ───────────────────────────────────────────────────────

    async def get_roles(self) -> List[UserRoleItem]:
        supa_roles = await db.fetch_supabase("user_roles")
        if supa_roles and isinstance(supa_roles, list) and len(supa_roles) > 0:
            return [
                UserRoleItem(
                    id=str(r.get("id")),
                    user_email=r.get("user_email", ""),
                    role=r.get("role", "participant"),
                    display_name=r.get("display_name", ""),
                    department=r.get("department", ""),
                    is_active=r.get("is_active", True),
                    assigned_by=r.get("assigned_by", "admin"),
                    created_at=r.get("created_at"),
                    updated_at=r.get("updated_at")
                )
                for r in supa_roles
            ]

        local_roles = db.load_local().get("user_roles", DEFAULT_USER_ROLES)
        return [UserRoleItem(**r) for r in local_roles]

    async def create_role(self, data: UserRoleCreate, assigned_by: str = "admin") -> UserRoleItem:
        role_id = f"role-{uuid.uuid4().hex[:8]}"
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        new_item = {
            "id": role_id,
            "user_email": data.user_email.strip().lower(),
            "role": data.role,
            "display_name": data.display_name.strip() if data.display_name else "",
            "department": data.department.strip() if data.department else "",
            "is_active": data.is_active,
            "assigned_by": assigned_by,
            "created_at": now,
            "updated_at": now
        }

        # Try Supabase
        supa_res = await db.insert_supabase("user_roles", new_item)
        if supa_res and isinstance(supa_res, dict):
            new_item["id"] = str(supa_res.get("id", role_id))

        # Local storage sync
        local_data = db.load_local()
        roles = local_data.setdefault("user_roles", [])
        # Check if email already exists locally
        roles = [r for r in roles if r.get("user_email") != new_item["user_email"]]
        roles.append(new_item)
        local_data["user_roles"] = roles
        db.save_local(local_data)

        await self.log_audit_action(
            action="ROLE_ASSIGNED",
            performed_by=assigned_by,
            target=new_item["user_email"],
            details=f"Assigned role '{new_item['role']}' to {new_item['user_email']}"
        )

        return UserRoleItem(**new_item)

    async def update_role(self, role_id: str, data: UserRoleUpdate, performed_by: str = "admin") -> Optional[UserRoleItem]:
        local_data = db.load_local()
        roles = local_data.setdefault("user_roles", [])
        target = next((r for r in roles if str(r.get("id")) == str(role_id)), None)

        if not target:
            # Check supabase
            supa_roles = await db.fetch_supabase("user_roles")
            if supa_roles and isinstance(supa_roles, list):
                target = next((r for r in supa_roles if str(r.get("id")) == str(role_id)), None)

        if not target:
            return None

        if data.role is not None:
            target["role"] = data.role
        if data.display_name is not None:
            target["display_name"] = data.display_name.strip()
        if data.department is not None:
            target["department"] = data.department.strip()
        if data.is_active is not None:
            target["is_active"] = data.is_active

        target["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Update in Supabase
        await db.upsert_supabase("user_roles", target, on_conflict="id")

        # Update in Local JSON
        for i, r in enumerate(roles):
            if str(r.get("id")) == str(role_id):
                roles[i] = target
                break
        db.save_local(local_data)

        await self.log_audit_action(
            action="ROLE_UPDATED",
            performed_by=performed_by,
            target=target.get("user_email", role_id),
            details=f"Updated role configuration for {target.get('user_email')}"
        )

        return UserRoleItem(**target)

    async def delete_role(self, role_id: str, performed_by: str = "admin") -> bool:
        local_data = db.load_local()
        roles = local_data.setdefault("user_roles", [])
        target = next((r for r in roles if str(r.get("id")) == str(role_id)), None)

        user_email = target.get("user_email", role_id) if target else role_id

        # Delete from local
        local_data["user_roles"] = [r for r in roles if str(r.get("id")) != str(role_id)]
        db.save_local(local_data)

        # Delete from Supabase
        await db.delete_supabase("user_roles", "id", str(role_id))

        await self.log_audit_action(
            action="ROLE_REVOKED",
            performed_by=performed_by,
            target=user_email,
            details=f"Revoked role assignment for {user_email}"
        )

        return True

    # ─── AUDIT LOGS ───────────────────────────────────────────────────────────

    async def get_audit_logs(self, limit: int = 30) -> List[AuditLogItem]:
        supa_logs = await db.fetch_supabase("audit_logs")
        if supa_logs and isinstance(supa_logs, list) and len(supa_logs) > 0:
            sorted_logs = sorted(supa_logs, key=lambda x: x.get("created_at", ""), reverse=True)
            return [
                AuditLogItem(
                    id=str(log.get("id")),
                    action=log.get("action", "UNKNOWN"),
                    performed_by=log.get("performed_by", "admin"),
                    target=log.get("target", ""),
                    details=log.get("details", ""),
                    created_at=log.get("created_at")
                )
                for log in sorted_logs[:limit]
            ]

        local_logs = db.load_local().get("audit_logs", [])
        sorted_local = sorted(local_logs, key=lambda x: x.get("created_at", ""), reverse=True)
        return [AuditLogItem(**l) for l in sorted_local[:limit]]

    async def log_audit_action(self, action: str, performed_by: str, target: str = "", details: str = ""):
        log_entry = {
            "id": f"audit-{uuid.uuid4().hex[:8]}",
            "action": action,
            "performed_by": performed_by,
            "target": target,
            "details": details,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        # Try Supabase insert
        await db.insert_supabase("audit_logs", log_entry)

        # Local storage insert
        local_data = db.load_local()
        logs = local_data.setdefault("audit_logs", [])
        logs.insert(0, log_entry)
        if len(logs) > 100:
            local_data["audit_logs"] = logs[:100]
        db.save_local(local_data)

settings_service = SettingsService()

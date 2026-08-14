from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class EventConfig(BaseModel):
    event_name: str = "PRAGATHI 2K26"
    event_date: str = "09 October 2026"
    target_date_iso: str = "2026-10-09T09:00:00+05:30"
    registration_status: str = "open"  # 'open' | 'closed' | 'paused'
    registration_open_date: str = "2026-08-01T00:00:00+05:30"
    registration_close_date: str = "2026-10-01T23:59:59+05:30"
    website_visibility: str = "published"  # 'published' | 'maintenance'
    event_status: str = "active"  # 'planning' | 'active' | 'completed'

class NotificationConfig(BaseModel):
    announcement_emails_enabled: bool = True
    registration_confirmation_emails_enabled: bool = True
    event_reminder_alerts_enabled: bool = True
    email_sender_name: str = "PRAGATHI 2K26 Secretariat"
    provider_status: str = "ready"  # 'ready' | 'simulated' | 'configured'

class SystemConfig(BaseModel):
    maintenance_mode: bool = False
    max_registrations: int = 500
    announcement_banner_enabled: bool = False
    announcement_banner_text: str = "Welcome to PRAGATHI 2K26 Expo Registration Portal!"
    debug_logging: bool = False

class AdminProfile(BaseModel):
    display_name: str = "Lead Administrator"
    email: str = "admin@sru.edu.in"
    role: str = "admin"
    account_status: str = "verified"
    last_sign_in: Optional[str] = None
    auth_provider: str = "email"

class FullSettings(BaseModel):
    event: EventConfig
    notifications: NotificationConfig
    system: SystemConfig
    admin_profile: AdminProfile

class FullSettingsUpdate(BaseModel):
    event: Optional[EventConfig] = None
    notifications: Optional[NotificationConfig] = None
    system: Optional[SystemConfig] = None
    admin_profile: Optional[Dict[str, Any]] = None

class SettingsResponse(BaseModel):
    success: bool = True
    data: FullSettings
    message: Optional[str] = None

class UserRoleItem(BaseModel):
    id: str
    user_email: str
    role: str  # 'admin' | 'coordinator' | 'jury' | 'participant'
    display_name: str = ""
    department: str = ""
    is_active: bool = True
    assigned_by: str = "admin"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class UserRoleCreate(BaseModel):
    user_email: str
    role: str
    display_name: Optional[str] = ""
    department: Optional[str] = ""
    is_active: bool = True

class UserRoleUpdate(BaseModel):
    role: Optional[str] = None
    display_name: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class UserRolesResponse(BaseModel):
    success: bool = True
    data: List[UserRoleItem]

class UserRoleSingleResponse(BaseModel):
    success: bool = True
    data: UserRoleItem
    message: Optional[str] = None

class AuditLogItem(BaseModel):
    id: str
    action: str
    performed_by: str
    target: str = ""
    details: str = ""
    created_at: Optional[str] = None

class AuditLogsResponse(BaseModel):
    success: bool = True
    data: List[AuditLogItem]

import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = os.getenv("SUPABASE_URL", os.getenv("VITE_SUPABASE_URL", "https://ajoixggemnuokpcwomnn.supabase.co"))
    supabase_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("VITE_SUPABASE_ANON_KEY", ""))
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "*")
    admin_secret_key: str = os.getenv("ADMIN_SECRET_KEY", "pragathi_admin_secret_key_2026")

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
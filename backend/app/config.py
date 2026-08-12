from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = https://ajoixggemnuokpcwomnn.supabase.co
    supabase_key: str = ""
    allowed_origins: str = "*"
    admin_secret_key: str = "pragathi_admin_secret_key_2026"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

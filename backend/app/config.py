import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = Field(
        default="https://ajoixggemnuokpcwomnn.supabase.co",
        validation_alias="SUPABASE_URL",
    )

    supabase_key: str = Field(
        default="",
        validation_alias="SUPABASE_SERVICE_ROLE_KEY",
    )

    allowed_origins: str = Field(
        default="*",
        validation_alias="ALLOWED_ORIGINS",
    )

    admin_secret_key: str = Field(
        default="",
        validation_alias="ADMIN_SECRET_KEY",
    )

    jury_assignment_enforcement: bool = Field(
        default=False,
        validation_alias="JURY_ASSIGNMENT_ENFORCEMENT",
    )

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def get_effective_key(self) -> str:
        return (
            self.supabase_key
            or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
            or os.getenv("SUPABASE_KEY", "")
            or os.getenv("SUPABASE_ANON_KEY", "")
            or os.getenv("VITE_SUPABASE_ANON_KEY", "")
        )


settings = Settings()


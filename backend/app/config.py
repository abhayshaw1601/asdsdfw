import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Wind Forecast Decision Portal"
    data_dir: Path = Path(__file__).resolve().parent.parent.parent / "data"
    static_dir: str | None = os.getenv("STATIC_DIR", None)

    model_config = SettingsConfigDict(env_prefix="APP_")


settings = Settings()

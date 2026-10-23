import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_data_dir() -> Path:
    # 1. Self-contained backend/data directory
    backend_data = Path(__file__).resolve().parent.parent / "data"
    if backend_data.exists():
        return backend_data
    # 2. Fallback to workspace root data/
    root_data = Path(__file__).resolve().parent.parent.parent / "data"
    if root_data.exists():
        return root_data
    return backend_data


class Settings(BaseSettings):
    app_name: str = "Wind Forecast Decision Portal"
    data_dir: Path = _resolve_data_dir()
    static_dir: str | None = os.getenv("STATIC_DIR", None)

    model_config = SettingsConfigDict(env_prefix="APP_")


settings = Settings()

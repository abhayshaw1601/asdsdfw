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
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/wind_portal")
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "wind-portal-super-secret-key-2026-elexon")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()

import os
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Wind Forecast Decision Portal"
    data_dir: Path = Path(__file__).resolve().parent.parent.parent / "data"
    static_dir: str | None = os.getenv("STATIC_DIR", None)

    class Config:
        env_prefix = "APP_"


settings = Settings()

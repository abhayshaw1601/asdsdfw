"""Main FastAPI application entrypoint for Wind Forecast Decision Portal."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.auth_routes import auth_router
from backend.app.api.routes import router
from backend.app.config import settings

app = FastAPI(
    title=settings.app_name,
    description="Day-ahead wind power buying forecast decision portal API",
    version="0.1.0",
)

# Enable CORS for frontend Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(router)
app.include_router(auth_router)


@app.get("/api/v1/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "app": settings.app_name}


# Optional static files mounting for Docker container deployment
if settings.static_dir:
    static_path = Path(settings.static_dir)
    if static_path.exists() and static_path.is_dir():
        app.mount("/", StaticFiles(directory=str(static_path), html=True), name="static")

"""FastAPI endpoints for Elexon BMRS live streaming data synchronization and telemetry."""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.core.live_syncer import fetch_live_actuals, fetch_live_forecasts, live_service
from backend.app.data_store import data_store

logger = logging.getLogger("wind_portal.api.live")

live_router = APIRouter(prefix="/api/v1/live", tags=["live-stream"])


class LiveSyncRequest(BaseModel):
    days: int = Field(default=3, ge=1, le=14, description="Number of rolling days to fetch up to now")


class DateRangeRequest(BaseModel):
    startDate: str = Field(..., description="Start date (YYYY-MM-DD)")
    endDate: str = Field(..., description="End date (YYYY-MM-DD)")


@live_router.get("/status")
def get_live_status() -> Dict[str, Any]:
    """Get real-time telemetry on Elexon live streaming connection and dataset boundaries."""
    return live_service.get_telemetry()


@live_router.get("/bounds")
def get_dataset_bounds() -> Dict[str, Any]:
    """Get active date bounds across all loaded actuals (January 2026 + live streaming data)."""
    latest_outturn = None
    if not data_store.actuals_df.empty:
        latest_outturn = data_store.actuals_df["startTime"].max().isoformat()

    return {
        "minDate": str(data_store.min_date) if data_store.min_date else "2026-01-01",
        "maxDate": str(data_store.max_date) if data_store.max_date else "2026-01-31",
        "totalActuals": len(data_store.actuals_df),
        "totalForecasts": len(data_store.forecasts_df),
        "latestActual": latest_outturn,
    }


@live_router.post("/sync")
def sync_live_stream(req: Optional[LiveSyncRequest] = None) -> Dict[str, Any]:
    """Trigger on-demand live ingestion of rolling Elexon FUELHH actuals & WINDFOR forecasts."""
    days = req.days if req else 3
    result = live_service.sync_rolling_window(days=days)
    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Elexon live sync failed: {result.get('message')}",
        )
    return result


@live_router.post("/fetch-range")
def fetch_custom_date_range(req: DateRangeRequest) -> Dict[str, Any]:
    """Fetch and merge a specific historical or live date range from Elexon BMRS."""
    try:
        s_date = date.fromisoformat(req.startDate)
        e_date = date.fromisoformat(req.endDate)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format (must be YYYY-MM-DD): {exc}",
        ) from exc

    if s_date > e_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="startDate cannot be after endDate",
        )

    # Max range 31 days per request
    if (e_date - s_date).days > 31:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested range cannot exceed 31 days per request",
        )

    logger.info(f"On-demand range fetch from Elexon: {s_date} to {e_date}")
    act_df = fetch_live_actuals(s_date, e_date)

    # Forecasts published starting 2 days before s_date up to e_date
    pub_from = datetime(s_date.year, s_date.month, s_date.day, 0, 0, tzinfo=timezone.utc) - timedelta(days=2)
    pub_to = datetime(e_date.year, e_date.month, e_date.day, 23, 59, tzinfo=timezone.utc)
    fc_df = fetch_live_forecasts(pub_from, pub_to)

    data_store.merge_live_data(act_df, fc_df)

    return {
        "status": "success",
        "startDate": str(s_date),
        "endDate": str(e_date),
        "actualsAdded": len(act_df),
        "forecastsAdded": len(fc_df),
        "minDate": str(data_store.min_date),
        "maxDate": str(data_store.max_date),
    }

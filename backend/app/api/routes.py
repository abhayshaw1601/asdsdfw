"""API route definitions for the Wind Forecast Decision Portal."""

from datetime import date

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from backend.app.core.metrics import (
    compute_buffer_guidance,
    compute_horizon_metrics,
    compute_hourly_metrics,
    compute_metrics,
)
from backend.app.core.selection import merge_decision_with_actuals, select_decision_forecasts
from backend.app.core.timeutil import deadline_utc
from backend.app.data_store import data_store
from backend.app.schemas import (
    BufferResponse,
    BufferRow,
    DaySummary,
    DecisionResponse,
    HorizonResponse,
    HourMetrics,
    MetadataResponse,
    Metrics,
    MetricsResponse,
    SeriesPoint,
    SeriesResponse,
)

router = APIRouter(prefix="/api/v1", tags=["Wind Forecast API"])


@router.get("/metadata", response_model=MetadataResponse)
def get_metadata():
    """Return dataset time boundaries and summary counts."""
    return MetadataResponse(
        minDate=data_store.min_date or date(2026, 1, 1),
        maxDate=data_store.max_date or date(2026, 1, 31),
        actualsCount=len(data_store.actuals_df),
        forecastsCount=len(data_store.forecasts_df),
        defaultDeadlineHour=9,
    )


@router.get("/decision", response_model=DecisionResponse)
def get_decision(
    day: date = Query(date(2026, 1, 15), description="Target delivery day (YYYY-MM-DD)"),
    deadline_hour: int = Query(9, ge=0, le=23, description="Deadline hour on D-1 (0-23)"),
):
    """Retrieve decision-time forecasts and actuals for a specific delivery day."""
    if data_store.min_date and data_store.max_date:
        if day < data_store.min_date or day > data_store.max_date:
            raise HTTPException(
                status_code=422,
                detail=f"Requested day {day} is outside dataset range ({data_store.min_date} to {data_store.max_date}).",
            )

    selected = select_decision_forecasts(
        data_store.forecasts_df, start_date=day, end_date=day, deadline_hour=deadline_hour
    )
    merged = merge_decision_with_actuals(selected, data_store.actuals_df)

    points = []
    for _, row in merged.iterrows():
        points.append(
            SeriesPoint(
                startTime=row["startTime"].to_pydatetime(),
                forecast=round(float(row["forecast"]), 2),
                actual=round(float(row["actual"]), 2) if pd.notna(row["actual"]) else None,
                publishTime=row["publishTime"].to_pydatetime(),
                deadlineUtc=row["deadlineUtc"].to_pydatetime(),
                horizonHours=round(float(row["horizonHours"]), 2),
                error=round(float(row["error"]), 2) if pd.notna(row["error"]) else None,
            )
        )

    deadline_ts = deadline_utc(day, hour=deadline_hour)
    deadline_local_str = f"D-1 at {deadline_hour:02d}:00 Europe/London"

    if points:
        forecast_vals = [p.forecast for p in points]
        summary = DaySummary(
            minForecastMw=round(min(forecast_vals), 2),
            maxForecastMw=round(max(forecast_vals), 2),
            meanForecastMw=round(float(np.mean(forecast_vals)), 2),
            # 1 hour intervals = 1 MWh per MW; for half-hours multiply by 0.5
            totalEnergyMwh=round(float(sum(forecast_vals)), 2),
        )
    else:
        summary = DaySummary(
            minForecastMw=0.0, maxForecastMw=0.0, meanForecastMw=0.0, totalEnergyMwh=0.0
        )

    return DecisionResponse(
        day=day,
        deadlineUtc=deadline_ts.to_pydatetime(),
        deadlineLocal=deadline_local_str,
        points=points,
        summary=summary,
    )


@router.get("/series", response_model=SeriesResponse)
def get_series(
    start_date: date = Query(date(2026, 1, 1), description="Start delivery date (inclusive)"),
    end_date: date = Query(date(2026, 1, 31), description="End delivery date (inclusive)"),
    deadline_hour: int = Query(9, ge=0, le=23, description="Deadline hour on D-1 (0-23)"),
):
    """Retrieve time series of decision forecasts and actuals across a date range."""
    if start_date > end_date:
        raise HTTPException(
            status_code=422,
            detail=f"start_date ({start_date}) must be before or equal to end_date ({end_date}).",
        )

    selected = select_decision_forecasts(
        data_store.forecasts_df,
        start_date=start_date,
        end_date=end_date,
        deadline_hour=deadline_hour,
    )
    merged = merge_decision_with_actuals(selected, data_store.actuals_df)

    points = []
    for _, row in merged.iterrows():
        points.append(
            SeriesPoint(
                startTime=row["startTime"].to_pydatetime(),
                forecast=round(float(row["forecast"]), 2),
                actual=round(float(row["actual"]), 2) if pd.notna(row["actual"]) else None,
                publishTime=row["publishTime"].to_pydatetime(),
                deadlineUtc=row["deadlineUtc"].to_pydatetime(),
                horizonHours=round(float(row["horizonHours"]), 2),
                error=round(float(row["error"]), 2) if pd.notna(row["error"]) else None,
            )
        )

    return SeriesResponse(count=len(points), points=points)


@router.get("/metrics", response_model=MetricsResponse)
def get_metrics(
    start_date: date = Query(date(2026, 1, 1), description="Start delivery date (inclusive)"),
    end_date: date = Query(date(2026, 1, 31), description="End delivery date (inclusive)"),
    deadline_hour: int = Query(9, ge=0, le=23, description="Deadline hour on D-1 (0-23)"),
):
    """Calculate overall and hourly forecast accuracy metrics for the specified window."""
    if start_date > end_date:
        raise HTTPException(
            status_code=422,
            detail=f"start_date ({start_date}) must be before or equal to end_date ({end_date}).",
        )

    selected = select_decision_forecasts(
        data_store.forecasts_df,
        start_date=start_date,
        end_date=end_date,
        deadline_hour=deadline_hour,
    )
    merged = merge_decision_with_actuals(selected, data_store.actuals_df)

    raw_summary = compute_metrics(merged)
    raw_hourly = compute_hourly_metrics(merged)

    return MetricsResponse(
        summary=Metrics(**raw_summary),
        hourly=[HourMetrics(**h) for h in raw_hourly],
    )


@router.get("/horizon", response_model=HorizonResponse)
def get_horizon():
    """Calculate error metrics binned by forecast lead horizon hours across ALL forecasts."""
    raw_horizon = compute_horizon_metrics(data_store.forecasts_df, data_store.actuals_df)
    return HorizonResponse(bins=raw_horizon)


@router.get("/buffer", response_model=BufferResponse)
def get_buffer(
    start_date: date = Query(date(2026, 1, 1), description="Start delivery date (inclusive)"),
    end_date: date = Query(date(2026, 1, 31), description="End delivery date (inclusive)"),
    deadline_hour: int = Query(9, ge=0, le=23, description="Deadline hour on D-1 (0-23)"),
    quantile: float = Query(
        0.90, gt=0.0, lt=1.0, description="Target shortfall protection quantile (e.g. 0.90 or 0.95)"
    ),
):
    """Calculate safety buffer guidance per hour of day to protect against over-forecast risk."""
    if start_date > end_date:
        raise HTTPException(
            status_code=422,
            detail=f"start_date ({start_date}) must be before or equal to end_date ({end_date}).",
        )

    selected = select_decision_forecasts(
        data_store.forecasts_df,
        start_date=start_date,
        end_date=end_date,
        deadline_hour=deadline_hour,
    )
    merged = merge_decision_with_actuals(selected, data_store.actuals_df)

    raw_buffer = compute_buffer_guidance(merged)

    # Compute custom quantile if different from default P90
    rows = []
    for b in raw_buffer:
        h = b["hour"]
        subset = merged[merged["localHour"] == h]
        if not subset.empty:
            shortfall = subset["error"].clip(lower=0.0)
            custom_buffer = float(shortfall.quantile(quantile))
        else:
            custom_buffer = 0.0

        rows.append(
            BufferRow(
                hour=h,
                n=b["n"],
                bufferMw=round(custom_buffer, 2),
                bufferP90=b["bufferP90"],
                bufferP95=b["bufferP95"],
                meanOverForecast=b["meanOverForecast"],
                maxShortfall=b["maxShortfall"],
            )
        )

    return BufferResponse(quantile=quantile, rows=rows)

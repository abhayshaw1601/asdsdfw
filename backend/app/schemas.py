"""Pydantic request and response schemas for the Wind Forecast Decision Portal API."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    app: str


class MetadataResponse(BaseModel):
    minDate: date
    maxDate: date
    actualsCount: int
    forecastsCount: int
    defaultDeadlineHour: int = 9


class SeriesPoint(BaseModel):
    startTime: datetime
    forecast: float
    actual: Optional[float] = None
    publishTime: datetime
    deadlineUtc: datetime
    horizonHours: float
    error: Optional[float] = None


class DaySummary(BaseModel):
    minForecastMw: float
    maxForecastMw: float
    meanForecastMw: float
    totalEnergyMwh: float


class DecisionResponse(BaseModel):
    day: date
    deadlineUtc: datetime
    deadlineLocal: str
    points: list[SeriesPoint]
    summary: DaySummary


class SeriesResponse(BaseModel):
    count: int
    points: list[SeriesPoint]


class Metrics(BaseModel):
    n: int
    mae: float
    rmse: float
    bias: float
    nmae: float
    p50: float
    p90: float
    p95: float


class HourMetrics(BaseModel):
    hour: int
    n: int
    mae: float
    rmse: float
    bias: float


class MetricsResponse(BaseModel):
    summary: Metrics
    hourly: list[HourMetrics]


class HorizonMetrics(BaseModel):
    binLabel: str
    n: int
    mae: float
    rmse: float
    bias: float


class HorizonResponse(BaseModel):
    bins: list[HorizonMetrics]


class BufferRow(BaseModel):
    hour: int
    n: int
    bufferMw: float = Field(description="Buffer sized for requested quantile of shortfall")
    bufferP90: float
    bufferP95: float
    meanOverForecast: float
    maxShortfall: float


class BufferResponse(BaseModel):
    quantile: float
    rows: list[BufferRow]

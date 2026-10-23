"""Unit tests for metrics calculation module."""

import math

import pandas as pd
import pytest

from backend.app.core.metrics import (
    compute_buffer_guidance,
    compute_horizon_metrics,
    compute_hourly_metrics,
    compute_metrics,
)


@pytest.fixture
def hand_computed_df():
    """Small fixture with known hand-calculated metrics.

    Forecasts: [100, 200, 150, 300]
    Actuals:   [80,  250, 150, 200]
    Errors:    [+20, -50, 0,   +100]
    Abs Errors:[20,  50,  0,   100]

    Expected:
    - MAE = (20 + 50 + 0 + 100) / 4 = 170 / 4 = 42.50
    - RMSE = sqrt((400 + 2500 + 0 + 10000) / 4) = sqrt(12900 / 4) = sqrt(3225) ≈ 56.79
    - Bias = (20 - 50 + 0 + 100) / 4 = 70 / 4 = 17.50
    - Mean Actual = (80 + 250 + 150 + 200) / 4 = 170.00
    - nMAE = 42.50 / 170.00 = 0.2500
    - Shortfalls (over-forecast risk): [20, 0, 0, 100]
    """
    return pd.DataFrame(
        [
            {"localHour": 10, "forecast": 100, "actual": 80, "error": 20},
            {"localHour": 10, "forecast": 200, "actual": 250, "error": -50},
            {"localHour": 11, "forecast": 150, "actual": 150, "error": 0},
            {"localHour": 11, "forecast": 300, "actual": 200, "error": 100},
        ]
    )


def test_hand_computed_summary_metrics(hand_computed_df):
    """Verify MAE, RMSE, Bias, and nMAE match hand calculations exactly."""
    metrics = compute_metrics(hand_computed_df)

    assert metrics["n"] == 4
    assert metrics["mae"] == 42.50
    assert math.isclose(metrics["rmse"], 56.79, abs_tol=0.01)
    assert metrics["bias"] == 17.50
    assert metrics["nmae"] == 0.2500
    assert metrics["p50"] == 35.00


def test_empty_dataframe_metrics():
    """Verify empty dataframe returns zeroed metrics without crashing."""
    empty_df = pd.DataFrame(columns=["forecast", "actual", "error"])
    metrics = compute_metrics(empty_df)

    assert metrics["n"] == 0
    assert metrics["mae"] == 0.0
    assert metrics["rmse"] == 0.0
    assert metrics["bias"] == 0.0


def test_compute_hourly_metrics(hand_computed_df):
    """Hourly breakdown separates hours 10 and 11 and fills empty hours with 0."""
    hourly = compute_hourly_metrics(hand_computed_df)
    assert len(hourly) == 24

    h10 = next(h for h in hourly if h["hour"] == 10)
    assert h10["n"] == 2
    # Errors for h10: [20, -50] -> MAE = 35.0, Bias = -15.0
    assert h10["mae"] == 35.00
    assert h10["bias"] == -15.00

    h11 = next(h for h in hourly if h["hour"] == 11)
    assert h11["n"] == 2
    # Errors for h11: [0, 100] -> MAE = 50.0, Bias = 50.0
    assert h11["mae"] == 50.00
    assert h11["bias"] == 50.00


def test_compute_buffer_guidance(hand_computed_df):
    """Buffer guidance quantiles non-negative shortfalls per hour."""
    buffer_rows = compute_buffer_guidance(hand_computed_df)
    assert len(buffer_rows) == 24

    h10 = next(b for b in buffer_rows if b["hour"] == 10)
    # Shortfalls for h10: max(20, 0) = 20; max(-50, 0) = 0
    assert h10["n"] == 2
    assert h10["meanOverForecast"] == 10.0
    assert h10["maxShortfall"] == 20.0
    assert h10["bufferP90"] > 0

    h11 = next(b for b in buffer_rows if b["hour"] == 11)
    # Shortfalls for h11: max(0, 0) = 0; max(100, 0) = 100
    assert h11["n"] == 2
    assert h11["meanOverForecast"] == 50.0
    assert h11["maxShortfall"] == 100.0


def test_compute_horizon_metrics():
    """Horizon binning groups forecast lead times into appropriate buckets."""
    t0 = pd.Timestamp("2026-01-05 12:00:00", tz="UTC")

    fc = pd.DataFrame(
        [
            # 3 hours lead time -> bin 0-6h
            {"startTime": t0, "publishTime": t0 - pd.Timedelta(hours=3), "generation": 100},
            # 10 hours lead time -> bin 6-12h
            {"startTime": t0, "publishTime": t0 - pd.Timedelta(hours=10), "generation": 120},
            # 20 hours lead time -> bin 18-24h
            {"startTime": t0, "publishTime": t0 - pd.Timedelta(hours=20), "generation": 140},
        ]
    )
    act = pd.DataFrame([{"startTime": t0, "generation": 100}])

    horizon_results = compute_horizon_metrics(fc, act)
    bin_dict = {r["binLabel"]: r for r in horizon_results}

    assert bin_dict["0-6h"]["n"] == 1
    assert bin_dict["0-6h"]["mae"] == 0.0  # 100 - 100 = 0

    assert bin_dict["6-12h"]["n"] == 1
    assert bin_dict["6-12h"]["mae"] == 20.0  # 120 - 100 = 20

    assert bin_dict["18-24h"]["n"] == 1
    assert bin_dict["18-24h"]["mae"] == 40.0  # 140 - 100 = 40

    assert bin_dict["12-18h"]["n"] == 0

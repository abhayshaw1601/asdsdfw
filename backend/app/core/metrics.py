"""Forecast accuracy metrics, hourly breakdowns, horizon curves, and buffer sizing.

Metrics definitions:
- error = forecast - actual (MW)
- MAE = mean(|error|)
- RMSE = sqrt(mean(error^2))
- Bias = mean(error) (positive = over-forecast / shortfall risk)
- nMAE = MAE / mean(actual) (normalized MAE)
- P50, P90, P95 = empirical quantiles of absolute error |error|
- Buffer guidance: quantile q of max(error, 0) per hour-of-day for over-forecast shortfall risk
"""

from typing import Any, Optional

import numpy as np
import pandas as pd


def compute_metrics(merged_df: pd.DataFrame) -> dict[str, Any]:
    """Compute overall summary forecast accuracy metrics.

    Args:
        merged_df: DataFrame containing at least 'forecast', 'actual', and 'error'.

    Returns:
        dict with n, mae, rmse, bias, nmae, p50, p90, p95.
    """
    valid = merged_df.dropna(subset=["error"]).copy()
    if valid.empty:
        return {
            "n": 0,
            "mae": 0.0,
            "rmse": 0.0,
            "bias": 0.0,
            "nmae": 0.0,
            "p50": 0.0,
            "p90": 0.0,
            "p95": 0.0,
        }

    err = valid["error"]
    abs_err = err.abs()
    act = valid["actual"]

    mae = float(abs_err.mean())
    rmse = float(np.sqrt((err**2).mean()))
    bias = float(err.mean())
    actual_mean = float(act.mean())
    nmae = float(mae / actual_mean) if actual_mean > 0 else 0.0

    p50 = float(abs_err.quantile(0.50))
    p90 = float(abs_err.quantile(0.90))
    p95 = float(abs_err.quantile(0.95))

    return {
        "n": int(len(valid)),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "bias": round(bias, 2),
        "nmae": round(nmae, 4),
        "p50": round(p50, 2),
        "p90": round(p90, 2),
        "p95": round(p95, 2),
    }


def compute_hourly_metrics(merged_df: pd.DataFrame) -> list[dict[str, Any]]:
    """Compute metrics broken down by local hour of day (0-23).

    Args:
        merged_df: DataFrame containing 'localHour', 'error', 'forecast', 'actual'.

    Returns:
        list of dicts, one for each hour 0-23.
    """
    valid = merged_df.dropna(subset=["error"]).copy()
    if valid.empty:
        return []

    results = []
    for hour in range(24):
        subset = valid[valid["localHour"] == hour]
        if subset.empty:
            results.append(
                {
                    "hour": hour,
                    "n": 0,
                    "mae": 0.0,
                    "rmse": 0.0,
                    "bias": 0.0,
                }
            )
            continue

        err = subset["error"]
        mae = float(err.abs().mean())
        rmse = float(np.sqrt((err**2).mean()))
        bias = float(err.mean())

        results.append(
            {
                "hour": hour,
                "n": int(len(subset)),
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "bias": round(bias, 2),
            }
        )

    return results


def compute_horizon_metrics(
    all_forecasts_df: pd.DataFrame,
    actuals_df: pd.DataFrame,
    bins: Optional[list[float]] = None,
    bin_labels: Optional[list[str]] = None,
) -> list[dict[str, Any]]:
    """Compute accuracy across forecast lead time horizon bins using ALL forecasts.

    Lead time: horizonHours = (startTime - publishTime) in hours.
    Default bins: [0, 6, 12, 18, 24, 36, 48, 72].
    """
    if bins is None:
        bins = [0.0, 6.0, 12.0, 18.0, 24.0, 36.0, 48.0, 72.0]
    if bin_labels is None:
        bin_labels = ["0-6h", "6-12h", "12-18h", "18-24h", "24-36h", "36-48h", "48-72h"]

    fc = all_forecasts_df.copy()
    act = actuals_df.copy()

    if fc["startTime"].dt.tz is None:
        fc["startTime"] = pd.to_datetime(fc["startTime"], utc=True)
    if fc["publishTime"].dt.tz is None:
        fc["publishTime"] = pd.to_datetime(fc["publishTime"], utc=True)
    if act["startTime"].dt.tz is None:
        act["startTime"] = pd.to_datetime(act["startTime"], utc=True)

    fc["horizonHours"] = (fc["startTime"] - fc["publishTime"]).dt.total_seconds() / 3600.0

    # Filter to positive lead times within the max bin boundary
    fc = fc[(fc["horizonHours"] >= bins[0]) & (fc["horizonHours"] <= bins[-1])]

    merged = pd.merge(
        fc[["startTime", "publishTime", "generation", "horizonHours"]],
        act[["startTime", "generation"]].rename(columns={"generation": "actual"}),
        on="startTime",
        how="inner",
    )
    merged = merged.rename(columns={"generation": "forecast"})
    merged["error"] = merged["forecast"] - merged["actual"]

    merged["bin"] = pd.cut(
        merged["horizonHours"],
        bins=bins,
        labels=bin_labels,
        right=False,
        include_lowest=True,
    )

    results = []
    for label in bin_labels:
        subset = merged[merged["bin"] == label]
        if subset.empty:
            results.append(
                {
                    "binLabel": label,
                    "n": 0,
                    "mae": 0.0,
                    "rmse": 0.0,
                    "bias": 0.0,
                }
            )
            continue

        err = subset["error"]
        mae = float(err.abs().mean())
        rmse = float(np.sqrt((err**2).mean()))
        bias = float(err.mean())

        results.append(
            {
                "binLabel": label,
                "n": int(len(subset)),
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "bias": round(bias, 2),
            }
        )

    return results


def compute_buffer_guidance(merged_df: pd.DataFrame) -> list[dict[str, Any]]:
    """Compute empirical safety buffer guidance per local hour of day.

    Over-forecast shortfall: max(error, 0) in MW.
    Buffer sizing represents the additional power procurement needed to cover
    over-forecast risk at P90 and P95 confidence.
    """
    valid = merged_df.dropna(subset=["error"]).copy()
    if valid.empty:
        return []

    # Over-forecast shortfall is non-negative
    valid["shortfall"] = valid["error"].clip(lower=0.0)

    results = []
    for hour in range(24):
        subset = valid[valid["localHour"] == hour]
        if subset.empty:
            results.append(
                {
                    "hour": hour,
                    "n": 0,
                    "bufferP90": 0.0,
                    "bufferP95": 0.0,
                    "meanOverForecast": 0.0,
                    "maxShortfall": 0.0,
                }
            )
            continue

        shortfalls = subset["shortfall"]
        p90 = float(shortfalls.quantile(0.90))
        p95 = float(shortfalls.quantile(0.95))
        mean_val = float(shortfalls.mean())
        max_val = float(shortfalls.max())

        results.append(
            {
                "hour": hour,
                "n": int(len(subset)),
                "bufferP90": round(p90, 2),
                "bufferP95": round(p95, 2),
                "meanOverForecast": round(mean_val, 2),
                "maxShortfall": round(max_val, 2),
            }
        )

    return results

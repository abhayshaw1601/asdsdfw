"""Decision-time forecast selection logic with strict no-lookahead guarantee.

For each delivery day D, day-ahead purchase decisions freeze at a deadline (default: 09:00 D-1 London).
This module selects, for each target half-hour, the most recent forecast published at or before that deadline.
"""

from datetime import date
from typing import Optional

import pandas as pd

from backend.app.core.timeutil import deadline_utc


def select_decision_forecasts(
    forecasts_df: pd.DataFrame,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    deadline_hour: int = 9,
    tz: str = "Europe/London",
) -> pd.DataFrame:
    """Select the latest forecast for each target startTime available at decision deadline.

    Guarantee:
        No forecast with publishTime > deadline(day(startTime)) is EVER selected.

    Args:
        forecasts_df: DataFrame containing at least ['startTime', 'publishTime', 'generation'].
        start_date: Inclusive start delivery date (Europe/London date).
        end_date: Inclusive end delivery date (Europe/London date).
        deadline_hour: Local hour on D-1 for the decision deadline (0-23, default 9).
        tz: Timezone string for delivery day and deadline (default "Europe/London").

    Returns:
        pd.DataFrame: Selected decision-time forecasts with columns:
            ['startTime', 'deliveryDate', 'publishTime', 'deadlineUtc', 'forecast', 'horizonHours']
    """
    if forecasts_df.empty:
        return pd.DataFrame(
            columns=[
                "startTime",
                "deliveryDate",
                "publishTime",
                "deadlineUtc",
                "forecast",
                "horizonHours",
            ]
        )

    df = forecasts_df.copy()

    # Ensure UTC tz-aware
    if df["startTime"].dt.tz is None:
        df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    if df["publishTime"].dt.tz is None:
        df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)

    # Determine delivery date D in Europe/London
    df["deliveryDate"] = df["startTime"].dt.tz_convert(tz).dt.date

    # Filter to requested delivery date range if provided
    if start_date is not None:
        df = df[df["deliveryDate"] >= start_date]
    if end_date is not None:
        df = df[df["deliveryDate"] <= end_date]

    if df.empty:
        return pd.DataFrame(
            columns=[
                "startTime",
                "deliveryDate",
                "publishTime",
                "deadlineUtc",
                "forecast",
                "horizonHours",
            ]
        )

    # Map each unique delivery date to its UTC deadline timestamp
    unique_dates = df["deliveryDate"].unique()
    deadline_map = {d: deadline_utc(d, hour=deadline_hour, tz=tz) for d in unique_dates}
    df["deadlineUtc"] = df["deliveryDate"].map(deadline_map)

    # STRICT NO-LOOKAHEAD FILTER: Keep only forecasts published at or before deadline
    eligible = df[df["publishTime"] <= df["deadlineUtc"]].copy()

    if eligible.empty:
        return pd.DataFrame(
            columns=[
                "startTime",
                "deliveryDate",
                "publishTime",
                "deadlineUtc",
                "forecast",
                "horizonHours",
            ]
        )

    # For each target startTime, select the latest forecast published at or before the deadline
    # Sort by startTime and publishTime ascending, then take the last row per startTime
    eligible = eligible.sort_values(by=["startTime", "publishTime"])
    selected = eligible.groupby("startTime", as_index=False).last()

    # Calculate lead horizon in hours: (target startTime - publishTime)
    selected["horizonHours"] = (
        (selected["startTime"] - selected["publishTime"]).dt.total_seconds() / 3600.0
    ).round(2)

    selected = selected.rename(columns={"generation": "forecast"})

    return (
        selected[
            [
                "startTime",
                "deliveryDate",
                "publishTime",
                "deadlineUtc",
                "forecast",
                "horizonHours",
            ]
        ]
        .sort_values("startTime")
        .reset_index(drop=True)
    )


def merge_decision_with_actuals(
    decision_df: pd.DataFrame, actuals_df: pd.DataFrame, tz: str = "Europe/London"
) -> pd.DataFrame:
    """Merge selected decision-time forecasts with actual generation.

    Computes:
        error = forecast - actual (MW)
        Positive error = over-forecast (trader under-buys in day-ahead market, facing shortfall).
        Negative error = under-forecast (trader over-buys in day-ahead market, facing spill/imbalance).

    Returns:
        pd.DataFrame containing:
            ['startTime', 'deliveryDate', 'localHour', 'forecast', 'actual',
             'publishTime', 'deadlineUtc', 'horizonHours', 'error']
    """
    if decision_df.empty:
        return pd.DataFrame(
            columns=[
                "startTime",
                "deliveryDate",
                "localHour",
                "forecast",
                "actual",
                "publishTime",
                "deadlineUtc",
                "horizonHours",
                "error",
            ]
        )

    act = actuals_df.copy()
    if act["startTime"].dt.tz is None:
        act["startTime"] = pd.to_datetime(act["startTime"], utc=True)

    act = act.rename(columns={"generation": "actual"})

    merged = pd.merge(decision_df, act[["startTime", "actual"]], on="startTime", how="left")

    merged["localHour"] = merged["startTime"].dt.tz_convert(tz).dt.hour
    merged["error"] = merged["forecast"] - merged["actual"]

    return (
        merged[
            [
                "startTime",
                "deliveryDate",
                "localHour",
                "forecast",
                "actual",
                "publishTime",
                "deadlineUtc",
                "horizonHours",
                "error",
            ]
        ]
        .sort_values("startTime")
        .reset_index(drop=True)
    )

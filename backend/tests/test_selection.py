"""Unit tests for selection module and no-lookahead guarantee."""

from datetime import date

import pandas as pd
import pytest

from backend.app.core.selection import merge_decision_with_actuals, select_decision_forecasts


@pytest.fixture
def sample_forecasts():
    """Create a controlled fixture of forecasts for target 2026-01-05 12:00:00 UTC.

    Delivery day: 2026-01-05
    Deadline (09:00 London on D-1): 2026-01-04 09:00:00 UTC
    """
    target = pd.Timestamp("2026-01-05 12:00:00", tz="UTC")
    rows = [
        # 1. Very early forecast (eligible)
        {
            "startTime": target,
            "publishTime": pd.Timestamp("2026-01-03 12:00:00", tz="UTC"),
            "generation": 1000,
        },
        # 2. Latest forecast BEFORE deadline (eligible, should be selected)
        {
            "startTime": target,
            "publishTime": pd.Timestamp("2026-01-04 08:30:00", tz="UTC"),
            "generation": 1200,
        },
        # 3. Forecast published exactly AT deadline (eligible)
        {
            "startTime": target,
            "publishTime": pd.Timestamp("2026-01-04 09:00:00", tz="UTC"),
            "generation": 1250,
        },
        # 4. Forecast published 1 minute AFTER deadline (LOOKAHEAD - MUST NEVER BE SELECTED)
        {
            "startTime": target,
            "publishTime": pd.Timestamp("2026-01-04 09:01:00", tz="UTC"),
            "generation": 1500,
        },
        # 5. Near-delivery forecast (LOOKAHEAD - MUST NEVER BE SELECTED)
        {
            "startTime": target,
            "publishTime": pd.Timestamp("2026-01-05 10:00:00", tz="UTC"),
            "generation": 1800,
        },
    ]
    return pd.DataFrame(rows)


def test_no_lookahead_guarantee(sample_forecasts):
    """PROVE NO-LOOKAHEAD: Forecasts published after deadline are NEVER selected."""
    selected = select_decision_forecasts(sample_forecasts, deadline_hour=9)

    assert len(selected) == 1
    chosen = selected.iloc[0]

    # Must be the forecast at 09:00:00 UTC (1250 MW), NOT 1500 MW (09:01) or 1800 MW (10:00 D)
    assert chosen["forecast"] == 1250
    assert chosen["publishTime"] <= chosen["deadlineUtc"]
    assert chosen["publishTime"] == pd.Timestamp("2026-01-04 09:00:00", tz="UTC")


def test_no_lookahead_when_deadline_is_strict():
    """If the latest eligible forecast was at 08:30, 08:30 is selected and 09:01 is rejected."""
    target = pd.Timestamp("2026-01-05 12:00:00", tz="UTC")
    rows = [
        {
            "startTime": target,
            "publishTime": pd.Timestamp("2026-01-04 08:30:00", tz="UTC"),
            "generation": 1200,
        },
        {
            "startTime": target,
            "publishTime": pd.Timestamp("2026-01-04 09:01:00", tz="UTC"),
            "generation": 9999,
        },
    ]
    df = pd.DataFrame(rows)
    selected = select_decision_forecasts(df, deadline_hour=9)

    assert len(selected) == 1
    assert selected.iloc[0]["forecast"] == 1200
    assert selected.iloc[0]["publishTime"] < selected.iloc[0]["deadlineUtc"]


def test_no_eligible_forecast_dropped():
    """If all forecasts for a target were published after the deadline, target is omitted."""
    target = pd.Timestamp("2026-01-05 12:00:00", tz="UTC")
    rows = [
        {
            "startTime": target,
            "publishTime": pd.Timestamp("2026-01-04 10:00:00", tz="UTC"),
            "generation": 2000,
        },
        {
            "startTime": target,
            "publishTime": pd.Timestamp("2026-01-05 06:00:00", tz="UTC"),
            "generation": 2200,
        },
    ]
    df = pd.DataFrame(rows)
    selected = select_decision_forecasts(df, deadline_hour=9)

    assert selected.empty


def test_date_range_filtering():
    """Delivery date filters correctly include only targets within start_date and end_date."""
    rows = [
        # Target Jan 4
        {
            "startTime": pd.Timestamp("2026-01-04 12:00:00", tz="UTC"),
            "publishTime": pd.Timestamp("2026-01-03 08:00:00", tz="UTC"),
            "generation": 500,
        },
        # Target Jan 5
        {
            "startTime": pd.Timestamp("2026-01-05 12:00:00", tz="UTC"),
            "publishTime": pd.Timestamp("2026-01-04 08:00:00", tz="UTC"),
            "generation": 600,
        },
        # Target Jan 6
        {
            "startTime": pd.Timestamp("2026-01-06 12:00:00", tz="UTC"),
            "publishTime": pd.Timestamp("2026-01-05 08:00:00", tz="UTC"),
            "generation": 700,
        },
    ]
    df = pd.DataFrame(rows)

    selected = select_decision_forecasts(
        df, start_date=date(2026, 1, 5), end_date=date(2026, 1, 5), deadline_hour=9
    )

    assert len(selected) == 1
    assert selected.iloc[0]["deliveryDate"] == date(2026, 1, 5)
    assert selected.iloc[0]["forecast"] == 600


def test_merge_decision_with_actuals():
    """Correctly merges actuals, computes error = forecast - actual, and derives localHour."""
    target1 = pd.Timestamp("2026-01-05 14:00:00", tz="UTC")
    target2 = pd.Timestamp("2026-01-05 15:00:00", tz="UTC")

    decision = pd.DataFrame(
        [
            {
                "startTime": target1,
                "deliveryDate": date(2026, 1, 5),
                "publishTime": pd.Timestamp("2026-01-04 08:00:00", tz="UTC"),
                "deadlineUtc": pd.Timestamp("2026-01-04 09:00:00", tz="UTC"),
                "forecast": 1500,
                "horizonHours": 30.0,
            },
            {
                "startTime": target2,
                "deliveryDate": date(2026, 1, 5),
                "publishTime": pd.Timestamp("2026-01-04 08:00:00", tz="UTC"),
                "deadlineUtc": pd.Timestamp("2026-01-04 09:00:00", tz="UTC"),
                "forecast": 800,
                "horizonHours": 31.0,
            },
        ]
    )

    actuals = pd.DataFrame(
        [
            {"startTime": target1, "generation": 1200},  # Over-forecast: 1500 - 1200 = +300
            {"startTime": target2, "generation": 1000},  # Under-forecast: 800 - 1000 = -200
        ]
    )

    merged = merge_decision_with_actuals(decision, actuals)

    assert len(merged) == 2
    row1 = merged[merged["startTime"] == target1].iloc[0]
    row2 = merged[merged["startTime"] == target2].iloc[0]

    assert row1["error"] == 300
    assert row1["actual"] == 1200
    assert row1["localHour"] == 14

    assert row2["error"] == -200
    assert row2["actual"] == 1000
    assert row2["localHour"] == 15

"""Unit tests for timeutil module."""

from datetime import date, datetime

import pandas as pd

from backend.app.core.timeutil import deadline_utc, target_delivery_date, target_local_hour


def test_winter_deadline_utc():
    """In winter (GMT / UTC+0), 09:00 London on D-1 equals 09:00 UTC on D-1."""
    day = date(2026, 1, 15)
    dl = deadline_utc(day, hour=9)
    assert dl == pd.Timestamp("2026-01-14 09:00:00", tz="UTC")


def test_summer_dst_deadline_utc():
    """In summer (BST / UTC+1), 09:00 London on D-1 equals 08:00 UTC on D-1."""
    day = date(2026, 7, 15)
    dl = deadline_utc(day, hour=9)
    # July in London is BST (UTC+1), so 09:00 local is 08:00 UTC
    assert dl == pd.Timestamp("2026-07-14 08:00:00", tz="UTC")


def test_deadline_with_datetime_input():
    """Supports datetime input as well as date."""
    dt = datetime(2026, 1, 20, 14, 30)
    dl = deadline_utc(dt, hour=11)
    assert dl == pd.Timestamp("2026-01-19 11:00:00", tz="UTC")


def test_target_delivery_date_and_hour():
    """Verifies conversion from UTC to London delivery date and local hour."""
    # 2026-01-05 14:30:00 UTC
    ts = pd.Timestamp("2026-01-05 14:30:00", tz="UTC")
    assert target_delivery_date(ts) == date(2026, 1, 5)
    assert target_local_hour(ts) == 14

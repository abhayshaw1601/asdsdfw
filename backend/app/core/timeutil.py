"""Time and timezone utilities for UK day-ahead decision deadlines.

Auction gate closure convention:
For electricity delivery on day D, purchase decisions and orders are placed on D-1
at a configurable deadline hour (default: 09:00 Europe/London).
"""

from datetime import date, datetime, time, timedelta
from typing import Union

import pandas as pd


def deadline_utc(
    day: Union[date, datetime], hour: int = 9, tz: str = "Europe/London"
) -> pd.Timestamp:
    """Compute the decision deadline in UTC for a given delivery day.

    Args:
        day: The delivery date D (date or datetime).
        hour: The local hour on D-1 when the decision is frozen (default 9 = 09:00).
        tz: Local timezone (default "Europe/London").

    Returns:
        pd.Timestamp: Deadline timestamp localized to UTC.
    """
    if isinstance(day, datetime):
        delivery_date = day.date()
    else:
        delivery_date = day

    decision_date = delivery_date - timedelta(days=1)
    local_ts = pd.Timestamp(
        datetime.combine(decision_date, time(hour=hour, minute=0, second=0)), tz=tz
    )
    return local_ts.tz_convert("UTC")


def target_delivery_date(ts: pd.Timestamp, tz: str = "Europe/London") -> date:
    """Return the local delivery date (in Europe/London) for a target timestamp.

    Settlement period 1 starts at 23:00 UTC on D-1 in winter (00:00 London on day D),
    so delivery day is strictly evaluated in local time.
    """
    if ts.tz is None:
        ts = ts.tz_localize("UTC")
    return ts.tz_convert(tz).date()


def target_local_hour(ts: pd.Timestamp, tz: str = "Europe/London") -> int:
    """Return the local hour of the day (0-23) in Europe/London."""
    if ts.tz is None:
        ts = ts.tz_localize("UTC")
    return ts.tz_convert(tz).hour

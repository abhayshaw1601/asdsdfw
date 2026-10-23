"""Elexon BMRS data ingest script for FUELHH (WIND) and WINDFOR datasets.

Fetches:
1. Actual generation (FUELHH) for January 2026 (target half-hours 2026-01-01 to 2026-01-31).
2. Forecasted generation (WINDFOR) published between 2025-12-15 and 2026-02-01, filtered
   for target delivery times in January 2026.

Outputs saved as compressed CSVs in data/:
- data/actuals_wind.csv.gz
- data/forecasts_wind.csv.gz
"""

import logging
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ingest")

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def fetch_with_retry(
    url: str, params: dict[str, Any], max_retries: int = 5, backoff_factor: float = 1.5
) -> list[dict[str, Any]]:
    """Fetch JSON data from Elexon API with exponential backoff."""
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(url, params=params, timeout=30)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and "data" in data:
                    return data["data"]
                return []
            if response.status_code in (429, 500, 502, 503, 504):
                sleep_time = backoff_factor**attempt
                logger.warning(
                    f"HTTP {response.status_code} on attempt {attempt}/{max_retries}. "
                    f"Backing off {sleep_time:.1f}s..."
                )
                time.sleep(sleep_time)
            else:
                logger.error(f"HTTP {response.status_code}: {response.text[:200]}")
                response.raise_for_status()
        except (requests.RequestException, ValueError) as exc:
            if attempt == max_retries:
                logger.error(f"Max retries reached for {url} with {params}: {exc}")
                raise
            sleep_time = backoff_factor**attempt
            logger.warning(
                f"Error on attempt {attempt}/{max_retries}: {exc}. Backing off {sleep_time:.1f}s..."
            )
            time.sleep(sleep_time)
    return []


def ingest_actuals(
    start_date: date = date(2026, 1, 1),
    end_date: date = date(2026, 1, 31),
    chunk_days: int = 7,
) -> pd.DataFrame:
    """Fetch actual generation (FUELHH) where fuelType is WIND for January 2026."""
    logger.info(f"Ingesting FUELHH actuals from {start_date} to {end_date}...")
    url = f"{BASE_URL}/FUELHH/stream"
    records: list[dict[str, Any]] = []

    current_start = start_date
    while current_start <= end_date:
        current_end = min(current_start + timedelta(days=chunk_days - 1), end_date)
        params = {
            "settlementDateFrom": current_start.isoformat(),
            "settlementDateTo": current_end.isoformat(),
        }
        logger.info(
            f"Fetching FUELHH for dates {params['settlementDateFrom']} "
            f"to {params['settlementDateTo']}..."
        )
        chunk_data = fetch_with_retry(url, params)
        for row in chunk_data:
            if row.get("fuelType") == "WIND":
                records.append(
                    {
                        "startTime": row.get("startTime"),
                        "generation": row.get("generation"),
                    }
                )
        current_start = current_end + timedelta(days=1)

    if not records:
        raise ValueError("No FUELHH WIND records retrieved!")

    df = pd.DataFrame(records)
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")

    # Filter to exact Jan 2026 window
    jan_start = pd.Timestamp("2026-01-01 00:00:00", tz=timezone.utc)
    jan_end = pd.Timestamp("2026-01-31 23:30:00", tz=timezone.utc)
    df = df[(df["startTime"] >= jan_start) & (df["startTime"] <= jan_end)]

    # Dedupe on startTime, keep last
    df = df.drop_duplicates(subset=["startTime"], keep="last")
    df = df.sort_values(by="startTime").reset_index(drop=True)

    # Check for missing half-hours (expect 1488 in Jan 2026: 31 days * 48 periods)
    expected_index = pd.date_range(start=jan_start, end=jan_end, freq="30min", tz=timezone.utc)
    missing = expected_index.difference(df["startTime"])

    logger.info(
        f"Actuals count: {len(df)} rows. Expected: {len(expected_index)} rows (31 * 48 = 1488)."
    )
    if len(missing) > 0:
        logger.warning(f"Found {len(missing)} missing actuals half-hours: {missing[:5]}")
    else:
        logger.info("Complete actuals coverage: exactly 1488 half-hours present with zero gaps!")

    return df


def ingest_forecasts(
    pub_start: datetime = datetime(2025, 12, 15, 0, 0, tzinfo=timezone.utc),
    pub_end: datetime = datetime(2026, 2, 1, 0, 0, tzinfo=timezone.utc),
    chunk_days: int = 5,
) -> pd.DataFrame:
    """Fetch wind forecasts (WINDFOR) covering targets in January 2026."""
    logger.info(f"Ingesting WINDFOR forecasts published between {pub_start} and {pub_end}...")
    url = f"{BASE_URL}/WINDFOR/stream"
    records: list[dict[str, Any]] = []

    current_start = pub_start
    while current_start < pub_end:
        current_end = min(current_start + timedelta(days=chunk_days), pub_end)
        params = {
            "publishDateTimeFrom": current_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": current_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        logger.info(
            f"Fetching WINDFOR between {params['publishDateTimeFrom']} "
            f"and {params['publishDateTimeTo']}..."
        )
        chunk_data = fetch_with_retry(url, params)
        for row in chunk_data:
            records.append(
                {
                    "startTime": row.get("startTime"),
                    "publishTime": row.get("publishTime"),
                    "generation": row.get("generation"),
                }
            )
        current_start = current_end

    if not records:
        raise ValueError("No WINDFOR records retrieved!")

    df = pd.DataFrame(records)
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")

    # Filter to targets in January 2026
    jan_start = pd.Timestamp("2026-01-01 00:00:00", tz=timezone.utc)
    jan_end = pd.Timestamp("2026-01-31 23:30:00", tz=timezone.utc)
    df = df[(df["startTime"] >= jan_start) & (df["startTime"] <= jan_end)]

    # Dedupe on (startTime, publishTime)
    df = df.drop_duplicates(subset=["startTime", "publishTime"], keep="last")
    df = df.sort_values(by=["startTime", "publishTime"]).reset_index(drop=True)

    targets_covered = df["startTime"].nunique()
    logger.info(f"Forecasts count: {len(df)} rows across {targets_covered} unique January targets.")
    logger.info(f"Publish time range: {df['publishTime'].min()} to {df['publishTime'].max()}")

    return df


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    actuals_df = ingest_actuals()
    actuals_path = DATA_DIR / "actuals_wind.csv.gz"
    actuals_df.to_csv(actuals_path, index=False, compression="gzip")
    logger.info(f"Saved actuals to {actuals_path} ({actuals_path.stat().st_size / 1024:.1f} KB)")

    forecasts_df = ingest_forecasts()
    forecasts_path = DATA_DIR / "forecasts_wind.csv.gz"
    forecasts_df.to_csv(forecasts_path, index=False, compression="gzip")
    logger.info(
        f"Saved forecasts to {forecasts_path} ({forecasts_path.stat().st_size / 1024:.1f} KB)"
    )


if __name__ == "__main__":
    main()

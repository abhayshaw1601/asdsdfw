"""Live streaming data ingestion service connecting to Elexon BMRS API.
Fetches near real-time FUELHH (WIND) actual generation and WINDFOR generation forecasts,
merges into the DataStore cache and persists to MongoDB.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import pandas as pd
import requests

from backend.app.data_store import data_store
from backend.app.db.mongo import mongo_manager

logger = logging.getLogger("wind_portal.live_syncer")

ELEXON_BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"


def fetch_elexon_json(
    url: str, params: Dict[str, Any], timeout: int = 25, max_retries: int = 3
) -> List[Dict[str, Any]]:
    """Fetch JSON stream from Elexon BMRS with basic retry handling."""
    for attempt in range(1, max_retries + 1):
        try:
            resp = requests.get(url, params=params, timeout=timeout)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    return data
                if isinstance(data, dict) and "data" in data:
                    return data["data"]
                return []
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < max_retries:
                logger.warning(f"Elexon HTTP {resp.status_code} attempt {attempt}/{max_retries}. Retrying...")
                continue
            logger.error(f"Elexon HTTP {resp.status_code}: {resp.text[:200]}")
            return []
        except requests.RequestException as exc:
            if attempt < max_retries:
                logger.warning(f"Elexon request error attempt {attempt}/{max_retries}: {exc}")
                continue
            logger.error(f"Failed to fetch {url} after {max_retries} attempts: {exc}")
            return []
    return []


def fetch_live_actuals(start_date: date, end_date: date) -> pd.DataFrame:
    """Fetch actual generation (FUELHH) where fuelType is WIND for given dates."""
    url = f"{ELEXON_BASE_URL}/FUELHH/stream"
    params = {
        "settlementDateFrom": start_date.isoformat(),
        "settlementDateTo": end_date.isoformat(),
    }
    logger.info(f"Fetching live FUELHH actuals from {start_date} to {end_date}...")
    records = fetch_elexon_json(url, params)
    wind_records = []
    for row in records:
        if row.get("fuelType") == "WIND":
            wind_records.append(
                {
                    "startTime": row.get("startTime"),
                    "generation": row.get("generation"),
                }
            )

    if not wind_records:
        logger.warning(f"No FUELHH WIND records found for {start_date} to {end_date}")
        return pd.DataFrame(columns=["startTime", "generation"])

    df = pd.DataFrame(wind_records)
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    df = df.dropna(subset=["startTime", "generation"])
    df = df.drop_duplicates(subset=["startTime"], keep="last")
    return df.sort_values("startTime").reset_index(drop=True)


def fetch_live_forecasts(pub_from: datetime, pub_to: datetime) -> pd.DataFrame:
    """Fetch WINDFOR wind forecasts published within the specified time range."""
    url = f"{ELEXON_BASE_URL}/WINDFOR/stream"
    params = {
        "publishDateTimeFrom": pub_from.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "publishDateTimeTo": pub_to.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    logger.info(f"Fetching live WINDFOR forecasts published between {pub_from} and {pub_to}...")
    records = fetch_elexon_json(url, params)
    fc_records = []
    for row in records:
        fc_records.append(
            {
                "startTime": row.get("startTime"),
                "publishTime": row.get("publishTime"),
                "generation": row.get("generation"),
            }
        )

    if not fc_records:
        logger.warning(f"No WINDFOR records retrieved for {pub_from} to {pub_to}")
        return pd.DataFrame(columns=["startTime", "publishTime", "generation"])

    df = pd.DataFrame(fc_records)
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")
    df = df.dropna(subset=["startTime", "publishTime", "generation"])
    df = df.drop_duplicates(subset=["startTime", "publishTime"], keep="last")
    return df.sort_values(["startTime", "publishTime"]).reset_index(drop=True)


class LiveDataService:
    """Coordinates live ingestion, synchronization, and telemetry tracking."""

    def __init__(self):
        self.last_sync_time: Optional[datetime] = None
        self.last_sync_status: str = "idle"
        self.last_error: Optional[str] = None
        self.synced_actuals_count: int = 0
        self.synced_forecasts_count: int = 0

    def sync_rolling_window(self, days: int = 3) -> Dict[str, Any]:
        """Fetch rolling actuals and forecasts up to current real-time UTC."""
        now = datetime.now(timezone.utc)
        today = now.date()
        start_date = today - timedelta(days=days)

        try:
            self.last_sync_status = "syncing"
            logger.info(f"Starting rolling live sync for {days} days ({start_date} to {today})...")

            # 1. Fetch live actuals
            act_df = fetch_live_actuals(start_date, today)

            # 2. Fetch live forecasts published across the window (allow published earlier for target dates)
            pub_start = now - timedelta(days=days + 2)
            fc_df = fetch_live_forecasts(pub_start, now)

            # 3. Merge into in-memory DataStore
            data_store.merge_live_data(act_df, fc_df)

            # 4. Persist newly fetched live data to MongoDB if connected
            if mongo_manager.is_connected and mongo_manager._db is not None:
                try:
                    if not act_df.empty:
                        act_docs = [
                            {"startTime": row["startTime"].isoformat(), "generation": float(row["generation"])}
                            for _, row in act_df.iterrows()
                        ]
                        for doc in act_docs:
                            mongo_manager._db.actuals.update_one(
                                {"startTime": doc["startTime"]}, {"$set": doc}, upsert=True
                            )

                    if not fc_df.empty:
                        fc_docs = [
                            {
                                "startTime": row["startTime"].isoformat(),
                                "publishTime": row["publishTime"].isoformat(),
                                "generation": float(row["generation"]),
                            }
                            for _, row in fc_df.iterrows()
                        ]
                        for doc in fc_docs:
                            mongo_manager._db.forecasts.update_one(
                                {"startTime": doc["startTime"], "publishTime": doc["publishTime"]},
                                {"$set": doc},
                                upsert=True,
                            )
                except Exception as db_exc:
                    logger.warning(f"MongoDB persistence warning during live sync: {db_exc}")

            self.last_sync_time = now
            self.last_sync_status = "success"
            self.last_error = None
            self.synced_actuals_count = len(act_df)
            self.synced_forecasts_count = len(fc_df)

            return {
                "status": "success",
                "synced_at": now.isoformat(),
                "actuals_fetched": len(act_df),
                "forecasts_fetched": len(fc_df),
                "min_date": str(data_store.min_date),
                "max_date": str(data_store.max_date),
                "total_actuals_in_store": len(data_store.actuals_df),
                "total_forecasts_in_store": len(data_store.forecasts_df),
            }
        except Exception as exc:
            self.last_sync_status = "error"
            self.last_error = str(exc)
            logger.error(f"Live sync failed: {exc}", exc_info=True)
            return {
                "status": "error",
                "message": str(exc),
                "synced_at": now.isoformat(),
            }

    def get_telemetry(self) -> Dict[str, Any]:
        """Return status telemetry for live data service."""
        latest_act_time = None
        if not data_store.actuals_df.empty:
            latest_act_time = data_store.actuals_df["startTime"].max().isoformat()

        return {
            "service": "Elexon BMRS Live Streamer",
            "last_sync_status": self.last_sync_status,
            "last_sync_time": self.last_sync_time.isoformat() if self.last_sync_time else None,
            "last_error": self.last_error,
            "min_date": str(data_store.min_date) if data_store.min_date else None,
            "max_date": str(data_store.max_date) if data_store.max_date else None,
            "latest_outturn_time": latest_act_time,
            "actuals_in_store": len(data_store.actuals_df),
            "forecasts_in_store": len(data_store.forecasts_df),
            "is_live_enabled": True,
        }


# Global singleton
live_service = LiveDataService()

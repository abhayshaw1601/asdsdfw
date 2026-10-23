"""In-memory data store for actuals and forecast snapshots.

Loads compressed CSVs once on startup/import for sub-millisecond API queries.
"""

import logging
from datetime import date
from pathlib import Path
from typing import Optional

import pandas as pd

from backend.app.config import settings

logger = logging.getLogger("data_store")


class DataStore:
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or settings.data_dir
        self.actuals_df = pd.DataFrame()
        self.forecasts_df = pd.DataFrame()
        self.min_date: Optional[date] = None
        self.max_date: Optional[date] = None
        self.load_data()

    def load_data(self) -> None:
        """Load and cache actuals and forecasts from compressed CSVs."""
        actuals_file = self.data_dir / "actuals_wind.csv.gz"
        forecasts_file = self.data_dir / "forecasts_wind.csv.gz"

        if not actuals_file.exists() or not forecasts_file.exists():
            logger.warning(
                f"Data files not found in {self.data_dir}. Run fetch_elexon.py to populate."
            )
            return

        logger.info(f"Loading data snapshots from {self.data_dir}...")
        act = pd.read_csv(actuals_file)
        fc = pd.read_csv(forecasts_file)

        act["startTime"] = pd.to_datetime(act["startTime"], utc=True)
        fc["startTime"] = pd.to_datetime(fc["startTime"], utc=True)
        fc["publishTime"] = pd.to_datetime(fc["publishTime"], utc=True)

        act = act.sort_values("startTime").reset_index(drop=True)
        fc = fc.sort_values(["startTime", "publishTime"]).reset_index(drop=True)

        self.actuals_df = act
        self.forecasts_df = fc

        # Compute available date boundaries in Europe/London
        london_dates = act["startTime"].dt.tz_convert("Europe/London").dt.date
        self.min_date = london_dates.min()
        self.max_date = london_dates.max()

        logger.info(
            f"Loaded {len(act)} actuals and {len(fc)} forecasts. Date range: {self.min_date} to {self.max_date}."
        )


# Global singleton instance
data_store = DataStore()

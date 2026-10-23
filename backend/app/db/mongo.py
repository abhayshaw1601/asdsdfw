"""MongoDB database connector and persistence layer for dataset and user credentials.
Provides resilient connectivity with automatic graceful in-memory fallback.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger("wind_portal.db.mongo")

# Try importing pymongo; gracefully handle if not installed
try:
    from pymongo import ASCENDING, MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False
    MongoClient = None
    ASCENDING = 1


class MongoManager:
    """Manages MongoDB connections for credentials and dataset storage."""

    def __init__(self, uri: Optional[str] = None, db_name: str = "wind_portal"):
        self.uri = uri or os.getenv("MONGO_URI", "mongodb://localhost:27017/wind_portal")
        self.db_name = db_name
        self._client: Optional[Any] = None
        self._db: Optional[Any] = None
        self._is_connected: bool = False

        # In-memory fallback stores for when MongoDB is unreachable
        self._fallback_users: Dict[str, Dict[str, Any]] = {}
        self._fallback_meta: Dict[str, Any] = {
            "sync_time": None,
            "actuals_count": 0,
            "forecasts_count": 0,
        }

        self.connect()

    def connect(self) -> bool:
        """Attempt connection to MongoDB with low timeout."""
        if not PYMONGO_AVAILABLE:
            logger.info("pymongo not available; running in in-memory fallback mode.")
            self._is_connected = False
            return False

        try:
            # Short 2-second timeout so app never hangs if MongoDB is unavailable
            self._client = MongoClient(self.uri, serverSelectionTimeoutMS=2000, connectTimeoutMS=2000)
            # Force server check
            self._client.admin.command("ping")
            self._db = self._client.get_default_database()
            if self._db is None or self._db.name == "admin":
                self._db = self._client[self.db_name]

            # Ensure unique index on user email
            self._db.users.create_index([("email", ASCENDING)], unique=True)
            # Safely drop any legacy username_1 index that conflicts on null
            try:
                indexes = self._db.users.index_information()
                if "username_1" in indexes:
                    self._db.users.drop_index("username_1")
            except Exception:
                pass

            self._is_connected = True
            logger.info(f"Connected to MongoDB at {self.uri.split('@')[-1]}")
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as exc:
            logger.warning(f"MongoDB connection unavailable ({exc}); using resilient in-memory storage.")
            self._is_connected = False
            self._db = None
            return False

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    # ==========================================
    # USER CREDENTIAL OPERATIONS
    # ==========================================

    def create_user(self, user_doc: Dict[str, Any]) -> Dict[str, Any]:
        """Save a new user document. Raises ValueError if email already exists."""
        email = user_doc["email"].strip().lower()
        clean_doc = dict(user_doc)
        clean_doc["email"] = email
        clean_doc.setdefault("username", email)
        clean_doc.setdefault("created_at", datetime.now(timezone.utc).isoformat())
        clean_doc.setdefault("role", "trader")

        if self.is_connected and self._db is not None:
            # Check existing
            if self._db.users.find_one({"email": email}):
                raise ValueError(f"User with email '{email}' already exists.")
            try:
                res = self._db.users.insert_one(clean_doc)
                clean_doc["_id"] = str(res.inserted_id)
                return clean_doc
            except Exception as exc:
                if "duplicate key" in str(exc).lower() or "11000" in str(exc):
                    raise ValueError(f"User with email '{email}' already exists.") from exc
                raise

        # In-memory fallback
        if email in self._fallback_users:
            raise ValueError(f"User with email '{email}' already exists.")
        clean_doc["_id"] = f"mem_{len(self._fallback_users) + 1}"
        self._fallback_users[email] = clean_doc
        return clean_doc

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Find a user by email."""
        clean_email = email.strip().lower()
        if self.is_connected and self._db is not None:
            user = self._db.users.find_one({"email": clean_email})
            if user:
                user["_id"] = str(user["_id"])
            return user
        return self._fallback_users.get(clean_email)

    def list_users(self) -> List[Dict[str, Any]]:
        """List registered users (without password hashes)."""
        if self.is_connected and self._db is not None:
            cursor = self._db.users.find({}, {"password_hash": 0})
            out = []
            for doc in cursor:
                doc["_id"] = str(doc["_id"])
                out.append(doc)
            return out
        return [
            {k: v for k, v in u.items() if k != "password_hash"}
            for u in self._fallback_users.values()
        ]

    # ==========================================
    # DATASET STATUS & SYNC OPERATIONS
    # ==========================================

    def get_dataset_status(self) -> Dict[str, Any]:
        """Return dataset storage metrics from MongoDB or fallback."""
        if self.is_connected and self._db is not None:
            actuals_count = self._db.actuals.count_documents({})
            forecasts_count = self._db.forecasts.count_documents({})
            users_count = self._db.users.count_documents({})
            return {
                "engine": "mongodb",
                "connected": True,
                "database": self._db.name,
                "usersCount": users_count,
                "actualsCount": actuals_count,
                "forecastsCount": forecasts_count,
            }
        return {
            "engine": "in-memory-fallback",
            "connected": False,
            "database": "volatile",
            "usersCount": len(self._fallback_users),
            "actualsCount": self._fallback_meta["actuals_count"],
            "forecastsCount": self._fallback_meta["forecasts_count"],
        }


# Global singleton instance
mongo_manager = MongoManager()

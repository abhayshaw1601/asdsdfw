"""Unit and integration tests for live Elexon streaming routes and synchronization."""

from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_get_live_status():
    """Verify GET /api/v1/live/status returns expected telemetry fields."""
    resp = client.get("/api/v1/live/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "service" in data
    assert "last_sync_status" in data
    assert data["is_live_enabled"] is True


def test_get_dataset_bounds():
    """Verify GET /api/v1/live/bounds returns minDate and maxDate."""
    resp = client.get("/api/v1/live/bounds")
    assert resp.status_code == 200
    data = resp.json()
    assert "minDate" in data
    assert "maxDate" in data
    assert data["totalActuals"] > 0


def test_fetch_range_validation_errors():
    """Verify date range validation rejects invalid dates or inverted ranges."""
    # Invalid date format
    resp = client.post("/api/v1/live/fetch-range", json={"startDate": "invalid", "endDate": "2026-01-05"})
    assert resp.status_code == 400

    # Start date after end date
    resp = client.post("/api/v1/live/fetch-range", json={"startDate": "2026-02-10", "endDate": "2026-02-05"})
    assert resp.status_code == 400


@patch("backend.app.api.live_routes.live_service.sync_rolling_window")
def test_sync_live_stream_endpoint(mock_sync):
    """Verify POST /api/v1/live/sync delegates to live_service."""
    mock_sync.return_value = {
        "status": "success",
        "synced_at": "2026-10-23T18:00:00Z",
        "actuals_fetched": 48,
        "forecasts_fetched": 120,
    }
    resp = client.post("/api/v1/live/sync", json={"days": 2})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["actuals_fetched"] == 48

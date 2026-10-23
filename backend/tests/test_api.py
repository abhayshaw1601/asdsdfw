"""API integration tests for all endpoints and validation error handling."""

from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify health check returns status ok."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Wind Forecast Decision Portal" in data["app"]


def test_docs_reachable():
    """Verify OpenAPI documentation is reachable at /docs and schema at /openapi.json."""
    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 200

    schema_resp = client.get("/openapi.json")
    assert schema_resp.status_code == 200
    assert "paths" in schema_resp.json()


def test_metadata_endpoint():
    """Verify dataset metadata matches January 2026 bounds."""
    response = client.get("/api/v1/metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["minDate"] == "2026-01-01"
    assert data["maxDate"] == "2026-01-31"
    assert data["actualsCount"] == 1488
    assert data["forecastsCount"] == 18080
    assert data["defaultDeadlineHour"] == 9


def test_decision_endpoint_valid():
    """Verify daily decision endpoint returns correct points and summary for Jan 15."""
    response = client.get("/api/v1/decision?day=2026-01-15&deadline_hour=9")
    assert response.status_code == 200
    data = response.json()
    assert data["day"] == "2026-01-15"
    assert "D-1 at 09:00 Europe/London" in data["deadlineLocal"]
    assert len(data["points"]) == 24  # 24 hourly targets
    assert data["summary"]["meanForecastMw"] > 0
    assert data["summary"]["maxForecastMw"] >= data["summary"]["minForecastMw"]


def test_decision_invalid_deadline_hour():
    """Validation: deadline_hour > 23 returns 422."""
    response = client.get("/api/v1/decision?day=2026-01-15&deadline_hour=25")
    assert response.status_code == 422


def test_series_endpoint():
    """Verify range series retrieval."""
    response = client.get(
        "/api/v1/series?start_date=2026-01-01&end_date=2026-01-03&deadline_hour=9"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 72  # 3 days * 24 hours
    assert len(data["points"]) == 72


def test_series_invalid_date_range():
    """Validation: start_date > end_date returns 422."""
    response = client.get("/api/v1/series?start_date=2026-01-10&end_date=2026-01-05")
    assert response.status_code == 422


def test_api_metrics_equals_notebook_metrics():
    """CRITICAL CHECK: API metrics for default deadline exactly match notebook & baseline JSON."""
    response = client.get(
        "/api/v1/metrics?start_date=2026-01-01&end_date=2026-01-31&deadline_hour=9"
    )
    assert response.status_code == 200
    data = response.json()
    summary = data["summary"]

    # Exact equality check with reproducible baseline
    assert summary["n"] == 744
    assert summary["mae"] == 2127.48
    assert summary["rmse"] == 2606.07
    assert summary["bias"] == 1851.53
    assert summary["nmae"] == 0.1837
    assert summary["p50"] == 1758.50
    assert summary["p90"] == 4306.40
    assert summary["p95"] == 5350.90

    # Verify hourly breakdown exists for all 24 hours
    assert len(data["hourly"]) == 24


def test_horizon_endpoint():
    """Verify horizon binning endpoint returns all 7 standard bins."""
    response = client.get("/api/v1/horizon")
    assert response.status_code == 200
    data = response.json()
    assert "bins" in data
    assert len(data["bins"]) == 7
    bin_labels = [b["binLabel"] for b in data["bins"]]
    assert "0-6h" in bin_labels
    assert "48-72h" in bin_labels


def test_buffer_endpoint():
    """Verify buffer guidance returns rows for all 24 hours."""
    response = client.get(
        "/api/v1/buffer?start_date=2026-01-01&end_date=2026-01-31&deadline_hour=9&quantile=0.95"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["quantile"] == 0.95
    assert len(data["rows"]) == 24
    row_h12 = next(r for r in data["rows"] if r["hour"] == 12)
    assert row_h12["bufferMw"] > 0
    assert row_h12["bufferP95"] >= row_h12["bufferP90"]


def test_buffer_invalid_quantile():
    """Validation: quantile <= 0 or >= 1 returns 422."""
    resp1 = client.get("/api/v1/buffer?quantile=0.0")
    assert resp1.status_code == 422

    resp2 = client.get("/api/v1/buffer?quantile=1.0")
    assert resp2.status_code == 422

"""Unit tests for Groq AI chat and trader workstation routes."""

from __future__ import annotations

from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.app.auth.security import create_access_token
from backend.app.main import app

client = TestClient(app)


def get_test_token() -> str:
    """Generate a valid test JWT token."""
    return create_access_token({"sub": "trader@gridutility.co.uk", "name": "Senior Trader"})


def test_copilot_requires_auth():
    """Verify POST /api/v1/chat/completions requires valid Authorization header."""
    resp = client.post(
        "/api/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "What is tomorrow's wind?"}]},
    )
    assert resp.status_code == 401


@patch("backend.app.api.chat_routes.requests.post")
def test_copilot_generates_response(mock_post):
    """Verify POST /api/v1/chat/completions returns AI advice with mock Groq response."""
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {
        "choices": [{"message": {"content": "Tomorrow's thermal procurement requirement is 6,390 MW."}}],
        "usage": {"total_tokens": 42},
    }

    token = get_test_token()
    with patch.dict("os.environ", {"GROQ_API_KEY": "gsk_test_key_123"}):
        resp = client.post(
            "/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "messages": [{"role": "user", "content": "What is our thermal deficit?"}],
                "context": {"day": "2026-01-15", "meanForecastMw": 11610, "consumerDemandMw": 18000},
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "reply" in data
        assert "thermal procurement" in data["reply"]



def test_export_order_sheet():
    """Verify GET /api/v1/trader/export-order-sheet exports CSV format."""
    token = get_test_token()
    resp = client.get(
        "/api/v1/trader/export-order-sheet?day=2026-01-15&deadline_hour=9&demand_mw=18000",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    content = resp.text
    assert "UK DAY-AHEAD POWER AUCTION PROCUREMENT ORDER SHEET" in content
    assert "Delivery_Time_UTC" in content
    assert "Total_Auction_Bid_MW" in content


def test_portfolio_save_and_retrieve():
    """Verify custom demand portfolio save and retrieval."""
    token = get_test_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Save portfolio
    resp = client.post(
        "/api/v1/trader/portfolios",
        headers=headers,
        json={"name": "Test Industrial", "demandMw": 19500, "description": "High industrial load"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "saved"

    # Retrieve portfolios
    resp_get = client.get("/api/v1/trader/portfolios", headers=headers)
    assert resp_get.status_code == 200
    names = [p["name"] for p in resp_get.json()]
    assert "Test Industrial" in names


def test_imbalance_savings_calculator():
    """Verify financial savings calculator endpoint."""
    token = get_test_token()
    resp = client.get(
        "/api/v1/trader/savings-estimate?imbalance_price_gbp=125.0&buffer_quantile=0.90",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "estimated_savings_gbp" in data
    assert data["estimated_savings_gbp"] > 0
    assert "daily_average_savings_gbp" in data

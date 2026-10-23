"""Tests for MongoDB authentication and user registration."""

import uuid
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_register_and_login_flow():
    test_id = uuid.uuid4().hex[:8]
    test_email = f"trader_{test_id}@energytrading.com"
    # 1. Register new user
    reg_data = {
        "name": f"Trader {test_id}",
        "email": test_email,
        "password": "SecurePassword123!",
    }
    response = client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 200, response.text
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_email
    assert data["user"]["name"] == reg_data["name"]

    # 2. Reject duplicate registration
    dup_res = client.post("/api/v1/auth/register", json=reg_data)
    assert dup_res.status_code == 400

    # 3. Successful Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    token = login_data["access_token"]

    # 4. Access /auth/me with Bearer token
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email

    # 5. Invalid credentials rejection
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": test_email, "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401


def test_mongo_status():
    res = client.get("/api/v1/dataset/mongo-status")
    assert res.status_code == 200
    data = res.json()
    assert "engine" in data
    assert "usersCount" in data

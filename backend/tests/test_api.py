"""Integration tests for Person 3 — API & Persistence."""
import pytest
from fastapi.testclient import TestClient

from app.main import app

PLAN_PAYLOAD = {
    "country": "US",
    "currency": "USD",
    "monthly_income": 5000,
    "recurring": [{"name": "Netflix", "monthly_amount": 15, "category": "subscription"}],
    "savings_goal": 10000,
    "deadline": "2027-12-31",
    "current_savings": 0,
}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_post_plan_returns_id(client):
    r = client.post("/plan", json=PLAN_PAYLOAD)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data["id"], int)
    assert data["daily_budget"] >= 0


def test_get_plan_after_post(client):
    r = client.post("/plan", json=PLAN_PAYLOAD)
    plan_id = r.json()["id"]

    r2 = client.get(f"/plan/{plan_id}")
    assert r2.status_code == 200
    assert r2.json()["id"] == plan_id


def test_get_plan_not_found(client):
    r = client.get("/plan/999999")
    assert r.status_code == 404


def test_put_plan_updates_and_returns(client):
    r = client.post("/plan", json=PLAN_PAYLOAD)
    plan_id = r.json()["id"]

    updated = {**PLAN_PAYLOAD, "savings_goal": 20000}
    r2 = client.put(f"/plan/{plan_id}", json=updated)
    assert r2.status_code == 200
    assert r2.json()["id"] == plan_id


def test_put_plan_not_found(client):
    r = client.put("/plan/999999", json=PLAN_PAYLOAD)
    assert r.status_code == 404

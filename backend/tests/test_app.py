import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest

from app import app


@pytest.fixture
def client(tmp_path):
    database_path = tmp_path / "test_expenses.db"

    import app as app_module

    app_module.DATABASE = str(database_path)
    app_module.initialize_database()

    app.config["TESTING"] = True

    with app.test_client() as test_client:
        yield test_client


def test_home(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.get_json()["message"] == "Smart Expense Tracker API is running"


def test_add_transaction(client):
    response = client.post(
        "/api/transactions",
        json={
            "type": "expense",
            "description": "Lunch",
            "amount": 500,
            "category": "Food",
            "date": "2026-09-18",
        },
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["description"] == "Lunch"
    assert data["amount"] == 500
    assert data["category"] == "Food"


def test_get_transactions(client):
    client.post(
        "/api/transactions",
        json={
            "type": "expense",
            "description": "Transport",
            "amount": 300,
            "category": "Transport",
            "date": "2026-09-18",
        },
    )

    response = client.get("/api/transactions")

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["description"] == "Transport"


def test_invalid_transaction(client):
    response = client.post(
        "/api/transactions",
        json={
            "type": "expense",
            "description": "Invalid",
            "amount": -100,
            "category": "Food",
            "date": "2026-09-18",
        },
    )

    assert response.status_code == 400

    data = response.get_json()

    assert "error" in data


def test_delete_transaction(client):
    create_response = client.post(
        "/api/transactions",
        json={
            "type": "expense",
            "description": "Shopping",
            "amount": 1000,
            "category": "Shopping",
            "date": "2026-09-18",
        },
    )

    transaction_id = create_response.get_json()["id"]

    response = client.delete(
        f"/api/transactions/{transaction_id}"
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["message"] == "Transaction deleted successfully"
import os
import sys

sys.path.insert(
    0,
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    ),
)

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


def create_transaction(
    client,
    transaction_type="expense",
    description="Test transaction",
    amount=1000,
    category="Food",
    date="2026-09-18",
):
    return client.post(
        "/api/transactions",
        json={
            "type": transaction_type,
            "description": description,
            "amount": amount,
            "category": category,
            "date": date,
        },
    )


def test_home(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.get_json()["message"] == (
        "Smart Expense Tracker API is running"
    )


def test_add_transaction(client):
    response = create_transaction(
        client,
        description="Lunch",
        amount=500,
        category="Food",
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["description"] == "Lunch"
    assert data["amount"] == 500
    assert data["category"] == "Food"


def test_get_transactions(client):
    create_transaction(
        client,
        description="Transport",
        amount=300,
        category="Transport",
    )

    response = client.get("/api/transactions")

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["description"] == "Transport"


def test_filter_by_type(client):
    create_transaction(
        client,
        transaction_type="expense",
        description="Lunch",
        amount=500,
        category="Food",
    )

    create_transaction(
        client,
        transaction_type="income",
        description="Salary",
        amount=50000,
        category="Salary",
    )

    response = client.get("/api/transactions?type=expense")

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["description"] == "Lunch"
    assert data[0]["type"] == "expense"


def test_filter_by_category(client):
    create_transaction(
        client,
        description="Lunch",
        amount=500,
        category="Food",
    )

    create_transaction(
        client,
        description="Bus",
        amount=300,
        category="Transport",
    )

    response = client.get(
        "/api/transactions?category=Food"
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["category"] == "Food"


def test_filter_by_date_range(client):
    create_transaction(
        client,
        description="January expense",
        amount=1000,
        category="Food",
        date="2026-01-15",
    )

    create_transaction(
        client,
        description="February expense",
        amount=2000,
        category="Shopping",
        date="2026-02-15",
    )

    create_transaction(
        client,
        description="March expense",
        amount=3000,
        category="Transport",
        date="2026-03-15",
    )

    response = client.get(
        "/api/transactions"
        "?start_date=2026-02-01"
        "&end_date=2026-02-28"
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["description"] == "February expense"


def test_invalid_transaction_type_filter(client):
    response = client.get(
        "/api/transactions?type=invalid"
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data["error"] == (
        "Type must be income or expense"
    )


def test_invalid_transaction(client):
    response = create_transaction(
        client,
        description="Invalid",
        amount=-100,
        category="Food",
    )

    assert response.status_code == 400

    assert "error" in response.get_json()


def test_delete_transaction(client):
    create_response = create_transaction(
        client,
        description="Shopping",
        amount=1000,
        category="Shopping",
    )

    transaction_id = create_response.get_json()["id"]

    response = client.delete(
        f"/api/transactions/{transaction_id}"
    )

    assert response.status_code == 200

    assert response.get_json()["message"] == (
        "Transaction deleted successfully"
    )


def test_update_transaction(client):
    create_response = create_transaction(
        client,
        description="Old description",
        amount=500,
        category="Food",
    )

    transaction_id = create_response.get_json()["id"]

    response = client.put(
        f"/api/transactions/{transaction_id}",
        json={
            "type": "expense",
            "description": "Updated description",
            "amount": 750,
            "category": "Shopping",
            "date": "2026-09-19",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["description"] == "Updated description"
    assert data["amount"] == 750
    assert data["category"] == "Shopping"


def test_update_missing_transaction(client):
    response = client.put(
        "/api/transactions/9999",
        json={
            "type": "expense",
            "description": "Updated",
            "amount": 500,
            "category": "Food",
            "date": "2026-09-19",
        },
    )

    assert response.status_code == 404

    assert response.get_json()["error"] == (
        "Transaction not found"
    )


def test_summary(client):
    create_transaction(
        client,
        transaction_type="income",
        description="Salary",
        amount=50000,
        category="Salary",
    )

    create_transaction(
        client,
        transaction_type="expense",
        description="Rent",
        amount=15000,
        category="Bills",
    )

    response = client.get("/api/summary")

    assert response.status_code == 200

    data = response.get_json()

    assert data["total_income"] == 50000
    assert data["total_expenses"] == 15000
    assert data["balance"] == 35000
    assert data["transaction_count"] == 2


def test_category_summary(client):
    create_transaction(
        client,
        description="Lunch",
        amount=500,
        category="Food",
    )

    create_transaction(
        client,
        description="Dinner",
        amount=1000,
        category="Food",
    )

    create_transaction(
        client,
        description="Bus",
        amount=300,
        category="Transport",
    )

    response = client.get("/api/summary/categories")

    assert response.status_code == 200

    data = response.get_json()

    assert data[0]["category"] == "Food"
    assert data[0]["total"] == 1500
    assert data[1]["category"] == "Transport"
    assert data[1]["total"] == 300


def test_monthly_summary(client):
    create_transaction(
        client,
        description="January shopping",
        amount=1000,
        category="Shopping",
        date="2026-01-15",
    )

    create_transaction(
        client,
        description="January food",
        amount=500,
        category="Food",
        date="2026-01-20",
    )

    create_transaction(
        client,
        description="February transport",
        amount=700,
        category="Transport",
        date="2026-02-10",
    )

    response = client.get("/api/summary/monthly")

    assert response.status_code == 200

    data = response.get_json()

    assert data[0]["month"] == "2026-02"
    assert data[0]["total"] == 700

    assert data[1]["month"] == "2026-01"
    assert data[1]["total"] == 1500

def test_get_budget(client):
    response = client.get("/api/budget")

    assert response.status_code == 200

    data = response.get_json()

    assert data["amount"] == 0


def test_update_budget(client):
    response = client.put(
        "/api/budget",
        json={
            "amount": 50000
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["amount"] == 50000
    assert data["message"] == "Budget updated successfully"

    get_response = client.get("/api/budget")

    assert get_response.status_code == 200
    assert get_response.get_json()["amount"] == 50000
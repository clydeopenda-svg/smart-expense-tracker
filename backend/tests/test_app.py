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


@pytest.fixture
def auth_headers(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "testpass123"},
    )

    token = response.get_json()["token"]

    return {"Authorization": f"Bearer {token}"}


def create_transaction(
    client,
    headers,
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
        headers=headers,
    )


def test_home(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.get_json()["message"] == (
        "Smart Expense Tracker API is running"
    )


def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "newuser", "password": "strongpass123"},
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["user"]["username"] == "newuser"
    assert "token" in data


def test_register_duplicate_username(client):
    client.post(
        "/api/auth/register",
        json={"username": "duplicate", "password": "strongpass123"},
    )

    response = client.post(
        "/api/auth/register",
        json={"username": "duplicate", "password": "anotherpass123"},
    )

    assert response.status_code == 409
    assert response.get_json()["error"] == "Username is already taken"


def test_register_invalid_username(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "ab", "password": "strongpass123"},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_register_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={"username": "validname", "password": "short"},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_login(client):
    client.post(
        "/api/auth/register",
        json={"username": "loginuser", "password": "strongpass123"},
    )

    response = client.post(
        "/api/auth/login",
        json={"username": "loginuser", "password": "strongpass123"},
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["user"]["username"] == "loginuser"
    assert "token" in data


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"username": "loginuser2", "password": "strongpass123"},
    )

    response = client.post(
        "/api/auth/login",
        json={"username": "loginuser2", "password": "wrongpassword"},
    )

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid username or password"


def test_transactions_require_auth(client):
    response = client.get("/api/transactions")

    assert response.status_code == 401
    assert response.get_json()["error"] == "Authentication required"


def test_add_transaction(client, auth_headers):
    response = create_transaction(
        client,
        auth_headers,
        description="Lunch",
        amount=500,
        category="Food",
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["description"] == "Lunch"
    assert data["amount"] == 500
    assert data["category"] == "Food"


def test_get_transactions(client, auth_headers):
    create_transaction(
        client,
        auth_headers,
        description="Transport",
        amount=300,
        category="Transport",
    )

    response = client.get("/api/transactions", headers=auth_headers)

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["description"] == "Transport"


def test_transactions_scoped_per_user(client, auth_headers):
    create_transaction(
        client,
        auth_headers,
        description="First user's expense",
        amount=500,
        category="Food",
    )

    second_user = client.post(
        "/api/auth/register",
        json={"username": "seconduser", "password": "strongpass123"},
    )

    second_headers = {
        "Authorization": f"Bearer {second_user.get_json()['token']}"
    }

    response = client.get("/api/transactions", headers=second_headers)

    assert response.status_code == 200
    assert response.get_json() == []


def test_filter_by_type(client, auth_headers):
    create_transaction(
        client,
        auth_headers,
        transaction_type="expense",
        description="Lunch",
        amount=500,
        category="Food",
    )

    create_transaction(
        client,
        auth_headers,
        transaction_type="income",
        description="Salary",
        amount=50000,
        category="Salary",
    )

    response = client.get(
        "/api/transactions?type=expense", headers=auth_headers
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["description"] == "Lunch"
    assert data[0]["type"] == "expense"


def test_filter_by_category(client, auth_headers):
    create_transaction(
        client,
        auth_headers,
        description="Lunch",
        amount=500,
        category="Food",
    )

    create_transaction(
        client,
        auth_headers,
        description="Bus",
        amount=300,
        category="Transport",
    )

    response = client.get(
        "/api/transactions?category=Food", headers=auth_headers
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["category"] == "Food"


def test_filter_by_date_range(client, auth_headers):
    create_transaction(
        client,
        auth_headers,
        description="January expense",
        amount=1000,
        category="Food",
        date="2026-01-15",
    )

    create_transaction(
        client,
        auth_headers,
        description="February expense",
        amount=2000,
        category="Shopping",
        date="2026-02-15",
    )

    create_transaction(
        client,
        auth_headers,
        description="March expense",
        amount=3000,
        category="Transport",
        date="2026-03-15",
    )

    response = client.get(
        "/api/transactions"
        "?start_date=2026-02-01"
        "&end_date=2026-02-28",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1
    assert data[0]["description"] == "February expense"


def test_invalid_transaction_type_filter(client, auth_headers):
    response = client.get(
        "/api/transactions?type=invalid", headers=auth_headers
    )

    assert response.status_code == 400

    data = response.get_json()

    assert data["error"] == (
        "Type must be income or expense"
    )


def test_invalid_transaction(client, auth_headers):
    response = create_transaction(
        client,
        auth_headers,
        description="Invalid",
        amount=-100,
        category="Food",
    )

    assert response.status_code == 400

    assert "error" in response.get_json()


def test_rejects_non_padded_transaction_date(client, auth_headers):
    response = create_transaction(
        client,
        auth_headers,
        description="Invalid date",
        date="2026-2-3",
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == (
        "Date must be a valid date in YYYY-MM-DD format"
    )


def test_delete_transaction(client, auth_headers):
    create_response = create_transaction(
        client,
        auth_headers,
        description="Shopping",
        amount=1000,
        category="Shopping",
    )

    transaction_id = create_response.get_json()["id"]

    response = client.delete(
        f"/api/transactions/{transaction_id}", headers=auth_headers
    )

    assert response.status_code == 200

    assert response.get_json()["message"] == (
        "Transaction deleted successfully"
    )


def test_update_transaction(client, auth_headers):
    create_response = create_transaction(
        client,
        auth_headers,
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
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["description"] == "Updated description"
    assert data["amount"] == 750
    assert data["category"] == "Shopping"


def test_update_missing_transaction(client, auth_headers):
    response = client.put(
        "/api/transactions/9999",
        json={
            "type": "expense",
            "description": "Updated",
            "amount": 500,
            "category": "Food",
            "date": "2026-09-19",
        },
        headers=auth_headers,
    )

    assert response.status_code == 404

    assert response.get_json()["error"] == (
        "Transaction not found"
    )


def test_summary(client, auth_headers):
    create_transaction(
        client,
        auth_headers,
        transaction_type="income",
        description="Salary",
        amount=50000,
        category="Salary",
    )

    create_transaction(
        client,
        auth_headers,
        transaction_type="expense",
        description="Rent",
        amount=15000,
        category="Bills",
    )

    response = client.get("/api/summary", headers=auth_headers)

    assert response.status_code == 200

    data = response.get_json()

    assert data["total_income"] == 50000
    assert data["total_expenses"] == 15000
    assert data["balance"] == 35000
    assert data["transaction_count"] == 2


def test_category_summary(client, auth_headers):
    create_transaction(
        client,
        auth_headers,
        description="Lunch",
        amount=500,
        category="Food",
    )

    create_transaction(
        client,
        auth_headers,
        description="Dinner",
        amount=1000,
        category="Food",
    )

    create_transaction(
        client,
        auth_headers,
        description="Bus",
        amount=300,
        category="Transport",
    )

    response = client.get(
        "/api/summary/categories", headers=auth_headers
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data[0]["category"] == "Food"
    assert data[0]["total"] == 1500
    assert data[1]["category"] == "Transport"
    assert data[1]["total"] == 300


def test_monthly_summary(client, auth_headers):
    create_transaction(
        client,
        auth_headers,
        description="January shopping",
        amount=1000,
        category="Shopping",
        date="2026-01-15",
    )

    create_transaction(
        client,
        auth_headers,
        description="January food",
        amount=500,
        category="Food",
        date="2026-01-20",
    )

    create_transaction(
        client,
        auth_headers,
        description="February transport",
        amount=700,
        category="Transport",
        date="2026-02-10",
    )

    response = client.get("/api/summary/monthly", headers=auth_headers)

    assert response.status_code == 200

    data = response.get_json()

    assert data[0]["month"] == "2026-02"
    assert data[0]["total"] == 700

    assert data[1]["month"] == "2026-01"
    assert data[1]["total"] == 1500


def test_get_budget(client, auth_headers):
    response = client.get("/api/budget", headers=auth_headers)

    assert response.status_code == 200

    data = response.get_json()

    assert data["amount"] == 0


def test_update_budget(client, auth_headers):
    response = client.put(
        "/api/budget",
        json={
            "amount": 50000
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["amount"] == 50000
    assert data["message"] == "Budget updated successfully"

    get_response = client.get("/api/budget", headers=auth_headers)

    assert get_response.status_code == 200
    assert get_response.get_json()["amount"] == 50000


def test_budget_scoped_per_user(client, auth_headers):
    client.put(
        "/api/budget",
        json={"amount": 30000},
        headers=auth_headers,
    )

    second_user = client.post(
        "/api/auth/register",
        json={"username": "budgetuser", "password": "strongpass123"},
    )

    second_headers = {
        "Authorization": f"Bearer {second_user.get_json()['token']}"
    }

    response = client.get("/api/budget", headers=second_headers)

    assert response.status_code == 200
    assert response.get_json()["amount"] == 0
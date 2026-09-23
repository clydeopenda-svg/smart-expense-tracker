import math
import os
import sqlite3
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS


app = Flask(__name__)

# During local development Vite and Flask run on different ports.
# This keeps the API usable locally while allowing the origin to be
# configured later for deployment.
allowed_origins = os.getenv("CORS_ORIGINS", "*")

if allowed_origins == "*":
    CORS(app)
else:
    CORS(
        app,
        origins=[
            origin.strip()
            for origin in allowed_origins.split(",")
            if origin.strip()
        ],
    )


DATABASE = os.getenv("DATABASE_PATH", "expenses.db")

TRANSACTION_TYPES = {"income", "expense"}

CATEGORIES = {
    "Food",
    "Transport",
    "Bills",
    "Shopping",
    "Entertainment",
    "Health",
    "Education",
    "Other",
    "Salary",
}

MAX_DESCRIPTION_LENGTH = 100
MAX_CATEGORY_LENGTH = 50
MAX_AMOUNT = 100_000_000
MAX_BUDGET = 100_000_000


def get_db_connection():
    """Create a SQLite connection configured for this application."""
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    """Create the application's database tables if they do not exist."""
    connection = get_db_connection()

    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                amount REAL NOT NULL
            )
            """
        )

        connection.commit()
    finally:
        connection.close()


def error_response(message, status_code=400):
    """Return API errors in one consistent JSON format."""
    return jsonify({"error": message}), status_code


def parse_date(value):
    """
    Validate an ISO date in YYYY-MM-DD format.

    Returning True/False keeps this helper simple and reusable for
    transaction dates and date filters.
    """
    if not isinstance(value, str) or not value.strip():
        return False

    try:
        datetime.strptime(value.strip(), "%Y-%m-%d")
        return True
    except ValueError:
        return False


def parse_amount(value):
    """
    Convert an amount into a finite positive number.

    The frontend performs similar validation, but the API must enforce
    its own rules because requests can be sent directly to the backend.
    """
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return None

    if not math.isfinite(numeric_value):
        return None

    return numeric_value


def validate_transaction(data):
    """Validate transaction data before it reaches the database."""
    if not isinstance(data, dict):
        return "Request body is required"

    transaction_type = data.get("type")
    description = data.get("description")
    amount = data.get("amount")
    category = data.get("category")
    date = data.get("date")

    if transaction_type not in TRANSACTION_TYPES:
        return "Type must be income or expense"

    if not isinstance(description, str) or not description.strip():
        return "Description is required"

    description = description.strip()

    if len(description) > MAX_DESCRIPTION_LENGTH:
        return (
            f"Description must be {MAX_DESCRIPTION_LENGTH} "
            "characters or less"
        )

    numeric_amount = parse_amount(amount)

    if numeric_amount is None:
        return "Amount must be a valid number"

    if numeric_amount <= 0:
        return "Amount must be greater than zero"

    if numeric_amount > MAX_AMOUNT:
        return "Amount is too large"

    if not isinstance(category, str) or not category.strip():
        return "Category is required"

    category = category.strip()

    if len(category) > MAX_CATEGORY_LENGTH:
        return (
            f"Category must be {MAX_CATEGORY_LENGTH} "
            "characters or less"
        )

    if category not in CATEGORIES:
        return "Please select a valid category"

    if not parse_date(date):
        return "Date must be a valid date in YYYY-MM-DD format"

    return None


@app.route("/")
def home():
    return jsonify(
        {
            "message": "Smart Expense Tracker API is running"
        }
    )


@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    transaction_type = request.args.get("type")
    category = request.args.get("category")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if transaction_type and transaction_type not in TRANSACTION_TYPES:
        return error_response(
            "Type must be income or expense",
            400,
        )

    if category and category not in CATEGORIES:
        return error_response(
            "Please select a valid category",
            400,
        )

    if start_date and not parse_date(start_date):
        return error_response(
            "Start date must be a valid date in YYYY-MM-DD format",
            400,
        )

    if end_date and not parse_date(end_date):
        return error_response(
            "End date must be a valid date in YYYY-MM-DD format",
            400,
        )

    if start_date and end_date and start_date > end_date:
        return error_response(
            "Start date cannot be after end date",
            400,
        )

    query = """
        SELECT id, type, description, amount, category, date
        FROM transactions
        WHERE 1 = 1
    """

    parameters = []

    if transaction_type:
        query += " AND type = ?"
        parameters.append(transaction_type)

    if category:
        query += " AND category = ?"
        parameters.append(category)

    if start_date:
        query += " AND date >= ?"
        parameters.append(start_date)

    if end_date:
        query += " AND date <= ?"
        parameters.append(end_date)

    query += " ORDER BY date DESC, id DESC"

    connection = get_db_connection()

    try:
        transactions = connection.execute(
            query,
            parameters,
        ).fetchall()

        return jsonify(
            [dict(transaction) for transaction in transactions]
        )
    except sqlite3.Error:
        app.logger.exception("Failed to retrieve transactions")
        return error_response(
            "Unable to retrieve transactions",
            500,
        )
    finally:
        connection.close()


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json(silent=True)

    error = validate_transaction(data)

    if error:
        return error_response(error, 400)

    transaction_type = data["type"]
    description = data["description"].strip()
    amount = parse_amount(data["amount"])
    category = data["category"].strip()
    date = data["date"].strip()

    connection = get_db_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO transactions (
                type,
                description,
                amount,
                category,
                date
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                transaction_type,
                description,
                amount,
                category,
                date,
            ),
        )

        connection.commit()

        transaction_id = cursor.lastrowid

        transaction = connection.execute(
            """
            SELECT id, type, description, amount, category, date
            FROM transactions
            WHERE id = ?
            """,
            (transaction_id,),
        ).fetchone()

        return jsonify(dict(transaction)), 201
    except sqlite3.Error:
        connection.rollback()
        app.logger.exception("Failed to create transaction")
        return error_response(
            "Unable to create transaction",
            500,
        )
    finally:
        connection.close()


@app.route("/api/transactions/<int:transaction_id>", methods=["PUT"])
def update_transaction(transaction_id):
    data = request.get_json(silent=True)

    error = validate_transaction(data)

    if error:
        return error_response(error, 400)

    connection = get_db_connection()

    try:
        existing_transaction = connection.execute(
            """
            SELECT id
            FROM transactions
            WHERE id = ?
            """,
            (transaction_id,),
        ).fetchone()

        if existing_transaction is None:
            return error_response(
                "Transaction not found",
                404,
            )

        connection.execute(
            """
            UPDATE transactions
            SET
                type = ?,
                description = ?,
                amount = ?,
                category = ?,
                date = ?
            WHERE id = ?
            """,
            (
                data["type"],
                data["description"].strip(),
                parse_amount(data["amount"]),
                data["category"].strip(),
                data["date"].strip(),
                transaction_id,
            ),
        )

        connection.commit()

        transaction = connection.execute(
            """
            SELECT id, type, description, amount, category, date
            FROM transactions
            WHERE id = ?
            """,
            (transaction_id,),
        ).fetchone()

        return jsonify(dict(transaction))
    except sqlite3.Error:
        connection.rollback()
        app.logger.exception("Failed to update transaction")
        return error_response(
            "Unable to update transaction",
            500,
        )
    finally:
        connection.close()


@app.route("/api/transactions/<int:transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    connection = get_db_connection()

    try:
        existing_transaction = connection.execute(
            """
            SELECT id
            FROM transactions
            WHERE id = ?
            """,
            (transaction_id,),
        ).fetchone()

        if existing_transaction is None:
            return error_response(
                "Transaction not found",
                404,
            )

        connection.execute(
            """
            DELETE FROM transactions
            WHERE id = ?
            """,
            (transaction_id,),
        )

        connection.commit()

        return jsonify(
            {
                "message": "Transaction deleted successfully"
            }
        )
    except sqlite3.Error:
        connection.rollback()
        app.logger.exception("Failed to delete transaction")
        return error_response(
            "Unable to delete transaction",
            500,
        )
    finally:
        connection.close()


@app.route("/api/summary", methods=["GET"])
def get_summary():
    connection = get_db_connection()

    try:
        summary = connection.execute(
            """
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'income'
                            THEN amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_income,

                COALESCE(
                    SUM(
                        CASE
                            WHEN type = 'expense'
                            THEN amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_expenses,

                COUNT(*) AS transaction_count

            FROM transactions
            """
        ).fetchone()

        total_income = float(summary["total_income"])
        total_expenses = float(summary["total_expenses"])

        return jsonify(
            {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "balance": total_income - total_expenses,
                "transaction_count": summary["transaction_count"],
            }
        )
    except sqlite3.Error:
        app.logger.exception("Failed to retrieve summary")
        return error_response(
            "Unable to retrieve financial summary",
            500,
        )
    finally:
        connection.close()


@app.route("/api/summary/categories", methods=["GET"])
def get_category_summary():
    connection = get_db_connection()

    try:
        categories = connection.execute(
            """
            SELECT
                category,
                SUM(amount) AS total
            FROM transactions
            WHERE type = 'expense'
            GROUP BY category
            ORDER BY total DESC
            """
        ).fetchall()

        return jsonify(
            [
                {
                    "category": row["category"],
                    "total": float(row["total"]),
                }
                for row in categories
            ]
        )
    except sqlite3.Error:
        app.logger.exception(
            "Failed to retrieve category summary"
        )
        return error_response(
            "Unable to retrieve category summary",
            500,
        )
    finally:
        connection.close()


@app.route("/api/summary/monthly", methods=["GET"])
def get_monthly_summary():
    connection = get_db_connection()

    try:
        monthly = connection.execute(
            """
            SELECT
                substr(date, 1, 7) AS month,
                SUM(amount) AS total
            FROM transactions
            WHERE type = 'expense'
            GROUP BY substr(date, 1, 7)
            ORDER BY month DESC
            """
        ).fetchall()

        return jsonify(
            [
                {
                    "month": row["month"],
                    "total": float(row["total"]),
                }
                for row in monthly
            ]
        )
    except sqlite3.Error:
        app.logger.exception(
            "Failed to retrieve monthly summary"
        )
        return error_response(
            "Unable to retrieve monthly summary",
            500,
        )
    finally:
        connection.close()


@app.route("/api/budget", methods=["GET"])
def get_budget():
    connection = get_db_connection()

    try:
        budget = connection.execute(
            """
            SELECT amount
            FROM budgets
            WHERE id = 1
            """
        ).fetchone()

        if budget is None:
            return jsonify({"amount": 0})

        return jsonify(
            {
                "amount": float(budget["amount"])
            }
        )
    except sqlite3.Error:
        app.logger.exception("Failed to retrieve budget")
        return error_response(
            "Unable to retrieve budget",
            500,
        )
    finally:
        connection.close()


@app.route("/api/budget", methods=["PUT"])
def update_budget():
    data = request.get_json(silent=True)

    if not isinstance(data, dict) or "amount" not in data:
        return error_response(
            "Budget amount is required",
            400,
        )

    amount = parse_amount(data["amount"])

    if amount is None:
        return error_response(
            "Budget amount must be a valid number",
            400,
        )

    if amount < 0:
        return error_response(
            "Budget amount cannot be negative",
            400,
        )

    if amount > MAX_BUDGET:
        return error_response(
            "Budget amount is too large",
            400,
        )

    connection = get_db_connection()

    try:
        connection.execute(
            """
            INSERT INTO budgets (id, amount)
            VALUES (1, ?)
            ON CONFLICT(id)
            DO UPDATE SET amount = excluded.amount
            """,
            (amount,),
        )

        connection.commit()

        return jsonify(
            {
                "amount": amount,
                "message": "Budget updated successfully",
            }
        )
    except sqlite3.Error:
        connection.rollback()
        app.logger.exception("Failed to update budget")
        return error_response(
            "Unable to update budget",
            500,
        )
    finally:
        connection.close()


initialize_database()


if __name__ == "__main__":
    app.run(
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true"
    )
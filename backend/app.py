import sqlite3

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE = "expenses.db"


def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_db_connection()

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
    connection.close()


def validate_transaction(data):
    if not data:
        return "Request body is required"

    transaction_type = data.get("type")
    description = data.get("description")
    amount = data.get("amount")
    category = data.get("category")
    date = data.get("date")

    if transaction_type not in ["income", "expense"]:
        return "Type must be income or expense"

    if not description or not isinstance(description, str):
        return "Description is required"

    if len(description.strip()) > 100:
        return "Description must be 100 characters or less"

    if amount is None:
        return "Amount is required"

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return "Amount must be a valid number"

    if amount <= 0:
        return "Amount must be greater than zero"

    if amount > 100000000:
        return "Amount is too large"

    if not category or not isinstance(category, str):
        return "Category is required"

    if len(category.strip()) > 50:
        return "Category must be 50 characters or less"

    if not date or not isinstance(date, str):
        return "Date is required"

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

    query = """
        SELECT id, type, description, amount, category, date
        FROM transactions
        WHERE 1 = 1
    """

    parameters = []

    if transaction_type:
        if transaction_type not in ["income", "expense"]:
            return jsonify(
                {"error": "Type must be income or expense"}
            ), 400

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

    transactions = connection.execute(
        query,
        parameters,
    ).fetchall()

    connection.close()

    return jsonify(
        [dict(transaction) for transaction in transactions]
    )


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json(silent=True)

    error = validate_transaction(data)

    if error:
        return jsonify({"error": error}), 400

    transaction_type = data["type"]
    description = data["description"].strip()
    amount = float(data["amount"])
    category = data["category"].strip()
    date = data["date"].strip()

    connection = get_db_connection()

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

    connection.close()

    return jsonify(dict(transaction)), 201


@app.route("/api/transactions/<int:transaction_id>", methods=["PUT"])
def update_transaction(transaction_id):
    data = request.get_json(silent=True)

    error = validate_transaction(data)

    if error:
        return jsonify({"error": error}), 400

    connection = get_db_connection()

    existing_transaction = connection.execute(
        """
        SELECT id
        FROM transactions
        WHERE id = ?
        """,
        (transaction_id,),
    ).fetchone()

    if existing_transaction is None:
        connection.close()

        return jsonify(
            {"error": "Transaction not found"}
        ), 404

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
            float(data["amount"]),
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

    connection.close()

    return jsonify(dict(transaction))


@app.route("/api/transactions/<int:transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    connection = get_db_connection()

    existing_transaction = connection.execute(
        """
        SELECT id
        FROM transactions
        WHERE id = ?
        """,
        (transaction_id,),
    ).fetchone()

    if existing_transaction is None:
        connection.close()

        return jsonify(
            {"error": "Transaction not found"}
        ), 404

    connection.execute(
        """
        DELETE FROM transactions
        WHERE id = ?
        """,
        (transaction_id,),
    )

    connection.commit()
    connection.close()

    return jsonify(
        {"message": "Transaction deleted successfully"}
    )


@app.route("/api/summary", methods=["GET"])
def get_summary():
    connection = get_db_connection()

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

    connection.close()

    total_income = float(summary["total_income"])
    total_expenses = float(summary["total_expenses"])
    balance = total_income - total_expenses

    return jsonify(
        {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "balance": balance,
            "transaction_count": summary["transaction_count"],
        }
    )


@app.route("/api/summary/categories", methods=["GET"])
def get_category_summary():
    connection = get_db_connection()

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

    connection.close()

    return jsonify(
        [
            {
                "category": row["category"],
                "total": float(row["total"]),
            }
            for row in categories
        ]
    )


@app.route("/api/summary/monthly", methods=["GET"])
def get_monthly_summary():
    connection = get_db_connection()

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

    connection.close()

    return jsonify(
        [
            {
                "month": row["month"],
                "total": float(row["total"]),
            }
            for row in monthly
        ]
    )


@app.route("/api/budget", methods=["GET"])
def get_budget():
    connection = get_db_connection()

    budget = connection.execute(
        """
        SELECT amount
        FROM budgets
        WHERE id = 1
        """
    ).fetchone()

    connection.close()

    if budget is None:
        return jsonify({"amount": 0})

    return jsonify(
        {
            "amount": float(budget["amount"])
        }
    )


@app.route("/api/budget", methods=["PUT"])
def update_budget():
    data = request.get_json(silent=True)

    if not data or "amount" not in data:
        return jsonify(
            {"error": "Budget amount is required"}
        ), 400

    try:
        amount = float(data["amount"])
    except (TypeError, ValueError):
        return jsonify(
            {"error": "Budget amount must be a valid number"}
        ), 400

    if amount < 0:
        return jsonify(
            {"error": "Budget amount cannot be negative"}
        ), 400

    connection = get_db_connection()

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
    connection.close()

    return jsonify(
        {
            "amount": amount,
            "message": "Budget updated successfully",
        }
    )


initialize_database()


if __name__ == "__main__":
    app.run(debug=True)
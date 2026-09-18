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

    connection.commit()
    connection.close()


@app.route("/")
def home():
    return jsonify({
        "message": "Smart Expense Tracker API is running"
    })


@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    connection = get_db_connection()

    transactions = connection.execute(
        """
        SELECT id, type, description, amount, category, date
        FROM transactions
        ORDER BY id DESC
        """
    ).fetchall()

    connection.close()

    return jsonify([dict(transaction) for transaction in transactions])


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json(silent=True) or {}

    transaction_type = data.get("type")
    description = str(data.get("description", "")).strip()
    amount = data.get("amount")
    category = str(data.get("category", "")).strip()
    date = data.get("date")

    if transaction_type not in ["income", "expense"]:
        return jsonify({
            "error": "Transaction type must be income or expense"
        }), 400

    if not description:
        return jsonify({
            "error": "Description is required"
        }), 400

    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({
            "error": "Amount must be a valid number"
        }), 400

    if amount <= 0:
        return jsonify({
            "error": "Amount must be greater than zero"
        }), 400

    if not category:
        return jsonify({
            "error": "Category is required"
        }), 400

    if not date:
        return jsonify({
            "error": "Date is required"
        }), 400

    connection = get_db_connection()

    cursor = connection.execute(
        """
        INSERT INTO transactions
        (type, description, amount, category, date)
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

    transaction = connection.execute(
        """
        SELECT id, type, description, amount, category, date
        FROM transactions
        WHERE id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()

    connection.close()

    return jsonify(dict(transaction)), 201


@app.route("/api/transactions/<int:transaction_id>", methods=["DELETE"])
def delete_transaction(transaction_id):
    connection = get_db_connection()

    transaction = connection.execute(
        """
        SELECT id
        FROM transactions
        WHERE id = ?
        """,
        (transaction_id,),
    ).fetchone()

    if transaction is None:
        connection.close()

        return jsonify({
            "error": "Transaction not found"
        }), 404

    connection.execute(
        """
        DELETE FROM transactions
        WHERE id = ?
        """,
        (transaction_id,),
    )

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Transaction deleted successfully"
    })


if __name__ == "__main__":
    initialize_database()
    app.run(debug=True)
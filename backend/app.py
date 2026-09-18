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
    data = request.get_json()

    connection = get_db_connection()

    cursor = connection.execute(
        """
        INSERT INTO transactions
        (type, description, amount, category, date)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            data.get("type"),
            data.get("description"),
            data.get("amount"),
            data.get("category"),
            data.get("date"),
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
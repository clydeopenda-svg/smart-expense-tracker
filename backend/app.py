import math
import os
import re
import sqlite3
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()

app = Flask(__name__)

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
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
TOKEN_EXPIRY_DAYS = 7

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

MIN_USERNAME_LENGTH = 3
MAX_USERNAME_LENGTH = 50
MIN_PASSWORD_LENGTH = 8
USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_.-]+$")


def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def table_has_column(connection, table_name, column_name):
    columns = connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    return any(column["name"] == column_name for column in columns)


def initialize_database():
    connection = get_db_connection()

    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL
            )
            """
        )

        if not table_has_column(connection, "transactions", "user_id"):
            connection.execute("ALTER TABLE transactions ADD COLUMN user_id INTEGER")

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS budgets (
                user_id INTEGER PRIMARY KEY,
                amount REAL NOT NULL
            )
            """
        )

        if table_has_column(connection, "budgets", "id") and not table_has_column(
            connection, "budgets", "user_id"
        ):
            connection.execute("ALTER TABLE budgets RENAME TO budgets_legacy")
            connection.execute(
                """
                CREATE TABLE budgets (
                    user_id INTEGER PRIMARY KEY,
                    amount REAL NOT NULL
                )
                """
            )

        connection.commit()
    finally:
        connection.close()


def error_response(message, status_code=400):
    return jsonify({"error": message}), status_code


def parse_date(value):
    if not isinstance(value, str) or not value.strip():
        return False

    try:
        parsed_date = datetime.strptime(value.strip(), "%Y-%m-%d")
        return parsed_date.strftime("%Y-%m-%d") == value.strip()
    except ValueError:
        return False


def parse_amount(value):
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return None

    if not math.isfinite(numeric_value):
        return None

    return numeric_value


def validate_transaction(data):
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


def validate_credentials(data, require_username_rules=True):
    if not isinstance(data, dict):
        return "Request body is required"

    username = data.get("username")
    password = data.get("password")

    if not isinstance(username, str) or not username.strip():
        return "Username is required"

    username = username.strip()

    if require_username_rules:
        if len(username) < MIN_USERNAME_LENGTH or len(username) > MAX_USERNAME_LENGTH:
            return (
                f"Username must be between {MIN_USERNAME_LENGTH} and "
                f"{MAX_USERNAME_LENGTH} characters"
            )

        if not USERNAME_PATTERN.match(username):
            return (
                "Username can only contain letters, numbers, "
                "dots, underscores and hyphens"
            )

    if not isinstance(password, str) or not password:
        return "Password is required"

    if require_username_rules and len(password) < MIN_PASSWORD_LENGTH:
        return f"Password must be at least {MIN_PASSWORD_LENGTH} characters"

    return None


def generate_token(user_id, username):
    payload = {
        "user_id": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS),
        "iat": datetime.now(timezone.utc),
    }

    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def login_required(view_function):
    @wraps(view_function)
    def wrapped(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return error_response("Authentication required", 401)

        token = auth_header.split(" ", 1)[1].strip()

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return error_response("Session expired, please log in again", 401)
        except jwt.InvalidTokenError:
            return error_response("Invalid authentication token", 401)

        g.user_id = payload.get("user_id")
        g.username = payload.get("username")

        return view_function(*args, **kwargs)

    return wrapped


@app.route("/")
def home():
    return jsonify(
        {
            "message": "Smart Expense Tracker API is running"
        }
    )


@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    error = validate_credentials(data, require_username_rules=True)

    if error:
        return error_response(error, 400)

    username = data["username"].strip()
    password = data["password"]

    connection = get_db_connection()

    try:
        existing_user = connection.execute(
            "SELECT id FROM users WHERE username = ?",
            (username,),
        ).fetchone()

        if existing_user is not None:
            return error_response("Username is already taken", 409)

        password_hash = generate_password_hash(password)
        created_at = datetime.now(timezone.utc).isoformat()

        cursor = connection.execute(
            """
            INSERT INTO users (username, password_hash, created_at)
            VALUES (?, ?, ?)
            """,
            (username, password_hash, created_at),
        )

        connection.commit()

        user_id = cursor.lastrowid
        token = generate_token(user_id, username)

        return (
            jsonify(
                {
                    "token": token,
                    "user": {"id": user_id, "username": username},
                }
            ),
            201,
        )
    except sqlite3.Error:
        connection.rollback()
        app.logger.exception("Failed to register user")
        return error_response("Unable to register user", 500)
    finally:
        connection.close()


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    error = validate_credentials(data, require_username_rules=False)

    if error:
        return error_response(error, 400)

    username = data["username"].strip()
    password = data["password"]

    connection = get_db_connection()

    try:
        user = connection.execute(
            "SELECT id, username, password_hash FROM users WHERE username = ?",
            (username,),
        ).fetchone()

        if user is None or not check_password_hash(user["password_hash"], password):
            return error_response("Invalid username or password", 401)

        token = generate_token(user["id"], user["username"])

        return jsonify(
            {
                "token": token,
                "user": {"id": user["id"], "username": user["username"]},
            }
        )
    except sqlite3.Error:
        app.logger.exception("Failed to log in user")
        return error_response("Unable to log in", 500)
    finally:
        connection.close()


@app.route("/api/auth/me", methods=["GET"])
@login_required
def get_current_user():
    return jsonify({"user": {"id": g.user_id, "username": g.username}})


@app.route("/api/transactions", methods=["GET"])
@login_required
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
        WHERE user_id = ?
    """

    parameters = [g.user_id]

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
@login_required
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
                user_id,
                type,
                description,
                amount,
                category,
                date
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                g.user_id,
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
@login_required
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
            WHERE id = ? AND user_id = ?
            """,
            (transaction_id, g.user_id),
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
            WHERE id = ? AND user_id = ?
            """,
            (
                data["type"],
                data["description"].strip(),
                parse_amount(data["amount"]),
                data["category"].strip(),
                data["date"].strip(),
                transaction_id,
                g.user_id,
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
@login_required
def delete_transaction(transaction_id):
    connection = get_db_connection()

    try:
        existing_transaction = connection.execute(
            """
            SELECT id
            FROM transactions
            WHERE id = ? AND user_id = ?
            """,
            (transaction_id, g.user_id),
        ).fetchone()

        if existing_transaction is None:
            return error_response(
                "Transaction not found",
                404,
            )

        connection.execute(
            """
            DELETE FROM transactions
            WHERE id = ? AND user_id = ?
            """,
            (transaction_id, g.user_id),
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
@login_required
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
            WHERE user_id = ?
            """,
            (g.user_id,),
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
@login_required
def get_category_summary():
    connection = get_db_connection()

    try:
        categories = connection.execute(
            """
            SELECT
                category,
                SUM(amount) AS total
            FROM transactions
            WHERE type = 'expense' AND user_id = ?
            GROUP BY category
            ORDER BY total DESC
            """,
            (g.user_id,),
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
@login_required
def get_monthly_summary():
    connection = get_db_connection()

    try:
        monthly = connection.execute(
            """
            SELECT
                substr(date, 1, 7) AS month,
                SUM(amount) AS total
            FROM transactions
            WHERE type = 'expense' AND user_id = ?
            GROUP BY substr(date, 1, 7)
            ORDER BY month DESC
            """,
            (g.user_id,),
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
@login_required
def get_budget():
    connection = get_db_connection()

    try:
        budget = connection.execute(
            """
            SELECT amount
            FROM budgets
            WHERE user_id = ?
            """,
            (g.user_id,),
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
@login_required
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
            INSERT INTO budgets (user_id, amount)
            VALUES (?, ?)
            ON CONFLICT(user_id)
            DO UPDATE SET amount = excluded.amount
            """,
            (g.user_id, amount),
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
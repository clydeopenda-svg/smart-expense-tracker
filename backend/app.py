from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

transactions = []


@app.route("/")
def home():
    return jsonify({
        "message": "Smart Expense Tracker API is running"
    })


@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    return jsonify(transactions)


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json()

    transaction = {
        "id": len(transactions) + 1,
        "type": data.get("type"),
        "description": data.get("description"),
        "amount": data.get("amount"),
        "category": data.get("category"),
        "date": data.get("date"),
    }

    transactions.append(transaction)

    return jsonify(transaction), 201


if __name__ == "__main__":
    app.run(debug=True)
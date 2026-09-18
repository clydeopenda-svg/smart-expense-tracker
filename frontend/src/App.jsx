import { useEffect, useState } from "react";
import "./index.css";

const API_URL = "http://127.0.0.1:5000/api/transactions";

function App() {
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      setTransactions(data);
    } catch (error) {
      console.error("Could not load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const newTransaction = {
      type,
      description,
      amount: Number(amount),
      category,
      date,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }

      const savedTransaction = await response.json();

      setTransactions([savedTransaction, ...transactions]);

      setDescription("");
      setAmount("");
      setCategory("Food");
      setDate("");
    } catch (error) {
      console.error("Could not add transaction:", error);
    }
  };

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Smart Expense Tracker</h1>
        <p>Track your income and expenses in one place.</p>
      </header>

      <main className="container">
        <section className="summary-grid">
          <div className="summary-card">
            <p>Current Balance</p>
            <h2>KSh {balance.toLocaleString()}</h2>
          </div>

          <div className="summary-card">
            <p>Total Income</p>
            <h2>KSh {totalIncome.toLocaleString()}</h2>
          </div>

          <div className="summary-card">
            <p>Total Expenses</p>
            <h2>KSh {totalExpenses.toLocaleString()}</h2>
          </div>
        </section>

        <section className="transaction-card">
          <h2>Add Transaction</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="type">Transaction Type</label>

              <select
                id="type"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>

              <input
                id="description"
                type="text"
                placeholder="e.g. Lunch"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount</label>

              <input
                id="amount"
                type="number"
                placeholder="e.g. 500"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>

              <select
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Bills">Bills</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Salary">Salary</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>

              <input
                id="date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>

            <button type="submit">Add Transaction</button>
          </form>
        </section>

        <section className="transaction-card transaction-list">
          <h2>Recent Transactions</h2>

          {loading ? (
            <p>Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p>No transactions yet.</p>
          ) : (
            transactions.map((transaction) => (
              <div className="transaction-item" key={transaction.id}>
                <div>
                  <h3>{transaction.description}</h3>
                  <p>
                    {transaction.category} • {transaction.date}
                  </p>
                </div>

                <strong
                  className={
                    transaction.type === "income" ? "income" : "expense"
                  }
                >
                  {transaction.type === "income" ? "+" : "-"} KSh{" "}
                  {Number(transaction.amount).toLocaleString()}
                </strong>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
import { useState } from "react";
import "./index.css";

function App() {
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: "expense",
      description: "Lunch",
      amount: 500,
      category: "Food",
      date: "2026-09-17",
    },
    {
      id: 2,
      type: "income",
      description: "Salary",
      amount: 25000,
      category: "Salary",
      date: "2026-09-15",
    },
  ]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const newTransaction = {
      id: Date.now(),
      type,
      description,
      amount: Number(amount),
      category,
      date,
    };

    setTransactions([newTransaction, ...transactions]);

    setDescription("");
    setAmount("");
    setCategory("Food");
    setDate("");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Smart Expense Tracker</h1>
        <p>Track your income and expenses in one place.</p>
      </header>

      <main className="container">
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

          {transactions.length === 0 ? (
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
                    transaction.type === "income"
                      ? "income"
                      : "expense"
                  }
                >
                  {transaction.type === "income" ? "+" : "-"} KSh{" "}
                  {transaction.amount.toLocaleString()}
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
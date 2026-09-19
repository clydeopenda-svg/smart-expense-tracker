import { useEffect, useState } from "react";
import "./index.css";

const API_URL = "http://127.0.0.1:5000/api/transactions";

const categories = [
  "Food",
  "Transport",
  "Bills",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];

function App() {
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [monthlyBudget, setMonthlyBudget] = useState(
    Number(localStorage.getItem("monthlyBudget")) || 0
  );
  const [budgetInput, setBudgetInput] = useState("");

  const loadTransactions = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      setTransactions(data);
    } catch (error) {
      console.error("Could not load transactions:", error);
      setErrorMessage("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!description.trim()) {
      setErrorMessage("Please enter a description.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setErrorMessage("Amount must be greater than zero.");
      return;
    }

    if (!date) {
      setErrorMessage("Please select a date.");
      return;
    }

    const newTransaction = {
      type,
      description: description.trim(),
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add transaction");
      }

      setTransactions([data, ...transactions]);

      setDescription("");
      setAmount("");
      setCategory("Food");
      setDate("");
    } catch (error) {
      console.error("Could not add transaction:", error);
      setErrorMessage(error.message);
    }
  };

  const handleDelete = async (transactionId) => {
    try {
      const response = await fetch(`${API_URL}/${transactionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      setTransactions(
        transactions.filter(
          (transaction) => transaction.id !== transactionId
        )
      );
    } catch (error) {
      console.error("Could not delete transaction:", error);
      setErrorMessage("Could not delete transaction.");
    }
  };

  const handleBudgetSubmit = (event) => {
    event.preventDefault();

    const newBudget = Number(budgetInput);

    if (newBudget <= 0) {
      setErrorMessage("Monthly budget must be greater than zero.");
      return;
    }

    localStorage.setItem("monthlyBudget", newBudget);
    setMonthlyBudget(newBudget);
    setBudgetInput("");
    setErrorMessage("");
  };

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const balance = totalIncome - totalExpenses;

  const budgetRemaining = monthlyBudget - totalExpenses;

  const budgetPercentage =
    monthlyBudget > 0
      ? Math.min((totalExpenses / monthlyBudget) * 100, 100)
      : 0;

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType =
      filterType === "all" || transaction.type === filterType;

    const matchesCategory =
      filterCategory === "all" ||
      transaction.category === filterCategory;

    return matchesType && matchesCategory;
  });

  const categoryTotals = categories.map((categoryName) => {
    const total = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category === categoryName
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return {
      category: categoryName,
      total,
    };
  });

  const highestCategoryTotal = Math.max(
    ...categoryTotals.map((item) => item.total),
    1
  );

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <div>
            <p className="eyebrow">PERSONAL FINANCE</p>
            <h1>Smart Expense Tracker</h1>
            <p className="hero-description">
              Understand your money at a glance.
            </p>
          </div>

          <div className="hero-date">
            <span>Dashboard</span>
            <strong>{new Date().toLocaleDateString()}</strong>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <section className="balance-card">
          <div className="balance-top">
            <div>
              <p className="card-label">TOTAL BALANCE</p>
              <p className="balance-caption">Available funds</p>
            </div>

            <div className="balance-menu">•••</div>
          </div>

          <div className="balance-main">
            <h2>KSh {balance.toLocaleString()}</h2>

            <div className="balance-pill">
              <span>{balance >= 0 ? "↗" : "↘"}</span>
              <span>{balance >= 0 ? "Positive balance" : "Review spending"}</span>
            </div>
          </div>

          <div className="balance-footer">
            <div>
              <span>Income</span>
              <strong>+ KSh {totalIncome.toLocaleString()}</strong>
            </div>

            <div>
              <span>Expenses</span>
              <strong>- KSh {totalExpenses.toLocaleString()}</strong>
            </div>

            <div className="balance-symbol">KES</div>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card income-card">
            <div className="stat-icon">↗</div>
            <p>Income</p>
            <h3>KSh {totalIncome.toLocaleString()}</h3>
            <span>Total money received</span>
          </div>

          <div className="stat-card expense-card">
            <div className="stat-icon">↘</div>
            <p>Expenses</p>
            <h3>KSh {totalExpenses.toLocaleString()}</h3>
            <span>Total money spent</span>
          </div>

          <div className="stat-card budget-stat-card">
            <div className="stat-icon">◎</div>
            <p>Budget Remaining</p>
            <h3>
              KSh{" "}
              {monthlyBudget > 0
                ? budgetRemaining.toLocaleString()
                : "—"}
            </h3>
            <span>
              {monthlyBudget > 0
                ? "Available this month"
                : "No budget set"}
            </span>
          </div>
        </section>

        <section className="main-grid">
          <div className="left-column">
            <section className="dashboard-card">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">SPENDING</p>
                  <h2>Where your money goes</h2>
                </div>
                <span className="section-badge">Categories</span>
              </div>

              {totalExpenses === 0 ? (
                <div className="empty-state">
                  <span>◎</span>
                  <p>No expense data available yet.</p>
                  <small>Add an expense to see your spending breakdown.</small>
                </div>
              ) : (
                <div className="spending-chart">
                  {categoryTotals
                    .filter((item) => item.total > 0)
                    .map((item) => (
                      <div className="spending-row" key={item.category}>
                        <div className="spending-info">
                          <span>{item.category}</span>
                          <strong>
                            KSh {item.total.toLocaleString()}
                          </strong>
                        </div>

                        <div className="spending-track">
                          <div
                            className="spending-fill"
                            style={{
                              width: `${
                                (item.total / highestCategoryTotal) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section className="dashboard-card">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">ACTIVITY</p>
                  <h2>Recent transactions</h2>
                </div>

                <span className="transaction-count">
                  {filteredTransactions.length} items
                </span>
              </div>

              <div className="filter-grid">
                <div className="form-group">
                  <label htmlFor="filter-type">Type</label>

                  <select
                    id="filter-type"
                    value={filterType}
                    onChange={(event) =>
                      setFilterType(event.target.value)
                    }
                  >
                    <option value="all">All transactions</option>
                    <option value="income">Income</option>
                    <option value="expense">Expenses</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="filter-category">Category</label>

                  <select
                    id="filter-category"
                    value={filterCategory}
                    onChange={(event) =>
                      setFilterCategory(event.target.value)
                    }
                  >
                    <option value="all">All categories</option>

                    {categories.map((categoryName) => (
                      <option
                        value={categoryName}
                        key={categoryName}
                      >
                        {categoryName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <p className="status-message">
                  Loading transactions...
                </p>
              ) : filteredTransactions.length === 0 ? (
                <div className="empty-state">
                  <span>○</span>
                  <p>No matching transactions.</p>
                  <small>Try changing your filters.</small>
                </div>
              ) : (
                <div className="transaction-list">
                  {filteredTransactions.map((transaction) => (
                    <div
                      className="modern-transaction"
                      key={transaction.id}
                    >
                      <div className="transaction-icon">
                        {transaction.type === "income" ? "↗" : "↘"}
                      </div>

                      <div className="transaction-details">
                        <h3>{transaction.description}</h3>
                        <p>
                          {transaction.category} · {transaction.date}
                        </p>
                      </div>

                      <div className="transaction-value">
                        <strong
                          className={
                            transaction.type === "income"
                              ? "income"
                              : "expense"
                          }
                        >
                          {transaction.type === "income" ? "+" : "-"} KSh{" "}
                          {Number(transaction.amount).toLocaleString()}
                        </strong>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDelete(transaction.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="right-column">
            <section className="dashboard-card budget-panel">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">MONTHLY PLAN</p>
                  <h2>Budget</h2>
                </div>
              </div>

              <form onSubmit={handleBudgetSubmit}>
                <div className="form-group">
                  <label htmlFor="budget">Monthly budget</label>

                  <input
                    id="budget"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 30000"
                    value={budgetInput}
                    onChange={(event) =>
                      setBudgetInput(event.target.value)
                    }
                  />
                </div>

                <button type="submit" className="primary-button">
                  Save budget
                </button>
              </form>

              {monthlyBudget > 0 && (
                <div className="budget-progress">
                  <div className="budget-progress-heading">
                    <span>Spent</span>
                    <strong>{Math.round(budgetPercentage)}%</strong>
                  </div>

                  <div className="budget-track">
                    <div
                      className="budget-fill"
                      style={{
                        width: `${budgetPercentage}%`,
                      }}
                    />
                  </div>

                  <div className="budget-numbers">
                    <span>
                      KSh {totalExpenses.toLocaleString()} spent
                    </span>
                    <span>
                      KSh {monthlyBudget.toLocaleString()} limit
                    </span>
                  </div>

                  {budgetRemaining < 0 && (
                    <p className="budget-warning">
                      You have exceeded your monthly budget.
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="dashboard-card quick-insight">
              <p className="section-kicker">QUICK INSIGHT</p>

              <h2>
                {totalExpenses === 0
                  ? "Start tracking"
                  : "Keep an eye on your spending"}
              </h2>

              <p>
                {totalExpenses === 0
                  ? "Add your first expense to start understanding your spending habits."
                  : "Your dashboard updates automatically whenever you add or remove a transaction."}
              </p>
            </section>
          </aside>
        </section>

        <section className="dashboard-card add-transaction-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">NEW ACTIVITY</p>
              <h2>Add a transaction</h2>
            </div>
          </div>

          {errorMessage && (
            <p className="error-message">{errorMessage}</p>
          )}

          <form className="transaction-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="type">Type</label>

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
                placeholder="e.g. Groceries"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount</label>

              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 1500"
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
                onChange={(event) =>
                  setCategory(event.target.value)
                }
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

            <button type="submit" className="primary-button">
              Add transaction
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
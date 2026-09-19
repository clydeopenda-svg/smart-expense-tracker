import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api/transactions";

const categories = [
  { name: "Food", icon: "🍴", className: "category-food" },
  { name: "Transport", icon: "🚗", className: "category-transport" },
  { name: "Bills", icon: "⚡", className: "category-bills" },
  { name: "Shopping", icon: "🛍️", className: "category-shopping" },
  {
    name: "Entertainment",
    icon: "🎬",
    className: "category-entertainment",
  },
  { name: "Health", icon: "❤️", className: "category-health" },
  { name: "Education", icon: "📚", className: "category-education" },
  { name: "Other", icon: "•••", className: "category-other" },
];

function App() {
  const [transactions, setTransactions] = useState([]);

  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [monthlyBudget, setMonthlyBudget] = useState(50000);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load transactions");
      }

      const data = await response.json();

      setTransactions(data);
      setError("");
    } catch (err) {
      setError("Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          description: description.trim(),
          amount: Number(amount),
          category,
          date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add transaction");
      }

      setTransactions((current) => [data, ...current]);

      setDescription("");
      setAmount("");
      setType("expense");
      setCategory("Food");
      setDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete transaction");
      }

      setTransactions((current) =>
        current.filter((transaction) => transaction.id !== id)
      );
    } catch (err) {
      setError(err.message);
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function getCategoryDetails(transactionCategory) {
    return (
      categories.find((item) => item.name === transactionCategory) || {
        name: transactionCategory,
        icon: "•••",
        className: "category-other",
      }
    );
  }

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

  const categoryTotals = categories
    .map((item) => {
      const total = transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" &&
            transaction.category === item.name
        )
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

      return {
        ...item,
        total,
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const largestCategory = categoryTotals[0];

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType =
      filterType === "all" || transaction.type === filterType;

    const matchesCategory =
      filterCategory === "all" ||
      transaction.category === filterCategory;

    return matchesType && matchesCategory;
  });

  return (
    <div className="app-shell">
      <header className="top-navigation">
        <div className="brand-area">
          <div className="brand-mark">S</div>

          <div>
            <h1>SmartSpend</h1>
            <span>Personal finance</span>
          </div>
        </div>

        <nav className="main-navigation">
          <a href="#dashboard" className="nav-link active">
            Dashboard
          </a>

          <a href="#transactions" className="nav-link">
            Transactions
          </a>

          <a href="#budget" className="nav-link">
            Budget
          </a>

          <a href="#insights" className="nav-link">
            Insights
          </a>
        </nav>

        <div className="profile-area">
          <div className="notification-button">⌁</div>

          <div className="profile-avatar">CO</div>

          <div className="profile-details">
            <strong>Clyde</strong>
            <span>Personal account</span>
          </div>
        </div>
      </header>

      <main className="dashboard-container" id="dashboard">
        <section className="dashboard-hero">
          <div>
            <p className="eyebrow">FINANCIAL OVERVIEW</p>

            <h2>
              Good to see you,
              <br />
              <span>Clyde.</span>
            </h2>

            <p className="hero-description">
              Keep track of your money and make every shilling count.
            </p>
          </div>

          <div className="hero-date">
            <span>Today</span>
            <strong>
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
          </div>
        </section>

        <section className="balance-card">
          <div className="balance-card-top">
            <div>
              <span className="balance-label">TOTAL BALANCE</span>
              <h3>{formatCurrency(balance)}</h3>
            </div>

            <div className="balance-badge">
              {balance >= 0 ? "Positive balance" : "Review balance"}
            </div>
          </div>

          <div className="balance-footer">
            <div>
              <span>Income</span>

              <strong className="income-text">
                +{formatCurrency(totalIncome)}
              </strong>
            </div>

            <div>
              <span>Expenses</span>

              <strong className="expense-text">
                -{formatCurrency(totalExpenses)}
              </strong>
            </div>
          </div>
        </section>

        <section className="statistics-grid">
          <article className="stat-card">
            <div className="stat-icon income-icon">↗</div>

            <div>
              <span>Total income</span>
              <strong>{formatCurrency(totalIncome)}</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon expense-icon">↘</div>

            <div>
              <span>Total expenses</span>
              <strong>{formatCurrency(totalExpenses)}</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon budget-icon">◎</div>

            <div>
              <span>Budget remaining</span>
              <strong>{formatCurrency(budgetRemaining)}</strong>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-icon transaction-icon-stat">#</div>

            <div>
              <span>Transactions</span>
              <strong>{transactions.length}</strong>
            </div>
          </article>
        </section>

        <section className="financial-summary-card">
          <div className="financial-summary-header">
            <div>
              <p className="section-kicker">FINANCIAL SUMMARY</p>
              <h3>Your money at a glance</h3>
            </div>

            <div className="summary-period">Current overview</div>
          </div>

          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-item-header">
                <span>Income</span>
                <span className="summary-dot income-dot"></span>
              </div>

              <strong className="income-text">
                {formatCurrency(totalIncome)}
              </strong>

              <div className="summary-bar">
                <div
                  className="summary-bar-fill income-summary-fill"
                  style={{
                    width:
                      totalIncome > 0
                        ? `${Math.min(
                            (totalIncome /
                              Math.max(
                                totalIncome,
                                totalExpenses,
                                1
                              )) *
                              100,
                            100
                          )}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-item-header">
                <span>Expenses</span>
                <span className="summary-dot expense-dot"></span>
              </div>

              <strong className="expense-text">
                {formatCurrency(totalExpenses)}
              </strong>

              <div className="summary-bar">
                <div
                  className="summary-bar-fill expense-summary-fill"
                  style={{
                    width:
                      totalExpenses > 0
                        ? `${Math.min(
                            (totalExpenses /
                              Math.max(
                                totalIncome,
                                totalExpenses,
                                1
                              )) *
                              100,
                            100
                          )}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

            <div className="summary-item summary-balance">
              <div className="summary-item-header">
                <span>Net position</span>
                <span className="summary-dot balance-dot"></span>
              </div>

              <strong>{formatCurrency(balance)}</strong>

              <p>
                {balance >= 0
                  ? "Your income is currently higher than your expenses."
                  : "Your expenses are currently higher than your income."}
              </p>
            </div>
          </div>
        </section>

        <section className="dashboard-columns">
          <div className="dashboard-main-column">
            <section className="dashboard-card spending-card">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">SPENDING</p>
                  <h3>Where your money goes</h3>
                </div>

                {largestCategory && (
                  <div className="category-highlight">
                    <span>{largestCategory.icon}</span>

                    <div>
                      <small>Highest category</small>
                      <strong>{largestCategory.name}</strong>
                    </div>
                  </div>
                )}
              </div>

              {categoryTotals.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">◎</div>

                  <h4>No spending data yet</h4>

                  <p>
                    Add an expense to start seeing your spending
                    breakdown.
                  </p>
                </div>
              ) : (
                <div className="category-list">
                  {categoryTotals.map((item) => {
                    const percentage =
                      totalExpenses > 0
                        ? (item.total / totalExpenses) * 100
                        : 0;

                    return (
                      <div className="category-row" key={item.name}>
                        <div className="category-row-top">
                          <div className="category-name">
                            <span
                              className={`category-icon ${item.className}`}
                            >
                              {item.icon}
                            </span>

                            <strong>{item.name}</strong>
                          </div>

                          <div className="category-amount">
                            <strong>
                              {formatCurrency(item.total)}
                            </strong>

                            <span>{Math.round(percentage)}%</span>
                          </div>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section
              className="dashboard-card transactions-card"
              id="transactions"
            >
              <div className="section-heading">
                <div>
                  <p className="section-kicker">ACTIVITY</p>
                  <h3>Recent transactions</h3>
                </div>

                <span className="transaction-count">
                  {filteredTransactions.length} shown
                </span>
              </div>

              <div className="filter-bar">
                <select
                  value={filterType}
                  onChange={(event) =>
                    setFilterType(event.target.value)
                  }
                >
                  <option value="all">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(event) =>
                    setFilterCategory(event.target.value)
                  }
                >
                  <option value="all">All categories</option>

                  {categories.map((item) => (
                    <option value={item.name} key={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="status-message">
                  Loading transactions...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="empty-state small-empty">
                  <div className="empty-icon">○</div>

                  <h4>No transactions found</h4>

                  <p>
                    Try changing your filters or add a new
                    transaction.
                  </p>
                </div>
              ) : (
                <div className="transaction-list">
                  {filteredTransactions.map((transaction) => {
                    const categoryDetails = getCategoryDetails(
                      transaction.category
                    );

                    return (
                      <article
                        className={`modern-transaction ${
                          transaction.type === "income"
                            ? "transaction-income"
                            : "transaction-expense"
                        }`}
                        key={transaction.id}
                      >
                        <div
                          className={`transaction-icon ${categoryDetails.className}`}
                        >
                          {categoryDetails.icon}
                        </div>

                        <div className="transaction-information">
                          <div className="transaction-title-row">
                            <h4>{transaction.description}</h4>

                            <span
                              className={`transaction-type-badge ${
                                transaction.type === "income"
                                  ? "income-badge"
                                  : "expense-badge"
                              }`}
                            >
                              {transaction.type === "income"
                                ? "Income"
                                : "Expense"}
                            </span>
                          </div>

                          <div className="transaction-meta">
                            <span>{transaction.category}</span>
                            <span>•</span>
                            <span>{transaction.date}</span>
                          </div>
                        </div>

                        <div className="transaction-value">
                          <strong
                            className={
                              transaction.type === "income"
                                ? "income-text"
                                : "expense-text"
                            }
                          >
                            {transaction.type === "income"
                              ? "+"
                              : "-"}
                            {formatCurrency(
                              Number(transaction.amount)
                            )}
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
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="dashboard-side-column">
            <section className="dashboard-card budget-card" id="budget">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">MONTHLY PLAN</p>
                  <h3>Budget</h3>
                </div>

                <span className="budget-symbol">◎</span>
              </div>

              <div className="budget-amount">
                <span>Monthly limit</span>
                <strong>{formatCurrency(monthlyBudget)}</strong>
              </div>

              <div className="budget-progress">
                <div className="budget-progress-header">
                  <span>Spent</span>
                  <strong>{Math.round(budgetPercentage)}%</strong>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill budget-fill"
                    style={{
                      width: `${budgetPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <div className="budget-summary">
                <div>
                  <span>Spent</span>
                  <strong>{formatCurrency(totalExpenses)}</strong>
                </div>

                <div>
                  <span>Remaining</span>
                  <strong>{formatCurrency(budgetRemaining)}</strong>
                </div>
              </div>

              <label className="budget-input-label">
                Adjust monthly budget

                <input
                  type="number"
                  min="0"
                  value={monthlyBudget}
                  onChange={(event) =>
                    setMonthlyBudget(Number(event.target.value))
                  }
                />
              </label>
            </section>

            <section className="dashboard-card insight-card" id="insights">
              <div className="insight-symbol">✦</div>

              <p className="section-kicker">QUICK INSIGHT</p>

              {largestCategory ? (
                <>
                  <h3>
                    {largestCategory.name} is your biggest spending
                    category.
                  </h3>

                  <p>
                    You have spent{" "}
                    <strong>
                      {formatCurrency(largestCategory.total)}
                    </strong>{" "}
                    on {largestCategory.name} so far.
                  </p>
                </>
              ) : (
                <>
                  <h3>Your financial picture starts here.</h3>

                  <p>
                    Add a few transactions and SmartSpend will begin
                    showing useful spending insights.
                  </p>
                </>
              )}
            </section>
          </aside>
        </section>

        <section className="dashboard-card add-transaction-card">
          <div className="section-heading">
            <div>
              <p className="section-kicker">QUICK ACTION</p>
              <h3>Add transaction</h3>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="transaction-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Type</label>

              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>

              <input
                type="text"
                placeholder="e.g. Groceries"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label>Amount</label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Category</label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option value={item.name} key={item.name}>
                    {item.name}
                  </option>
                ))}

                <option value="Salary">Salary</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>

              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <button
              className="submit-button"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add transaction"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
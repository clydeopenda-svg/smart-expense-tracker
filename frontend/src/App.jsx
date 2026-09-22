import { useEffect, useState } from "react";

const API_BASE_URL = "/api";
const API_URL = `${API_BASE_URL}/transactions`;
const BUDGET_URL = `${API_BASE_URL}/budget`;

function Icon({ name, size = 20 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  const icons = {
    food: (
      <svg {...commonProps}>
        <path d="M7 3v18" />
        <path d="M4 3v6a3 3 0 0 0 6 0V3" />
        <path d="M17 3v18" />
        <path d="M17 3c2 1.5 3 3.5 3 6v2h-3" />
      </svg>
    ),
    transport: (
      <svg {...commonProps}>
        <path d="M5 17h14l-1-8H6l-1 8Z" />
        <path d="M7 9l1.5-4h7L17 9" />
        <circle cx="8" cy="17" r="1.5" />
        <circle cx="16" cy="17" r="1.5" />
      </svg>
    ),
    bills: (
      <svg {...commonProps}>
        <path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" />
      </svg>
    ),
    shopping: (
      <svg {...commonProps}>
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
    ),
    entertainment: (
      <svg {...commonProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m10 9 5 3-5 3V9Z" />
      </svg>
    ),
    health: (
      <svg {...commonProps}>
        <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
        <path d="M12 8v6" />
        <path d="M9 11h6" />
      </svg>
    ),
    education: (
      <svg {...commonProps}>
        <path d="m3 9 9-5 9 5-9 5-9-5Z" />
        <path d="M7 11v5c2.5 2 7.5 2 10 0v-5" />
        <path d="M21 9v6" />
      </svg>
    ),
    other: (
      <svg {...commonProps}>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </svg>
    ),
    balance: (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v10" />
        <path d="M15 9.5c-.7-.7-1.7-1-3-1-1.7 0-3 .8-3 2s1.3 2 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.3-.3-3-1" />
      </svg>
    ),
    income: (
      <svg {...commonProps}>
        <path d="M5 15 15 5" />
        <path d="M8 5h7v7" />
        <path d="M19 19H5V5" />
      </svg>
    ),
    expense: (
      <svg {...commonProps}>
        <path d="M5 9 15 19" />
        <path d="M8 19h7v-7" />
        <path d="M19 5H5v14" />
      </svg>
    ),
    budget: (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    insight: (
      <svg {...commonProps}>
        <path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" />
      </svg>
    ),
  };

  return icons[name] || icons.other;
}

const categories = [
  { name: "Food", icon: "food" },
  { name: "Transport", icon: "transport" },
  { name: "Bills", icon: "bills" },
  { name: "Shopping", icon: "shopping" },
  { name: "Entertainment", icon: "entertainment" },
  { name: "Health", icon: "health" },
  { name: "Education", icon: "education" },
  { name: "Other", icon: "other" },
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
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [budgetError, setBudgetError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [transactionsResponse, budgetResponse] =
        await Promise.all([
          fetch(API_URL),
          fetch(BUDGET_URL),
        ]);

      if (!transactionsResponse.ok) {
        throw new Error("Failed to load transactions.");
      }

      if (!budgetResponse.ok) {
        throw new Error("Failed to load budget.");
      }

      const transactionsData =
        await transactionsResponse.json();

      const budgetData = await budgetResponse.json();

      setTransactions(transactionsData);
      setMonthlyBudget(Number(budgetData.amount) || 0);
      setBudgetInput(
        budgetData.amount ? String(budgetData.amount) : ""
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function resetTransactionForm() {
    setType("expense");
    setDescription("");
    setAmount("");
    setCategory("Food");
    setDate(new Date().toISOString().split("T")[0]);
    setEditingId(null);
  }

  function resetFilters() {
    setFilterType("all");
    setFilterCategory("all");
    setFilterStartDate("");
    setFilterEndDate("");
  }

  function startEditing(transaction) {
    setEditingId(transaction.id);
    setType(transaction.type);
    setDescription(transaction.description);
    setAmount(String(transaction.amount));
    setCategory(transaction.category);
    setDate(transaction.date);

    window.setTimeout(() => {
      document
        .getElementById("transaction-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function cancelEditing() {
    resetTransactionForm();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const transactionData = {
        type,
        description,
        amount: Number(amount),
        category,
        date,
      };

      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transactionData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save transaction."
        );
      }

      if (isEditing) {
        setTransactions((currentTransactions) =>
          currentTransactions.map((transaction) =>
            transaction.id === editingId ? data : transaction
          )
        );
      } else {
        setTransactions((currentTransactions) => [
          data,
          ...currentTransactions,
        ]);
      }

      resetTransactionForm();
    } catch (err) {
      setError(err.message || "Failed to save transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(transactionId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/${transactionId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete transaction."
        );
      }

      setTransactions((currentTransactions) =>
        currentTransactions.filter(
          (transaction) => transaction.id !== transactionId
        )
      );

      if (editingId === transactionId) {
        resetTransactionForm();
      }
    } catch (err) {
      setError(err.message || "Failed to delete transaction.");
    }
  }

  async function handleBudgetSave(event) {
    event.preventDefault();

    try {
      setSavingBudget(true);
      setBudgetError("");

      const value = Number(budgetInput);

      if (!Number.isFinite(value) || value < 0) {
        throw new Error("Please enter a valid budget amount.");
      }

      const response = await fetch(BUDGET_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update budget."
        );
      }

      setMonthlyBudget(Number(data.amount) || 0);
      setBudgetInput(String(data.amount));
    } catch (err) {
      setBudgetError(
        err.message || "Failed to update budget."
      );
    } finally {
      setSavingBudget(false);
    }
  }

  const filteredTransactions = transactions.filter(
    (transaction) => {
      const matchesType =
        filterType === "all" ||
        transaction.type === filterType;

      const matchesCategory =
        filterCategory === "all" ||
        transaction.category === filterCategory;

      const matchesStartDate =
        !filterStartDate ||
        transaction.date >= filterStartDate;

      const matchesEndDate =
        !filterEndDate ||
        transaction.date <= filterEndDate;

      return (
        matchesType &&
        matchesCategory &&
        matchesStartDate &&
        matchesEndDate
      );
    }
  );

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  const balance = totalIncome - totalExpenses;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthlyExpenses = transactions
    .filter((transaction) => {
      if (
        transaction.type !== "expense" ||
        !transaction.date
      ) {
        return false;
      }

      const transactionDate = new Date(
        `${transaction.date}T00:00:00`
      );

      return (
        transactionDate.getFullYear() === currentYear &&
        transactionDate.getMonth() === currentMonth
      );
    })
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  const budgetRemaining =
    monthlyBudget - monthlyExpenses;

  const budgetPercentage =
    monthlyBudget > 0
      ? Math.min(
          (monthlyExpenses / monthlyBudget) * 100,
          100
        )
      : 0;

  const categoryTotals = categories.map((item) => {
    const total = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category === item.name
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount),
        0
      );

    return {
      ...item,
      total,
    };
  });

  const largestCategory = [...categoryTotals].sort(
    (a, b) => b.total - a.total
  )[0];

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function getCategoryDetails(categoryName) {
    return (
      categories.find(
        (item) => item.name === categoryName
      ) || {
        name: categoryName,
        icon: "other",
      }
    );
  }

  return (
    <div className="app-shell">
      <nav className="top-navigation">
        <div className="brand">
          <div className="brand-mark">S</div>

          <div>
            <strong>Smart Expense</strong>
            <span>Personal finance dashboard</span>
          </div>
        </div>

        <div className="nav-status">
          <span className="status-dot"></span>
          Finance overview
        </div>
      </nav>

      <main className="dashboard-container">
        <section className="hero-section">
          <div>
            <p className="section-kicker">
              YOUR MONEY AT A GLANCE
            </p>

            <h1>Take control of your money.</h1>

            <p className="hero-description">
              Track your spending, manage your budget, and
              understand where your money goes.
            </p>
          </div>

          <div className="hero-date">
            <span>Today</span>

            <strong>
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date())}
            </strong>
          </div>
        </section>

        {error && (
          <div className="alert-message">
            {error}
          </div>
        )}

        <section className="summary-grid">
          <article className="financial-summary-card balance-card">
            <div className="financial-summary-header">
              <div>
                <span className="summary-label">
                  Balance
                </span>

                <h2>{formatCurrency(balance)}</h2>
              </div>

              <span className="summary-icon">
                <Icon name="balance" size={22} />
              </span>
            </div>

            <p className="summary-note">
              Income minus all recorded expenses
            </p>
          </article>

          <article className="financial-summary-card income-card">
            <div className="financial-summary-header">
              <div>
                <span className="summary-label">
                  Total income
                </span>

                <h2>{formatCurrency(totalIncome)}</h2>
              </div>

              <span className="summary-icon">
                <Icon name="income" size={22} />
              </span>
            </div>

            <p className="summary-note">
              All income recorded so far
            </p>
          </article>

          <article className="financial-summary-card expense-card">
            <div className="financial-summary-header">
              <div>
                <span className="summary-label">
                  Total expenses
                </span>

                <h2>{formatCurrency(totalExpenses)}</h2>
              </div>

              <span className="summary-icon">
                <Icon name="expense" size={22} />
              </span>
            </div>

            <p className="summary-note">
              All expenses recorded so far
            </p>
          </article>
        </section>

        <section className="dashboard-layout">
          <div className="main-column">
            <section
              className="dashboard-card transaction-form-card"
              id="transaction-form"
            >
              <div className="card-heading">
                <div>
                  <p className="section-kicker">
                    {editingId !== null
                      ? "UPDATE TRANSACTION"
                      : "ADD TRANSACTION"}
                  </p>

                  <h2>
                    {editingId !== null
                      ? "Edit your transaction"
                      : "Record your money movement"}
                  </h2>
                </div>

                {editingId !== null && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label>
                    Type

                    <select
                      value={type}
                      onChange={(event) =>
                        setType(event.target.value)
                      }
                    >
                      <option value="expense">
                        Expense
                      </option>

                      <option value="income">
                        Income
                      </option>
                    </select>
                  </label>

                  <label>
                    Description

                    <input
                      type="text"
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="e.g. Groceries"
                      required
                    />
                  </label>

                  <label>
                    Amount

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(event) =>
                        setAmount(event.target.value)
                      }
                      placeholder="0"
                      required
                    />
                  </label>

                  <label>
                    Category

                    <select
                      value={category}
                      onChange={(event) =>
                        setCategory(event.target.value)
                      }
                    >
                      {categories.map((item) => (
                        <option
                          key={item.name}
                          value={item.name}
                        >
                          {item.name}
                        </option>
                      ))}

                      <option value="Salary">
                        Salary
                      </option>
                    </select>
                  </label>

                  <label>
                    Date

                    <input
                      type="date"
                      value={date}
                      onChange={(event) =>
                        setDate(event.target.value)
                      }
                      required
                    />
                  </label>
                </div>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? editingId !== null
                      ? "Updating..."
                      : "Saving..."
                    : editingId !== null
                    ? "Update transaction"
                    : "Add transaction"}
                </button>
              </form>
            </section>

            <section className="dashboard-card transactions-card">
              <div className="card-heading">
                <div>
                  <p className="section-kicker">
                    TRANSACTION HISTORY
                  </p>

                  <h2>Your transactions</h2>
                </div>

                <span className="transaction-count">
                  {filteredTransactions.length}
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
                  <option value="expense">
                    Expenses
                  </option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(event) =>
                    setFilterCategory(event.target.value)
                  }
                >
                  <option value="all">
                    All categories
                  </option>

                  {categories.map((item) => (
                    <option
                      key={item.name}
                      value={item.name}
                    >
                      {item.name}
                    </option>
                  ))}

                  <option value="Salary">Salary</option>
                </select>

                <label className="date-filter">
                  <span>From</span>

                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(event) =>
                      setFilterStartDate(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label className="date-filter">
                  <span>To</span>

                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(event) =>
                      setFilterEndDate(
                        event.target.value
                      )
                    }
                  />
                </label>

                <button
                  className="clear-filters-button"
                  type="button"
                  onClick={resetFilters}
                >
                  Clear filters
                </button>
              </div>

              {loading ? (
                <div className="empty-state">
                  <strong>
                    Loading transactions...
                  </strong>

                  <p>
                    Please wait while your financial data
                    loads.
                  </p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="empty-state">
                  <strong>
                    No transactions found.
                  </strong>

                  <p>
                    Add a transaction or change your
                    filters.
                  </p>
                </div>
              ) : (
                <div className="transaction-list">
                  {filteredTransactions.map(
                    (transaction) => {
                      const categoryDetails =
                        getCategoryDetails(
                          transaction.category
                        );

                      return (
                        <article
                          className="transaction-row"
                          key={transaction.id}
                        >
                          <div className="transaction-icon">
                            <Icon
                              name={categoryDetails.icon}
                              size={20}
                            />
                          </div>

                          <div className="transaction-details">
                            <strong>
                              {transaction.description}
                            </strong>

                            <span>
                              {transaction.category} ·{" "}
                              {transaction.date}
                            </span>
                          </div>

                          <strong
                            className={`transaction-amount ${transaction.type}`}
                          >
                            {transaction.type ===
                            "income"
                              ? "+"
                              : "-"}
                            {formatCurrency(
                              Number(
                                transaction.amount
                              )
                            )}
                          </strong>

                          <div className="transaction-actions">
                            <button
                              className="edit-button"
                              type="button"
                              onClick={() =>
                                startEditing(
                                  transaction
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  transaction.id
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="side-column">
            <section className="dashboard-card budget-card">
              <div className="card-heading">
                <div>
                  <p className="section-kicker">
                    MONTHLY PLAN
                  </p>

                  <h2>Monthly budget</h2>
                </div>

                <span className="budget-icon">
                  <Icon name="budget" size={22} />
                </span>
              </div>

              <form onSubmit={handleBudgetSave}>
                <label className="budget-input-label">
                  Set monthly budget

                  <div className="budget-input-wrapper">
                    <span>KES</span>

                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={budgetInput}
                      onChange={(event) =>
                        setBudgetInput(
                          event.target.value
                        )
                      }
                      placeholder="50000"
                    />
                  </div>
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={savingBudget}
                >
                  {savingBudget
                    ? "Saving..."
                    : "Save budget"}
                </button>
              </form>

              {budgetError && (
                <p className="form-error">
                  {budgetError}
                </p>
              )}

              <div className="budget-overview">
                <div>
                  <span>Spent this month</span>

                  <strong>
                    {formatCurrency(monthlyExpenses)}
                  </strong>
                </div>

                <div>
                  <span>Remaining</span>

                  <strong
                    className={
                      budgetRemaining < 0
                        ? "negative-value"
                        : ""
                    }
                  >
                    {formatCurrency(
                      budgetRemaining
                    )}
                  </strong>
                </div>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${budgetPercentage}%`,
                  }}
                ></div>
              </div>

              <div className="budget-progress-label">
                <span>
                  {Math.round(budgetPercentage)}% used
                </span>

                {monthlyBudget > 0 &&
                  monthlyExpenses > monthlyBudget && (
                    <span className="over-budget">
                      Over budget
                    </span>
                  )}
              </div>
            </section>

            <section className="dashboard-card category-card">
              <div className="card-heading">
                <div>
                  <p className="section-kicker">
                    SPENDING BREAKDOWN
                  </p>

                  <h2>Where your money goes</h2>
                </div>
              </div>

              <div className="category-list">
                {categoryTotals.map((item) => {
                  const percentage =
                    totalExpenses > 0
                      ? (item.total / totalExpenses) *
                        100
                      : 0;

                  return (
                    <div
                      className="category-item"
                      key={item.name}
                    >
                      <div className="category-item-top">
                        <span>
                          <Icon
                            name={item.icon}
                            size={16}
                          />
                          {item.name}
                        </span>

                        <strong>
                          {formatCurrency(item.total)}
                        </strong>
                      </div>

                      <div className="category-progress">
                        <div
                          style={{
                            width: `${percentage}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="insight-card">
              <span className="insight-icon">
                <Icon name="insight" size={22} />
              </span>

              <div>
                <p className="section-kicker">
                  QUICK INSIGHT
                </p>

                <h3>
                  {largestCategory?.total > 0
                    ? `${largestCategory.name} is your biggest spending category.`
                    : "Start adding transactions to see your spending insights."}
                </h3>

                {largestCategory?.total > 0 && (
                  <p>
                    You have recorded{" "}
                    {formatCurrency(
                      largestCategory.total
                    )}{" "}
                    in {largestCategory.name} expenses.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default App;
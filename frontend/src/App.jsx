import { useEffect, useRef, useState } from "react";

const API_BASE_URL = "/api";
const API_URL = `${API_BASE_URL}/transactions`;
const BUDGET_URL = `${API_BASE_URL}/budget`;
const THEME_STORAGE_KEY = "smart-expense-theme";

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
    search: (
      <svg {...commonProps}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 5 5" />
      </svg>
    ),
    sun: (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.5" />
        <path d="M12 19.5V22" />
        <path d="M4.2 4.2l1.8 1.8" />
        <path d="M18 18l1.8 1.8" />
        <path d="M2 12h2.5" />
        <path d="M19.5 12H22" />
        <path d="M4.2 19.8 6 18" />
        <path d="M18 6l1.8-1.8" />
      </svg>
    ),
    moon: (
      <svg {...commonProps}>
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
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

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getErrorMessage(err, fallback) {
  if (err instanceof TypeError) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  return err.message || fallback;
}

function App() {
  const [transactions, setTransactions] = useState([]);

  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [formError, setFormError] = useState("");

  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const [editingId, setEditingId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const deleteCancelRef = useRef(null);
  const deleteTriggerRef = useRef(null);

  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState("");
  const [savingBudget, setSavingBudget] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!deleteTarget) {
      return;
    }

    window.setTimeout(() => {
      deleteCancelRef.current?.focus();
    }, 0);

    function handleDialogKeyDown(event) {
      if (event.key === "Escape" && !deletingId) {
        closeDeleteDialog();
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown);
    };
  }, [deleteTarget, deletingId]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");
      setLoadFailed(false);

      const [transactionsResponse, budgetResponse] = await Promise.all([
        fetch(API_URL),
        fetch(BUDGET_URL),
      ]);

      if (!transactionsResponse.ok) {
        throw new Error("The server couldn't return your transactions. Please try again.");
      }

      if (!budgetResponse.ok) {
        throw new Error("The server couldn't return your budget. Please try again.");
      }

      const transactionsData = await transactionsResponse.json();
      const budgetData = await budgetResponse.json();

      setTransactions(transactionsData);
      setMonthlyBudget(Number(budgetData.amount) || 0);
      setBudgetInput(budgetData.amount ? String(budgetData.amount) : "");
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong while loading your data."));
      setLoadFailed(true);
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
    setFormError("");
  }

  function resetFilters() {
    setFilterType("all");
    setFilterCategory("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchTerm("");
  }

  function focusTransactionForm() {
    window.setTimeout(() => {
      const formSection = document.getElementById("transaction-form");
      formSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("transaction-description")?.focus();
    }, 50);
  }

  function startEditing(transaction) {
    setEditingId(transaction.id);
    setType(transaction.type);
    setDescription(transaction.description);
    setAmount(String(transaction.amount));
    setCategory(transaction.category);
    setDate(transaction.date);
    setFormError("");
    focusTransactionForm();
  }

  function cancelEditing() {
    resetTransactionForm();
    focusTransactionForm();
  }

  function validateTransactionForm() {
    const trimmedDescription = description.trim();
    const numericAmount = Number(amount);

    if (!trimmedDescription) {
      return "Please enter a description for the transaction.";
    }

    if (trimmedDescription.length > 100) {
      return "Description must be 100 characters or less.";
    }

    if (amount.trim() === "") {
      return "Please enter an amount.";
    }

    if (!Number.isFinite(numericAmount)) {
      return "Please enter a valid amount.";
    }

    if (numericAmount <= 0) {
      return "Amount must be greater than zero.";
    }

    if (!category) {
      return "Please select a category.";
    }

    if (!date) {
      return "Please select a date.";
    }

    const selectedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime())) {
      return "Please enter a valid date.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError("");
    setError("");

    const validationError = validateTransactionForm();

    if (validationError) {
      setFormError(validationError);

      window.setTimeout(() => {
        if (!description.trim()) {
          document.getElementById("transaction-description")?.focus();
        } else if (
          amount.trim() === "" ||
          !Number.isFinite(Number(amount)) ||
          Number(amount) <= 0
        ) {
          document.getElementById("transaction-amount")?.focus();
        } else if (!category) {
          document.getElementById("transaction-category")?.focus();
        } else if (!date) {
          document.getElementById("transaction-date")?.focus();
        }
      }, 0);

      return;
    }

    try {
      setSubmitting(true);

      const transactionData = {
        type,
        description: description.trim(),
        amount: Number(amount),
        category,
        date,
      };

      const isEditing = editingId !== null;

      const response = await fetch(
        isEditing ? `${API_URL}/${editingId}` : API_URL,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transactionData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save transaction.");
      }

      if (isEditing) {
        setTransactions((currentTransactions) =>
          currentTransactions.map((transaction) =>
            transaction.id === editingId ? data : transaction
          )
        );
        setSuccessMessage("Transaction updated.");
      } else {
        setTransactions((currentTransactions) => [
          data,
          ...currentTransactions,
        ]);
        setSuccessMessage("Transaction added.");
      }

      resetTransactionForm();

      window.setTimeout(() => {
        document.getElementById("transaction-history")?.focus();
      }, 0);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save transaction."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(transaction, event) {
    deleteTriggerRef.current = event.currentTarget;
    setDeleteTarget(transaction);
  }

  function closeDeleteDialog() {
    if (deletingId !== null) {
      return;
    }

    setDeleteTarget(null);

    window.setTimeout(() => {
      deleteTriggerRef.current?.focus();
      deleteTriggerRef.current = null;
    }, 0);
  }

  async function confirmDeleteTransaction() {
    if (!deleteTarget) {
      return;
    }

    const transactionId = deleteTarget.id;

    try {
      setDeletingId(transactionId);
      setError("");

      const response = await fetch(`${API_URL}/${transactionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete transaction.");
      }

      setTransactions((currentTransactions) =>
        currentTransactions.filter(
          (transaction) => transaction.id !== transactionId
        )
      );

      if (editingId === transactionId) {
        resetTransactionForm();
      }

      setDeleteTarget(null);
      setSuccessMessage("Transaction deleted.");

      window.setTimeout(() => {
        deleteTriggerRef.current?.focus();
        deleteTriggerRef.current = null;
      }, 0);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete transaction."));
    } finally {
      setDeletingId(null);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update budget.");
      }

      setMonthlyBudget(Number(data.amount) || 0);
      setBudgetInput(String(data.amount));
      setSuccessMessage("Monthly budget updated.");

      window.setTimeout(() => {
        document.getElementById("budget-input")?.focus();
      }, 0);
    } catch (err) {
      setBudgetError(getErrorMessage(err, "Failed to update budget."));
    } finally {
      setSavingBudget(false);
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      transaction.description?.toLowerCase().includes(normalizedSearch) ||
      transaction.category?.toLowerCase().includes(normalizedSearch);

    const matchesType = filterType === "all" || transaction.type === filterType;

    const matchesCategory =
      filterCategory === "all" || transaction.category === filterCategory;

    const matchesStartDate =
      !filterStartDate || transaction.date >= filterStartDate;

    const matchesEndDate = !filterEndDate || transaction.date <= filterEndDate;

    return (
      matchesSearch &&
      matchesType &&
      matchesCategory &&
      matchesStartDate &&
      matchesEndDate
    );
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (sortOption) {
      case "oldest":
        return a.date.localeCompare(b.date);
      case "highest":
        return Number(b.amount) - Number(a.amount);
      case "lowest":
        return Number(a.amount) - Number(b.amount);
      case "az":
        return a.description.localeCompare(b.description);
      case "za":
        return b.description.localeCompare(a.description);
      case "newest":
      default:
        return b.date.localeCompare(a.date);
    }
  });

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    filterType !== "all" ||
    filterCategory !== "all" ||
    filterStartDate !== "" ||
    filterEndDate !== "";

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const balance = totalIncome - totalExpenses;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthlyExpenses = transactions
    .filter((transaction) => {
      if (transaction.type !== "expense" || !transaction.date) {
        return false;
      }

      const transactionDate = new Date(`${transaction.date}T00:00:00`);

      return (
        transactionDate.getFullYear() === currentYear &&
        transactionDate.getMonth() === currentMonth
      );
    })
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const budgetRemaining = monthlyBudget - monthlyExpenses;

  const budgetPercentage =
    monthlyBudget > 0
      ? Math.min((monthlyExpenses / monthlyBudget) * 100, 100)
      : 0;

  let budgetStatus = "No monthly budget set";
  let budgetStatusDetail =
    "Set a monthly budget to start tracking your spending limit.";

  if (monthlyBudget > 0 && monthlyExpenses > monthlyBudget) {
    const amountOverBudget = monthlyExpenses - monthlyBudget;
    budgetStatus = "Over budget";
    budgetStatusDetail = `${formatCurrency(amountOverBudget)} over your monthly budget.`;
  } else if (monthlyBudget > 0 && budgetPercentage >= 80) {
    budgetStatus = "Budget nearly used";
    budgetStatusDetail = `${Math.round(budgetPercentage)}% of your monthly budget has been used.`;
  } else if (monthlyBudget > 0) {
    budgetStatus = "Within budget";
    budgetStatusDetail = `${Math.round(budgetPercentage)}% of your monthly budget has been used.`;
  }

  const categoryTotals = categories.map((item) => {
    const total = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" && transaction.category === item.name
      )
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return { ...item, total };
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
      categories.find((item) => item.name === categoryName) || {
        name: categoryName,
        icon: "other",
      }
    );
  }

  function exportTransactionsToCsv() {
    const header = ["Date", "Type", "Description", "Category", "Amount"];

    function escapeCsvValue(value) {
      const stringValue = String(value ?? "");
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }

    const rows = sortedTransactions.map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.description,
      transaction.category,
      transaction.amount,
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().split("T")[0];

    link.href = url;
    link.download = `transactions-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app-shell">
      <nav className="top-navigation" aria-label="Main navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            S
          </div>

          <div>
            <strong>Smart Expense</strong>
            <span>Personal finance dashboard</span>
          </div>
        </div>

        <div className="nav-actions">
          <button
            className="theme-toggle-button"
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>

          <div className="nav-status">
            <span className="status-dot" aria-hidden="true"></span>
            Finance overview
          </div>
        </div>
      </nav>

      <main className="dashboard-container">
        <section className="hero-section" aria-labelledby="dashboard-title">
          <div>
            <p className="section-kicker">YOUR MONEY AT A GLANCE</p>
            <h1 id="dashboard-title">Take control of your money.</h1>
            <p className="hero-description">
              Track your spending, manage your budget, and understand where
              your money goes.
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

        {successMessage && (
          <div className="success-message" role="status" aria-live="polite">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="alert-message" role="alert" aria-live="assertive">
            <span>{error}</span>
            {loadFailed && (
              <button
                className="secondary-button retry-button"
                type="button"
                onClick={loadDashboardData}
              >
                Retry
              </button>
            )}
          </div>
        )}

        <section className="summary-grid" aria-label="Financial summary">
          <article className="financial-summary-card balance-card">
            <div className="financial-summary-header">
              <div>
                <span className="summary-label">Balance</span>
                <h2>{formatCurrency(balance)}</h2>
              </div>
              <span className="summary-icon">
                <Icon name="balance" size={22} />
              </span>
            </div>
            <p className="summary-note">Income minus all recorded expenses</p>
          </article>

          <article className="financial-summary-card income-card">
            <div className="financial-summary-header">
              <div>
                <span className="summary-label">Total income</span>
                <h2>{formatCurrency(totalIncome)}</h2>
              </div>
              <span className="summary-icon">
                <Icon name="income" size={22} />
              </span>
            </div>
            <p className="summary-note">All income recorded so far</p>
          </article>

          <article className="financial-summary-card expense-card">
            <div className="financial-summary-header">
              <div>
                <span className="summary-label">Total expenses</span>
                <h2>{formatCurrency(totalExpenses)}</h2>
              </div>
              <span className="summary-icon">
                <Icon name="expense" size={22} />
              </span>
            </div>
            <p className="summary-note">All expenses recorded so far</p>
          </article>
        </section>

        <section className="dashboard-layout">
          <div className="main-column">
            <section
              className="dashboard-card transaction-form-card"
              id="transaction-form"
              aria-labelledby="transaction-form-title"
            >
              <div className="card-heading">
                <div>
                  <p className="section-kicker">
                    {editingId !== null ? "UPDATE TRANSACTION" : "ADD TRANSACTION"}
                  </p>
                  <h2 id="transaction-form-title">
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
                    aria-label="Cancel editing transaction"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {formError && (
                <div
                  className="form-error"
                  id="transaction-form-error"
                  role="alert"
                  aria-live="polite"
                >
                  {formError}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                noValidate
                aria-describedby={
                  formError ? "transaction-form-error" : undefined
                }
              >
                <div className="form-grid">
                  <label htmlFor="transaction-type">
                    Type
                    <select
                      id="transaction-type"
                      value={type}
                      onChange={(event) => {
                        setType(event.target.value);
                        setFormError("");
                      }}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </label>

                  <label htmlFor="transaction-description">
                    Description
                    <input
                      id="transaction-description"
                      type="text"
                      value={description}
                      onChange={(event) => {
                        setDescription(event.target.value);
                        setFormError("");
                      }}
                      placeholder="e.g. Groceries"
                      maxLength="100"
                      aria-invalid={
                        formError && !description.trim() ? "true" : "false"
                      }
                    />
                  </label>

                  <label htmlFor="transaction-amount">
                    Amount
                    <input
                      id="transaction-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(event) => {
                        setAmount(event.target.value);
                        setFormError("");
                      }}
                      placeholder="0"
                      aria-invalid={
                        formError && (!amount || Number(amount) <= 0)
                          ? "true"
                          : "false"
                      }
                    />
                  </label>

                  <label htmlFor="transaction-category">
                    Category
                    <select
                      id="transaction-category"
                      value={category}
                      onChange={(event) => {
                        setCategory(event.target.value);
                        setFormError("");
                      }}
                    >
                      {categories.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                      <option value="Salary">Salary</option>
                    </select>
                  </label>

                  <label htmlFor="transaction-date">
                    Date
                    <input
                      id="transaction-date"
                      type="date"
                      value={date}
                      onChange={(event) => {
                        setDate(event.target.value);
                        setFormError("");
                      }}
                      aria-invalid={formError && !date ? "true" : "false"}
                    />
                  </label>
                </div>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
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

            <section
              className="dashboard-card transactions-card"
              id="transaction-history"
              tabIndex="-1"
              aria-labelledby="transaction-history-title"
            >
              <div className="card-heading">
                <div>
                  <p className="section-kicker">TRANSACTION HISTORY</p>
                  <h2 id="transaction-history-title">Your transactions</h2>
                </div>

                <span
                  className="transaction-count"
                  aria-label={`${sortedTransactions.length} transactions shown`}
                >
                  {sortedTransactions.length}
                </span>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={exportTransactionsToCsv}
                  disabled={sortedTransactions.length === 0}
                  aria-label="Export shown transactions to CSV"
                >
                  Export CSV
                </button>
              </div>

              <div className="transaction-search">
                <div className="search-input-wrapper">
                  <Icon name="search" size={18} />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search transactions..."
                    aria-label="Search transactions"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="search-clear-button"
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear transaction search"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="filter-bar" aria-label="Transaction filters">
                <select
                  value={filterType}
                  onChange={(event) => setFilterType(event.target.value)}
                  aria-label="Filter by transaction type"
                >
                  <option value="all">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expenses</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(event) => setFilterCategory(event.target.value)}
                  aria-label="Filter by category"
                >
                  <option value="all">All categories</option>
                  {categories.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                  <option value="Salary">Salary</option>
                </select>

                <label className="date-filter" htmlFor="filter-start-date">
                  <span>From</span>
                  <input
                    id="filter-start-date"
                    type="date"
                    value={filterStartDate}
                    max={filterEndDate || undefined}
                    onChange={(event) => setFilterStartDate(event.target.value)}
                    aria-label="Filter transactions from date"
                  />
                </label>

                <label className="date-filter" htmlFor="filter-end-date">
                  <span>To</span>
                  <input
                    id="filter-end-date"
                    type="date"
                    value={filterEndDate}
                    min={filterStartDate || undefined}
                    onChange={(event) => setFilterEndDate(event.target.value)}
                    aria-label="Filter transactions to date"
                  />
                </label>

                <select
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value)}
                  aria-label="Sort transactions"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="highest">Highest amount</option>
                  <option value="lowest">Lowest amount</option>
                  <option value="az">Description A–Z</option>
                  <option value="za">Description Z–A</option>
                </select>

                <button
                  className="clear-filters-button"
                  type="button"
                  onClick={resetFilters}
                  disabled={!hasActiveFilters}
                  aria-label="Clear all transaction filters"
                >
                  Clear filters
                </button>
              </div>

              <div className="summary-note" aria-live="polite">
                {hasActiveFilters
                  ? `Showing ${sortedTransactions.length} of ${transactions.length} transactions`
                  : `${transactions.length} transactions recorded`}
              </div>

              {loading ? (
                <div className="empty-state" role="status" aria-live="polite">
                  <strong>Loading transactions...</strong>
                  <p>Please wait while your financial data loads.</p>
                </div>
              ) : sortedTransactions.length === 0 ? (
                <div className="empty-state" role="status">
                  <strong>
                    {hasActiveFilters
                      ? "No matching transactions."
                      : "No transactions found."}
                  </strong>
                  <p>
                    {hasActiveFilters
                      ? "Try changing your search or filter options."
                      : "Add a transaction to start building your history."}
                  </p>
                  {!hasActiveFilters && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={focusTransactionForm}
                    >
                      Add your first transaction
                    </button>
                  )}
                  {hasActiveFilters && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={resetFilters}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="transaction-list">
                  {sortedTransactions.map((transaction) => {
                    const categoryDetails = getCategoryDetails(
                      transaction.category
                    );

                    return (
                      <article className="transaction-row" key={transaction.id}>
                        <div className="transaction-icon" aria-hidden="true">
                          <Icon name={categoryDetails.icon} size={20} />
                        </div>

                        <div className="transaction-details">
                          <strong>{transaction.description}</strong>
                          <span>
                            {transaction.category} · {transaction.date}
                          </span>
                        </div>

                        <strong
                          className={`transaction-amount ${transaction.type}`}
                          aria-label={`${
                            transaction.type === "income" ? "Income" : "Expense"
                          } ${formatCurrency(Number(transaction.amount))}`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(Number(transaction.amount))}
                        </strong>

                        <div className="transaction-actions">
                          <button
                            className="edit-button"
                            type="button"
                            onClick={() => startEditing(transaction)}
                            aria-label={`Edit ${transaction.description}`}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            type="button"
                            onClick={(event) => handleDelete(transaction, event)}
                            aria-label={`Delete ${transaction.description}`}
                            disabled={deletingId !== null}
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

          <aside className="side-column">
            <section
              className="dashboard-card budget-card"
              aria-labelledby="monthly-budget-title"
            >
              <div className="card-heading">
                <div>
                  <p className="section-kicker">MONTHLY PLAN</p>
                  <h2 id="monthly-budget-title">Monthly budget</h2>
                </div>
                <span className="budget-icon" aria-hidden="true">
                  <Icon name="budget" size={22} />
                </span>
              </div>

              <form onSubmit={handleBudgetSave}>
                <label className="budget-input-label" htmlFor="budget-input">
                  Set monthly budget
                  <div className="budget-input-wrapper">
                    <span aria-hidden="true">KES</span>
                    <input
                      id="budget-input"
                      type="number"
                      min="0"
                      step="100"
                      value={budgetInput}
                      onChange={(event) => setBudgetInput(event.target.value)}
                      placeholder="50000"
                      aria-label="Monthly budget amount in Kenyan shillings"
                      aria-describedby={budgetError ? "budget-error" : undefined}
                    />
                  </div>
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={savingBudget}
                  aria-busy={savingBudget}
                >
                  {savingBudget ? "Saving..." : "Save budget"}
                </button>
              </form>

              {budgetError && (
                <p
                  className="form-error"
                  id="budget-error"
                  role="alert"
                  aria-live="polite"
                >
                  {budgetError}
                </p>
              )}

              <div className="budget-overview" aria-label="Monthly budget overview">
                <div>
                  <span>Spent this month</span>
                  <strong>{formatCurrency(monthlyExpenses)}</strong>
                </div>
                <div>
                  <span>Remaining</span>
                  <strong className={budgetRemaining < 0 ? "negative-value" : ""}>
                    {formatCurrency(budgetRemaining)}
                  </strong>
                </div>
              </div>

              <div
                className="progress-track"
                role="progressbar"
                aria-label="Monthly budget usage"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={Math.round(budgetPercentage)}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${budgetPercentage}%` }}
                ></div>
              </div>

              <div className="budget-progress-label">
                <span>
                  {monthlyBudget > 0
                    ? `${Math.round(budgetPercentage)}% used`
                    : "No budget set"}
                </span>
                {monthlyBudget > 0 && monthlyExpenses > monthlyBudget ? (
                  <span className="over-budget">{budgetStatus}</span>
                ) : (
                  <span>{budgetStatus}</span>
                )}
              </div>

              <p className="summary-note">{budgetStatusDetail}</p>
            </section>

            <section
              className="dashboard-card category-card"
              aria-labelledby="category-breakdown-title"
            >
              <div className="card-heading">
                <div>
                  <p className="section-kicker">SPENDING BREAKDOWN</p>
                  <h2 id="category-breakdown-title">Where your money goes</h2>
                </div>
              </div>

              <div className="category-list">
                {categoryTotals.map((item) => {
                  const percentage =
                    totalExpenses > 0 ? (item.total / totalExpenses) * 100 : 0;

                  return (
                    <div className="category-item" key={item.name}>
                      <div className="category-item-top">
                        <span>
                          <Icon name={item.icon} size={16} />
                          {item.name}
                        </span>
                        <strong>{formatCurrency(item.total)}</strong>
                      </div>
                      <div
                        className="category-progress"
                        role="progressbar"
                        aria-label={`${item.name} spending`}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={Math.round(percentage)}
                      >
                        <div style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="insight-card" aria-labelledby="insight-title">
              <span className="insight-icon" aria-hidden="true">
                <Icon name="insight" size={22} />
              </span>

              <div>
                <p className="section-kicker">QUICK INSIGHT</p>
                <h3 id="insight-title">
                  {largestCategory?.total > 0
                    ? `${largestCategory.name} is your biggest spending category.`
                    : "Start adding transactions to see your spending insights."}
                </h3>
                {largestCategory?.total > 0 && (
                  <p>
                    You have recorded {formatCurrency(largestCategory.total)} in{" "}
                    {largestCategory.name} expenses.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </section>

        <footer className="site-footer">
          <p>© 2026 Smart Expense Tracker</p>
          <nav aria-label="Legal">
            <a href="/privacy.html">Privacy Policy</a>
            <a href="/terms.html">Terms & Conditions</a>
          </nav>
        </footer>
      </main>

      {deleteTarget && (
        <div
          className="delete-dialog-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && deletingId === null) {
              closeDeleteDialog();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(20, 20, 18, 0.55)",
          }}
        >
          <section
            className="delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            style={{
              width: "min(100%, 460px)",
              padding: "28px",
              borderRadius: "18px",
              background: "var(--paper, #ffffff)",
              color: "var(--ink, #1f1f1c)",
              boxShadow: "0 24px 70px rgba(0, 0, 0, 0.22)",
            }}
          >
            <p className="section-kicker" style={{ marginTop: 0 }}>
              DELETE TRANSACTION
            </p>

            <h2 id="delete-dialog-title" style={{ marginTop: "8px", marginBottom: "12px" }}>
              Delete this transaction?
            </h2>

            <p id="delete-dialog-description">
              This action cannot be undone. The following transaction will be
              permanently removed.
            </p>

            <div
              style={{
                margin: "20px 0",
                padding: "16px",
                borderRadius: "12px",
                background: "var(--cream, #f6f3ed)",
                border: "1px solid var(--soft-line, #e5e1d8)",
              }}
            >
              <strong>{deleteTarget.description}</strong>
              <div
                style={{
                  marginTop: "6px",
                  color: "var(--muted, #686860)",
                  fontSize: "0.92rem",
                }}
              >
                {deleteTarget.category} · {deleteTarget.date}
              </div>
              <div style={{ marginTop: "10px", fontWeight: 700 }}>
                {deleteTarget.type === "income" ? "+" : "-"}
                {formatCurrency(Number(deleteTarget.amount))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                ref={deleteCancelRef}
                className="secondary-button"
                type="button"
                onClick={closeDeleteDialog}
                disabled={deletingId !== null}
              >
                Cancel
              </button>

              <button
                className="delete-button"
                type="button"
                onClick={confirmDeleteTransaction}
                disabled={deletingId !== null}
                aria-busy={deletingId !== null}
                style={{ minWidth: "110px" }}
              >
                {deletingId !== null ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
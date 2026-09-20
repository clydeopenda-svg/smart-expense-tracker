# Smart Expense Tracker

A full-stack personal finance dashboard for tracking income, expenses, budgets, and spending patterns.

## Features

- Add income and expense transactions
- Edit existing transactions
- Delete transactions
- Categorize transactions
- Filter transactions by:
  - Type
  - Category
  - Start date
  - End date
- Automatically calculate:
  - Total income
  - Total expenses
  - Current balance
- Set and update a monthly spending budget
- Track monthly budget usage
- View spending by category
- View monthly spending summaries
- Receive simple financial insights
- Responsive dashboard for desktop, tablet, and mobile
- SQLite database for persistent data storage
- Backend API tests with pytest

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- Flask
- Flask-CORS
- SQLite
- pytest

## Project Structure

```text
smart-expense-tracker/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── expenses.db
│   └── tests/
│       └── test_app.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
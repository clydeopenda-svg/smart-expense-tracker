# Smart Expense Tracker

A full-stack personal finance dashboard for recording transactions, managing a monthly budget, and understanding spending patterns.

## Features

### Transaction management

* Add income and expense transactions
* Edit existing transactions
* Delete transactions
* Categorize transactions
* Record transaction dates
* Validate transaction information before submission

### Transaction search and filtering

* Search transactions by description
* Filter by transaction type
* Filter by category
* Filter by start date
* Filter by end date
* Combine multiple filters

### Financial dashboard

* View total income
* View total expenses
* View current balance
* View monthly expenses
* View spending by category
* Identify the largest spending category
* Display simple spending insights

### Budget management

* Set a monthly spending budget
* Update the monthly budget
* Track budget usage
* Display remaining budget
* Provide budget status and warnings

### User experience

* Responsive layout for desktop, tablet, and mobile
* Keyboard-accessible controls
* Accessible labels and focus states
* Clear loading and error states
* Empty states for sections without data
* Consistent dashboard icons and visual styling

### Supporting pages

* Privacy Policy
* Terms & Conditions
* Favicon and application metadata

## Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Python
* Flask
* Flask-CORS
* SQLite

### Testing

* pytest

## Project Structure

```text
smart-expense-tracker/
│
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── expenses.db
│   └── tests/
│       └── test_app.py
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── icons.svg
│   │   ├── privacy.html
│   │   └── terms.html
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── README.md
└── vercel.json
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

* Python 3
* Node.js
* npm
* Git

### 1. Clone the repository

```bash
git clone <repository-url>
cd smart-expense-tracker
```

Replace `<repository-url>` with the repository's actual URL.

### 2. Set up the backend

Move into the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask backend:

```bash
python app.py
```

The backend runs locally on the Flask development server.

### 3. Set up the frontend

Open another terminal and move into the frontend directory:

```bash
cd frontend
```

Install the JavaScript dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL provided by Vite in your browser.

## Running Tests

The backend tests use pytest.

From the backend directory, activate the virtual environment and run:

```bash
python -m pytest
```

## Building the Frontend

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Application Pages

The main application is available through the React dashboard.

Additional pages are available at:

* `/privacy.html` - Privacy Policy
* `/terms.html` - Terms & Conditions

## API

The Flask backend provides API endpoints for managing transactions and the monthly budget.

The frontend communicates with the backend through the `/api` base path.

## Data Storage

Transaction and budget information is stored using SQLite during local development.

The application is intended as a personal finance tracking tool. Users should maintain appropriate backups and should not treat the application as a replacement for official financial records.

## Deployment Notes

The current backend uses a local SQLite database for development and demonstration purposes.

Before using the application as a production service for multiple users, the database layer should be migrated to a persistent hosted database appropriate for the deployment environment.

The current deployment configuration is intended to demonstrate the full-stack application and its frontend/backend integration rather than provide production-grade persistent database infrastructure.

## Financial Disclaimer

Smart Expense Tracker is a tracking and organization tool. It does not provide financial, investment, tax, accounting, or legal advice.

Information displayed by the application should not be treated as professional financial guidance.

## Privacy

Information about how application data is handled is provided in the [Privacy Policy](./frontend/public/privacy.html).

## Terms

Use of the application is subject to the [Terms & Conditions](./frontend/public/terms.html).

## Development

The project is structured as a separate React frontend and Flask backend.

Frontend development uses Vite for the development server and production build process. The backend uses Flask to provide the application's API and SQLite for local data persistence.

## License

No open-source license has been specified for this project at this time.

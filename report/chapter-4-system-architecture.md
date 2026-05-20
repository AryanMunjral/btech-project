# CHAPTER 4: SYSTEM ARCHITECTURE AND DESIGN

## 4.1 High-Level Architecture

The UPI Fraud Detection System follows a three-tier architecture comprising a presentation layer (React frontend), a business logic layer (Express.js backend), and a data layer (PostgreSQL database), augmented by an auxiliary machine learning inference service (FastAPI ML API). The architectural decision to separate the ML service from the backend was deliberate — it enables independent scaling, deployment, and language-appropriate tooling for each component.

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                         │
│                  React 18 + Tailwind CSS                      │
│         (Dashboard, Transactions, Alerts, Analytics)          │
│                     Port: 5173 (Vite)                         │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP/REST (Axios)
                         │ JWT Bearer Token
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                        │
│              Express.js + Prisma ORM + JWT                    │
│   (Auth, Transactions, Alerts, Dashboard, Fraud Service)      │
│                     Port: 5000                                │
└───────────┬────────────────────────┬─────────────────────────┘
            │                        │
            │ Prisma Client          │ HTTP/REST (Axios)
            │ (SQL over TCP)         │ (Prediction Request)
            ▼                        ▼
┌─────────────────────┐   ┌─────────────────────────────────────┐
│     DATA LAYER      │   │       ML INFERENCE LAYER             │
│    PostgreSQL 16    │   │   FastAPI + XGBoost + scikit-learn   │
│  (Users, Txns,      │   │   (Feature Engineering, Prediction,  │
│   Alerts)           │   │    Health Check, Model Management)   │
│    Port: 5432       │   │         Port: 8000                   │
└─────────────────────┘   └─────────────────────────────────────┘
```

## 4.2 Component Design

### 4.2.1 Frontend Architecture

The React frontend is organized as a single-page application (SPA) with client-side routing managed by React Router v6. The component hierarchy follows a clear separation between pages (route-level components), shared UI components, custom hooks (data logic), services (API communication), and utilities (formatting and error handling).

```
frontend/src/
├── App.jsx                 # Root component with routing
├── main.jsx                # Application entry point
├── index.css               # Global styles and Tailwind directives
│
├── components/             # Shared UI components
│   ├── Layout.jsx          # Authenticated layout (sidebar + header)
│   ├── Sidebar.jsx         # Navigation sidebar
│   ├── ProtectedRoute.jsx  # Auth guard for routes
│   └── ErrorBoundary.jsx   # React error boundary
│
├── context/
│   └── AuthContext.jsx     # Authentication state provider
│
├── hooks/                  # Custom data hooks
│   ├── useAuth.js          # Authentication operations
│   ├── useApi.js           # Generic fetch + mutation hooks
│   ├── useDashboard.js     # Dashboard data aggregation
│   ├── useTransactions.js  # Transaction CRUD + filters
│   ├── useAlerts.js        # Alert lifecycle management
│   └── useMLStatus.js      # ML service health monitoring
│
├── pages/                  # Route-level page components
│   ├── Login.jsx           # Authentication page
│   ├── Register.jsx        # Account creation
│   ├── Dashboard.jsx       # KPI dashboard with charts
│   ├── Transactions.jsx    # Transaction list with filters
│   ├── Alerts.jsx          # Alert management
│   ├── CheckTransaction.jsx # Manual fraud check form
│   └── Analytics.jsx       # Detailed analytics views
│
├── services/
│   └── api.js              # Axios instances + API functions
│
└── utils/
    ├── errorHandler.js     # Centralised error parsing
    └── formatters.js       # Currency, date, number formatters
```

**State Management Strategy.** The application uses React's built-in state management (useState, useContext) rather than external libraries such as Redux or Zustand. This decision reflects the application's moderate complexity — authentication state is global (managed via AuthContext), while page-specific data is managed locally through custom hooks. This approach avoids the boilerplate overhead of centralised state management while maintaining predictable data flow.

**Custom Hooks Pattern.** Each data domain (transactions, alerts, dashboard, ML status) has a dedicated hook that encapsulates fetching, caching, filtering, and mutation logic. Page components consume these hooks and render data without containing any fetch or state management code. This separation yields two benefits: page components remain purely presentational and thus easier to test and maintain, and data logic can be reused across multiple pages without duplication.

### 4.2.2 Backend Architecture

The Express.js backend follows a layered architecture with middleware-based request processing:

```
backend/src/
├── server.js               # Entry point, server startup
├── app.js                  # Express app configuration
│
├── config/
│   └── index.js            # Environment variable loading
│
├── middleware/
│   ├── auth.js             # JWT verification + role check
│   ├── validate.js         # Zod schema validation
│   └── errorHandler.js     # Global error handler
│
├── routes/
│   ├── auth.js             # Authentication endpoints
│   ├── transactions.js     # Transaction CRUD endpoints
│   ├── alerts.js           # Alert management endpoints
│   ├── dashboard.js        # Dashboard statistics endpoint
│   ├── users.js            # User management endpoints
│   └── health.js           # Health check endpoint
│
├── services/
│   ├── transactionService.js  # Transaction processing logic
│   └── fraudService.js       # ML integration + rule-based fallback
│
├── validators/
│   └── schemas.js          # Zod validation schemas
│
└── prisma/
    └── schema.prisma       # Database schema definition
```

**Request Processing Pipeline.** Each incoming HTTP request traverses the following middleware chain:

1. **Helmet** — Sets security-related HTTP headers (X-Content-Type-Options, X-Frame-Options, Content-Security-Policy).
2. **CORS** — Validates the request origin against the configured whitelist.
3. **Rate Limiter** — Enforces per-IP request limits to prevent abuse.
4. **Morgan** — Logs the request method, URL, status code, and response time.
5. **Body Parser** — Parses JSON request bodies with a 10 KB size limit.
6. **Router** — Dispatches to the appropriate route handler based on URL path and HTTP method.
7. **Auth Middleware** (on protected routes) — Extracts and verifies the JWT from the Authorization header, attaches the decoded user object to the request.
8. **Validation Middleware** — Validates the request body against the route's Zod schema, returning structured validation errors on failure.
9. **Route Handler** — Executes the business logic and returns the response.
10. **Error Handler** — Catches unhandled errors and returns a standardised error response.

### 4.2.3 ML Service Architecture

The FastAPI ML service is structured as a modular Python application:

```
ml-api/
├── app/
│   ├── main.py              # FastAPI application + routes
│   ├── services/
│   │   └── fraud_detector.py # Model loading + prediction logic
│   ├── utils/
│   │   └── feature_engineering.py  # Feature transformation pipeline
│   └── models/              # Serialised model artefacts
│       ├── fraud_model.pkl  # Trained XGBoost model
│       ├── scaler.pkl       # Fitted StandardScaler
│       └── feature_columns.pkl  # Feature name list
│
├── train_model.py           # Model training script
├── evaluation.py            # Model evaluation and plotting
├── generate_data.py         # Synthetic data generator
│
├── data/                    # Generated datasets
│   ├── upi_transactions.csv
│   └── upi_transactions_featured.csv
│
├── outputs/                 # Evaluation plots
│   ├── confusion_matrix.png
│   ├── roc_curve.png
│   ├── precision_recall_curve.png
│   ├── feature_importance.png
│   └── probability_distribution.png
│
└── requirements.txt         # Python dependencies
```

**Model Serving Design.** The ML service loads the trained model, scaler, and feature column list into memory at startup. Prediction requests are processed synchronously — feature engineering followed by model inference — with a target latency under 100 milliseconds per transaction. The service exposes a `/health` endpoint that returns model status, uptime, and prediction count, enabling the backend to verify ML service availability before routing prediction requests.

**Graceful Degradation.** When the ML service is unavailable (network failure, service restart, or model corruption), the backend's fraud service automatically falls back to rule-based scoring. This fallback computes a fraud probability based on predefined rules applied to transaction attributes (amount thresholds, balance ratios, time of day). While less accurate than the ML model, the rule-based fallback ensures that the system continues to provide fraud risk assessments without interruption.

## 4.3 Authentication and Authorisation Design

The system implements stateless JWT-based authentication with role-based access control (RBAC):

**Token Architecture:**
- **Access Token:** Short-lived (24 hours), contains user ID, email, and role. Attached to every authenticated API request as a Bearer token.
- **Refresh Token:** Long-lived (7 days), used to obtain new access tokens without re-authentication. Stored client-side in localStorage.

**Role Hierarchy:**
- **USER:** Can view own transactions, submit new transactions for fraud checking, and view alerts assigned to them.
- **ANALYST:** Inherits USER permissions plus the ability to mark alerts as read/resolved, recheck transaction fraud scores, and view aggregated analytics.
- **ADMIN:** Full system access including user management, transaction deletion, alert creation, and system configuration.

**Token Refresh Flow:** When the frontend receives a 401 (Unauthorized) response, the Axios response interceptor automatically attempts to refresh the access token using the stored refresh token. If refresh succeeds, the original failed request is retried with the new token. If refresh fails (expired or revoked refresh token), the user is logged out and redirected to the login page.

## 4.4 Data Flow for Transaction Processing

The following sequence describes the complete data flow when a user submits a new transaction through the frontend:

1. The user fills in the transaction form on the Check Transaction page and clicks Submit.
2. The React component calls `createTransaction(payload)` from the `useTransactions` hook.
3. The hook invokes `transactionAPI.create(data)`, which sends a POST request to `/api/transactions` with the JWT in the Authorization header.
4. The Express router validates the JWT, checks the user's role, and passes the request to the validation middleware.
5. The Zod schema validates the request body (sender UPI, receiver UPI, amount, transaction type).
6. The transaction service looks up sender and receiver accounts in PostgreSQL via Prisma.
7. A balance sufficiency check is performed — if the sender has insufficient funds, the transaction is marked FAILED and returned immediately.
8. The fraud service constructs a prediction payload and sends it to the FastAPI ML service at `POST /predict`.
9. The ML service applies feature engineering to the transaction data, transforming it into the 28-feature vector expected by the model.
10. The XGBoost model produces a fraud probability score between 0 and 1.
11. The ML service returns the probability, risk level, and contributing features to the backend.
12. The fraud service applies threshold logic: probability ≥ 0.85 → BLOCKED, probability ≥ 0.50 → FLAGGED, otherwise → COMPLETED.
13. The transaction record is created in PostgreSQL with the fraud probability, risk level, and status.
14. If the transaction is COMPLETED, sender and receiver balances are updated atomically.
15. Alert records are generated based on the fraud analysis (fraud detected, suspicious activity, high amount, or rapid transaction alerts).
16. The complete transaction record, including prediction results and generated alerts, is returned to the frontend.
17. The React component displays the result with colour-coded risk indicators and a toast notification.

## 4.5 Error Handling Architecture

Errors are handled at three levels:

**ML Service Level:** The FastAPI service catches prediction errors and returns structured error responses with appropriate HTTP status codes. If model files are missing or corrupt, the service starts in a degraded mode and returns rule-based predictions with a warning flag.

**Backend Level:** Express route handlers wrap all async operations in try-catch blocks. Unhandled errors are caught by the global error handler middleware, which logs the full error stack and returns a sanitised error message to the client (avoiding leakage of internal details). Validation errors from Zod schemas are formatted into user-friendly field-level error messages.

**Frontend Level:** The Axios response interceptor handles HTTP errors centrally. The `parseError` utility extracts the most useful error message from various response formats (server error messages, network errors, validation error arrays). The `ErrorBoundary` component catches unhandled JavaScript errors in the React component tree and displays a recovery interface rather than a blank page.

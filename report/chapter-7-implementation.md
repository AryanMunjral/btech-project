# CHAPTER 7: IMPLEMENTATION

## 7.1 Project Structure

The project is organised as a monorepo containing three independent service directories, each with its own dependency management and runtime:

```
upi-fraud-detection/
├── backend/              # Express.js API server
│   ├── prisma/           # Database schema and migrations
│   ├── src/              # Application source code
│   │   ├── config/       # Environment configuration
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── routes/       # API endpoint definitions
│   │   ├── services/     # Business logic
│   │   ├── validators/   # Zod validation schemas
│   │   ├── app.js        # Express app setup
│   │   └── server.js     # Server entry point
│   └── package.json
│
├── frontend/             # React SPA
│   ├── src/
│   │   ├── components/   # Shared UI components
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom data hooks
│   │   ├── pages/        # Route-level page components
│   │   ├── services/     # API communication layer
│   │   ├── utils/        # Formatting and error utilities
│   │   ├── App.jsx       # Root component with routing
│   │   ├── main.jsx      # Entry point
│   │   └── index.css     # Global styles
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── ml-api/               # FastAPI ML service
│   ├── app/
│   │   ├── models/       # Serialised model artefacts
│   │   ├── services/     # Fraud detection logic
│   │   ├── utils/        # Feature engineering
│   │   └── main.py       # FastAPI application
│   ├── data/             # Generated datasets
│   ├── outputs/          # Evaluation plots
│   ├── train_model.py    # Training script
│   ├── evaluation.py     # Evaluation script
│   ├── generate_data.py  # Data generator
│   └── requirements.txt
│
├── .env                  # Environment variables
└── report/               # Project report (this document)
```

## 7.2 Backend Implementation

### 7.2.1 Server Configuration

The Express server is configured in `app.js` with middleware arranged in a specific order that ensures security headers are set before any request processing, CORS validation occurs before body parsing, and rate limiting is applied before route dispatch.

The server configuration loads environment variables from a `.env` file located at the project root. The configuration module (`config/index.js`) centralises all environment variable access, providing defaults for optional values and throwing descriptive errors for missing required values (such as `JWT_SECRET` and `DATABASE_URL`).

### 7.2.2 Authentication Implementation

The authentication system is implemented across three components:

**Registration (POST /api/auth/register):** Accepts name, email, password, and optional UPI ID. The password is hashed using bcrypt with a salt factor of 10, producing a 60-character hash. A UPI ID is auto-generated in the format `{name_part}@upi` if not provided. The Prisma client creates the user record and returns a JWT access token and refresh token.

**Login (POST /api/auth/login):** Accepts email and password. The email is looked up in the database, and the provided password is compared against the stored bcrypt hash using `bcrypt.compare()`, which performs a constant-time comparison to prevent timing attacks. On successful authentication, access and refresh tokens are generated using the `jsonwebtoken` library with the configured expiration times (24 hours and 7 days respectively).

**JWT Verification Middleware:** Extracts the Bearer token from the Authorization header, verifies its signature against the JWT secret, and attaches the decoded payload (user ID, email, role) to the request object. If verification fails, the middleware returns a 401 response and halts the request pipeline.

**Role-Based Authorisation:** A higher-order middleware function `requireRole(...roles)` checks whether the authenticated user's role is included in the allowed roles for a particular endpoint. This middleware is applied selectively — for example, the DELETE /api/transactions/:id endpoint requires the ADMIN role, while GET /api/transactions is available to any authenticated user.

### 7.2.3 Transaction Processing Implementation

The transaction service (`services/transactionService.js`) orchestrates the complete transaction lifecycle:

**Input Validation:** The Zod schema validates that senderUpi and receiverUpi are non-empty strings, amount is a positive number, and transactionType is one of the four valid types. Invalid inputs are rejected with structured error messages before any database interaction occurs.

**User Lookup:** The service queries the Users table for both sender and receiver by their UPI IDs. If the sender is not found, the transaction is rejected. If the receiver is not found, the transaction proceeds (supporting transfers to external UPI addresses not registered in the system).

**Balance Verification:** The sender's balance is compared against the transaction amount. If insufficient, the transaction is created with status FAILED and no balance deduction occurs.

**Fraud Assessment:** The fraud service constructs a prediction payload containing the transaction amount, sender balance, receiver balance, transaction type, and current timestamp. This payload is sent to the ML API for scoring. If the ML service is unavailable, the fraud service applies the rule-based fallback scoring logic.

**Database Operations:** A Prisma transaction block (using `prisma.$transaction`) ensures atomicity across three operations: creating the transaction record, updating the sender's balance (deducting the amount), and updating the receiver's balance (adding the amount). If any operation fails, all three are rolled back.

**Alert Generation:** Based on the fraud assessment result, the service creates appropriate alert records. Multiple alerts can be generated for a single transaction — for example, a high-amount fraudulent transaction would generate both a FRAUD_DETECTED alert and a HIGH_AMOUNT alert.

### 7.2.4 Dashboard Statistics Implementation

The dashboard endpoint (`/api/dashboard/stats`) computes aggregate statistics using Prisma's groupBy and aggregate query capabilities:

- Total transaction count and sum of amounts.
- Fraud count and legitimate count.
- Fraud rate as a percentage.
- Risk breakdown (count per risk level: LOW, MEDIUM, HIGH).
- Status breakdown (count per status: COMPLETED, FLAGGED, BLOCKED, FAILED).
- Daily transaction volumes for the past 7 days (total and fraud count per day).
- Alert statistics (total, unread, critical, high-severity counts).
- ML service availability status (obtained by pinging the ML API health endpoint).

All statistics are computed from live database data, ensuring the dashboard reflects the current state of the system.

### 7.2.5 Alert Management Implementation

The alert endpoints support the complete alert lifecycle:

- **Listing** with optional filters by severity (LOW, MEDIUM, HIGH, CRITICAL) and read status (all, read, unread). Results are paginated and sorted by creation date descending.
- **Statistics** aggregation returning total, unread, critical, and high-severity counts.
- **Mark as Read** updates the `isRead` flag for a single alert.
- **Mark All Read** performs a bulk update setting `isRead = true` for all unread alerts.
- **Resolve** sets both `isRead = true` and `resolved = true`, indicating that the alert has been investigated and addressed.

## 7.3 ML Service Implementation

### 7.3.1 Model Loading

At startup, the FastAPI application loads three serialised artefacts using joblib:

1. **fraud_model.pkl** — The trained XGBoost classifier.
2. **scaler.pkl** — The fitted StandardScaler.
3. **feature_columns.pkl** — An ordered list of 28 feature names.

These artefacts are loaded into a `FraudDetector` service class that maintains them in memory for the lifetime of the process. If any artefact is missing or fails to deserialise, the service starts in degraded mode and returns rule-based predictions with a `model_loaded: false` flag.

### 7.3.2 Prediction Pipeline

When a prediction request arrives at `POST /predict`, the following steps execute:

1. **Request Validation:** Pydantic validates the request body against the expected schema (amount, sender_balance, receiver_balance, transaction_type, timestamp).
2. **Feature Engineering:** The feature engineering utility computes all 28 features from the raw input values. For behavioural features (sender_txn_count, sender_avg_amount, etc.), default values are used since the ML API does not maintain per-sender state for individual predictions.
3. **Feature Ordering:** The computed features are arranged into a NumPy array in the exact column order expected by the model (matching `feature_columns.pkl`).
4. **Scaling:** The StandardScaler transforms the feature array using the mean and variance learned during training.
5. **Prediction:** The XGBoost model's `predict_proba` method returns a two-element array containing the probability of the legitimate class and the fraud class. The fraud probability (index 1) is extracted.
6. **Risk Classification:** The fraud probability is mapped to a risk level: HIGH (≥ 0.5), MEDIUM (≥ 0.3), LOW (< 0.3).
7. **Response:** The API returns the fraud probability, boolean fraud classification, risk level, and the top contributing features.

### 7.3.3 Batch Prediction

The `POST /predict/batch` endpoint accepts an array of up to 100 transactions and processes them in a single call. Feature engineering and scaling are vectorised using pandas DataFrames and NumPy arrays, enabling batch processing that is significantly faster than 100 individual predictions due to reduced Python function call overhead and NumPy's optimised array operations.

### 7.3.4 Health Monitoring

The `GET /health` endpoint returns:
- `status`: "healthy" or "degraded"
- `model_loaded`: Boolean indicating whether the ML model is in memory.
- `model_version`: The version string from model metadata.
- `uptime_seconds`: Time since the service started.
- `predictions_served`: Counter of total predictions made since startup.

The backend polls this endpoint before sending prediction requests, falling back to rule-based scoring if the health check fails or returns `model_loaded: false`.

### 7.3.5 Model Hot-Reload

The `POST /model/reload` endpoint reloads the model, scaler, and feature columns from disk without restarting the service. This enables model updates in environments where restarting the service would disrupt ongoing predictions.

## 7.4 Frontend Implementation

### 7.4.1 Routing and Navigation

The React application uses React Router v6 with the following route structure:

| Path | Component | Auth Required | Layout |
|------|-----------|---------------|--------|
| /login | Login | No | None |
| /register | Register | No | None |
| / | Dashboard | Yes | Sidebar |
| /transactions | Transactions | Yes | Sidebar |
| /alerts | Alerts | Yes | Sidebar |
| /check | CheckTransaction | Yes | Sidebar |
| /analytics | Analytics | Yes | Sidebar |

The `ProtectedRoute` component wraps authenticated routes, checking for a valid JWT in localStorage. If no token is present, the user is redirected to `/login` with the original URL preserved in the location state. After successful login, the user is redirected back to the page they originally tried to access.

### 7.4.2 Authentication Context

The `AuthContext` provides authentication state (user object, loading status) and operations (login, register, logout) to all components through React's Context API. The context provider initialises by checking localStorage for an existing token and fetching the user profile. If the token is expired, the refresh flow is triggered automatically.

### 7.4.3 API Service Layer

The `services/api.js` module creates two Axios instances:

**Backend API Client:** Configured with the backend base URL, 15-second timeout, and JSON content type. A request interceptor attaches the JWT token to every outgoing request. A response interceptor handles 401 responses by attempting token refresh before re-executing the failed request.

**ML API Client:** Configured with the ML service base URL and a 10-second timeout. This client is used for direct frontend-to-ML-service communication (model info, health status) and does not require authentication.

API functions are organised into domain-specific objects (authAPI, transactionAPI, alertAPI, dashboardAPI, userAPI, mlAPI) that provide method-level abstraction over HTTP requests.

### 7.4.4 Custom Hooks Implementation

**useApi:** A generic data-fetching hook that encapsulates the loading → fetch → data/error → refetch pattern. It uses a `fetchIdRef` counter to prevent race conditions — when multiple fetches are triggered in rapid succession (due to filter changes or re-renders), only the response from the most recent fetch updates the state, preventing stale data from overwriting fresh results.

**useDashboard:** Fetches dashboard statistics, recent transactions, and recent alerts in parallel using `Promise.all`. Includes fallback data that is used when API calls fail, ensuring the UI always displays meaningful content. The refresh function provides manual data refresh with a loading indicator.

**useTransactions:** Manages transaction listing with filter state (search query, fraud filter, status filter, risk filter, sort order, pagination). The `buildParams` function converts the filter state object into API query parameters. When any filter changes, the hook automatically re-fetches with the updated parameters.

**useAlerts:** Manages the alert lifecycle including fetching with filters (severity, read status), marking alerts as read (individually or in bulk), and resolving alerts. Alert statistics are fetched in parallel with the alert list to populate the stats panel.

**useMLStatus:** Monitors the ML service health by periodically calling the health endpoint. Returns derived convenience values (`isAvailable`, `mlHealth`) that components can use directly without parsing the full status object.

### 7.4.5 Page Implementations

**Dashboard:** Displays four KPI cards (total transactions, fraud count, fraud rate, total amount), a 7-day transaction trend chart (using Recharts AreaChart), risk and status breakdown charts (using Recharts PieChart), recent transactions table, and recent alerts list. All data is sourced from the `useDashboard` hook.

**Transactions:** Presents a filterable, sortable table of all transactions with columns for transaction ID, sender, receiver, amount, type, risk level, fraud probability, status, and date. Filter controls allow searching by transaction ID or UPI address, filtering by fraud status, risk level, and transaction status. The table updates in real time as filters change.

**Alerts:** Shows a list of alerts with severity badges (colour-coded: red for critical, orange for high, yellow for medium, blue for low), read/unread indicators, and action buttons (mark as read, resolve). A summary panel displays alert counts by severity. Filters allow viewing by severity level and read/unread status.

**Check Transaction:** Provides a form for manual fraud checking. The user enters sender UPI, receiver UPI, amount, and transaction type. On submission, the transaction is created and fraud-checked through the backend. The result displays the fraud probability, risk level, and status with colour-coded indicators and an animation.

**Analytics:** Displays detailed analytical views including ML model status (version, prediction count, availability), transaction volume trends, fraud rate analysis, and amount distribution charts.

### 7.4.6 Error Boundary

The `ErrorBoundary` component is implemented as a React class component (required by React's error boundary API). It catches JavaScript errors in the component tree below it and displays a recovery interface with:
- A friendly error message visible to all users.
- Technical error details (error message and component stack trace) visible only in development mode.
- A "Try Again" button that clears the error state and re-renders the child components.
- A "Go Home" link that navigates to the dashboard.

## 7.5 Styling Implementation

The frontend uses Tailwind CSS for styling, with custom design tokens defined in `tailwind.config.js`:

**Colour Palette:** A custom primary colour scale (50-900) based on a blue-indigo palette, used consistently across buttons, links, badges, and chart elements. The palette is generated from a base hue and provides sufficient contrast ratios for accessibility compliance.

**Custom CSS Classes:** Reusable component classes defined in `index.css` using Tailwind's `@apply` directive:
- `btn-primary`, `btn-secondary`, `btn-danger` — Button variants with hover, focus, and disabled states.
- `input-field` — Standardised text input styling.
- `card` — Rounded container with shadow and border.
- `badge-*` — Status and severity indicator badges.
- `table-header` — Consistent table header styling.

**Responsive Design:** The layout uses Tailwind's responsive utility classes (sm:, md:, lg:, xl:) to adapt the interface from mobile to desktop viewports. The sidebar collapses on small screens, table columns are hidden selectively, and chart dimensions adjust to available width.

**Animations:** CSS animations for entry transitions:
- `animate-fade-in` — Opacity fade from 0 to 1 over 500ms.
- `animate-slide-up` — Upward translation with opacity fade over 300ms.

These animations are applied to dashboard cards and transaction results to provide visual feedback when data loads or changes.

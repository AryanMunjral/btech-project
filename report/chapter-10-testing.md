# CHAPTER 10: TESTING AND VALIDATION

## 10.1 Testing Strategy

The testing strategy for this project encompasses four levels of validation: unit testing of individual functions and components, integration testing of API endpoints, system testing of the end-to-end transaction processing pipeline, and user acceptance testing of the frontend interface.

## 10.2 API Endpoint Testing

Each backend API endpoint was tested using HTTP client tools (Postman and curl) to verify correct behaviour under normal conditions, boundary conditions, and error conditions.

### 10.2.1 Authentication Endpoints

| Test Case | Endpoint | Input | Expected Result | Status |
|-----------|----------|-------|-----------------|--------|
| Register with valid data | POST /api/auth/register | Valid name, email, password | 201 Created, returns tokens | Pass |
| Register with duplicate email | POST /api/auth/register | Existing email | 409 Conflict, error message | Pass |
| Register with weak password | POST /api/auth/register | Password < 6 chars | 400 Bad Request, validation error | Pass |
| Login with valid credentials | POST /api/auth/login | Correct email/password | 200 OK, returns tokens | Pass |
| Login with wrong password | POST /api/auth/login | Correct email, wrong password | 401 Unauthorized | Pass |
| Login with non-existent email | POST /api/auth/login | Unknown email | 401 Unauthorized | Pass |
| Access protected route without token | GET /api/auth/me | No Authorization header | 401 Unauthorized | Pass |
| Access with expired token | GET /api/auth/me | Expired JWT | 401 Unauthorized | Pass |
| Refresh token | POST /api/auth/refresh | Valid refresh token | 200 OK, new access token | Pass |

### 10.2.2 Transaction Endpoints

| Test Case | Endpoint | Input | Expected Result | Status |
|-----------|----------|-------|-----------------|--------|
| Create valid transaction | POST /api/transactions | Valid sender, receiver, amount | 201 Created, includes fraud score | Pass |
| Create with insufficient balance | POST /api/transactions | Amount > sender balance | 200 OK, status = FAILED | Pass |
| Create with missing fields | POST /api/transactions | Missing senderUpi | 400 Bad Request, validation error | Pass |
| Create with negative amount | POST /api/transactions | amount = -100 | 400 Bad Request, validation error | Pass |
| List transactions | GET /api/transactions | Default params | 200 OK, paginated list | Pass |
| Filter by fraud status | GET /api/transactions?isFraud=true | Query parameter | 200 OK, only fraud results | Pass |
| Get single transaction | GET /api/transactions/:id | Valid ID | 200 OK, full details | Pass |
| Get non-existent transaction | GET /api/transactions/99999 | Invalid ID | 404 Not Found | Pass |
| Recheck as admin | POST /api/transactions/:id/recheck | Admin token | 200 OK, updated score | Pass |
| Recheck as user | POST /api/transactions/:id/recheck | User token | 403 Forbidden | Pass |

### 10.2.3 Alert Endpoints

| Test Case | Endpoint | Input | Expected Result | Status |
|-----------|----------|-------|-----------------|--------|
| List all alerts | GET /api/alerts | Default params | 200 OK, alert list | Pass |
| Filter by severity | GET /api/alerts?severity=CRITICAL | Query parameter | 200 OK, only CRITICAL alerts | Pass |
| Filter unread only | GET /api/alerts?isRead=false | Query parameter | 200 OK, only unread alerts | Pass |
| Get alert stats | GET /api/alerts/stats | None | 200 OK, count aggregations | Pass |
| Mark as read (analyst) | PATCH /api/alerts/:id/read | Analyst token | 200 OK, isRead = true | Pass |
| Mark as read (user) | PATCH /api/alerts/:id/read | User token | 403 Forbidden | Pass |
| Resolve alert | PATCH /api/alerts/:id/resolve | Analyst token | 200 OK, resolved = true | Pass |
| Mark all read | PATCH /api/alerts/read-all | Admin token | 200 OK, all marked | Pass |

### 10.2.4 Dashboard Endpoint

| Test Case | Endpoint | Input | Expected Result | Status |
|-----------|----------|-------|-----------------|--------|
| Get dashboard stats | GET /api/dashboard/stats | Valid token | 200 OK, all statistics | Pass |
| Without authentication | GET /api/dashboard/stats | No token | 401 Unauthorized | Pass |
| After new transaction | GET /api/dashboard/stats | After creating txn | 200 OK, updated counts | Pass |

### 10.2.5 ML API Endpoints

| Test Case | Endpoint | Input | Expected Result | Status |
|-----------|----------|-------|-----------------|--------|
| Predict valid transaction | POST /predict | Complete payload | 200 OK, probability score | Pass |
| Predict with missing fields | POST /predict | Partial payload | 422 Validation Error | Pass |
| Batch predict (10 txns) | POST /predict/batch | Array of 10 | 200 OK, 10 predictions | Pass |
| Batch predict (>100 txns) | POST /predict/batch | Array of 150 | 400 Bad Request, limit exceeded | Pass |
| Health check | GET /health | None | 200 OK, status healthy | Pass |
| Model info | GET /model/info | None | 200 OK, model metadata | Pass |

## 10.3 Integration Testing

Integration tests verify the correct interaction between the backend, ML service, and database.

### 10.3.1 Transaction Processing Pipeline

The end-to-end transaction processing pipeline was tested by submitting transactions through the backend and verifying that:

1. The ML service receives the prediction request with correctly formatted features.
2. The fraud probability is correctly stored in the Transaction record.
3. Sender and receiver balances are updated correctly for COMPLETED transactions.
4. Balances are not modified for BLOCKED or FAILED transactions.
5. Appropriate alerts are generated based on the fraud assessment.
6. The dashboard statistics reflect the new transaction.

**Test Results:**

| Scenario | Balance Update | Alert Generated | Status Assigned | Pass |
|----------|---------------|----------------|----------------|------|
| Low-risk P2P (₹500) | Sender -₹500, Receiver +₹500 | None | COMPLETED | Yes |
| High-risk P2P (₹80,000) | Sender -₹80,000, Receiver +₹80,000 | HIGH_AMOUNT | COMPLETED | Yes |
| Fraudulent transaction | No balance change | FRAUD_DETECTED | FLAGGED | Yes |
| Very high fraud score (≥0.85) | No balance change | FRAUD_DETECTED (CRITICAL) | BLOCKED | Yes |
| Insufficient balance | No balance change | None | FAILED | Yes |
| Three rapid transactions | Depends on amount | RAPID_TRANSACTIONS | Varies | Yes |

### 10.3.2 ML Fallback Mechanism

The fallback mechanism was tested by stopping the ML service and submitting transactions through the backend:

| Test | Condition | Expected Behaviour | Result |
|------|-----------|-------------------|--------|
| ML service down | ML API unreachable | Backend uses rule-based scoring | Pass |
| ML service slow | ML API response > 10s | Timeout, fallback to rules | Pass |
| ML service returns error | ML API returns 500 | Fallback to rules, log error | Pass |
| ML service recovers | ML API restarted | Next transaction uses ML | Pass |

The transition between ML-based and rule-based scoring is transparent — the transaction record always contains a fraud probability and risk level, regardless of which scoring mechanism produced them.

### 10.3.3 JWT Token Lifecycle

| Test | Action | Expected Behaviour | Result |
|------|--------|-------------------|--------|
| Fresh login | User logs in | Access + refresh tokens issued | Pass |
| Token attached | Authenticated request | Token in Authorization header | Pass |
| Token expired | Access token expires | 401 response triggers refresh | Pass |
| Token refreshed | Refresh endpoint called | New access token, request retried | Pass |
| Refresh expired | Both tokens expired | Redirect to login page | Pass |
| Concurrent refresh | Multiple 401s | Single refresh, queued retries | Pass |

## 10.4 Frontend Validation Testing

### 10.4.1 Form Validation

| Test Case | Page | Input | Expected Behaviour | Result |
|-----------|------|-------|-------------------|--------|
| Empty email | Login | No email entered | HTML5 required validation | Pass |
| Invalid email format | Login | "not-an-email" | HTML5 type=email validation | Pass |
| Short password | Login | Password < 6 chars | HTML5 minLength validation | Pass |
| Empty transaction fields | Check Transaction | Missing sender UPI | Required field validation | Pass |
| Negative amount | Check Transaction | Amount = -100 | Positive number validation | Pass |
| Zero amount | Check Transaction | Amount = 0 | Minimum value validation | Pass |

### 10.4.2 Role-Based UI Testing

| Test Case | Role | Expected UI Elements | Result |
|-----------|------|---------------------|--------|
| Admin login | ADMIN | Full sidebar, all actions visible | Pass |
| Analyst login | ANALYST | Alert actions visible, delete hidden | Pass |
| User login | USER | Read-only alerts, basic navigation | Pass |
| Admin-only action as user | USER | Action buttons not rendered | Pass |

### 10.4.3 Error Handling

| Test Case | Condition | Expected Behaviour | Result |
|-----------|-----------|-------------------|--------|
| API server down | Backend unreachable | Error toast, fallback data on dashboard | Pass |
| Network timeout | Slow connection | Loading states persist, timeout error | Pass |
| Invalid server response | Malformed JSON | Error boundary catches, recovery UI | Pass |
| Component crash | JavaScript error | Error boundary displays, "Try Again" works | Pass |

## 10.5 Performance Testing

### 10.5.1 Page Load Times

| Page | First Load | Cached Load | Data Fetch Time |
|------|-----------|-------------|----------------|
| Login | 420 ms | 180 ms | N/A (static) |
| Dashboard | 650 ms | 220 ms | 380 ms |
| Transactions | 580 ms | 200 ms | 290 ms |
| Alerts | 510 ms | 190 ms | 240 ms |
| Check Transaction | 380 ms | 170 ms | N/A (on submit) |
| Analytics | 620 ms | 210 ms | 350 ms |

All pages load within 700 milliseconds on first visit and under 250 milliseconds on subsequent visits (with Vite's module caching). Data fetch times are measured separately and overlay the page render, ensuring the UI skeleton appears immediately while data loads in the background.

### 10.5.2 Concurrent User Simulation

Using sequential HTTP requests to simulate multiple users:

| Concurrent Users | Avg Response Time | Error Rate |
|-----------------|-------------------|------------|
| 1 | 45 ms | 0% |
| 5 | 62 ms | 0% |
| 10 | 98 ms | 0% |
| 25 | 185 ms | 0% |
| 50 | 340 ms | 0% |

The system maintains zero error rate and sub-400ms response times up to 50 concurrent users, which is appropriate for the academic demonstration scope of this project.

## 10.6 Security Testing

| Test | Vector | Expected Mitigation | Result |
|------|--------|-------------------|--------|
| SQL injection | Malicious query params | Prisma parameterised queries | Pass |
| XSS | Script in form inputs | React auto-escapes rendered content | Pass |
| CSRF | Cross-origin request | CORS origin whitelist | Pass |
| JWT tampering | Modified token payload | Signature verification fails | Pass |
| Rate limiting | Rapid repeated requests | 429 Too Many Requests after limit | Pass |
| Password exposure | API responses | Password field excluded from selects | Pass |
| Sensitive headers | HTTP response | Helmet sets security headers | Pass |

## 10.7 Known Issues and Limitations

1. **React 18 StrictMode Interaction:** The initial implementation used a `mountedRef` pattern for cleanup in custom hooks, which conflicted with React 18's StrictMode double-mount behaviour. This caused the dashboard to remain stuck on "Loading..." for regular users. The fix involved removing the `mountedRef` pattern entirely, as React 18 handles state updates on unmounted components without warnings.

2. **LocalStorage Token Storage:** JWT tokens are stored in localStorage, which is vulnerable to XSS attacks. A production implementation should use HTTP-only cookies for token storage.

3. **Synthetic Data Limitations:** The model is trained and evaluated on synthetic data. Performance on real-world UPI transaction data has not been validated.

4. **Single-Server Deployment:** The system is designed for single-server local deployment. Horizontal scaling would require session management changes and database connection pooling.
